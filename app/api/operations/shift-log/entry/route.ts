import {NextResponse} from "next/server";
import {operationsDbFetch,requireOperationPermission,trustedOrigin} from "../../../../../lib/server/operations-auth";
import {isUuid} from "../../../../../data/operations-command-rules";
import {isCaseReference,isShiftLogCategory,isShiftLogEntryCode,isShiftLogSeverity} from "../../../../../data/shift-log-rules";

type LogRow={id:string;state:"open"|"closed"};
type IncidentRow={id:string};
type EntryRow={id:string;shift_log_id:string;entry_code:string;category:string;severity:string;incident_id:string|null;case_reference:string|null;created_at:string};

export async function POST(req:Request){
 if(!trustedOrigin(req))return NextResponse.json({error:"Origen no autorizado"},{status:403});
 const identity=await requireOperationPermission("write_shift_log");
 if(!identity)return NextResponse.json({error:"No autorizado"},{status:403});
 let body:{logId?:unknown;entryCode?:unknown;category?:unknown;severity?:unknown;incidentId?:unknown;caseReference?:unknown};
 try{body=await req.json()}catch{return NextResponse.json({error:"Solicitud inválida"},{status:400})}
 if(!isUuid(body.logId)||!isShiftLogEntryCode(body.entryCode)||!isShiftLogCategory(body.category)||!isShiftLogSeverity(body.severity))return NextResponse.json({error:"Entrada de bitácora inválida"},{status:400});
 const incidentId=body.incidentId===undefined||body.incidentId===null||body.incidentId===""?null:body.incidentId;
 const caseReference=body.caseReference===undefined||body.caseReference===null||body.caseReference===""?null:body.caseReference;
 if(incidentId!==null&&!isUuid(incidentId))return NextResponse.json({error:"Incidencia vinculada inválida"},{status:400});
 if(caseReference!==null&&!isCaseReference(caseReference))return NextResponse.json({error:"Referencia inválida"},{status:400});
 if(body.entryCode==="incident_followup"&&incidentId===null)return NextResponse.json({error:"El seguimiento de incidencia requiere una incidencia vinculada"},{status:400});
 if(body.entryCode!=="incident_followup"&&incidentId!==null)return NextResponse.json({error:"Solo un seguimiento de incidencia puede vincular una incidencia"},{status:400});

 const community=encodeURIComponent(identity.communityId);
 const logId=encodeURIComponent(body.logId);
 const logResponse=await operationsDbFetch(`shift_logs?select=id,state&id=eq.${logId}&community_id=eq.${community}&limit=1`,identity);
 if(!logResponse.ok)return NextResponse.json({error:"No se pudo consultar la bitácora"},{status:502});
 const log=(await logResponse.json() as LogRow[])[0];
 if(!log)return NextResponse.json({error:"Bitácora no encontrada"},{status:404});
 if(log.state!=="open")return NextResponse.json({error:"La bitácora ya está cerrada"},{status:409});

 if(incidentId!==null){
  const incidentResponse=await operationsDbFetch(`incidents?select=id&id=eq.${encodeURIComponent(incidentId)}&community_id=eq.${community}&limit=1`,identity);
  if(!incidentResponse.ok)return NextResponse.json({error:"No se pudo validar la incidencia"},{status:502});
  const incident=(await incidentResponse.json() as IncidentRow[])[0];
  if(!incident)return NextResponse.json({error:"Incidencia vinculada no encontrada"},{status:404});
 }

 const payload={shift_log_id:log.id,community_id:identity.communityId,entry_code:body.entryCode,category:body.category,severity:body.severity,incident_id:incidentId,case_reference:caseReference,actor_user_id:identity.id};
 const createResponse=await operationsDbFetch("shift_log_entries?select=id,shift_log_id,entry_code,category,severity,incident_id,case_reference,created_at",identity,{method:"POST",headers:{"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(payload)});
 if(!createResponse.ok)return NextResponse.json({error:"No se pudo registrar la entrada de bitácora"},{status:createResponse.status===409?409:400});
 const rows=await createResponse.json() as EntryRow[];
 if(rows.length!==1)return NextResponse.json({error:"No se pudo confirmar la entrada"},{status:500});
 return NextResponse.json({ok:true,entry:rows[0]},{status:201,headers:{"Cache-Control":"no-store"}});
}
