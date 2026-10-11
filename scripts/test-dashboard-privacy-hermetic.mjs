import assert from "node:assert/strict";
import http from "node:http";
import {spawn} from "node:child_process";

const appHost="localhost";
const appPort=Number(process.env.ORBI_QA_DASHBOARD_PRIVACY_PORT||3223);
const appBase=`http://${appHost}:${appPort}`;
const upstreamHost="127.0.0.1";
const upstreamPort=Number(process.env.ORBI_QA_DASHBOARD_UPSTREAM_PORT||54332);
const upstreamBase=`http://${upstreamHost}:${upstreamPort}`;
const nextBin="node_modules/next/dist/bin/next";
const serviceDate="2026-10-10";
const privateStaffId="77777777-7777-4777-8777-777777777777";
const shiftId="88888888-8888-4888-8888-888888888888";
const incidentId="99999999-9999-4999-8999-999999999999";

const identities={
 concierge:{token:"qa-dashboard-concierge",id:"71111111-1111-4111-8111-111111111111",role:"concierge"},
 mayordomo:{token:"qa-dashboard-mayordomo",id:"72222222-2222-4222-8222-222222222222",role:"mayordomo"},
 committee:{token:"qa-dashboard-committee",id:"73333333-3333-4333-8333-333333333333",role:"committee"},
 resident:{token:"qa-dashboard-resident",id:"74444444-4444-4444-8444-444444444444",role:"resident"},
};
const byToken=new Map(Object.values(identities).map(identity=>[identity.token,identity]));
const state={resourceCalls:[]};

function sendJson(res,status,payload){
 res.writeHead(status,{"Content-Type":"application/json","Cache-Control":"no-store"});
 res.end(JSON.stringify(payload));
}
function bearer(req){
 const value=req.headers.authorization||"";
 return value.startsWith("Bearer ")?value.slice(7):"";
}
function identityFrom(req){return byToken.get(bearer(req))||null}

