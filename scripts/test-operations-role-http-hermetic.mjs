import assert from "node:assert/strict";
import http from "node:http";
import {spawn} from "node:child_process";

const appHost="localhost";
const appPort=Number(process.env.ORBI_QA_ROLE_HTTP_PORT||3222);
const appBase=`http://${appHost}:${appPort}`;
const upstreamHost="127.0.0.1";
const upstreamPort=Number(process.env.ORBI_QA_ROLE_HTTP_UPSTREAM_PORT||54331);
const upstreamBase=`http://${upstreamHost}:${upstreamPort}`;
const nextBin="node_modules/next/dist/bin/next";
const assignmentId="44444444-4444-4444-8444-444444444444";
const incidentId="55555555-5555-4555-8555-555555555555";

const identities={
 concierge:{token:"qa-role-concierge",id:"61111111-1111-4111-8111-111111111111",role:"concierge"},
 mayordomo:{token:"qa-role-mayordomo",id:"62222222-2222-4222-8222-222222222222",role:"mayordomo"},
 committee:{token:"qa-role-committee",id:"63333333-3333-4333-8333-333333333333",role:"committee"},
 resident:{token:"qa-role-resident",id:"64444444-4444-4444-8444-444444444444",role:"resident"},
 administrator:{token:"qa-role-administrator",id:"65555555-5555-4555-8555-555555555555",role:"administrator"},
};
const byToken=new Map(Object.values(identities).map(identity=>[identity.token,identity]));
const state={resourceCalls:[],userLookups:0,membershipLookups:0};

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
function identityFrom(req){return byToken.get(bearer(req))||null}

