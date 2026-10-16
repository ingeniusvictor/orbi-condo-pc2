import assert from "node:assert/strict";
import http from "node:http";
import {spawn} from "node:child_process";

const appHost="localhost";
const appPort=Number(process.env.ORBI_QA_AUTH_REFRESH_PORT||3226);
const appBase=`http://${appHost}:${appPort}`;
const upstreamHost="127.0.0.1";
const upstreamPort=Number(process.env.ORBI_QA_AUTH_REFRESH_UPSTREAM_PORT||54335);
const upstreamBase=`http://${upstreamHost}:${upstreamPort}`;
const nextBin="node_modules/next/dist/bin/next";

async function readJson(req){
 let body="";
 for await(const chunk of req)body+=chunk;
 try{return JSON.parse(body||"{}")}catch{return null}
}
function sendJson(res,status,payload,headers={}){
 res.writeHead(status,{"Content-Type":"application/json","Cache-Control":"no-store",...headers});
 res.end(JSON.stringify(payload));
}

const upstream=http.createServer(async(req,res)=>{
 const url=new URL(req.url||"/",upstreamBase);
 if(req.method!=="POST"||url.pathname!=="/auth/v1/token"||url.searchParams.get("grant_type")!=="refresh_token"){
  return sendJson(res,404,{error:"not_found"});
 }
 const body=await readJson(req);
 switch(body?.refresh_token){
  case "qa-rate-limit":
   return sendJson(res,429,{error:"upstream_rate_limit",private_detail:"must-not-leak"},{"Retry-After":"23","X-Upstream-Private":"must-not-pass"});
  case "qa-rate-limit-unsafe":
   return sendJson(res,429,{error:"upstream_rate_limit"},{"Retry-After":"Wed, 21 Oct 2026 07:28:00 GMT","X-Upstream-Private":"must-not-pass"});
  case "qa-unavailable":
   return sendJson(res,503,{error:"upstream_internal",private_detail:"must-not-leak"},{"X-Upstream-Private":"must-not-pass"});
  case "qa-invalid":
   return sendJson(res,400,{error:"invalid_refresh",private_detail:"must-not-leak"},{"X-Upstream-Private":"must-not-pass"});
  case "qa-invalid-success-payload":
   return sendJson(res,200,{refresh_token:"rotated-but-no-access-token",private_detail:"must-not-leak"},{"X-Upstream-Private":"must-not-pass"});
  default:
   return sendJson(res,400,{error:"invalid_refresh"});
 }
});

function listen(server,port,host){return new Promise((resolve,reject)=>{server.once("error",reject);server.listen(port,host,resolve)})}
function close(server){return new Promise(resolve=>server.close(()=>resolve()))}

const childEnv={...process.env,NODE_ENV:"production",SUPABASE_URL:upstreamBase,SUPABASE_ANON_KEY:"synthetic-anon-key",ORBI_COMMUNITY_ID:"pc2"};
const app=spawn(process.execPath,[nextBin,"start","-H",appHost,"-p",String(appPort)],{env:childEnv,stdio:["ignore","pipe","pipe"]});
let appOutput="";
app.stdout.on("data",chunk=>{appOutput+=chunk.toString()});
app.stderr.on("data",chunk=>{appOutput+=chunk.toString()});

async function waitForApp(){
 const deadline=Date.now()+20_000;
 while(Date.now()<deadline){
  if(app.exitCode!==null)throw new Error(`Next server exited early (${app.exitCode}).\n${appOutput.slice(-4000)}`);
  try{const response=await fetch(`${appBase}/api/auth/session`,{cache:"no-store"});if(response.ok)return;}catch{}
  await new Promise(resolve=>setTimeout(resolve,250));
 }
 throw new Error(`Timed out waiting for refresh semantics app.\n${appOutput.slice(-4000)}`);
}
function setCookies(response){return typeof response.headers.getSetCookie==="function"?response.headers.getSetCookie():[]}
async function refresh(token){
 const response=await fetch(`${appBase}/api/auth/refresh`,{
  method:"POST",
  headers:{"Origin":appBase,"Cookie":`orbi_session=stale-access; orbi_refresh=${token}`},
  cache:"no-store",
 });
 const payload=await response.json().catch(()=>null);
 return {response,payload,cookies:setCookies(response)};
}
function assertPrivate(result){
 assert.equal(result.response.headers.get("cache-control"),"private, no-store");
 assert.equal(result.response.headers.get("x-upstream-private"),null,"upstream-private headers must never cross the app boundary");
}
function assertPreserved(result,label){
 assert.equal(result.cookies.length,0,`${label}: transient refresh outcome must not clear or rotate local cookies`);
 assertPrivate(result);
}

async function main(){
 await listen(upstream,upstreamPort,upstreamHost);
 await waitForApp();
 console.log(`Hermetic auth refresh upstream semantics · ${appBase}`);

 const limited=await refresh("qa-rate-limit");
 assert.equal(limited.response.status,429);
 assert.deepEqual(limited.payload,{error:"Demasiadas solicitudes. Intenta nuevamente más tarde."});
 assert.equal(limited.response.headers.get("retry-after"),"23");
 assertPreserved(limited,"rate limit");
 assert.equal(JSON.stringify(limited.payload).includes("must-not-leak"),false);
 console.log("PASS refresh 429 preserves cookies and exposes only bounded Retry-After");

 const unsafeRetry=await refresh("qa-rate-limit-unsafe");
 assert.equal(unsafeRetry.response.status,429);
 assert.equal(unsafeRetry.response.headers.get("retry-after"),null,"unsafe Retry-After must be discarded");
 assertPreserved(unsafeRetry,"unsafe rate limit");
 console.log("PASS unsafe refresh Retry-After fails closed without destroying session state");

 const unavailable=await refresh("qa-unavailable");
 assert.equal(unavailable.response.status,503);
 assert.deepEqual(unavailable.payload,{error:"Servicio de autenticación temporalmente no disponible"});
 assertPreserved(unavailable,"upstream unavailable");
 console.log("PASS refresh 5xx is temporary and preserves local credentials");

 const invalidPayload=await refresh("qa-invalid-success-payload");
 assert.equal(invalidPayload.response.status,502);
 assert.deepEqual(invalidPayload.payload,{error:"Respuesta de sesión inválida"});
 assertPreserved(invalidPayload,"invalid success payload");
 console.log("PASS malformed successful refresh response fails closed without erasing a potentially valid refresh token");

 const invalid=await refresh("qa-invalid");
 assert.equal(invalid.response.status,401);
 assert.deepEqual(invalid.payload,{error:"La sesión ya no es válida"});
 assert.equal(invalid.cookies.length,2,"definitively invalid refresh token must clear access and refresh cookies");
 for(const raw of invalid.cookies){
  assert.equal(raw.toLowerCase().includes("max-age=0"),true,"invalid refresh cookie clearing must expire immediately");
 }
 assertPrivate(invalid);
 console.log("PASS definitive refresh-token rejection clears both local credentials");

 console.log("AUTH REFRESH UPSTREAM SEMANTICS GREEN");
}

try{
 await main();
}finally{
 if(app.exitCode===null){
  app.kill("SIGTERM");
  await Promise.race([new Promise(resolve=>app.once("exit",resolve)),new Promise(resolve=>setTimeout(resolve,3000))]);
  if(app.exitCode===null)app.kill("SIGKILL");
 }
 if(upstream.listening)await close(upstream);
}
