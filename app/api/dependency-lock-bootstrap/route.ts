import fs from "node:fs";
import path from "node:path";

export const dynamic="force-dynamic";

export function GET(){
 if(process.env.VERCEL_ENV!=="preview")return new Response(null,{status:404});
 try{
  const lock=fs.readFileSync(path.join(process.cwd(),"package-lock.json"),"utf8");
  return new Response(lock,{status:200,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"private, no-store","X-Robots-Tag":"noindex"}});
 }catch{
  return Response.json({error:"Lockfile bootstrap unavailable"},{status:503,headers:{"Cache-Control":"private, no-store","X-Robots-Tag":"noindex"}});
 }
}
