import {NextResponse} from "next/server";
import {OPERATIONS_SESSION_COOKIE,operationsBackendConfig,operationsBackendConfigured,trustedOrigin} from "../../../../lib/server/operations-auth";

export async function POST(req:Request){
 if(!trustedOrigin(req))return NextResponse.json({error:"Origen no autorizado"},{status:403,headers:{"Cache-Control":"no-store"}});
 if(!operationsBackendConfigured)return NextResponse.json({error:"Autenticación aún no configurada"},{status:503,headers:{"Cache-Control":"no-store"}});
 const length=Number(req.headers.get("content-length")||"0");
 if(Number.isFinite(length)&&length>4096)return NextResponse.json({error:"Solicitud demasiado grande"},{status:413,headers:{"Cache-Control":"no-store"}});
 let body:{email?:unknown;password?:unknown};
 try{body=await req.json();}catch{return NextResponse.json({error:"Solicitud inválida"},{status:400,headers:{"Cache-Control":"no-store"}});}
 const email=typeof body.email==="string"?body.email.trim().toLowerCase():"";
 const password=typeof body.password==="string"?body.password:"";
 if(!email||email.length>254||!password||password.length>512)return NextResponse.json({error:"Credenciales inválidas"},{status:400,headers:{"Cache-Control":"no-store"}});
 const {url,anonKey}=operationsBackendConfig();
 const result=await fetch(url+"/auth/v1/token?grant_type=password",{method:"POST",headers:{apikey:anonKey,"Content-Type":"application/json"},body:JSON.stringify({email,password}),cache:"no-store"});
 if(!result.ok)return NextResponse.json({error:"Credenciales no válidas"},{status:401,headers:{"Cache-Control":"no-store"}});
 const session=await result.json() as {access_token?:unknown;expires_in?:unknown};
 if(typeof session.access_token!=="string"||!session.access_token)return NextResponse.json({error:"Sesión inválida"},{status:502,headers:{"Cache-Control":"no-store"}});
 const expires=typeof session.expires_in==="number"&&Number.isFinite(session.expires_in)?Math.max(60,Math.min(session.expires_in,3600)):3600;
 const response=NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
 response.cookies.set(OPERATIONS_SESSION_COOKIE,session.access_token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:expires});
 return response;
}
