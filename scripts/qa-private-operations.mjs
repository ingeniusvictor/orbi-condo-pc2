const rawBaseUrl=(process.env.ORBI_QA_BASE_URL||"").trim();
const email=process.env.ORBI_QA_EMAIL||"";
const password=process.env.ORBI_QA_PASSWORD||"";
const expectedRole=process.env.ORBI_QA_ROLE||"administrator";
const expectedCommunityId=process.env.ORBI_QA_COMMUNITY_ID||"pc2";
const runConflict=process.env.ORBI_QA_409==="1";
const allowProduction=process.env.ORBI_QA_ALLOW_PRODUCTION==="1";
const vercelBypass=(process.env.ORBI_QA_VERCEL_BYPASS||"").trim();
const date=process.env.ORBI_QA_DATE||new Intl.DateTimeFormat("en-CA",{timeZone:"America/Santiago",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const allowedRoles=new Set(["administrator","mayordomo","concierge","committee","resident"]);

if(!rawBaseUrl){
 console.error("Missing ORBI_QA_BASE_URL. Pass the exact staging/preview URL explicitly; no default deployment is allowed.");
 process.exit(2);
}
let baseUrl;
try{baseUrl=new URL(rawBaseUrl)}catch{
 console.error("Invalid ORBI_QA_BASE_URL. Provide an absolute URL.");
 process.exit(2);
}
const isLoopback=["localhost","127.0.0.1","::1"].includes(baseUrl.hostname);
if(baseUrl.protocol!=="https:"&&!(isLoopback&&baseUrl.protocol==="http:")){
 console.error("Unsafe ORBI_QA_BASE_URL. HTTPS is required except for localhost/loopback QA.");
 process.exit(2);
}
if(baseUrl.username||baseUrl.password||baseUrl.hash){
 console.error("Unsafe ORBI_QA_BASE_URL. Embedded credentials and URL fragments are not allowed.");
 process.exit(2);
}
baseUrl.pathname="/";
baseUrl.search="";
baseUrl.hash="";
if(baseUrl.hostname==="orbi-condo-pc2.vercel.app"&&!allowProduction){
 console.error("Refusing to run QA against the production hostname. Set ORBI_QA_ALLOW_PRODUCTION=1 only after explicit production approval.");
 process.exit(2);
}
if(vercelBypass&&!baseUrl.hostname.endsWith(".vercel.app")){
 console.error("Refusing to send ORBI_QA_VERCEL_BYPASS to a non-Vercel hostname.");
 process.exit(2);
}
if(!allowedRoles.has(expectedRole)){
 console.error(`Invalid ORBI_QA_ROLE: ${expectedRole}`);
 process.exit(2);
}
if(!email||!password){
 console.error("Missing ORBI_QA_EMAIL / ORBI_QA_PASSWORD. Credentials must stay in local environment variables.");
 process.exit(2);
}

const jar=new Map();
function absorbCookies(response){
 const values=typeof response.headers.getSetCookie==="function"?response.headers.getSetCookie():[];
 for(const value of values){
  const [pair]=value.split(";",1);
  const index=pair.indexOf("=");
  if(index<1)continue;
  const name=pair.slice(0,index).trim();
  const cookieValue=pair.slice(index+1);
  if(cookieValue)jar.set(name,cookieValue); else jar.delete(name);
 }
}
function cookieHeader(){return [...jar.entries()].map(([key,value])=>`${key}=${value}`).join("; ")}

async function establishProtectedPreviewAccess(){
 if(!vercelBypass)return;
 const response=await fetch(baseUrl.origin,{
  headers:{
   Accept:"text/html",
   "x-vercel-protection-bypass":vercelBypass,
   "x-vercel-set-bypass-cookie":"true",
  },
  redirect:"manual",
 });
 absorbCookies(response);
 const location=response.headers.get("location");
 if(location&&new URL(location,baseUrl.origin).origin!==baseUrl.origin){
  throw new Error("Vercel bypass redirected outside the verified deployment origin");
 }
 assert(response.status<400,`Vercel bypass bootstrap failed with HTTP ${response.status}`);
 assert(jar.has("_vercel_jwt"),"Vercel bypass did not establish a scoped _vercel_jwt cookie");
 console.log("PASS protected Preview access established with scoped Vercel bypass cookie");
}

async function request(path,{method="GET",body}={}){
 const url=new URL(path,baseUrl);
 const headers={Accept:"application/json"};
 const cookies=cookieHeader();
 if(cookies)headers.Cookie=cookies;
 if(method!=="GET"&&method!=="HEAD")headers.Origin=baseUrl.origin;
 if(body!==undefined)headers["Content-Type"]="application/json";
 const response=await fetch(url,{method,headers,body:body===undefined?undefined:JSON.stringify(body),redirect:"manual"});
 absorbCookies(response);
 let payload=null;
 const contentType=response.headers.get("content-type")||"";
 if(contentType.includes("application/json"))payload=await response.json();
 return {response,payload};
}
function assert(condition,message){if(!condition)throw new Error(message)}
function assertPrivateNoStore(response,label){
 assert((response.headers.get("cache-control")||"").includes("no-store"),`${label} missing no-store`);
 assert(response.headers.get("x-content-type-options")==="nosniff",`${label} missing nosniff`);
 assert(response.headers.get("access-control-allow-origin")===null,`${label} unexpectedly opted into CORS`);
}
function assertSafeContinuityPayload(payload){
 const serialized=JSON.stringify(payload??{}).toLowerCase();
 for(const forbidden of ["assignee_staff_id","actor_id","staff_private","display_name"]){
  assert(!serialized.includes(forbidden),`continuity payload leaked forbidden field ${forbidden}`);
 }
}

async function restoreConflictFixture(assignmentId){
 if(!assignmentId)return;
 try{
  const changed=await request(`/api/operations/dashboard?date=${encodeURIComponent(date)}`);
  const current=changed.payload?.shifts?.find((shift)=>shift.id===assignmentId);
  if(current?.status!=="vacant"||!Number.isInteger(current.revision))return;
  const restore=await request("/api/operations/shifts/command",{method:"POST",body:{assignmentId:current.id,expectedRevision:current.revision,nextStatus:"planned"}});
  if(restore.response.status===200){
   console.log("PASS 409 fixture restored to planned");
  }else{
   console.error(`QA CLEANUP WARNING: failed to restore synthetic 409 fixture, status ${restore.response.status}`);
  }
 }catch(error){
  console.error(`QA CLEANUP WARNING: ${error instanceof Error?error.message:String(error)}`);
 }
}

async function main(){
 console.log(`ORBI LIVING private operations QA · ${baseUrl.origin} · ${date}`);

 await establishProtectedPreviewAccess();

 const preflight=await request("/api/auth/session");
 assert(preflight.response.status===200,`preflight session expected 200, received ${preflight.response.status}`);
 assert(preflight.payload?.configured===true,"target deployment is not configured with its backend");
 assert(preflight.payload?.authenticated===false,"preflight expected an anonymous browser session");
 assertPrivateNoStore(preflight.response,"preflight session");
 console.log("PASS preflight configured + anonymous + hardened private headers");

 const login=await request("/api/auth/login",{method:"POST",body:{email,password}});
 assert(login.response.status===200,`login expected 200, received ${login.response.status}`);
 assertPrivateNoStore(login.response,"login");
 console.log("PASS login 200 + HttpOnly session cookies received");

 const session=await request("/api/auth/session");
 assert(session.response.status===200&&session.payload?.authenticated===true,"session was not authenticated after login");
 assert(session.payload?.role===expectedRole,`expected role ${expectedRole}, received ${session.payload?.role}`);
 assert(session.payload?.communityId===expectedCommunityId,`expected community ${expectedCommunityId}, received ${session.payload?.communityId}`);
 const permissions=session.payload?.permissions??[];
 console.log(`PASS session authenticated · community=${session.payload.communityId} · role=${session.payload.role} · permissions=${permissions.length}`);

 const dashboard=await request(`/api/operations/dashboard?date=${encodeURIComponent(date)}`);
 assert(dashboard.response.status===200,"private dashboard did not return 200");
 assert(Array.isArray(dashboard.payload?.shifts),"dashboard shifts missing");
 assertPrivateNoStore(dashboard.response,"dashboard");
 console.log(`PASS dashboard RLS read · shifts=${dashboard.payload.shifts.length} · incidents=${dashboard.payload.incidents?.length??0}`);

 if(expectedRole==="concierge"){
  assert(Array.isArray(dashboard.payload?.staff)&&dashboard.payload.staff.length===0,"concierge dashboard unexpectedly exposed staff catalog");
  const serialized=JSON.stringify(dashboard.payload);
  assert(!serialized.includes("assignee_staff_id")&&!serialized.includes("assigneeStaffId"),"concierge dashboard exposed private assignee linkage");
  console.log("PASS concierge privacy projection · no staff catalog / no assignee linkage");
 }
 if(expectedRole==="committee"){
  assert(Array.isArray(dashboard.payload?.staff)&&dashboard.payload.staff.length===0,"committee dashboard unexpectedly exposed staff catalog");
  assert(Array.isArray(dashboard.payload?.recentActivity)&&dashboard.payload.recentActivity.length===0,"committee dashboard unexpectedly exposed operational event stream");
  console.log("PASS committee privacy projection · no staff catalog / no operational event stream");
 }

 if(permissions.includes("view_shift_log")){
  const shiftLog=await request(`/api/operations/shift-log?date=${encodeURIComponent(date)}`);
  assert(shiftLog.response.status===200&&Array.isArray(shiftLog.payload?.logs),"shift-log read failed");
  console.log(`PASS shift-log RLS read · logs=${shiftLog.payload.logs.length}`);
 }
 if(permissions.includes("view_operational_round")){
  const rounds=await request(`/api/operations/rounds?date=${encodeURIComponent(date)}`);
  assert(rounds.response.status===200&&Array.isArray(rounds.payload?.rounds),"operational rounds read failed");
  console.log(`PASS operational rounds RLS read · rounds=${rounds.payload.rounds.length}`);
 }
 if(["view_shift_schedule","view_shift_log","view_operational_round"].every(permission=>permissions.includes(permission))){
  const continuity=await request(`/api/operations/continuity?date=${encodeURIComponent(date)}`);
  assert(continuity.response.status===200,"continuity snapshot did not return 200");
  assert(["blocked","critical","attention","clear"].includes(continuity.payload?.status?.tone),"continuity status tone invalid");
  assert(Array.isArray(continuity.payload?.items),"continuity items missing");
  assert(Number.isInteger(continuity.payload?.metrics?.technicalBlockers),"continuity blocker metric missing");
  assertSafeContinuityPayload(continuity.payload);
  console.log(`PASS server continuity snapshot · tone=${continuity.payload.status.tone} · items=${continuity.payload.items.length}`);
 }

 const refresh=await request("/api/auth/refresh",{method:"POST"});
 assert(refresh.response.status===200,`refresh expected 200, received ${refresh.response.status}`);
 const sessionAfterRefresh=await request("/api/auth/session");
 assert(sessionAfterRefresh.payload?.authenticated===true,"session was not authenticated after refresh");
 assert(sessionAfterRefresh.payload?.communityId===expectedCommunityId,"community changed after refresh");
 assert(sessionAfterRefresh.payload?.role===expectedRole,"role changed after refresh");
 console.log("PASS refresh rotated/continued authenticated session without scope drift");

 let conflictAssignmentId=null;
 if(runConflict){
  assert(sessionAfterRefresh.payload?.permissions?.includes("manage_shift_schedule"),"409 test requires manage_shift_schedule");
  const fresh=await request(`/api/operations/dashboard?date=${encodeURIComponent(date)}`);
  const candidate=fresh.payload?.shifts?.find((shift)=>shift.status==="planned");
  assert(candidate&&Number.isInteger(candidate.revision),"no planned synthetic shift available for reversible 409 test");
  conflictAssignmentId=candidate.id;
  try{
   const command={assignmentId:candidate.id,expectedRevision:candidate.revision};
   const [first,second]=await Promise.all([
    request("/api/operations/shifts/report-gap",{method:"POST",body:command}),
    request("/api/operations/shifts/report-gap",{method:"POST",body:command}),
   ]);
   const statuses=[first.response.status,second.response.status].sort((a,b)=>a-b);
   assert(statuses[0]===200&&statuses[1]===409,`expected concurrent statuses 200/409, received ${statuses.join("/")}`);
   console.log("PASS expectedRevision conflict · concurrent HTTP results 200/409");
  }finally{
   await restoreConflictFixture(conflictAssignmentId);
   conflictAssignmentId=null;
  }
 }else{
  console.log("SKIP HTTP 409 mutation (set ORBI_QA_409=1 to run the reversible concurrency check)");
 }

 const logout=await request("/api/auth/logout",{method:"POST"});
 assert(logout.response.status===200,`logout expected 200, received ${logout.response.status}`);
 const finalSession=await request("/api/auth/session");
 assert(finalSession.response.status===200&&finalSession.payload?.authenticated===false,"session remained authenticated after logout");
 console.log("PASS logout cleared browser session");

 const anonymousContinuity=await request(`/api/operations/continuity?date=${encodeURIComponent(date)}`);
 assert(anonymousContinuity.response.status===403,`anonymous continuity expected 403, received ${anonymousContinuity.response.status}`);
 console.log("PASS continuity denies anonymous access with HTTP 403");
 console.log("QA GREEN");
}

main().catch((error)=>{
 console.error(`QA RED: ${error instanceof Error?error.message:String(error)}`);
 process.exit(1);
});
