import assert from "node:assert/strict";
import http from "node:http";
import {spawn} from "node:child_process";

const appHost="localhost";
const appPort=Number(process.env.ORBI_QA_AUTH_THROTTLE_PORT||3224);
const appBase=`http://${appHost}:${appPort}`;
const upstreamHost="127.0.0.1";
const upstreamPort=Number(process.env.ORBI_QA_AUTH_THROTTLE_UPSTREAM_PORT||54333);
const upstreamBase=`http://${upstreamHost}:${upstreamPort}`;
const nextBin="node_modules/next/dist/bin/next";
const syntheticEmail="administrator.synthetic@example.invalid";

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
 if(req.method!=="POST"||url.pathname!=="/auth/v1/token"||url.searchParams.get("grant_type")!=="password"){
  return sendJson(res,404,{error:"not_found"});
 }
 const body=await readJson(req);
 if(body?.email!==syntheticEmail)return sendJson(res,400,{error:"invalid_grant"});
 switch(body?.password){
  case "rate-limit-password":
   return sendJson(res,429,{error:"upstream_rate_limit",private_detail:"must-not-leak"},{"Retry-After":"17","X-Upstream-Private":"must-not-pass"});
  case "rate-limit-unsafe-retry":
   return sendJson(res,429,{error:"upstream_rate_limit"},{"Retry-After":"Wed, 21 Oct 2026 07:28:00 GMT","X-Upstream-Private":"must-not-pass"});
  case "upstream-unavailable":
   return sendJson(res,503,{error:"upstream_internal",private_detail:"must-not-leak"},{"X-Upstream-Private":"must-not-pass"});
  default:
   return sendJson(res,400,{error:"invalid_grant",private_detail:"must-not-leak"},{"X-Upstream-Private":"must-not-pass"});
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
 throw new Error(`Timed out waiting for login semantics app.\n${appOutput.slice(-4000)}`);
}
async function login(password){
 const response=await fetch(`${appBase}/api/auth/login`,{
  method:"POST",
  headers:{"Content-Type":"application/json","Origin":appBase},
  body:JSON.stringify({email:syntheticEmail,password}),
  cache:"no-store",
 });
 const payload=await response.json().catch(()=>null);
 return {response,payload};
}
function assertPrivateResponse(response){
 assert.equal(response.headers.get("cache-control"),"private, no-store");
 assert.equal(response.headers.get("x-upstream-private"),null,"upstream-private headers must never cross the app boundary");
 assert.equal(response.headers.get("set-cookie"),null,"failed login paths must not issue cookies");
}

async function main(){
 await listen(upstream,upstreamPort,upstreamHost);
 await waitForApp();
 console.log(`Hermetic auth login upstream semantics · ${appBase}`);

 const limited=await login("rate-limit-password");
 assert.equal(limited.response.status,429);
 assert.deepEqual(limited.payload,{error:"Demasiados intentos. Intenta nuevamente más tarde."});
 assert.equal(limited.response.headers.get("retry-after"),"17");
 assert.equal(JSON.stringify(limited.payload).includes("upstream_rate_limit"),false);
 assert.equal(JSON.stringify(limited.payload).includes("must-not-leak"),false);
 assertPrivateResponse(limited.response);
 console.log("PASS upstream 429 remains 429 with bounded numeric Retry-After and no upstream detail leakage");

 const unsafeRetry=await login("rate-limit-unsafe-retry");
 assert.equal(unsafeRetry.response.status,429);
 assert.equal(unsafeRetry.response.headers.get("retry-after"),null,"non-numeric upstream Retry-After must fail closed");
 assertPrivateResponse(unsafeRetry.response);
 console.log("PASS unsafe Retry-After is discarded while rate-limit response remains normalized");

 const unavailable=await login("upstream-unavailable");
 assert.equal(unavailable.response.status,503);
 assert.deepEqual(unavailable.payload,{error:"Servicio de autenticación temporalmente no disponible"});
 assertPrivateResponse(unavailable.response);
 console.log("PASS upstream 5xx is normalized to temporary authentication unavailability");

 const invalid=await login("wrong-password");
 assert.equal(invalid.response.status,401);
 assert.deepEqual(invalid.payload,{error:"Credenciales no válidas"});
 assertPrivateResponse(invalid.response);
 console.log("PASS ordinary credential rejection remains normalized 401");

 console.log("AUTH LOGIN UPSTREAM SEMANTICS GREEN");
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
