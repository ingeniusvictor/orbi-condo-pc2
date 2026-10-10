import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {OPERATIONS_REFRESH_COOKIE,OPERATIONS_SESSION_COOKIE,operationsAuthFetch,operationsBackendConfigured,trustedOrigin} from "../../../../lib/server/operations-auth";

const noStore={"Cache-Control":"private, no-store"};
const cookieBase={httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict" as const,path:"/"};

async function revokeLocal(accessToken:string):Promise<boolean>{
 try{
  const result=await operationsAuthFetch("logout?scope=local",{method:"POST",headers:{Authorization:"Bearer "+accessToken}});
  return result.ok;
 }catch{return false;}
}

async function accessFromRefresh(refreshToken:string):Promise<string|null>{
 try{
  const result=await operationsAuthFetch("token?grant_type=refresh_token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({refresh_token:refreshToken})});
  if(!result.ok)return null;
  const session=await result.json() as {access_token?:unknown};
  return typeof session.access_token==="string"&&session.access_token?session.access_token:null;
 }catch{return null;}
}

export async function POST(req:Request){
 if(!trustedOrigin(req))return NextResponse.json({error:"Origen no autorizado"},{status:403,headers:noStore});
 const store=await cookies();
 const accessToken=store.get(OPERATIONS_SESSION_COOKIE)?.value;
 const refreshToken=store.get(OPERATIONS_REFRESH_COOKIE)?.value;
 let revoked=false;
 if(operationsBackendConfigured&&accessToken)revoked=await revokeLocal(accessToken);
 // If the access JWT is already expired, exchange the still-held refresh token once and
 // revoke that current session. This is best-effort; local credentials are always cleared.
 if(operationsBackendConfigured&&!revoked&&refreshToken){
  const refreshedAccess=await accessFromRefresh(refreshToken);
  if(refreshedAccess)revoked=await revokeLocal(refreshedAccess);
 }
 const response=NextResponse.json({ok:true,serverSessionRevoked:revoked},{headers:noStore});
 response.cookies.set(OPERATIONS_SESSION_COOKIE,"",{...cookieBase,maxAge:0});
 response.cookies.set(OPERATIONS_REFRESH_COOKIE,"",{...cookieBase,maxAge:0});
 return response;
}
