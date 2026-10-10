import {NextResponse} from "next/server";
import {OPERATIONS_REFRESH_COOKIE,OPERATIONS_SESSION_COOKIE,operationsAuthFetch,operationsBackendConfigured,trustedOrigin} from "../../../../lib/server/operations-auth";

const noStore={"Cache-Control":"private, no-store"};
const cookieBase={httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict" as const,path:"/"};

export async function POST(req:Request){
 if(!trustedOrigin(req))return NextResponse.json({error:"Origen no autorizado"},{status:403,headers:noStore});
 if(!operationsBackendConfigured)return NextResponse.json({error:"Autenticación aún no configurada"},{status:503,headers:noStore});
 const length=Number(req.headers.get("content-length")||"0");
 if(Number.isFinite(length)&&length>4096)return NextResponse.json({error:"Solicitud demasiado grande"},{status:413,headers:noStore});
 let body:{email?:unknown;password?:unknown};
 try{body=await req.json();}catch{return NextResponse.json({error:"Solicitud inválida"},{status:400,headers:noStore});}
 const email=typeof body.email==="string"?body.email.trim().toLowerCase():"";
 const password=typeof body.password==="string"?body.password:"";
 if(!email||email.length>254||!password||password.length>512)return NextResponse.json({error:"Credenciales inválidas"},{status:400,headers:noStore});
 let result:Response;
 try{
  result=await operationsAuthFetch("token?grant_type=password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
 }catch{return NextResponse.json({error:"Servicio de autenticación temporalmente no disponible"},{status:503,headers:noStore});}
 if(!result.ok)return NextResponse.json({error:"Credenciales no válidas"},{status:401,headers:noStore});
 const session=await result.json() as {access_token?:unknown;refresh_token?:unknown;expires_in?:unknown};
 if(typeof session.access_token!=="string"||!session.access_token||typeof session.refresh_token!=="string"||!session.refresh_token)return NextResponse.json({error:"Sesión inválida"},{status:502,headers:noStore});
 const expires=typeof session.expires_in==="number"&&Number.isFinite(session.expires_in)?Math.max(60,Math.min(session.expires_in,86_400)):3600;
 const response=NextResponse.json({ok:true},{headers:noStore});
 response.cookies.set(OPERATIONS_SESSION_COOKIE,session.access_token,{...cookieBase,maxAge:expires});
 // Refresh token deliberately uses a browser-session HttpOnly cookie in this staging cut.
 // Production persistence/remember-me policy must be an explicit product/security decision.
 response.cookies.set(OPERATIONS_REFRESH_COOKIE,session.refresh_token,cookieBase);
 return response;
}
