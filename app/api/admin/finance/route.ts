import {NextResponse} from "next/server";
import {authenticate,configured,dbFetch} from "../../../../lib/server/finance-auth";
type Draft={period:string;description:string;amount_clp:number;reason:string};
const invalid=(d:Draft)=>!/^\d{4}-(0[1-9]|1[0-2])$/.test(d.period)||!d.description.trim()||d.description.length>160||!Number.isSafeInteger(d.amount_clp)||!d.reason.trim()||d.reason.length>500;
export async function GET(){
 if(!configured)return NextResponse.json({error:"Base de datos pendiente de configurar"},{status:503});
 const identity=await authenticate();
 if(!identity||identity.role!=="administrator")return NextResponse.json({error:"Acceso denegado"},{status:403});
 const result=await dbFetch("finance_drafts?select=id,period,description,amount_clp,reason,created_at,updated_at&order=created_at.desc&limit=100",identity);
 if(!result.ok)return NextResponse.json({error:"No se pudieron consultar los borradores"},{status:502});
 return NextResponse.json({rows:await result.json()},{headers:{"Cache-Control":"no-store"}});
}
export async function POST(req:Request){
 if(!configured)return NextResponse.json({error:"Base de datos pendiente de configurar"},{status:503});
 const identity=await authenticate();
 if(!identity||identity.role!=="administrator")return NextResponse.json({error:"Acceso denegado"},{status:403});
 let data:Draft;
 try{data=await req.json()}catch{return NextResponse.json({error:"Solicitud inválida"},{status:400})}
 if(!data||typeof data.period!=="string"||typeof data.description!=="string"||typeof data.amount_clp!=="number"||typeof data.reason!=="string"||invalid(data))return NextResponse.json({error:"Datos inválidos"},{status:400});
 const result=await dbFetch("finance_drafts?select=id,period,description,amount_clp,reason,created_at",identity,{method:"POST",headers:{"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify({...data,community_id:"pc2",created_by:identity.id})});
 if(!result.ok)return NextResponse.json({error:"No se pudo guardar el borrador"},{status:502});
 return NextResponse.json({rows:await result.json()},{status:201});
}
