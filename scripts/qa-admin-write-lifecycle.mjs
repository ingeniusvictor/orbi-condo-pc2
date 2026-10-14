const rawBaseUrl=(process.env.ORBI_QA_BASE_URL||"").trim();
const email=process.env.ORBI_QA_EMAIL||"";
const password=process.env.ORBI_QA_PASSWORD||"";
const expectedCommunityId=process.env.ORBI_QA_COMMUNITY_ID||"pc2";
const assignmentId=(process.env.ORBI_QA_WRITE_ASSIGNMENT_ID||"").trim();
const requestedDate=(process.env.ORBI_QA_DATE||"").trim();
const vercelBypass=(process.env.ORBI_QA_VERCEL_BYPASS||"").trim();
const currentSantiagoDate=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Santiago",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const requiredPermissions=[
 "view_shift_schedule",
 "view_shift_log",
 "write_shift_log",
 "close_shift_log",
 "view_operational_round",
 "write_operational_round",
 "complete_operational_round",
];

function failSetup(message){console.error(message);process.exit(2)}
function assert(condition,message){if(!condition)throw new Error(message)}

if(!rawBaseUrl)failSetup("Missing ORBI_QA_BASE_URL. Pass the exact staging/preview URL explicitly.");
if(!email||!password)failSetup("Missing ORBI_QA_EMAIL / ORBI_QA_PASSWORD.");
if(!uuidPattern.test(assignmentId))failSetup("Missing or invalid ORBI_QA_WRITE_ASSIGNMENT_ID. A dedicated synthetic shift UUID is required.");
if(!requestedDate)failSetup("Missing ORBI_QA_DATE. Write lifecycle certification requires an explicit Santiago service date.");
if(requestedDate!==currentSantiagoDate)failSetup(`Write lifecycle date must equal the current Santiago operational date ${currentSantiagoDate}.`);

let baseUrl;
try{baseUrl=new URL(rawBaseUrl)}catch{failSetup("Invalid ORBI_QA_BASE_URL. Provide an absolute URL.")}
const isLoopback=["localhost","127.0.0.1","::1"].includes(baseUrl.hostname);
if(baseUrl.protocol!=="https:"&&!(isLoopback&&baseUrl.protocol==="http:"))failSetup("Unsafe ORBI_QA_BASE_URL. HTTPS is required except for localhost/loopback QA.");
if(baseUrl.username||baseUrl.password||baseUrl.hash)failSetup("Unsafe ORBI_QA_BASE_URL. Embedded credentials and URL fragments are not allowed.");
baseUrl.pathname="/";
baseUrl.search="";
baseUrl.hash="";
if(baseUrl.hostname==="orbi-condo-pc2.vercel.app")failSetup("Refusing to run Administrator write lifecycle against the production hostname.");
if(vercelBypass&&!baseUrl.hostname.endsWith(".vercel.app"))failSetup("Refusing to send ORBI_QA_VERCEL_BYPASS to a non-Vercel hostname.");

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
  headers:{Accept:"text/html","x-vercel-protection-bypass":vercelBypass,"x-vercel-set-bypass-cookie":"true"},
  redirect:"manual",
 });
 absorbCookies(response);
 const location=response.headers.get("location");
 if(location&&new URL(location,baseUrl.origin).origin!==baseUrl.origin)throw new Error("Vercel bypass redirected outside the verified deployment origin");
 assert(response.status<400,`Vercel bypass bootstrap failed with HTTP ${response.status}`);
 assert(jar.has("_vercel_jwt"),"Vercel bypass did not establish a scoped _vercel_jwt cookie");
 console.log("PASS protected Preview access established");
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
function assertPrivateNoStore(response,label){
 assert((response.headers.get("cache-control")||"").includes("no-store"),`${label} missing no-store`);
 assert(response.headers.get("x-content-type-options")==="nosniff",`${label} missing nosniff`);
 assert(response.headers.get("access-control-allow-origin")===null,`${label} unexpectedly opted into CORS`);
}
function assertStatus(result,status,label){
 assert(result.response.status===status,`${label} expected HTTP ${status}, received ${result.response.status}`);
}

