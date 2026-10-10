import {NextResponse} from "next/server";
import {OPERATIONS_SESSION_COOKIE,trustedOrigin} from "../../../../lib/server/operations-auth";

export async function POST(req:Request){
 if(!trustedOrigin(req))return NextResponse.json({error:"Origen no autorizado"},{status:403,headers:{"Cache-Control":"no-store"}});
 const response=NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
 response.cookies.set(OPERATIONS_SESSION_COOKIE,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:0});
 return response;
}
