import {NextResponse} from "next/server";
import {trustedOrigin} from "../../../../lib/server/finance-auth";
export async function POST(req:Request){
 if(!trustedOrigin(req))return NextResponse.json({error:"Origen no autorizado"},{status:403});
 const response=NextResponse.json({ok:true});
 response.cookies.set("orbi_session","",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:0});
 return response;
}
