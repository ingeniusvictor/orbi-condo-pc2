import assert from "node:assert/strict";
import http from "node:http";
import {spawn} from "node:child_process";

const appHost="localhost";
const appPort=Number(process.env.ORBI_QA_ORIGIN_PORT||3223);
const appBase=`http://${appHost}:${appPort}`;
const upstreamHost="127.0.0.1";
const upstreamPort=Number(process.env.ORBI_QA_ORIGIN_UPSTREAM_PORT||54332);
const upstreamBase=`http://${upstreamHost}:${upstreamPort}`;
const nextBin="node_modules/next/dist/bin/next";
const assignmentId="22222222-2222-4222-8222-222222222222";
const accessToken="qa-origin-access";
let upstreamRequests=0;

function sendJson(res,status,payload){
 res.writeHead(status,{"Content-Type":"application/json","Cache-Control":"no-store"});
 res.end(JSON.stringify(payload));
}

const upstream=http.createServer((_req,res)=>{
 upstreamRequests++;
 return sendJson(res,500,{error:"origin_guard_should_have_blocked_before_upstream"});
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
 throw new Error(`Timed out waiting for hermetic origin-guard app.\n${appOutput.slice(-4000)}`);
}

async function postGap(origin){
 const headers={"Content-Type":"application/json","Cookie":`orbi_session=${accessToken}`};
 if(origin!==null)headers.Origin=origin;
 const response=await fetch(`${appBase}/api/operations/shifts/report-gap`,{
  method:"POST",
  headers,
  body:JSON.stringify({assignmentId,expectedRevision:1}),
  redirect:"manual",
 });
 const payload=await response.json().catch(()=>null);
 return {response,payload};
}

function assertRejected(result,label){
 assert.equal(result.response.status,403,label);
 assert.equal(result.payload?.error,"Origen no autorizado",label);
 assert.equal((result.response.headers.get("cache-control")||"").includes("no-store"),true,`${label} no-store`);
 assert.equal(result.response.headers.get("access-control-allow-origin"),null,`${label} no CORS opt-in`);
}

async function main(){
 await listen(upstream,upstreamPort,upstreamHost);
 await waitForApp();
 console.log(`Hermetic private mutation origin guard · ${appBase}`);

 const beforeMissing=upstreamRequests;
 const missing=await postGap(null);
 assertRejected(missing,"missing Origin must be rejected");
 assert.equal(upstreamRequests,beforeMissing,"missing Origin must not reach Supabase/auth upstream");
 console.log("PASS missing Origin is rejected before upstream work");

 const beforeForeign=upstreamRequests;
 const foreign=await postGap("https://attacker.invalid");
 assertRejected(foreign,"foreign Origin must be rejected");
 assert.equal(upstreamRequests,beforeForeign,"foreign Origin must not reach Supabase/auth upstream");
 console.log("PASS foreign Origin is rejected before upstream work");

 console.log("HERMETIC PRIVATE MUTATION ORIGIN GUARD GREEN");
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