const upstream=http.createServer((req,res)=>{
 const url=new URL(req.url||"/",upstreamBase);
 const identity=identityFrom(req);
 if(req.method==="GET"&&url.pathname==="/auth/v1/user"){
  if(!identity)return sendJson(res,401,{error:"invalid_token"});
  return sendJson(res,200,{id:identity.id});
 }
 if(req.method==="GET"&&url.pathname==="/rest/v1/memberships"){
  if(!identity)return sendJson(res,401,{error:"invalid_token"});
  return sendJson(res,200,[{operations_role:identity.role,active_from:null,active_until:null,disabled_at:null}]);
 }
 if(!identity)return sendJson(res,401,{error:"invalid_token"});
 if(req.method!=="GET")return sendJson(res,405,{error:"method_not_allowed"});

 const table=url.pathname.replace("/rest/v1/","");
 state.resourceCalls.push({role:identity.role,table});
 if(table==="shift_assignments")return sendJson(res,200,[{
  id:shiftId,service_date:serviceDate,slot_code:"CONSERJERIA_AM",starts_at:"2026-10-10T11:00:00.000Z",ends_at:"2026-10-10T19:00:00.000Z",status:"planned",revision:4,assignee_staff_id:privateStaffId,
 }]);
 if(table==="incidents")return sendJson(res,200,[{
  id:incidentId,service_date:serviceDate,area:"access",priority:"high",state:"reported",assigned_role:"concierge",revision:3,created_at:"2026-10-10T12:00:00.000Z",updated_at:"2026-10-10T12:30:00.000Z",
 }]);
 if(table==="staff_private")return sendJson(res,200,[{id:privateStaffId,display_name:"Suplente Sintético Privado",staff_function:"concierge"}]);
 if(table==="shift_events")return sendJson(res,200,[{id:21,event_type:"created",from_status:null,to_status:"planned",reason_code:null,created_at:"2026-10-10T11:30:00.000Z"}]);
 if(table==="incident_events")return sendJson(res,200,[{id:31,event_type:"created",from_state:null,to_state:"reported",from_priority:null,to_priority:"high",created_at:"2026-10-10T12:00:00.000Z"}]);
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
 throw new Error(`Timed out waiting for hermetic dashboard app.\n${appOutput.slice(-4000)}`);
}
function cookie(role){return `orbi_session=${identities[role].token}`}
async function dashboard(role){
 const response=await fetch(`${appBase}/api/operations/dashboard?date=${serviceDate}`,{headers:{Cookie:cookie(role)},redirect:"manual"});
 const text=await response.text();
 let payload=null;
 try{payload=JSON.parse(text)}catch{}
 return {response,payload,text};
}
function tablesFor(role){return state.resourceCalls.filter(call=>call.role===role).map(call=>call.table)}
function assertPrivate(response,label){
 assert.equal((response.headers.get("cache-control")||"").includes("no-store"),true,`${label} no-store`);
 assert.equal(response.headers.get("x-content-type-options"),"nosniff",`${label} nosniff`);
 assert.equal(response.headers.get("access-control-allow-origin"),null,`${label} no CORS opt-in`);
}
function assertNoPrivateAssigneeLeak(result,label){
 assert.equal(result.text.includes(privateStaffId),false,`${label} must not expose assignee_staff_id`);
 assert.equal(result.text.includes("assignee_staff_id"),false,`${label} must not expose private DB field name`);
 assert.equal(result.payload?.shifts?.[0]?.hasAssignee,true,`${label} may expose only assignment presence`);
}

async function main(){
 await listen(upstream,upstreamPort,upstreamHost);
 await waitForApp();
 console.log(`Hermetic dashboard privacy · ${appBase}`);

 const concierge=await dashboard("concierge");
 assert.equal(concierge.response.status,200);
 assert.equal(concierge.payload?.role,"concierge");
 assert.deepEqual(concierge.payload?.staff,[]);
 assert.equal(tablesFor("concierge").includes("staff_private"),false,"concierge must not query staff_private");
 assert.equal(tablesFor("concierge").includes("shift_events"),true,"concierge may receive structured operational shift activity");
 assert.equal(tablesFor("concierge").includes("incident_events"),true,"concierge may receive structured incident activity");
 assert.equal(concierge.payload?.recentActivity?.length,2);
 assertNoPrivateAssigneeLeak(concierge,"concierge dashboard");
 assert.equal(concierge.text.includes("Suplente Sintético Privado"),false,"concierge must not receive private staff display name");
 assertPrivate(concierge.response,"concierge dashboard");
 console.log("PASS concierge dashboard omits staff_private while retaining structured operational activity");

 const mayordomo=await dashboard("mayordomo");
 assert.equal(mayordomo.response.status,200);
 assert.equal(mayordomo.payload?.role,"mayordomo");
 assert.equal(tablesFor("mayordomo").includes("staff_private"),true,"mayordomo may query eligible private staff catalog");
 assert.equal(mayordomo.payload?.staff?.length,1);
 assert.equal(mayordomo.payload?.staff?.[0]?.displayName,"Suplente Sintético Privado");
 assert.equal(mayordomo.payload?.staff?.[0]?.staffFunction,"concierge");
 assertNoPrivateAssigneeLeak(mayordomo,"mayordomo dashboard");
 assertPrivate(mayordomo.response,"mayordomo dashboard");
 console.log("PASS mayordomo receives only the eligible staff projection while shift assignee IDs remain hidden");

 const committee=await dashboard("committee");
 assert.equal(committee.response.status,200);
 assert.equal(committee.payload?.role,"committee");
 assert.deepEqual(committee.payload?.staff,[]);
 assert.deepEqual(committee.payload?.recentActivity,[]);
 assert.equal(tablesFor("committee").includes("staff_private"),false,"committee must not query staff_private");
 assert.equal(tablesFor("committee").includes("shift_events"),false,"committee must not query operational shift events");
 assert.equal(tablesFor("committee").includes("incident_events"),false,"committee must not query incident events");
 assertNoPrivateAssigneeLeak(committee,"committee dashboard");
 assertPrivate(committee.response,"committee dashboard");
 console.log("PASS committee receives schedule summary without private staff catalog or operational event stream");

 const residentCallsBefore=state.resourceCalls.length;
 const resident=await dashboard("resident");
 assert.equal(resident.response.status,403);
 assert.equal(resident.payload?.error,"No autorizado");
 assert.equal(state.resourceCalls.length,residentCallsBefore,"resident denial must happen before dashboard resource access");
 assertPrivate(resident.response,"resident dashboard denial");
 console.log("PASS resident cannot reach dashboard resource projection");

 console.log("HERMETIC DASHBOARD PRIVACY PROJECTION GREEN");
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
