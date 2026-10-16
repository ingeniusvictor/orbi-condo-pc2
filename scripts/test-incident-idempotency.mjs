import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import {spawn} from "node:child_process";

const migration=fs.readFileSync("supabase/migrations/20261016_p1_incident_idempotency.sql","utf8");
const route=fs.readFileSync("app/api/operations/incidents/report/route.ts","utf8");
const bridge=fs.readFileSync("app/operaciones/private-api-failure-reference.tsx","utf8");

assert.match(migration,/add column if not exists client_request_id uuid/i);
assert.match(migration,/create unique index if not exists incidents_creator_request_unique/i);
assert.match(migration,/community_id,created_by,client_request_id/i);
assert.match(migration,/where client_request_id is not null/i);
for(const forbidden of [/drop table/i,/truncate/i,/delete from/i,/auth\.users/i])assert.doesNotMatch(migration,forbidden);

assert.match(route,/x-orbi-idempotency-key/);
assert.match(route,/client_request_id:requestId/);
assert.match(route,/response\.status===409/);
assert.match(route,/findIncidentReplay/);
assert.match(route,/replayed:true/);
assert.match(route,/replayed:false/);
assert.doesNotMatch(route,/client_request_id[^\n]*incidentSelect/);

assert.match(bridge,/crypto\.randomUUID\(\)/);
assert.match(bridge,/headers\.set\("x-orbi-idempotency-key",key\)/);
assert.match(bridge,/current\?\.body===incidentBody\?current\.key/);
assert.match(bridge,/!retried&&response\.status>=500/);
assert.doesNotMatch(bridge,/localStorage|sessionStorage|document\.cookie|setInterval|while\s*\(/);

const appHost="localhost";
const appPort=Number(process.env.ORBI_QA_IDEMPOTENCY_PORT||3225);
const appBase=`http://${appHost}:${appPort}`;
const upstreamHost="127.0.0.1";
const upstreamPort=Number(process.env.ORBI_QA_IDEMPOTENCY_UPSTREAM_PORT||54335);
const upstreamBase=`http://${upstreamHost}:${upstreamPort}`;
const nextBin="node_modules/next/dist/bin/next";
const syntheticUserId="33333333-3333-4333-8333-333333333333";
const incidentId="44444444-4444-4444-8444-444444444444";
const requestId="55555555-5555-4555-8555-555555555555";
const accessToken="qa-idempotency-access";

const state={scenario:"create",incidentPosts:0,incidentReads:0,postBodies:[],postQueries:[],readQueries:[]};
const row={id:incidentId,community_id:"pc2",service_date:"2026-10-16",area:"common_area",priority:"medium",state:"reported",assigned_role:null,revision:1,created_at:"2026-10-16T12:00:00.000Z"};

function sendJson(res,status,payload){res.writeHead(status,{"Content-Type":"application/json","Cache-Control":"no-store"});res.end(JSON.stringify(payload));}
async function readJson(req){let body="";for await(const chunk of req)body+=chunk;try{return JSON.parse(body||"{}")}catch{return null}}
function bearer(req){const value=req.headers.authorization||"";return value.startsWith("Bearer ")?value.slice(7):"";}

const upstream=http.createServer(async(req,res)=>{
 const url=new URL(req.url||"/",upstreamBase);
 const token=bearer(req);
 if(req.method==="GET"&&url.pathname==="/auth/v1/user"){
  if(token!==accessToken)return sendJson(res,401,{error:"invalid_token"});
  return sendJson(res,200,{id:syntheticUserId});
 }
 if(req.method==="GET"&&url.pathname==="/rest/v1/memberships"){
  if(token!==accessToken)return sendJson(res,401,{error:"invalid_token"});
  return sendJson(res,200,[{operations_role:"administrator",active_from:null,active_until:null,disabled_at:null}]);
 }
 if(req.method==="POST"&&url.pathname==="/rest/v1/incidents"){
  state.incidentPosts++;
  state.postQueries.push(Object.fromEntries(url.searchParams.entries()));
  state.postBodies.push(await readJson(req));
  if(state.scenario==="create")return sendJson(res,201,[row]);
  if(state.scenario==="replay"||state.scenario==="orphan-conflict")return sendJson(res,409,{code:"23505"});
  if(state.scenario==="upstream-failure")return sendJson(res,503,{error:"synthetic_unavailable"});
 }
 if(req.method==="GET"&&url.pathname==="/rest/v1/incidents"){
  state.incidentReads++;
  state.readQueries.push(Object.fromEntries(url.searchParams.entries()));
  if(state.scenario==="replay")return sendJson(res,200,[row]);
  if(state.scenario==="orphan-conflict")return sendJson(res,200,[]);
  return sendJson(res,500,{error:"unexpected_read"});
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
 throw new Error(`Timed out waiting for hermetic idempotency app.\n${appOutput.slice(-4000)}`);
}
async function report(key=requestId){
 const headers={"Content-Type":"application/json","Origin":appBase,"Cookie":`orbi_session=${accessToken}`};
 if(key!==null)headers["x-orbi-idempotency-key"]=key;
 const response=await fetch(`${appBase}/api/operations/incidents/report`,{
  method:"POST",headers,body:JSON.stringify({serviceDate:"2026-10-16",area:"common_area",priority:"medium",caseReference:"QA-IDEM-1"}),redirect:"manual",
 });
 return {response,payload:await response.json().catch(()=>null)};
}
function assertPrivate(response,label){
 assert.equal((response.headers.get("cache-control")||"").includes("no-store"),true,`${label} no-store`);
 assert.equal(response.headers.get("x-content-type-options"),"nosniff",`${label} nosniff`);
 assert.equal(response.headers.get("access-control-allow-origin"),null,`${label} no CORS opt-in`);
}

async function main(){
 await listen(upstream,upstreamPort,upstreamHost);
 await waitForApp();
 console.log(`Hermetic incident idempotency · ${appBase}`);

 const postsBeforeMissing=state.incidentPosts;
 const missing=await report(null);
 assert.equal(missing.response.status,400);
 assert.equal(missing.payload?.error,"Clave de operación inválida");
 assert.equal(state.incidentPosts,postsBeforeMissing,"missing idempotency key must not reach incident INSERT");
 assertPrivate(missing.response,"missing idempotency key");
 console.log("PASS missing idempotency key fails closed before INSERT");

 state.scenario="create";
 const created=await report();
 assert.equal(created.response.status,201);
 assert.equal(created.payload?.ok,true);
 assert.equal(created.payload?.replayed,false);
 assert.equal(created.payload?.incident?.id,incidentId);
 assert.equal(created.payload?.incident?.client_request_id,undefined,"request key must not be exposed");
 assert.equal(state.postBodies.at(-1)?.client_request_id,requestId);
 assert.equal(state.postBodies.at(-1)?.created_by,syntheticUserId);
 assert.equal(state.postBodies.at(-1)?.updated_by,syntheticUserId);
 assert.equal(state.postQueries.at(-1)?.select?.includes("client_request_id"),false,"insert representation must omit request key");
 assertPrivate(created.response,"created incident");
 console.log("PASS first request creates exactly one incident with private request key");

 state.scenario="replay";
 const replay=await report();
 assert.equal(replay.response.status,200);
 assert.equal(replay.payload?.ok,true);
 assert.equal(replay.payload?.replayed,true);
 assert.equal(replay.payload?.incident?.id,incidentId);
 assert.equal(replay.payload?.incident?.client_request_id,undefined,"replay must not expose request key");
 assert.equal(state.readQueries.at(-1)?.community_id,"eq.pc2");
 assert.equal(state.readQueries.at(-1)?.created_by,`eq.${syntheticUserId}`);
 assert.equal(state.readQueries.at(-1)?.client_request_id,`eq.${requestId}`);
 assertPrivate(replay.response,"replayed incident");
 console.log("PASS duplicate key resolves to existing incident instead of a second create");

 state.scenario="orphan-conflict";
 const conflict=await report();
 assert.equal(conflict.response.status,409);
 assert.match(conflict.payload?.error||"",/Conflicto de idempotencia/);
 assertPrivate(conflict.response,"orphan idempotency conflict");
 console.log("PASS unexplained unique conflict fails closed");

 state.scenario="upstream-failure";
 const upstreamFailure=await report();
 assert.equal(upstreamFailure.response.status,502);
 assertPrivate(upstreamFailure.response,"upstream failure");
 console.log("PASS upstream 5xx remains an ambiguous 5xx-class client outcome");

 assert.equal(state.incidentPosts,4,"only valid-key scenarios may reach incident POST");
 assert.equal(state.incidentReads,2,"only conflict scenarios may perform idempotency lookup");
 console.log("HERMETIC INCIDENT IDEMPOTENCY CONTRACT GREEN");
}

try{await main();}
finally{
 if(app.exitCode===null){
  app.kill("SIGTERM");
  await Promise.race([new Promise(resolve=>app.once("exit",resolve)),new Promise(resolve=>setTimeout(resolve,3000))]);
  if(app.exitCode===null)app.kill("SIGKILL");
 }
 if(upstream.listening)await close(upstream);
}
