import {readUpload, removeObject, saveObject} from "../../server/storage";
import {getUser, ownerEmail} from "../../server/session";
import {getDb} from "../../../db";
import {offers} from "../../../db/schema";
import {and,eq,desc} from "drizzle-orm";
export const dynamic="force-dynamic";

const fail=(error:string,status:number)=>Response.json({error},{status});
export async function GET(){
 const u=await getUser();
 const rows=await getDb().select().from(offers).orderBy(desc(offers.created));
 return Response.json({rows,editor:!!u&&u.email.toLowerCase()===ownerEmail()},{headers:{"Cache-Control":"private, no-store"}});
}
async function authorize(req:Request){
 const u=await getUser();if(!u || u.email!==ownerEmail())return fail("Owner access required",403);
 if(req.headers.get("origin")!==new URL(req.url).origin)return fail("Invalid origin",403);
 return null;
}
async function save(req:Request,editing:boolean){
 if(editing){
   const denied=await authorize(req);
   if(denied)return denied;
 }else if(req.headers.get("origin")!==new URL(req.url).origin)return fail("Invalid origin",403);
 const f=await req.formData(), value=(k:string)=>String(f.get(k)??"").trim();
 const role=value("role"),company=value("company"),needed=Number(value("needed")),url=value("url"),body=value("body");
 const offerDate=value("offerDate");
 if(offerDate){
   const parsed=new Date(offerDate+"T00:00:00Z");
   if(!/^\d{4}-\d{2}-\d{2}$/.test(offerDate)||Number.isNaN(parsed.getTime())||parsed.toISOString().slice(0,10)!==offerDate)
     return fail("Enter a valid offer date.",400);
 }
 const salary=value("salary");
 if(salary.length>180)return fail("Salary must fit within 180 characters.",400);
 const db=getDb();
 const prior=editing?await db.select().from(offers).where(eq(offers.id,value("id"))).get():undefined;
 if(editing&&!prior)return fail("Offer no longer exists.",404);
 const revision=Number(value("revision"));
 if(prior&&prior.revision!==revision)return fail("This offer changed. Reopen it before editing.",409);
 const calendlyUrl=f.has("calendlyUrl")?(value("calendlyUrl")||null):(prior?.calendlyUrl??null);
 if(calendlyUrl){
   try{
     const link=new URL(calendlyUrl);
     if(link.protocol!=="https:"||!(link.hostname==="calendly.com"||link.hostname.endsWith(".calendly.com"))||link.username||link.password||link.port||link.pathname==="/"||calendlyUrl.length>3000)throw Error();
   }catch{return fail("Enter an HTTPS Calendly booking page link.",400)}
 }
 const jobCountry=f.has("jobCountry")?(value("jobCountry")||null):(prior?.jobCountry??null);
 if(jobCountry && jobCountry.length>100)return fail("Country must fit within 100 characters.",400);
 const location=value("candidateLocation")||prior?.candidateLocation||null;
 if(location!==null&&!["inside","outside"].includes(location))return fail("Choose a candidate location.",400);
 const staged: string[] = [];
 for (const kind of ["video", "file"] as const) {
   const key = value(kind + "Upload");
   if (!key) continue;
   try { f.set(kind, await readUpload(kind, key, value(kind + "Name"))); }
   catch { return fail("Attachment unavailable. Select it again and retry.", 400); }
   staged.push(key);
 }
 const media=f.get("video");
 const video=media instanceof File&&media.size>0?media:null;
 let mime="";
 if(video){
   if(video.size>20*1024*1024)return fail("Choose a video up to 20 MB.",400);
   const head=new Uint8Array(await video.slice(0,12).arrayBuffer());
   if(String.fromCharCode(...head.slice(4,8))==="ftyp")mime="video/mp4";
   else if(head[0]===0x1a&&head[1]===0x45&&head[2]===0xdf&&head[3]===0xa3)mime="video/webm";
   else return fail("Choose an MP4 or WebM video.",400);
 }
 const file=f.get("file"), pdf=file instanceof File && file.size>0?file:null;
 if(!role||!company||role.length>180||company.length>180||!Number.isSafeInteger(needed)||needed<1||needed>100000||body.length>100000||url.length>3000)return fail("Check the role, company, candidate count and offer length.",400);
 if(url){try{if(!["https:","http:"].includes(new URL(url).protocol))throw Error()}catch{return fail("Enter a valid offer link.",400)}}
 if(!calendlyUrl&&!url&&!body&&!pdf&&!prior?.letter&&!video&&!prior?.videoKey)return fail("Add offer text, a link, PDF or demonstration video.",400);
 if(pdf&&(pdf.size>10*1024*1024||await pdf.slice(0,5).text()!=="%PDF-"))return fail("Choose a PDF up to 10 MB.",400);
 const id=prior?.id??crypto.randomUUID(),created=new Date().toISOString(),day=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Tirane",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(created));
 const fileKey=pdf?crypto.randomUUID():prior?.fileKey??null;
 const videoKey=video?"videos/"+crypto.randomUUID():prior?.videoKey??null;
 const uploaded:string[]=[];
 const fields={calendlyUrl,jobCountry,videoKey,candidateLocation:location,offerDate:f.has("offerDate")?(offerDate||null):(prior?.offerDate??null),role,company,needed,url,body,salary,fileKey,letter:pdf?.name??prior?.letter??""};
 try{
   if(pdf){await saveObject(fileKey!,pdf,"application/pdf");uploaded.push(fileKey!)}
   if(video){await saveObject(videoKey!,video,mime);uploaded.push(videoKey!)}
   if(prior){
     const updated=await db.update(offers).set({...fields,revision:revision+1})
       .where(and(eq(offers.id,id),eq(offers.revision,revision))).returning({id:offers.id});
     if(!updated.length){
       if(uploaded.length)await Promise.all(uploaded.map(removeObject));
       return fail("Offer changed. Reopen it before editing.",409);
     }
   }else await db.insert(offers).values({...fields,id,created,day});
 }catch(e){if(uploaded.length)await Promise.all(uploaded.map(removeObject));throw e}
 await Promise.allSettled(staged.map(removeObject));
 if(prior?.videoKey&&video)await removeObject(prior.videoKey);
 if(prior?.letter&&pdf)await removeObject(prior.fileKey??id);
 return Response.json({id},{status:editing?200:201});
}
export async function POST(req:Request){return save(req,false)}
export async function PATCH(req:Request){return save(req,true)}
export async function PUT(req: Request) {
  const denied = await authorize(req);
  if (denied) return denied;
  const data = await req.formData();
  const status = data.get("status");
  if (status !== "available" && status !== "finished") return fail("Choose an offer status.", 400);
  const id = String(data.get("id") ?? "");
  const revision = Number(data.get("revision"));
  const updated = await getDb().update(offers).set({status, revision: revision + 1})
    .where(and(eq(offers.id, id), eq(offers.revision, revision))).returning({id: offers.id});
  if (!updated.length) return fail("The offer changed. Review its latest status and try again.", 409);
  return Response.json({id, status});
}
export async function DELETE(req:Request){
 const denied=await authorize(req);if(denied)return denied;
 const params=new URL(req.url).searchParams;
 const deleted=await getDb().delete(offers).where(and(eq(offers.id,params.get("id")??""),eq(offers.revision,Number(params.get("revision"))))).returning();
 if(!deleted.length)return fail("Offer changed or was removed. Reopen the offer.",409);
 const row=deleted[0];
 if(row.videoKey)await removeObject(row.videoKey);
 if(row.letter)await removeObject(row.fileKey??row.id);
 return new Response(null,{status:204});
}