const upstream=http.createServer(async(req,res)=>{
 const url=new URL(req.url||"/",upstreamBase);
 const identity=identityFrom(req);

 if(req.method==="GET"&&url.pathname==="/auth/v1/user"){
  state.userLookups++;
  if(!identity)return sendJson(res,401,{error:"invalid_token"});
  return sendJson(res,200,{id:identity.id});
 }

 if(req.method==="GET"&&url.pathname==="/rest/v1/memberships"){
  state.membershipLookups++;
  if(!identity)return sendJson(res,401,{error:"invalid_token"});
  return sendJson(res,200,[{operations_role:identity.role,active_from:null,active_until:null,disabled_at:null}]);
 }

 if(url.pathname==="/rest/v1/shift_assignments"){
  if(!identity)return sendJson(res,401,{error:"invalid_token"});
  state.resourceCalls.push({role:identity.role,method:req.method,path:"shift_assignments"});
  if(req.method==="GET")return sendJson(res,200,[{id:assignmentId,status:"planned",assignee_staff_id:null,revision:1}]);
  if(req.method==="PATCH"){
   const body=await readJson(req);
   return sendJson(res,200,[{id:assignmentId,status:body?.status??"planned",assignee_staff_id:body?.assignee_staff_id??null,revision:2,updated_at:"2026-10-11T02:40:00.000Z"}]);
  }
 }

 if(url.pathname==="/rest/v1/incidents"){
  if(!identity)return sendJson(res,401,{error:"invalid_token"});
  state.resourceCalls.push({role:identity.role,method:req.method,path:"incidents"});
  if(req.method==="GET")return sendJson(res,200,[{id:incidentId,state:"reported",priority:"low",assigned_role:null,revision:1}]);
  if(req.method==="PATCH"){
   const body=await readJson(req);
   return sendJson(res,200,[{id:incidentId,state:body?.state??"reported",priority:body?.priority??"low",assigned_role:body?.assigned_role??null,revision:2,updated_at:"2026-10-11T02:40:00.000Z"}]);
  }
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
 throw new Error(`Timed out waiting for hermetic role app.\n${appOutput.slice(-4000)}`);
}
function cookie(role){return `orbi_session=${identities[role].token}`}
async function json(path,{role,method="GET",body}={}){
 const headers={};
 if(role)headers.Cookie=cookie(role);
 if(method!=="GET")headers.Origin=appBase;
 if(body!==undefined)headers["Content-Type"]="application/json";
 const response=await fetch(`${appBase}${path}`,{
  method,
  headers,
  body:body===undefined?undefined:JSON.stringify(body),
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
function resourceCount(role){return state.resourceCalls.filter(call=>call.role===role).length}

async function assertSession(role,{includes=[],excludes=[]}){
 const result=await json("/api/auth/session",{role});
 assert.equal(result.response.status,200,`${role} session status`);
 assert.equal(result.payload?.authenticated,true,`${role} authenticated`);
 assert.equal(result.payload?.communityId,"pc2",`${role} community`);
 assert.equal(result.payload?.role,role,`${role} role`);
 for(const permission of includes)assert.equal(result.payload?.permissions.includes(permission),true,`${role} includes ${permission}`);
 for(const permission of excludes)assert.equal(result.payload?.permissions.includes(permission),false,`${role} excludes ${permission}`);
 assertPrivate(result.response,`${role} session`);
}

async function main(){
 await listen(upstream,upstreamPort,upstreamHost);
 await waitForApp();
 console.log(`Hermetic operations role HTTP · ${appBase}`);

 await assertSession("concierge",{
  includes:["report_shift_gap","confirm_shift_handoff","report_incident","write_shift_log","write_operational_round"],
  excludes:["manage_shift_schedule","manage_incident","request_shift_replacement","review_staff_contract"],
 });
 const conciergeBefore=resourceCount("concierge");
 const deniedShift=await json("/api/operations/shifts/command",{role:"concierge",method:"POST",body:{}});
 assert.equal(deniedShift.response.status,403);
 assert.equal(deniedShift.payload?.error,"No autorizado");
 assert.equal(resourceCount("concierge"),conciergeBefore,"concierge denial must occur before shift resource access");
 assertPrivate(deniedShift.response,"concierge shift-admin denial");
 const deniedIncident=await json("/api/operations/incidents/command",{role:"concierge",method:"POST",body:{}});
 assert.equal(deniedIncident.response.status,403);
 assert.equal(deniedIncident.payload?.error,"No autorizado");
 assert.equal(resourceCount("concierge"),conciergeBefore,"concierge denial must occur before incident resource access");
 assertPrivate(deniedIncident.response,"concierge incident-admin denial");
 const conciergeGap=await json("/api/operations/shifts/report-gap",{role:"concierge",method:"POST",body:{assignmentId,expectedRevision:1}});
 assert.equal(conciergeGap.response.status,200);
 assert.equal(conciergeGap.payload?.ok,true);
 assert.equal(conciergeGap.payload?.assignment?.status,"vacant");
 assert.equal(resourceCount("concierge"),conciergeBefore+2,"allowed concierge gap should perform one GET + one PATCH");
 console.log("PASS concierge operates allowed gap flow but cannot administer shifts or incidents");

 await assertSession("mayordomo",{
  includes:["request_shift_replacement","manage_shift_schedule","manage_incident","review_staff_functions"],
  excludes:["manage_resident","review_staff_contract"],
 });
 const mayordomoBefore=resourceCount("mayordomo");
 const managedShift=await json("/api/operations/shifts/command",{role:"mayordomo",method:"POST",body:{assignmentId,expectedRevision:1,nextStatus:"vacant"}});
 assert.equal(managedShift.response.status,200);
 assert.equal(managedShift.payload?.ok,true);
 assert.equal(managedShift.payload?.assignment?.status,"vacant");
 const managedIncident=await json("/api/operations/incidents/command",{role:"mayordomo",method:"POST",body:{incidentId,expectedRevision:1,nextState:"acknowledged"}});
 assert.equal(managedIncident.response.status,200);
 assert.equal(managedIncident.payload?.ok,true);
 assert.equal(managedIncident.payload?.incident?.state,"acknowledged");
 assert.equal(resourceCount("mayordomo"),mayordomoBefore+4,"mayordomo admin flows should each perform GET + PATCH");
 console.log("PASS mayordomo reaches shift and incident administration while retaining declared limits");

 await assertSession("committee",{includes:["view_shift_schedule","review_staff_functions"],excludes:["report_shift_gap","manage_shift_schedule","manage_incident"]});
 const committeeBefore=resourceCount("committee");
 const committeeGap=await json("/api/operations/shifts/report-gap",{role:"committee",method:"POST",body:{assignmentId,expectedRevision:1}});
 assert.equal(committeeGap.response.status,403);
 assert.equal(committeeGap.payload?.error,"No autorizado");
 assert.equal(resourceCount("committee"),committeeBefore,"committee denial must occur before resource access");
 console.log("PASS committee stays read/review-only at HTTP authorization boundary");

 await assertSession("resident",{includes:[],excludes:["view_shift_schedule","report_shift_gap","manage_incident"]});
 assert.deepEqual((await json("/api/auth/session",{role:"resident"})).payload?.permissions,[]);
 const residentBefore=resourceCount("resident");
 const residentGap=await json("/api/operations/shifts/report-gap",{role:"resident",method:"POST",body:{assignmentId,expectedRevision:1}});
 assert.equal(residentGap.response.status,403);
 assert.equal(residentGap.payload?.error,"No autorizado");
 assert.equal(resourceCount("resident"),residentBefore,"resident denial must occur before resource access");
 console.log("PASS resident receives no operational permission and cannot reach mutation resources");

 await assertSession("administrator",{includes:["manage_shift_schedule","manage_incident","manage_resident","review_staff_contract"],excludes:[]});
 console.log("PASS administrator session exposes the full declared administrative surface");

 assert.equal(state.userLookups>=13,true,"role checks must use upstream user verification");
 assert.equal(state.membershipLookups>=13,true,"role checks must resolve membership server-side");
 console.log("HERMETIC OPERATIONS ROLE HTTP CONTRACT GREEN");
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
