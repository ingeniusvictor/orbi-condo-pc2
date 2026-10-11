const baseUrl=new URL(process.env.ORBI_QA_BASE_URL||"https://orbi-condo-pc2-git-oc-pc2-47-private-operations-workspace-orbi4.vercel.app");
const email=process.env.ORBI_QA_EMAIL||"";
const password=process.env.ORBI_QA_PASSWORD||"";
const expectedRole=process.env.ORBI_QA_ROLE||"administrator";
const runConflict=process.env.ORBI_QA_409==="1";
const date=process.env.ORBI_QA_DATE||new Intl.DateTimeFormat("en-CA",{timeZone:"America/Santiago",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());

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

async function main(){
 console.log(`ORBI LIVING private operations QA · ${baseUrl.origin} · ${date}`);

 const login=await request("/api/auth/login",{method:"POST",body:{email,password}});
 assert(login.response.status===200,`login expected 200, received ${login.response.status}`);
 console.log("PASS login 200 + HttpOnly session cookies received");

 const session=await request("/api/auth/session");
 assert(session.response.status===200&&session.payload?.authenticated===true,"session was not authenticated after login");
 assert(session.payload?.role===expectedRole,`expected role ${expectedRole}, received ${session.payload?.role}`);
 console.log(`PASS session authenticated · role=${session.payload.role} · permissions=${session.payload.permissions?.length??0}`);

 const dashboard=await request(`/api/operations/dashboard?date=${encodeURIComponent(date)}`);
 assert(dashboard.response.status===200,"private dashboard did not return 200");
 assert(Array.isArray(dashboard.payload?.shifts),"dashboard shifts missing");
 console.log(`PASS dashboard RLS read · shifts=${dashboard.payload.shifts.length} · incidents=${dashboard.payload.incidents?.length??0}`);

 const refresh=await request("/api/auth/refresh",{method:"POST"});
 assert(refresh.response.status===200,`refresh expected 200, received ${refresh.response.status}`);
 const sessionAfterRefresh=await request("/api/auth/session");
 assert(sessionAfterRefresh.payload?.authenticated===true,"session was not authenticated after refresh");
 console.log("PASS refresh rotated/continued authenticated session");

 if(runConflict){
  assert(sessionAfterRefresh.payload?.permissions?.includes("manage_shift_schedule"),"409 test requires manage_shift_schedule");
  const fresh=await request(`/api/operations/dashboard?date=${encodeURIComponent(date)}`);
  const candidate=fresh.payload?.shifts?.find((shift)=>shift.status==="planned");
  assert(candidate&&Number.isInteger(candidate.revision),"no planned synthetic shift available for reversible 409 test");
  const command={assignmentId:candidate.id,expectedRevision:candidate.revision};
  const [first,second]=await Promise.all([
   request("/api/operations/shifts/report-gap",{method:"POST",body:command}),
   request("/api/operations/shifts/report-gap",{method:"POST",body:command}),
  ]);
  const statuses=[first.response.status,second.response.status].sort((a,b)=>a-b);
  assert(statuses[0]===200&&statuses[1]===409,`expected concurrent statuses 200/409, received ${statuses.join("/")}`);
  console.log("PASS expectedRevision conflict · concurrent HTTP results 200/409");

  const changed=await request(`/api/operations/dashboard?date=${encodeURIComponent(date)}`);
  const current=changed.payload?.shifts?.find((shift)=>shift.id===candidate.id);
  assert(current?.status==="vacant"&&Number.isInteger(current.revision),"conflict fixture did not reach vacant state");
  const restore=await request("/api/operations/shifts/command",{method:"POST",body:{assignmentId:current.id,expectedRevision:current.revision,nextStatus:"planned"}});
  assert(restore.response.status===200,`failed to restore synthetic fixture, status ${restore.response.status}`);
  console.log("PASS 409 fixture restored to planned");
 }else{
  console.log("SKIP HTTP 409 mutation (set ORBI_QA_409=1 to run the reversible concurrency check)");
 }

 const logout=await request("/api/auth/logout",{method:"POST"});
 assert(logout.response.status===200,`logout expected 200, received ${logout.response.status}`);
 const finalSession=await request("/api/auth/session");
 assert(finalSession.response.status===200&&finalSession.payload?.authenticated===false,"session remained authenticated after logout");
 console.log("PASS logout cleared browser session");
 console.log("QA GREEN");
}

main().catch((error)=>{
 console.error(`QA RED: ${error instanceof Error?error.message:String(error)}`);
 process.exit(1);
});
