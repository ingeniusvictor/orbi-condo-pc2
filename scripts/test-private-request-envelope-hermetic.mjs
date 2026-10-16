import assert from "node:assert/strict";
import http from "node:http";
import {spawn} from "node:child_process";

const appHost="localhost";
const appPort=Number(process.env.ORBI_QA_ENVELOPE_PORT||3224);
const appBase=`http://${appHost}:${appPort}`;
const upstreamHost="127.0.0.1";
const upstreamPort=Number(process.env.ORBI_QA_ENVELOPE_UPSTREAM_PORT||54333);
const upstreamBase=`http://${upstreamHost}:${upstreamPort}`;
const nextBin="node_modules/next/dist/bin/next";
const assignmentId="22222222-2222-4222-8222-222222222222";
const accessToken="qa-envelope-access";
let upstreamRequests=0;

function sendJson(res,status,payload){
 res.writeHead(status,{"Content-Type":"application/json","Cache-Control":"no-store"});
 res.end(JSON.stringify(payload));
}

const upstream=http.createServer((_req,res)=>{
 upstreamRequests++;
 return sendJson(res,500,{error:"request_envelope_should_have_blocked_before_upstream"});
});
function listen(server,port,host){return new Promise((resolve,reject)=>{server.once("error",reject);server.listen(port,host,resolve)})}
function close(server){return new Promise(resolve=>server.close(()=>resolve()))}

const childEnv={...process.env,NODE_ENV:"production",SUPABASE_URL:upstreamBase,SUPABASE_ANON_KEY:"synthetic-anon-key",ORBI_COMMUNITY_ID:"pc2"};
const app=spawn(process.execPath,[nextBin,"start","-H",appHost,"-p",String(appPort)],{env:childEnv,stdio:["ignore","pipe","pipe"]});
let appOutput="";
app.stdout.on("data",chunk=>{appOutput+=chunk.toString()});
app.stderr.on("data",chunk=>{appOutput+=chunk.toString()});

async function waitForApp(){
 const deadline=Date.now()+20000;
 while(Date.now()<deadline){
  if(app.exitCode!==null)throw new Error(`Next server exited early (${app.exitCode}).\n${appOutput.slice(-4000)}`);
  try{const response=await fetch(`${appBase}/api/auth/session`,{cache:"no-store"});if(response.ok)return;}catch{}
  await new Promise(resolve=>setTimeout(resolve,250));
 }
 throw new Error(`Timed out waiting for hermetic request-envelope app.\n${appOutput.slice(-4000)}`);
}

async function post(body,contentType){
 const response=await fetch(`${appBase}/api/operations/shifts/report-gap`,{
  method:"POST",
  headers:{
   "Content-Type":contentType,
   "Origin":appBase,
   "Cookie":`orbi_session=${accessToken}`,
  },
  body,
  redirect:"manual",
 });
 const payload=await response.json().catch(()=>null);
 return {response,payload};
}
function assertBoundary(result,status,error,label){
 assert.equal(result.response.status,status,label);
 assert.equal(result.payload?.error,error,label);
 assert.equal((result.response.headers.get("cache-control")||"").includes("no-store"),true,`${label} no-store`);
 assert.match(result.response.headers.get("x-orbi-request-id")||"",/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,`${label} request-id`);
 assert.equal(result.response.headers.get("access-control-allow-origin"),null,`${label} no CORS opt-in`);
}

async function main(){
 await listen(upstream,upstreamPort,upstreamHost);
 await waitForApp();
 console.log(`Hermetic private request envelope · ${appBase}`);

 const beforeOversize=upstreamRequests;
 const oversizedBody=JSON.stringify({assignmentId,expectedRevision:1,padding:"x".repeat(9000)});
 const oversized=await post(oversizedBody,"application/json");
 assertBoundary(oversized,413,"Solicitud demasiado grande","oversized private mutation");
 assert.equal(upstreamRequests,beforeOversize,"oversized mutation must not reach Auth/Supabase upstream");
 console.log("PASS oversized private mutation is rejected before upstream work");

 const beforeType=upstreamRequests;
 const wrongType=await post(JSON.stringify({assignmentId,expectedRevision:1}),"text/plain");
 assertBoundary(wrongType,415,"Tipo de contenido no admitido","non-JSON private mutation");
 assert.equal(upstreamRequests,beforeType,"non-JSON mutation must not reach Auth/Supabase upstream");
 console.log("PASS non-JSON private mutation is rejected before upstream work");

 console.log("HERMETIC PRIVATE REQUEST ENVELOPE GREEN");
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
