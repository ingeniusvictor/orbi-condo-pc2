import assert from "node:assert/strict";
import {spawn} from "node:child_process";

const host="127.0.0.1";
const port=Number(process.env.ORBI_QA_LOCAL_PORT||3219);
const base=`http://${host}:${port}`;
const date="2026-10-10";
const nextBin="node_modules/next/dist/bin/next";
const childEnv={...process.env,NODE_ENV:"production"};
for(const key of ["SUPABASE_URL","SUPABASE_ANON_KEY","ORBI_COMMUNITY_ID"])delete childEnv[key];

const server=spawn(process.execPath,[nextBin,"start","-H",host,"-p",String(port)],{
 env:childEnv,
 stdio:["ignore","pipe","pipe"],
});
let output="";
server.stdout.on("data",chunk=>{output+=chunk.toString()});
server.stderr.on("data",chunk=>{output+=chunk.toString()});

async function waitForServer(){
 const deadline=Date.now()+20000;
 while(Date.now()<deadline){
  if(server.exitCode!==null)throw new Error(`Next server exited early (${server.exitCode}).\n${output.slice(-4000)}`);
  try{
   const response=await fetch(`${base}/api/auth/session`,{cache:"no-store"});
   if(response.ok)return;
  }catch{}
  await new Promise(resolve=>setTimeout(resolve,250));
 }
 throw new Error(`Timed out waiting for local Next server.\n${output.slice(-4000)}`);
}

async function json(path,options){
 const response=await fetch(`${base}${path}`,{...options,redirect:"manual"});
 const payload=await response.json().catch(()=>null);
 return {response,payload};
}
function hasNoStore(response){return (response.headers.get("cache-control")||"").includes("no-store")}

async function main(){
 await waitForServer();
 console.log(`Anonymous security smoke · ${base}`);

 const session=await json("/api/auth/session");
 assert.equal(session.response.status,200);
 assert.equal(session.payload?.configured,false);
 assert.equal(session.payload?.authenticated,false);
 assert.equal(session.payload?.communityId,null);
 assert.equal(session.payload?.role,null);
 assert.deepEqual(session.payload?.permissions,[]);
 assert.equal(hasNoStore(session.response),true);
 console.log("PASS unconfigured auth session fails closed with no-store");

 const privateReads=[
  `/api/operations/dashboard?date=${date}`,
  `/api/operations/shift-log?date=${date}`,
  `/api/operations/rounds?date=${date}`,
  `/api/operations/continuity?date=${date}`,
 ];
 for(const path of privateReads){
  const result=await json(path);
  assert.equal(result.response.status,403,`${path} should return 403`);
  assert.equal(result.payload?.error,"No autorizado",`${path} should not disclose backend detail`);
  assert.equal(hasNoStore(result.response),true,`${path} should be no-store`);
 }
 console.log("PASS all private read APIs deny anonymous access with HTTP 403");

 const privateWrites=[
  "/api/operations/shifts/report-gap",
  "/api/operations/shifts/handoff",
  "/api/operations/incidents/report",
  "/api/operations/shift-log/open",
  "/api/operations/rounds/start",
 ];
 for(const path of privateWrites){
  const result=await json(path,{method:"POST",headers:{"Content-Type":"application/json","Origin":base},body:"{}"});
  assert.equal(result.response.status,403,`${path} should return 403 before any mutation`);
  assert.equal(result.payload?.error,"No autorizado",`${path} should not disclose mutation detail`);
 }
 console.log("PASS representative private write APIs deny anonymous access before mutation");

 for(const path of ["/operaciones","/conserjeria"]){
  const response=await fetch(`${base}${path}`,{redirect:"manual"});
  const html=await response.text();
  assert.equal(response.status,200,`${path} should render safely`);
  assert.match(html,/noindex/i,`${path} should carry noindex metadata`);
 }
 console.log("PASS private workspaces render with noindex metadata");
 console.log("ANONYMOUS SECURITY SMOKE GREEN");
}

try{
 await main();
}finally{
 if(server.exitCode===null){
  server.kill("SIGTERM");
  await Promise.race([
   new Promise(resolve=>server.once("exit",resolve)),
   new Promise(resolve=>setTimeout(resolve,3000)),
  ]);
  if(server.exitCode===null)server.kill("SIGKILL");
 }
}
