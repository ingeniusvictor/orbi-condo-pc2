import {NextResponse} from "next/server";
import {operationsDbFetch,requireOperationPermission,trustedOrigin} from "../../../../../lib/server/operations-auth";
import {isPositiveRevision,isUuid} from "../../../../../data/operations-command-rules";
import {isPendingCount,isShiftLogCheckStatus,isShiftLogClosureCode,type ShiftLogCheckStatus,type ShiftLogClosureCode} from "../../../../../data/shift-log-rules";

type LogRow={id:string;state:"open"|"closed";revision:number};
type CloseBody={logId?:unknown;expectedRevision?:unknown;closureCode?:unknown;accessControlStatus?:unknown;equipmentStatus?:unknown;openIncidentsReviewed?:unknown;pendingItemsCount?:unknown};
type ValidClosure={closureCode:ShiftLogClosureCode;accessControlStatus:ShiftLogCheckStatus;equipmentStatus:ShiftLogCheckStatus;openIncidentsReviewed:boolean;pendingItemsCount:number};

function validClosureCombination(body:ValidClosure):boolean{
 if(body.openIncidentsReviewed!==true)return false;
 if(body.closureCode==="normal")return body.pendingItemsCount===0&&body.accessControlStatus==="normal"&&body.equipmentStatus==="normal";
 if(body.closureCode==="pending_followup")return body.pendingItemsCount>0;
 return body.pendingItemsCount>0||body.accessControlStatus==="attention"||body.equipmentStatus==="attention";
}

export async function POST(req:Request){
 if(!trustedOrigin(req))return NextResponse.json({error:"Origen no autorizado"},{status:403});
 const identity=await requireOperationPermission("close_shift_log");
 if(!identity)return NextResponse.json({error:"No autorizado"},{status:403});
 let body:CloseBody;
 try{body=await req.json()}catch{return NextResponse.json({error:"Solicitud inválida"},{status:400})}
 if(!isUuid(body.logId)||!isPositiveRevision(body.expectedRevision)||!isShiftLogClosureCode(body.closureCode)||!isShiftLogCheckStatus(body.accessControlStatus)||!isShiftLogCheckStatus(body.equipmentStatus)||typeof body.openIncidentsReviewed!=="boolean"||!isPendingCount(body.pendingItemsCount))return NextResponse.json({error:"Entrega de turno inválida"},{status:400});
 const closure:ValidClosure={closureCode:body.closureCode,accessControlStatus:body.accessControlStatus,equipmentStatus:body.equipmentStatus,openIncidentsReviewed:body.openIncidentsReviewed,pendingItemsCount:body.pendingItemsCount};
 if(!validClosureCombination(closure))return NextResponse.json({error:"El checklist no es coherente con el resultado de la entrega"},{status:400});

 const community=encodeURIComponent(identity.communityId);
 const logId=encodeURIComponent(body.logId);
 const currentResponse=await operationsDbFetch(`shift_logs?select=id,state,revision&id=eq.${logId}&community_id=eq.${community}&limit=1`,identity);
 if(!currentResponse.ok)return NextResponse.json({error:"No se pudo consultar la bitácora"},{status:502});
 const current=(await currentResponse.json() as LogRow[])[0];
 if(!current)return NextResponse.json({error:"Bitácora no encontrada"},{status:404});
 if(current.revision!==body.expectedRevision)return NextResponse.json({error:"La bitácora cambió; recarga antes de cerrar",currentRevision:current.revision},{status:409});
 if(current.state!=="open")return NextResponse.json({error:"La bitácora ya está cerrada"},{status:409});

 const roundResponse=await operationsDbFetch(`operational_rounds?select=id&community_id=eq.${community}&shift_log_id=eq.${logId}&state=eq.open&limit=1`,identity);
 if(!roundResponse.ok)return NextResponse.json({error:"No se pudo validar el estado de las rondas"},{status:502});
 if((await roundResponse.json() as {id:string}[]).length)return NextResponse.json({error:"Completa la ronda operativa abierta antes de cerrar y entregar el turno"},{status:409});

 const followupResponse=await operationsDbFetch(`operational_followups?select=id&community_id=eq.${community}&shift_log_id=eq.${logId}&state=in.(open,acknowledged)`,identity);
 if(!followupResponse.ok)return NextResponse.json({error:"No se pudieron validar los pendientes del relevo"},{status:502});
 const unresolvedCount=(await followupResponse.json() as {id:string}[]).length;
 if(unresolvedCount!==closure.pendingItemsCount)return NextResponse.json({error:`El checklist declara ${closure.pendingItemsCount} pendiente(s), pero la cola operativa tiene ${unresolvedCount}. Actualiza la entrega antes de cerrar.`,currentPendingItemsCount:unresolvedCount},{status:409});

 const update={state:"closed",closed_by:identity.id,closed_at:new Date().toISOString(),closure_code:closure.closureCode,access_control_status:closure.accessControlStatus,equipment_status:closure.equipmentStatus,open_incidents_reviewed:closure.openIncidentsReviewed,pending_items_count:closure.pendingItemsCount,updated_by:identity.id};
 const updateResponse=await operationsDbFetch(`shift_logs?id=eq.${logId}&community_id=eq.${community}&state=eq.open&revision=eq.${body.expectedRevision}&select=id,state,closed_at,closure_code,access_control_status,equipment_status,open_incidents_reviewed,pending_items_count,revision,updated_at`,identity,{method:"PATCH",headers:{"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(update)});
 if(!updateResponse.ok)return NextResponse.json({error:"No se pudo cerrar la bitácora"},{status:updateResponse.status===409?409:400});
 const rows=await updateResponse.json() as unknown[];
 if(rows.length!==1)return NextResponse.json({error:"Conflicto de edición; recarga la bitácora"},{status:409});
 return NextResponse.json({ok:true,log:rows[0]},{headers:{"Cache-Control":"no-store"}});
}
