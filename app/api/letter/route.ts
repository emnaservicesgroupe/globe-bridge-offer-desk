import {env} from "cloudflare:workers";
import {getChatGPTUser} from "../../chatgpt-auth";
import {eq} from "drizzle-orm";
import {getDb} from "../../../db";
import {offers} from "../../../db/schema";
export const dynamic="force-dynamic";
export async function GET(req:Request){
 if(!await getChatGPTUser())return new Response(null,{status:401});
 const id=new URL(req.url).searchParams.get("id")??"";
 if(!/^[a-f0-9-]{36}$/.test(id))return new Response(null,{status:400});
 const offer=await getDb().select().from(offers).where(eq(offers.id,id)).get();
 if(!offer?.letter)return new Response(null,{status:404});
 const file=await env.BUCKET!.get(offer.fileKey??id);
 return file?new Response(file.body,{headers:{"Content-Type":"application/pdf","Content-Disposition":"attachment; filename=offer-letter.pdf","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}}):new Response(null,{status:404});
}
