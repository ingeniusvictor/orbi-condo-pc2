import assert from "node:assert/strict";
import http from "node:http";
import {spawn} from "node:child_process";

const appHost="localhost";
const appPort=Number(process.env.ORBI_QA_AUTH_PORT||3220);
const appBase=`http://${appHost}:${appPort}`;
const upstreamHost="127.0.0.1";
const upstreamPort=Number(process.env.ORBI_QA_FAKE_SUPABASE_PORT||54329);
const upstreamBase=`http://${upstreamHost}:${upstreamPort}`;
const nextBin="node_modules/next/dist/bin/next";
const syntheticEmail="concierge.synthetic@example.invalid";
const syntheticPassword="synthetic-password";
const syntheticUserId="11111111-1111-4111-8111-111111111111";

const state={
 passwordGrants:0,
 refreshGrants:0,
 userLookups:0,
 membershipLookups:0,
 logoutCalls:0,
 membershipMode:"active",
 revoked:new Set(),
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
function membershipFixture(){
 if(state.membershipMode==="disabled")return {operations_role:"concierge",active_from:null,active_until:null,disabled_at:"2026-10-10T00:00:00Z"};
 if(state.membershipMode==="future")return {operations_role:"concierge",active_from:"2999-01-01T00:00:00Z",active_until:null,disabled_at:null};
 if(state.membershipMode==="expired")return {operations_role:"concierge",active_from:null,active_until:"2000-01-01T00:00:00Z",disabled_at:null};
 if(state.membershipMode==="unknown_role")return {operations_role:"intruder",active_from:null,active_until:null,disabled_at:null};
 return {operations_role:"concierge",active_from:null,active_until:null,disabled_at:null};
}

const upstream=http.createServer(async(req,res)=>{
 const url=new URL(req.url||"/",upstreamBase);
 if(req.method==="POST"&&url.pathname==="/auth/v1/token"&&url.searchParams.get("grant_type")==="password"){
  state.passwordGrants++;
  const body=await readJson(req);
  if(body?.email!==syntheticEmail||body?.password!==syntheticPassword)return sendJson(res,400,{error:"invalid_grant"});
  return sendJson(res,200,{access_token:"qa-access-1",refresh_token:"qa-refresh-1",expires_in:120});
 }
 if(req.method==="POST"&&url.pathname==="/auth/v1/token"&&url.searchParams.get("grant_type")==="refresh_token"){
  state.refreshGrants++;
  const body=await readJson(req);
  if(body?.refresh_token!=="qa-refresh-1"&&body?.refresh_token!=="qa-refresh-2")return sendJson(res,400,{error:"invalid_refresh"});
  return sendJson(res,200,{access_token:"qa-access-2",refresh_token:"qa-refresh-2",expires_in:180});
 }
 if(req.method==="GET"&&url.pathname==="/auth/v1/user"){
  state.userLookups++;
  const token=bearer(req);
  if(!["qa-access-1","qa-access-2"].includes(token)||state.revoked.has(token))return sendJson(res,401,{error:"invalid_token"});
  return sendJson(res,200,{id:syntheticUserId});
 }
 if(req.method==="GET"&&url.pathname==="/rest/v1/memberships"){
  state.membershipLookups++;
  const token=bearer(req);
  if(!["qa-access-1","qa-access-2"].includes(token)||state.revoked.has(token))return sendJson(res,401,{error:"invalid_token"});
  return sendJson(res,200,[membershipFixture()]);
 }
 if(req.method==="POST"&&url.pathname==="/auth/v1/logout"){
  state.logoutCalls++;
  const token=bearer(req);
  if(!token)return sendJson(res,401,{error:"missing_token"});
  state.revoked.add(token);
  res.writeHead(204,{"Cache-Control":"no-store"});
  return res.end();
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
 throw new Error(`Timed out waiting for hermetic auth app.\n${appOutput.slice(-4000)}`);
}
async function json(path,options={}){
 const response=await fetch(`${appBase}${path}`,{...options,redirect:"manual"});
 const payload=await response.json().catch(()=>null);
 return {response,payload};
}
function setCookies(response){return typeof response.headers.getSetCookie==="function"?response.headers.getSetCookie():[]}
function cookiePair(raw){return raw.split(";",1)[0]}
function findCookie(response,name){return setCookies(response).find(value=>value.toLowerCase().startsWith(name.toLowerCase()+"="))}
function assertIssuedCookie(raw,name,{maxAge}={}){
 assert.ok(raw,`${name} should be issued`);
 const lower=raw.toLowerCase();
 assert.equal(lower.includes("httponly"),true,`${name} HttpOnly`);
 assert.equal(lower.includes("secure"),true,`${name} Secure`);
 assert.equal(lower.includes("samesite=strict"),true,`${name} SameSite=Strict`);
 assert.equal(lower.includes("path=/"),true,`${name} Path=/`);
 assert.equal(lower.includes("domain="),false,`${name} host-only`);
 if(maxAge!==undefined)assert.equal(lower.includes(`max-age=${maxAge}`),true,`${name} Max-Age=${maxAge}`);
}
function assertClearedCookie(raw,name){
 assert.ok(raw,`${name} should be cleared`);
 const lower=raw.toLowerCase();
 assert.match(raw,new RegExp(`^${name}=;`,"i"));
 assert.equal(lower.includes("max-age=0"),true,`${name} Max-Age=0`);
 assert.equal(lower.includes("httponly"),true,`${name} HttpOnly while clearing`);
 assert.equal(lower.includes("secure"),true,`${name} Secure while clearing`);
 assert.equal(lower.includes("samesite=strict"),true,`${name} SameSite=Strict while clearing`);
 assert.equal(lower.includes("path=/"),true,`${name} Path=/ while clearing`);
 assert.equal(lower.includes("domain="),false,`${name} remains host-only while clearing`);
}
function assertAnonymousSession(result,label){
 assert.equal(result.response.status,200,label);
 assert.equal(result.payload?.authenticated,false,label);
 assert.equal(result.payload?.communityId,null,label);
 assert.equal(result.payload?.role,null,label);
 assert.deepEqual(result.payload?.permissions,[],label);
}

async function main(){
 await listen(upstream,upstreamPort,upstreamHost);
 await waitForApp();
 console.log(`Hermetic auth lifecycle · ${appBase}`);

 const initial=await json("/api/auth/session");
 assert.equal(initial.response.status,200);
 assert.equal(initial.payload?.configured,true);
 assert.equal(initial.payload?.authenticated,false);
 console.log("PASS configured hermetic backend starts anonymous");

 const missingOrigin=await json("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:syntheticEmail,password:syntheticPassword})});
 assert.equal(missingOrigin.response.status,403);
 assert.equal(missingOrigin.payload?.error,"Origen no autorizado");
 assert.equal(state.passwordGrants,0,"missing Origin must not reach upstream auth");
 console.log("PASS login rejects missing Origin before upstream auth");

 const grantsBeforeOversize=state.passwordGrants;
 const oversized=await json("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json","Origin":appBase},body:JSON.stringify({email:syntheticEmail,password:"x".repeat(5000)})});
 assert.equal(oversized.response.status,413);
 assert.equal(state.passwordGrants,grantsBeforeOversize,"oversized login must not reach upstream auth");
 console.log("PASS oversized login is rejected before upstream auth");

 const invalid=await json("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json","Origin":appBase},body:JSON.stringify({email:syntheticEmail,password:"wrong-synthetic-password"})});
 assert.equal(invalid.response.status,401);
 assert.equal(setCookies(invalid.response).length,0,"invalid login must not issue cookies");
 assert.equal(state.passwordGrants,1);
 console.log("PASS invalid login normalizes failure and emits no cookies");

 const login=await json("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json","Origin":appBase},body:JSON.stringify({email:syntheticEmail,password:syntheticPassword})});
 assert.equal(login.response.status,200);
 assert.equal(login.payload?.ok,true);
 const loginSession=findCookie(login.response,"orbi_session");
 const loginRefresh=findCookie(login.response,"orbi_refresh");
 assertIssuedCookie(loginSession,"orbi_session",{maxAge:120});
 assertIssuedCookie(loginRefresh,"orbi_refresh");
 assert.equal(loginRefresh.toLowerCase().includes("max-age="),false,"refresh cookie remains browser-session scoped");
 const loginCookie=`${cookiePair(loginSession)}; ${cookiePair(loginRefresh)}`;
 console.log("PASS login issues hardened session + browser-session refresh cookies");

 const invalidAccess=await json("/api/auth/session",{headers:{Cookie:"orbi_session=not-a-valid-token"}});
 assertAnonymousSession(invalidAccess,"invalid access token must fail closed");
 console.log("PASS invalid access token fails closed to anonymous session");

 for(const mode of ["disabled","future","expired","unknown_role"]){
  state.membershipMode=mode;
  const restricted=await json("/api/auth/session",{headers:{Cookie:loginCookie}});
  assertAnonymousSession(restricted,`${mode} membership must fail closed`);
 }
 state.membershipMode="active";
 console.log("PASS disabled, future, expired and unknown-role memberships all fail closed");

 const authenticated=await json("/api/auth/session",{headers:{Cookie:loginCookie}});
 assert.equal(authenticated.response.status,200);
 assert.equal(authenticated.payload?.authenticated,true);
 assert.equal(authenticated.payload?.communityId,"pc2");
 assert.equal(authenticated.payload?.role,"concierge");
 assert.equal(authenticated.payload?.permissions.includes("view_shift_schedule"),true);
 assert.equal(authenticated.payload?.permissions.includes("view_shift_log"),true);
 assert.equal(authenticated.payload?.permissions.includes("view_operational_round"),true);
 assert.equal(authenticated.payload?.permissions.includes("manage_shift_schedule"),false);
 assert.equal(authenticated.payload?.permissions.includes("manage_incident"),false);
 console.log("PASS session resolves synthetic pc2/concierge identity and least privilege");

 const refreshWithoutToken=await json("/api/auth/refresh",{method:"POST",headers:{"Origin":appBase,"Cookie":"orbi_session=qa-access-1"}});
 assert.equal(refreshWithoutToken.response.status,401);
 assert.equal(refreshWithoutToken.payload?.error,"Sesión no renovable");
 assertClearedCookie(findCookie(refreshWithoutToken.response,"orbi_session"),"orbi_session");
 assert.equal(Boolean(findCookie(refreshWithoutToken.response,"orbi_refresh")),false,"missing refresh path should not invent a refresh cookie");
 console.log("PASS missing refresh token clears stale access session and stays unauthorized");

 const invalidRefresh=await json("/api/auth/refresh",{method:"POST",headers:{"Origin":appBase,"Cookie":"orbi_session=qa-access-1; orbi_refresh=invalid-refresh"}});
 assert.equal(invalidRefresh.response.status,401);
 assert.equal(invalidRefresh.payload?.error,"La sesión ya no es válida");
 assertClearedCookie(findCookie(invalidRefresh.response,"orbi_session"),"orbi_session");
 assertClearedCookie(findCookie(invalidRefresh.response,"orbi_refresh"),"orbi_refresh");
 console.log("PASS invalid refresh token clears both local credentials");

 const refresh=await json("/api/auth/refresh",{method:"POST",headers:{"Origin":appBase,Cookie:loginCookie}});
 assert.equal(refresh.response.status,200);
 assert.equal(refresh.payload?.ok,true);
 const rotatedSession=findCookie(refresh.response,"orbi_session");
 const rotatedRefresh=findCookie(refresh.response,"orbi_refresh");
 assert.ok(rotatedSession?.startsWith("orbi_session=qa-access-2"),"refresh should rotate access token");
 assert.ok(rotatedRefresh?.startsWith("orbi_refresh=qa-refresh-2"),"refresh should rotate refresh token");
 assertIssuedCookie(rotatedSession,"orbi_session",{maxAge:180});
 assertIssuedCookie(rotatedRefresh,"orbi_refresh");
 const rotatedCookie=`${cookiePair(rotatedSession)}; ${cookiePair(rotatedRefresh)}`;
 console.log("PASS refresh rotates both synthetic tokens under the shared cookie policy");

 const afterRefresh=await json("/api/auth/session",{headers:{Cookie:rotatedCookie}});
 assert.equal(afterRefresh.payload?.authenticated,true);
 assert.equal(afterRefresh.payload?.role,"concierge");
 console.log("PASS rotated access token remains authenticated");

 const logout=await json("/api/auth/logout",{method:"POST",headers:{"Origin":appBase,Cookie:rotatedCookie}});
 assert.equal(logout.response.status,200);
 assert.equal(logout.payload?.ok,true);
 assert.equal(logout.payload?.serverSessionRevoked,true);
 assertClearedCookie(findCookie(logout.response,"orbi_session"),"orbi_session");
 assertClearedCookie(findCookie(logout.response,"orbi_refresh"),"orbi_refresh");
 assert.equal(state.logoutCalls,1);
 console.log("PASS logout revokes synthetic upstream session and clears both cookies");

 const revokedAccess=await json("/api/auth/session",{headers:{Cookie:"orbi_session=qa-access-2"}});
 assertAnonymousSession(revokedAccess,"revoked access token must fail closed");
 console.log("PASS revoked access token cannot recreate a session");

 const final=await json("/api/auth/session");
 assertAnonymousSession(final,"final session should be anonymous");
 console.log("PASS lifecycle returns to anonymous after logout");

 assert.equal(state.passwordGrants,2);
 assert.equal(state.refreshGrants,2,"one invalid and one valid refresh grant should reach the synthetic upstream");
 assert.equal(state.userLookups>=8,true);
 assert.equal(state.membershipLookups>=6,true);
 console.log("HERMETIC AUTH LIFECYCLE GREEN");
 console.log("HERMETIC AUTH FAILURE MODES GREEN");
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
