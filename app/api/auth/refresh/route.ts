import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {OPERATIONS_REFRESH_COOKIE,operationsAuthFetch,operationsBackendConfigured,trustedOrigin} from "../../../../lib/server/operations-auth";
import {clearOperationsCookies,clearOperationsSessionCookie,setOperationsRefreshCookie,setOperationsSessionCookie} from "../../../../lib/server/operations-cookies";

const noStore={"Cache-Control":"private, no-store"};

function safeRetryAfter(value:string|null):string|null{
 if(!value||!/^\d{1,5}$/.test(value))return null;
 const seconds=Number(value);
 return Number.isInteger(seconds)&&seconds>=1&&seconds<=86_400?String(seconds):null;
}

export async function POST(req:Request){
 if(!trustedOrigin(req))return NextResponse.json({error:"Origen no autorizado"},{status:403,headers:noStore});
 if(!operationsBackendConfigured)return NextResponse.json({error:"Autenticación aún no configurada"},{status:503,headers:noStore});
 const store=await cookies();
 const refreshToken=store.get(OPERATIONS_REFRESH_COOKIE)?.value;
 if(!refreshToken){
  const response=NextResponse.json({error:"Sesión no renovable"},{status:401,headers:noStore});
  clearOperationsSessionCookie(response);
  return response;
 }
 let result:Response;
 try{
  result=await operationsAuthFetch("token?grant_type=refresh_token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({refresh_token:refreshToken})});
 }catch{return NextResponse.json({error:"Servicio de autenticación temporalmente no disponible"},{status:503,headers:noStore});}
 if(result.status===429){
  const headers:Record<string,string>={...noStore};
  const retryAfter=safeRetryAfter(result.headers.get("retry-after"));
  if(retryAfter)headers["Retry-After"]=retryAfter;
  return NextResponse.json({error:"Demasiadas solicitudes. Intenta nuevamente más tarde."},{status:429,headers});
 }
 if(result.status>=500)return NextResponse.json({error:"Servicio de autenticación temporalmente no disponible"},{status:503,headers:noStore});
 if(!result.ok){
  const response=NextResponse.json({error:"La sesión ya no es válida"},{status:401,headers:noStore});
  clearOperationsCookies(response);
  return response;
 }
 let session:{access_token?:unknown;refresh_token?:unknown;expires_in?:unknown};
 try{session=await result.json() as {access_token?:unknown;refresh_token?:unknown;expires_in?:unknown};}
 catch{return NextResponse.json({error:"Respuesta de sesión inválida"},{status:502,headers:noStore});}
 if(typeof session.access_token!=="string"||!session.access_token){
  return NextResponse.json({error:"Respuesta de sesión inválida"},{status:502,headers:noStore});
 }
 const rotatedRefresh=typeof session.refresh_token==="string"&&session.refresh_token?session.refresh_token:refreshToken;
 const expires=typeof session.expires_in==="number"&&Number.isFinite(session.expires_in)?Math.max(60,Math.min(session.expires_in,86_400)):3600;
 const response=NextResponse.json({ok:true},{headers:noStore});
 setOperationsSessionCookie(response,session.access_token,expires);
 setOperationsRefreshCookie(response,rotatedRefresh);
 return response;
}
