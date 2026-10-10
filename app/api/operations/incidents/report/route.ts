import {NextResponse} from "next/server";
import {operationsDbFetch,requireOperationPermission,trustedOrigin} from "../../../../../lib/server/operations-auth";

const areas=["access","common_area","water","electricity","elevator","security","medical","fire","other"] as const;
const priorities=["low","medium","high","critical"] as const;
type Area=typeof areas[number];
type Priority=typeof priorities[number];
const isDate=(value:unknown):value is string=>typeof value==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+"T00:00:00Z"));
const isArea=(value:unknown):value is Area=>typeof value==="string"&&(areas as readonly string[]).includes(value);
const isPriority=(value:unknown):value is Priority=>typeof value==="string"&&(priorities as readonly string[]).includes(value);

export async function POST(req:Request){
 if(!trustedOrigin(req))return NextResponse.json({error:"Origen no autorizado"},{status:403});
 const identity=await requireOperationPermission("report_incident");
 if(!identity)return NextResponse.json({error:"No autorizado"},{status:403});
 let body:{serviceDate?:unknown;area?:unknown;priority?:unknown;caseReference?:unknown};
 try{body=await req.json()}catch{return NextResponse.json({error:"Solicitud inválida"},{status:400})}
 if(!isDate(body.serviceDate)||!isArea(body.area)||!isPriority(body.priority))return NextResponse.json({error:"Datos de incidencia inválidos"},{status:400});
 if(body.caseReference!==undefined&&(typeof body.caseReference!=="string"||body.caseReference.length>80||!/^[A-Za-z0-9._-]*$/.test(body.caseReference)))return NextResponse.json({error:"Referencia de caso inválida"},{status:400});
 const payload={community_id:identity.communityId,service_date:body.serviceDate,area:body.area,priority:body.priority,state:"reported",assigned_role:null,private_case_reference:body.caseReference||null,created_by:identity.id,updated_by:identity.id};
 const response=await operationsDbFetch("incidents?select=id,community_id,service_date,area,priority,state,assigned_role,revision,created_at",identity,{method:"POST",headers:{"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(payload)});
 if(!response.ok)return NextResponse.json({error:"No se pudo registrar la incidencia"},{status:400});
 const rows=await response.json() as unknown[];
 if(rows.length!==1)return NextResponse.json({error:"No se pudo confirmar el registro"},{status:500});
 return NextResponse.json({ok:true,incident:rows[0]},{status:201,headers:{"Cache-Control":"no-store"}});
}
