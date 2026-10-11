import assert from "node:assert/strict";
import {spawn} from "node:child_process";

const host="localhost";
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
function assertSecurityHeaders(response,label){
 assert.equal(response.headers.get("x-content-type-options"),"nosniff",`${label}: nosniff`);
 assert.equal(response.headers.get("referrer-policy"),"strict-origin-when-cross-origin",`${label}: referrer policy`);
 assert.equal(response.headers.get("x-frame-options"),"SAMEORIGIN",`${label}: frame policy`);
 assert.equal(response.headers.get("permissions-policy"),"camera=(), microphone=(), geolocation=()",`${label}: permissions policy`);
 assert.equal(response.headers.get("x-powered-by"),null,`${label}: framework signature must stay suppressed`);
}
function assertPrivateApiHeaders(response,label){
 assertSecurityHeaders(response,label);
 assert.equal(hasNoStore(response),true,`${label}: private no-store`);
 assert.equal(response.headers.get("access-control-allow-origin"),null,`${label}: private API must not opt into cross-origin reads`);
}
function assertClearingCookie(raw,name){
 const lower=raw.toLowerCase();
 assert.match(raw,new RegExp(`^${name}=;`,"i"),`${name} should be cleared without exposing a value`);
 assert.equal(lower.includes("httponly"),true,`${name} should be HttpOnly`);
 assert.equal(lower.includes("secure"),true,`${name} should be Secure in production runtime`);
 assert.equal(lower.includes("samesite=strict"),true,`${name} should be SameSite=Strict`);
 assert.equal(lower.includes("path=/"),true,`${name} should be scoped to Path=/`);
 assert.equal(lower.includes("max-age=0"),true,`${name} should be cleared with Max-Age=0`);
 assert.equal(lower.includes("domain="),false,`${name} should remain host-only`);
}

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
 assertPrivateApiHeaders(session.response,"auth session");
 console.log("PASS unconfigured auth session fails closed with private security headers");

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
  assertPrivateApiHeaders(result.response,path);
 }
 console.log("PASS all private read APIs deny anonymous access with no-store, security headers and no CORS opt-in");

 const originProbe=await json("/api/operations/shifts/report-gap",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});
 assert.equal(originProbe.response.status,403);
 assert.equal(originProbe.payload?.error,"Origen no autorizado");
 assertPrivateApiHeaders(originProbe.response,"missing-origin write");
 console.log("PASS write path rejects missing Origin with hardened private headers");

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
  assert.equal(result.payload?.error,"No autorizado",`${path} with trusted Origin should reach auth barrier`);
  assertPrivateApiHeaders(result.response,path);
 }
 console.log("PASS trusted-Origin private writes reach auth barrier with hardened private headers");

 const logout=await json("/api/auth/logout",{method:"POST",headers:{"Origin":base}});
 assert.equal(logout.response.status,200,"logout should be locally idempotent without backend configuration");
 assert.equal(logout.payload?.ok,true);
 assert.equal(logout.payload?.serverSessionRevoked,false);
 assertPrivateApiHeaders(logout.response,"logout");
 assert.equal(typeof logout.response.headers.getSetCookie,"function","Node runtime should expose individual Set-Cookie headers");
 const setCookies=logout.response.headers.getSetCookie();
 const sessionCookie=setCookies.find(value=>value.toLowerCase().startsWith("orbi_session="));
 const refreshCookie=setCookies.find(value=>value.toLowerCase().startsWith("orbi_refresh="));
 assert.ok(sessionCookie,"logout should clear orbi_session");
 assert.ok(refreshCookie,"logout should clear orbi_refresh");
 assertClearingCookie(sessionCookie,"orbi_session");
 assertClearingCookie(refreshCookie,"orbi_refresh");
 console.log("PASS logout clears both hardened host-only session cookies");

 for(const path of ["/","/operaciones","/conserjeria"]){
  const response=await fetch(`${base}${path}`,{redirect:"manual"});
  const html=await response.text();
  assert.equal(response.status,200,`${path} should render safely`);
  assertSecurityHeaders(response,path);
  if(path!=="/")assert.match(html,/noindex/i,`${path} should carry noindex metadata`);
 }
 console.log("PASS public/private pages inherit the runtime security-header contract; private workspaces remain noindex");
 console.log("RUNTIME SECURITY HEADERS GREEN");
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
