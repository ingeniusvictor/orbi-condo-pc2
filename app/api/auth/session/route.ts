import {NextResponse} from "next/server";
import {authenticate,configured} from "../../../../lib/server/finance-auth";
export async function GET(){
 const identity=await authenticate();
 return NextResponse.json({configured,authenticated:!!identity,role:identity?.role??null},{headers:{"Cache-Control":"no-store"}});
}
