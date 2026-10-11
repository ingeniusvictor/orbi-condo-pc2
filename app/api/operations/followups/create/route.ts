import {NextResponse} from "next/server";
import {operationsDbFetch,requireOperationPermission,trustedOrigin} from "../../../../../lib/server/operations-auth";
import {isUuid} from "../../../../../data/operations-command-rules";
import {isOperationalFollowupAction,isOperationalFollowupCategory,isOperationalFollowupPriority,isOperationalFollowupReference} from "../../../../../data/operational-followup-rules";

type LogRow={id:string;state:"open"|"closed"};
type RoundRow={id:string;shift_log_id:string};
type IncidentRow={id:string};
type FollowupRow={id:string;shift_log_id:string;round_id:string|null;incident_id:string|null;action_code:string;category:string;priority:string;state:string;case_reference:string|null;created_at:string;revision:number};

export async function POST(req:Request){
 if(!trustedOrigin(req))return NextResponse.json({error:"Origen no autorizado"},{status:403});
 const identity=await requireOperationPermission("write_operational_followup");
 if(!identity)return NextResponse.json({error:"No autorizado"},{status:403});
 let body:{shiftLogId?:unknown;roundId?:unknown;incidentId?:unknown;actionCode?:unknown;category?:unknown;priority?:unknown;caseReference?:unknown};
 try{body=await req.json()}catch{return NextResponse.json({error:"Solicitud inválida"},{status:400})}
 if(!isUuid(body.shiftLogId)||!isOperationalFollowupAction(body.actionCode)||!isOperationalFollowupCategory(body.category)||!isOperationalFollowupPriority(body.priority))return NextResponse.json({error:"Pendiente inválido"},{status:400});
 const roundId=body.roundId===undefined||body.roundId===null||body.roundId===""?null:body.roundId;
 const incidentId=body.incidentId===undefined||body.incidentId===null||body.incidentId===""?null:body.incidentId;
 const caseReference=body.caseReference===undefined||body.caseReference===null||body.caseReference===""?null:body.caseReference;
 if(roundId!==null&&!isUuid(roundId))return NextResponse.json({error:"Ronda vinculada inválida"},{status:400});
 if(incidentId!==null&&!isUuid(incidentId))return NextResponse.json({error:"Incidencia vinculada inválida"},{status:400});
 if(caseReference!==null&&!isOperationalFollowupReference(caseReference))return NextResponse.json({error:"Referencia inválida"},{status:400});
 if(body.actionCode==="monitor_incident"&&incidentId===null)return NextResponse.json({error:"Monitorear incidencia requiere una incidencia vinculada"},{status:400});
 if(body.actionCode==="recheck_checkpoint"&&roundId===null)return NextResponse.json({error:"Revisar checkpoint requiere una ronda vinculada"},{status:400});
 if(body.actionCode==="other"&&caseReference===null)return NextResponse.json({error:"Otro pendiente requiere una referencia sintética"},{status:400});

 const community=encodeURIComponent(identity.communityId);
 const logId=encodeURIComponent(body.shiftLogId);
 const logResponse=await operationsDbFetch(`shift_logs?select=id,state&id=eq.${logId}&community_id=eq.${community}&limit=1`,identity);
 if(!logResponse.ok)return NextResponse.json({error:"No se pudo consultar la bitácora"},{status:502});
 const log=(await logResponse.json() as LogRow[])[0];
 if(!log)return NextResponse.json({error:"Bitácora no encontrada"},{status:404});
 if(log.state!=="open")return NextResponse.json({error:"Los pendientes nuevos requieren una bitácora abierta"},{status:409});
 if(roundId!==null){
  const roundResponse=await operationsDbFetch(`operational_rounds?select=id,shift_log_id&id=eq.${encodeURIComponent(roundId)}&community_id=eq.${community}&limit=1`,identity);
  if(!roundResponse.ok)return NextResponse.json({error:"No se pudo validar la ronda"},{status:502});
  const round=(await roundResponse.json() as RoundRow[])[0];
  if(!round||round.shift_log_id!==log.id)return NextResponse.json({error:"La ronda no pertenece a esta bitácora"},{status:409});
 }
 if(incidentId!==null){
  const incidentResponse=await operationsDbFetch(`incidents?select=id&id=eq.${encodeURIComponent(incidentId)}&community_id=eq.${community}&limit=1`,identity);
  if(!incidentResponse.ok)return NextResponse.json({error:"No se pudo validar la incidencia"},{status:502});
  if(!(await incidentResponse.json() as IncidentRow[])[0])return NextResponse.json({error:"Incidencia vinculada no encontrada"},{status:404});
 }
 const payload={community_id:identity.communityId,shift_log_id:log.id,round_id:roundId,incident_id:incidentId,action_code:body.actionCode,category:body.category,priority:body.priority,state:"open",case_reference:caseReference,created_by:identity.id,updated_by:identity.id};
 const response=await operationsDbFetch("operational_followups?select=id,shift_log_id,round_id,incident_id,action_code,category,priority,state,case_reference,created_at,revision",identity,{method:"POST",headers:{"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(payload)});
 if(!response.ok)return NextResponse.json({error:"No se pudo registrar el pendiente"},{status:400});
 const rows=await response.json() as FollowupRow[];
 if(rows.length!==1)return NextResponse.json({error:"No se pudo confirmar el pendiente"},{status:500});
 return NextResponse.json({ok:true,followup:rows[0]},{status:201,headers:{"Cache-Control":"no-store"}});
}