async function main(){
 console.log(`ORBI LIVING Administrator write lifecycle QA · ${baseUrl.origin} · ${requestedDate} · assignment=${assignmentId}`);
 await establishProtectedPreviewAccess();

 const preflight=await request("/api/auth/session");
 assertStatus(preflight,200,"preflight session");
 assert(preflight.payload?.configured===true,"target deployment is not configured with its backend");
 assert(preflight.payload?.authenticated===false,"preflight expected anonymous session");
 assertPrivateNoStore(preflight.response,"preflight session");
 console.log("PASS preflight configured + anonymous + hardened private headers");

 const login=await request("/api/auth/login",{method:"POST",body:{email,password}});
 assertStatus(login,200,"login");
 assertPrivateNoStore(login.response,"login");

 const session=await request("/api/auth/session");
 assertStatus(session,200,"authenticated session");
 assert(session.payload?.authenticated===true,"session was not authenticated after login");
 assert(session.payload?.role==="administrator",`write lifecycle requires administrator, received ${session.payload?.role}`);
 assert(session.payload?.communityId===expectedCommunityId,`expected community ${expectedCommunityId}, received ${session.payload?.communityId}`);
 const permissions=session.payload?.permissions??[];
 for(const permission of requiredPermissions)assert(permissions.includes(permission),`administrator session missing ${permission}`);
 console.log("PASS Administrator session has all write-lifecycle permissions");

 const dashboard=await request(`/api/operations/dashboard?date=${encodeURIComponent(requestedDate)}`);
 assertStatus(dashboard,200,"dashboard");
 assertPrivateNoStore(dashboard.response,"dashboard");
 const shift=dashboard.payload?.shifts?.find(row=>row.id===assignmentId);
 assert(shift,"dedicated synthetic assignment is not visible in the requested Santiago service date");
 assert(shift.serviceDate===requestedDate,"dedicated assignment service date drifted");
 assert(Number.isInteger(shift.revision)&&shift.revision>0,"dedicated assignment revision is invalid");
 assert(shift.hasAssignee===true,"dedicated assignment must have a synthetic assignee");
 assert(!["vacant","requested"].includes(shift.status),`dedicated assignment status ${shift.status} cannot open a log`);
 console.log(`PASS dedicated fixture preflight · status=${shift.status} · revision=${shift.revision}`);

 const beforeLogs=await request(`/api/operations/shift-log?date=${encodeURIComponent(requestedDate)}`);
 assertStatus(beforeLogs,200,"shift-log preflight");
 const existingLog=beforeLogs.payload?.logs?.find(log=>log.assignmentId===assignmentId);
 assert(!existingLog,"dedicated assignment was already consumed by a prior write-lifecycle certification; use a fresh fixture UUID");
 console.log("PASS fixture is one-shot and has no existing shift log");

 const opened=await request("/api/operations/shift-log/open",{method:"POST",body:{assignmentId,expectedAssignmentRevision:shift.revision}});
 assertStatus(opened,201,"open shift log");
 assert(opened.payload?.log?.state==="open"&&uuidPattern.test(opened.payload?.log?.id||""),"opened shift log payload is invalid");
 const logId=opened.payload.log.id;
 const logRevision=opened.payload.log.revision;
 assert(Number.isInteger(logRevision)&&logRevision>0,"opened shift log revision is invalid");
 console.log("PASS shift log opened through deployed HTTP API");

 const entry=await request("/api/operations/shift-log/entry",{method:"POST",body:{logId,entryCode:"routine_check",category:"access",severity:"info",caseReference:"QA_ADMIN_WRITE_LIFECYCLE"}});
 assertStatus(entry,201,"structured shift-log entry");
 assert(entry.payload?.entry?.entry_code==="routine_check"||entry.payload?.entry?.entryCode==="routine_check","structured entry payload is invalid");
 console.log("PASS structured shift-log entry persisted");

 const started=await request("/api/operations/rounds/start",{method:"POST",body:{shiftLogId:logId,roundType:"routine"}});
 assertStatus(started,201,"start operational round");
 assert(started.payload?.round?.state==="open"&&uuidPattern.test(started.payload?.round?.id||""),"started round payload is invalid");
 const roundId=started.payload.round.id;
 const roundRevision=started.payload.round.revision;
 assert(Number.isInteger(roundRevision)&&roundRevision>0,"started round revision is invalid");
 console.log("PASS operational round opened");

 const blockedClose=await request("/api/operations/shift-log/close",{method:"POST",body:{logId,expectedRevision:logRevision,closureCode:"normal",accessControlStatus:"normal",equipmentStatus:"normal",openIncidentsReviewed:true,pendingItemsCount:0}});
 assertStatus(blockedClose,409,"close while round open");
 console.log("PASS open operational round blocks shift-log closure with HTTP 409");

 const emptyRoundComplete=await request("/api/operations/rounds/complete",{method:"POST",body:{roundId,expectedRevision:roundRevision}});
 assertStatus(emptyRoundComplete,409,"complete round without checkpoint");
 console.log("PASS empty round completion is rejected with HTTP 409");

 const check=await request("/api/operations/rounds/check",{method:"POST",body:{roundId,checkpointCode:"access_control",result:"ok",caseReference:"QA_ADMIN_WRITE_LIFECYCLE"}});
 assertStatus(check,201,"round checkpoint");
 console.log("PASS structured operational checkpoint persisted");

 const duplicateCheck=await request("/api/operations/rounds/check",{method:"POST",body:{roundId,checkpointCode:"access_control",result:"ok",caseReference:"QA_ADMIN_WRITE_LIFECYCLE"}});
 assertStatus(duplicateCheck,409,"duplicate checkpoint");
 console.log("PASS duplicate checkpoint is rejected with HTTP 409");

 const completed=await request("/api/operations/rounds/complete",{method:"POST",body:{roundId,expectedRevision:roundRevision}});
 assertStatus(completed,200,"complete operational round");
 assert(completed.payload?.round?.state==="completed","completed round payload did not reach completed state");
 console.log("PASS operational round completed through deployed HTTP API");

 const postCompleteCheck=await request("/api/operations/rounds/check",{method:"POST",body:{roundId,checkpointCode:"common_areas",result:"ok"}});
 assertStatus(postCompleteCheck,409,"checkpoint after round completion");
 console.log("PASS completed round rejects further checkpoints");

 const closed=await request("/api/operations/shift-log/close",{method:"POST",body:{logId,expectedRevision:logRevision,closureCode:"normal",accessControlStatus:"normal",equipmentStatus:"normal",openIncidentsReviewed:true,pendingItemsCount:0}});
 assertStatus(closed,200,"close shift log");
 assert(closed.payload?.log?.state==="closed","closed shift-log payload did not reach closed state");
 const closedRevision=closed.payload?.log?.revision;
 assert(Number.isInteger(closedRevision)&&closedRevision>logRevision,"shift-log revision did not advance on close");
 console.log("PASS shift log closed after round completion");

 const postCloseEntry=await request("/api/operations/shift-log/entry",{method:"POST",body:{logId,entryCode:"routine_check",category:"access",severity:"info",caseReference:"QA_AFTER_CLOSE_MUST_FAIL"}});
 assertStatus(postCloseEntry,409,"entry after shift-log closure");
 console.log("PASS closed shift log rejects further entries");

 const repeatedClose=await request("/api/operations/shift-log/close",{method:"POST",body:{logId,expectedRevision:closedRevision,closureCode:"normal",accessControlStatus:"normal",equipmentStatus:"normal",openIncidentsReviewed:true,pendingItemsCount:0}});
 assertStatus(repeatedClose,409,"repeat shift-log closure");
 console.log("PASS closed shift log is immutable at HTTP boundary");

 const finalLogs=await request(`/api/operations/shift-log?date=${encodeURIComponent(requestedDate)}`);
 assertStatus(finalLogs,200,"final shift-log read");
 const finalLog=finalLogs.payload?.logs?.find(log=>log.id===logId);
 assert(finalLog?.state==="closed","final shift-log read did not preserve closed state");
 assert(finalLog?.closureCode==="normal"&&finalLog?.pendingItemsCount===0,"final shift-log closure evidence is inconsistent");
 assert(finalLog?.entries?.some(item=>item.entryCode==="routine_check"&&item.caseReference==="QA_ADMIN_WRITE_LIFECYCLE"),"final shift-log read is missing certification entry");
 console.log("PASS final shift-log read preserves append-only certification evidence");

 const finalRounds=await request(`/api/operations/rounds?date=${encodeURIComponent(requestedDate)}`);
 assertStatus(finalRounds,200,"final rounds read");
 const finalRound=finalRounds.payload?.rounds?.find(round=>round.id===roundId);
 assert(finalRound?.state==="completed"&&finalRound?.shiftLogState==="closed","final round/log states are inconsistent");
 assert(finalRound?.checks?.some(item=>item.checkpointCode==="access_control"&&item.result==="ok"),"final round read is missing certification checkpoint");
 console.log("PASS final round read preserves completed checkpoint evidence");

 const logout=await request("/api/auth/logout",{method:"POST"});
 assertStatus(logout,200,"logout");
 const finalSession=await request("/api/auth/session");
 assert(finalSession.payload?.authenticated===false,"session remained authenticated after logout");
 const anonymousLogs=await request(`/api/operations/shift-log?date=${encodeURIComponent(requestedDate)}`);
 assertStatus(anonymousLogs,403,"anonymous shift-log read");
 console.log("PASS logout returns write-lifecycle evidence to private boundary");
 console.log("ADMIN WRITE LIFECYCLE QA GREEN");
}

main().catch(error=>{
 console.error(`ADMIN WRITE LIFECYCLE QA RED: ${error instanceof Error?error.message:String(error)}`);
 process.exit(1);
});
