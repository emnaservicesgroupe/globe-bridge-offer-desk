import {env} from "cloudflare:workers";
import {eq} from "drizzle-orm";
import {getChatGPTUser} from "../../chatgpt-auth";
import {getDb} from "../../../db";
import {offers} from "../../../db/schema";

export const dynamic="force-dynamic";
export async function GET(req:Request){
  if(!await getChatGPTUser())return new Response(null,{status:401});
  const id=new URL(req.url).searchParams.get("id")??"";
  const offer=await getDb().select({key:offers.videoKey}).from(offers).where(eq(offers.id,id)).get();
  if(!offer?.key)return new Response(null,{status:404});
  const bucket=env.BUCKET!;
  const meta=await bucket.head(offer.key);
  if(!meta)return new Response(null,{status:404});
  const headers=new Headers({"Content-Type":meta.httpMetadata?.contentType??"video/mp4","Cache-Control":"private, no-store","Accept-Ranges":"bytes","X-Content-Type-Options":"nosniff"});
  const range=req.headers.get("range");
  let start=0,end=meta.size-1;
  if(range){
    const m=/^bytes=(\d*)-(\d*)$/.exec(range);
    if(m&&(m[1]||m[2])){
      start=m[1]?Number(m[1]):Math.max(0,meta.size-Number(m[2]));
      end=m[1]&&m[2]?Math.min(end,Number(m[2])):end;
    }else start=meta.size;
    if(start>end){headers.set("Content-Range","bytes */"+meta.size);return new Response(null,{status:416,headers})}
    headers.set("Content-Range","bytes "+start+"-"+end+"/"+meta.size);
  }
  const length=end-start+1;
  const object=await bucket.get(offer.key,{range:{offset:start,length}});
  if(!object)return new Response(null,{status:404});
  headers.set("Content-Length",String(length));
  return new Response(object.body,{headers,status:range?206:200});
}
