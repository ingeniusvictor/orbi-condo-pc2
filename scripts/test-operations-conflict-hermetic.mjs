import assert from "node:assert/strict";
import http from "node:http";
import {spawn} from "node:child_process";

const appHost="localhost";
const appPort=Number(process.env.ORBI_QA_CONFLICT_PORT||3221);
const appBase=`http://${appHost}:${appPort}`;
const upstreamHost="127.0.0.1";
const upstreamPort=Number(process.env.ORBI_QA_CONFLICT_UPSTREAM_PORT||54330);
const upstreamBase=`http://${upstreamHost}:${upstreamPort}`;
const nextBin="node_modules/next/dist/bin/next";
const assignmentId="22222222-2222-4222-8222-222222222222";
const syntheticUserId="33333333-3333-4333-8333-333333333333";
const accessToken="qa-conflict-access";

const state={
 scenario:"stale",
 userLookups:0,
 membershipLookups:0,
 shiftReads:0,
 shiftPatches:0,
 patchBodies:[],
 patchQueries:[],
};

function sendJson(res,status,payload){
 res.writeHead(status,{"Content-Type":"application/json","Cache-Control":"no-store"});
 res.end(JSON.stringify(payload));
}
async function readJson(req){
 let body="";
 for await(const chunk of req)body+=chunk;
 try{return JSON.parse(body||"{}")}catch{return null}
}
function bearer(req){
 const value=req.headers.authorization||"";
 return value.startsWith("Bearer ")?value.slice(7):"";
}

const upstream=http.createServer(async(req,res)=>{
 const url=new URL(req.url||"/",upstreamBase);
 const token=bearer(req);

 if(req.method==="GET"&&url.pathname==="/auth/v1/user"){
  state.userLookups++;
  if(token!==accessToken)return sendJson(res,401,{error:"invalid_token"});
  return sendJson(res,200,{id:syntheticUserId});
 }

 if(req.method==="GET"&&url.pathname==="/rest/v1/memberships"){
  state.membershipLookups++;
  if(token!==accessToken)return sendJson(res,401,{error:"invalid_token"});
  return sendJson(res,200,[{operations_role:"concierge",active_from:null,active_until:null,disabled_at:null}]);
 }

 if(req.method==="GET"&&url.pathname==="/rest/v1/shift_assignments"){
  state.shiftReads++;
  if(token!==accessToken)return sendJson(res,401,{error:"invalid_token"});
  const status=state.scenario==="illegal"?"received":"planned";
  return sendJson(res,200,[{id:assignmentId,status,revision:5}]);
 }

 if(req.method==="PATCH"&&url.pathname==="/rest/v1/shift_assignments"){
  state.shiftPatches++;
  if(token!==accessToken)return sendJson(res,401,{error:"invalid_token"});
  state.patchQueries.push(Object.fromEntries(url.searchParams.entries()));
  state.patchBodies.push(await readJson(req));
  if(state.scenario==="race")return sendJson(res,200,[]);
  if(state.scenario==="success")return sendJson(res,200,[{
   id:assignmentId,
   status:"vacant",
   assignee_staff_id:null,
   revision:6,
   updated_at:"2026-10-11T02:30:00.000Z",
  }]);
  return sendJson(res,500,{error:"unexpected_patch"});
 }

 return sendJson(res,404,{error:"not_found"});
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
 throw new Error(`Timed out waiting for hermetic operations app.\n${appOutput.slice(-4000)}`);
}
async function postGap(expectedRevision){
 const response=await fetch(`${appBase}/api/operations/shifts/report-gap`,{
  method:"POST",
  headers:{"Content-Type":"application/json","Origin":appBase,"Cookie":`orbi_session=${accessToken}`},
  body:JSON.stringify({assignmentId,expectedRevision}),
  redirect:"manual",
 });
 const payload=await response.json().catch(()=>null);
 return {response,payload};
}
function assertPrivate(response,label){
 assert.equal((response.headers.get("cache-control")||"").includes("no-store"),true,`${label} no-store`);
 assert.equal(response.headers.get("x-content-type-options"),"nosniff",`${label} nosniff`);
 assert.equal(response.headers.get("access-control-allow-origin"),null,`${label} no CORS opt-in`);
}

async function main(){
 await listen(upstream,upstreamPort,upstreamHost);
 await waitForApp();
 console.log(`Hermetic operations conflict · ${appBase}`);

 state.scenario="stale";
 const patchesBeforeStale=state.shiftPatches;
 const stale=await postGap(4);
 assert.equal(stale.response.status,409);
 assert.equal(stale.payload?.error,"El turno cambió; recarga antes de continuar");
 assert.equal(stale.payload?.currentRevision,5);
 assert.equal(state.shiftPatches,patchesBeforeStale,"stale preflight must not mutate upstream");
 assertPrivate(stale.response,"stale revision response");
 console.log("PASS stale expectedRevision returns 409 before PATCH");

 state.scenario="illegal";
 const patchesBeforeIllegal=state.shiftPatches;
 const illegal=await postGap(5);
 assert.equal(illegal.response.status,409);
 assert.equal(illegal.payload?.error,"Este turno no admite reporte de vacante desde su estado actual");
 assert.equal(state.shiftPatches,patchesBeforeIllegal,"illegal transition must not mutate upstream");
 assertPrivate(illegal.response,"illegal transition response");
 console.log("PASS invalid lifecycle transition returns 409 before PATCH");

 state.scenario="race";
 const race=await postGap(5);
 assert.equal(race.response.status,409);
 assert.equal(race.payload?.error,"Conflicto de edición; recarga el turno");
 assert.equal(state.shiftPatches,patchesBeforeIllegal+1,"race scenario should attempt exactly one PATCH");
 assert.equal(state.patchQueries.at(-1)?.revision,"eq.5","PATCH must preserve optimistic revision predicate");
 assert.equal(state.patchQueries.at(-1)?.id,`eq.${assignmentId}`,"PATCH must remain assignment-scoped");
 assert.equal(state.patchQueries.at(-1)?.community_id,"eq.pc2","PATCH must remain community-scoped");
 assertPrivate(race.response,"race conflict response");
 console.log("PASS zero-row compare-and-swap PATCH returns 409 conflict");

 state.scenario="success";
 const success=await postGap(5);
 assert.equal(success.response.status,200);
 assert.equal(success.payload?.ok,true);
 assert.equal(success.payload?.assignment?.id,assignmentId);
 assert.equal(success.payload?.assignment?.status,"vacant");
 assert.equal(success.payload?.assignment?.revision,6);
 assert.deepEqual(state.patchBodies.at(-1),{status:"vacant",assignee_staff_id:null,updated_by:syntheticUserId});
 assert.equal(state.patchQueries.at(-1)?.revision,"eq.5");
 assertPrivate(success.response,"successful command response");
 console.log("PASS valid command preserves scoped revision CAS and structured mutation body");

 assert.equal(state.userLookups,4,"each command must authenticate against upstream user endpoint");
 assert.equal(state.membershipLookups,4,"each command must resolve active membership");
 assert.equal(state.shiftReads,4,"each command must re-read current assignment state");
 assert.equal(state.shiftPatches,2,"only race and success paths may reach PATCH");
 console.log("HERMETIC OPERATIONS CONFLICT CONTRACT GREEN");
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
