import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {OPERATIONS_REFRESH_COOKIE,OPERATIONS_SESSION_COOKIE,operationsAuthFetch,operationsBackendConfigured,trustedOrigin} from "../../../../lib/server/operations-auth";

const noStore={"Cache-Control":"private, no-store"};
const cookieBase={httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict" as const,path:"/"};

function clearSession(response:NextResponse){
 response.cookies.set(OPERATIONS_SESSION_COOKIE,"",{...cookieBase,maxAge:0});
 response.cookies.set(OPERATIONS_REFRESH_COOKIE,"",{...cookieBase,maxAge:0});
}

export async function POST(req:Request){
 if(!trustedOrigin(req))return NextResponse.json({error:"Origen no autorizado"},{status:403,headers:noStore});
 if(!operationsBackendConfigured)return NextResponse.json({error:"Autenticación aún no configurada"},{status:503,headers:noStore});
 const store=await cookies();
 const refreshToken=store.get(OPERATIONS_REFRESH_COOKIE)?.value;
 if(!refreshToken){
  const response=NextResponse.json({error:"Sesión no renovable"},{status:401,headers:noStore});
  response.cookies.set(OPERATIONS_SESSION_COOKIE,"",{...cookieBase,maxAge:0});
  return response;
 }
 let result:Response;
 try{
  result=await operationsAuthFetch("token?grant_type=refresh_token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({refresh_token:refreshToken})});
 }catch{return NextResponse.json({error:"Servicio de autenticación temporalmente no disponible"},{status:503,headers:noStore});}
 if(!result.ok){
  const response=NextResponse.json({error:"La sesión ya no es válida"},{status:401,headers:noStore});
  clearSession(response);
  return response;
 }
 const session=await result.json() as {access_token?:unknown;refresh_token?:unknown;expires_in?:unknown};
 if(typeof session.access_token!=="string"||!session.access_token){
  const response=NextResponse.json({error:"Respuesta de sesión inválida"},{status:502,headers:noStore});
  clearSession(response);
  return response;
 }
 const rotatedRefresh=typeof session.refresh_token==="string"&&session.refresh_token?session.refresh_token:refreshToken;
 const expires=typeof session.expires_in==="number"&&Number.isFinite(session.expires_in)?Math.max(60,Math.min(session.expires_in,86_400)):3600;
 const response=NextResponse.json({ok:true},{headers:noStore});
 response.cookies.set(OPERATIONS_SESSION_COOKIE,session.access_token,{...cookieBase,maxAge:expires});
 response.cookies.set(OPERATIONS_REFRESH_COOKIE,rotatedRefresh,cookieBase);
 return response;
}
