import {NextResponse} from "next/server";
import {backendConfig,configured} from "../../../../lib/server/finance-auth";
export async function POST(req:Request){
 if(!configured)return NextResponse.json({error:"Autenticación aún no configurada"},{status:503});
 let body:{email?:unknown;password?:unknown};
 try{body=await req.json()}catch{return NextResponse.json({error:"Solicitud inválida"},{status:400})}
 if(typeof body.email!=="string"||typeof body.password!=="string"||body.email.length>254||body.password.length>512)return NextResponse.json({error:"Credenciales inválidas"},{status:400});
 const {url,key}=backendConfig();
 const result=await fetch(url+"/auth/v1/token?grant_type=password",{method:"POST",headers:{apikey:key,"Content-Type":"application/json"},body:JSON.stringify({email:body.email,password:body.password}),cache:"no-store"});
 if(!result.ok)return NextResponse.json({error:"Credenciales no válidas"},{status:401});
 const session=await result.json() as {access_token:string;expires_in:number};
 const response=NextResponse.json({ok:true});
 response.cookies.set("orbi_session",session.access_token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:Math.min(session.expires_in,3600)});
 return response;
}
