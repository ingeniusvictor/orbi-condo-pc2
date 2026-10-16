import {NextResponse} from "next/server";
import {operationsDbFetch,requireOperationPermission,trustedOrigin,type OperationsIdentity} from "../../../../../lib/server/operations-auth";

const areas=["access","common_area","water","electricity","elevator","security","medical","fire","other"] as const;
const priorities=["low","medium","high","critical"] as const;
type Area=typeof areas[number];
type Priority=typeof priorities[number];
type IncidentResponseRow={id:string;community_id:string;service_date:string;area:Area;priority:Priority;state:string;assigned_role:string|null;revision:number;created_at:string};
const incidentSelect="id,community_id,service_date,area,priority,state,assigned_role,revision,created_at";
const requestIdPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isDate=(value:unknown):value is string=>typeof value==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+"T00:00:00Z"));
const isArea=(value:unknown):value is Area=>typeof value==="string"&&(areas as readonly string[]).includes(value);
const isPriority=(value:unknown):value is Priority=>typeof value==="string"&&(priorities as readonly string[]).includes(value);
const isRequestId=(value:unknown):value is string=>typeof value==="string"&&requestIdPattern.test(value);

async function findIncidentReplay(identity:OperationsIdentity,requestId:string){
 const response=await operationsDbFetch(`incidents?select=${incidentSelect}&community_id=eq.${encodeURIComponent(identity.communityId)}&created_by=eq.${encodeURIComponent(identity.id)}&client_request_id=eq.${encodeURIComponent(requestId)}&limit=1`,identity);
 if(!response.ok)return {ok:false as const,row:null};
 const rows=await response.json() as IncidentResponseRow[];
 return {ok:true as const,row:rows[0]??null};
}

export async function POST(req:Request){
 if(!trustedOrigin(req))return NextResponse.json({error:"Origen no autorizado"},{status:403});
 const identity=await requireOperationPermission("report_incident");
 if(!identity)return NextResponse.json({error:"No autorizado"},{status:403});
 const requestId=req.headers.get("x-orbi-idempotency-key");
 if(!isRequestId(requestId))return NextResponse.json({error:"Clave de operación inválida"},{status:400});
 let body:{serviceDate?:unknown;area?:unknown;priority?:unknown;caseReference?:unknown};
 try{body=await req.json()}catch{return NextResponse.json({error:"Solicitud inválida"},{status:400})}
 if(!isDate(body.serviceDate)||!isArea(body.area)||!isPriority(body.priority))return NextResponse.json({error:"Datos de incidencia inválidos"},{status:400});
 if(body.caseReference!==undefined&&(typeof body.caseReference!=="string"||body.caseReference.length>80||!/^[A-Za-z0-9._-]*$/.test(body.caseReference)))return NextResponse.json({error:"Referencia de caso inválida"},{status:400});
 const payload={community_id:identity.communityId,service_date:body.serviceDate,area:body.area,priority:body.priority,state:"reported",assigned_role:null,private_case_reference:body.caseReference||null,client_request_id:requestId,created_by:identity.id,updated_by:identity.id};
 const response=await operationsDbFetch("incidents?select=id,community_id,service_date,area,priority,state,assigned_role,revision,created_at",identity,{method:"POST",headers:{"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(payload)});
 if(!response.ok){
  if(response.status===409){
   const replay=await findIncidentReplay(identity,requestId);
   if(!replay.ok)return NextResponse.json({error:"No se pudo verificar la operación repetida"},{status:502});
   if(replay.row)return NextResponse.json({ok:true,incident:replay.row,replayed:true},{status:200,headers:{"Cache-Control":"no-store"}});
   return NextResponse.json({error:"Conflicto de idempotencia; actualiza y verifica antes de continuar"},{status:409});
  }
  return NextResponse.json({error:"No se pudo registrar la incidencia"},{status:response.status>=500?502:400});
 }
 const rows=await response.json() as IncidentResponseRow[];
 if(rows.length!==1)return NextResponse.json({error:"No se pudo confirmar el registro"},{status:500});
 return NextResponse.json({ok:true,incident:rows[0],replayed:false},{status:201,headers:{"Cache-Control":"no-store"}});
}
