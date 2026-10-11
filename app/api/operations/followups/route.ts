import {NextResponse} from "next/server";
import {operationsDbFetch,requireOperationPermission} from "../../../../lib/server/operations-auth";
import {isServiceDate} from "../../../../data/shift-log-rules";

type ShiftRow={id:string;slot_code:string;starts_at:string;ends_at:string;status:string};
type LogRow={id:string;shift_assignment_id:string;state:"open"|"closed"};
type FollowupRow={id:string;shift_log_id:string;round_id:string|null;incident_id:string|null;action_code:string;category:string;priority:string;state:"open"|"acknowledged"|"resolved";case_reference:string|null;created_at:string;acknowledged_at:string|null;resolved_at:string|null;resolution_code:string|null;revision:number;updated_at:string};

function inFilter(ids:string[]){return `in.(${ids.map(id=>encodeURIComponent(id)).join(",")})`}

export async function GET(req:Request){
 const identity=await requireOperationPermission("view_operational_followup");
 if(!identity)return NextResponse.json({error:"No autorizado"},{status:403,headers:{"Cache-Control":"private, no-store"}});
 const date=new URL(req.url).searchParams.get("date");
 if(!isServiceDate(date))return NextResponse.json({error:"Fecha inválida"},{status:400,headers:{"Cache-Control":"private, no-store"}});
 const community=encodeURIComponent(identity.communityId);
 const shiftsResponse=await operationsDbFetch(`shift_assignments?select=id,slot_code,starts_at,ends_at,status&community_id=eq.${community}&service_date=eq.${encodeURIComponent(date)}&order=starts_at.asc`,identity);
 if(!shiftsResponse.ok)return NextResponse.json({error:"No se pudo consultar la jornada"},{status:502,headers:{"Cache-Control":"private, no-store"}});
 const shifts=await shiftsResponse.json() as ShiftRow[];
 if(!shifts.length)return NextResponse.json({date,followups:[]},{headers:{"Cache-Control":"private, no-store"}});
 const logsResponse=await operationsDbFetch(`shift_logs?select=id,shift_assignment_id,state&community_id=eq.${community}&shift_assignment_id=${inFilter(shifts.map(row=>row.id))}`,identity);
 if(!logsResponse.ok)return NextResponse.json({error:"No se pudo consultar la bitácora"},{status:502,headers:{"Cache-Control":"private, no-store"}});
 const logs=await logsResponse.json() as LogRow[];
 if(!logs.length)return NextResponse.json({date,followups:[]},{headers:{"Cache-Control":"private, no-store"}});
 const response=await operationsDbFetch(`operational_followups?select=id,shift_log_id,round_id,incident_id,action_code,category,priority,state,case_reference,created_at,acknowledged_at,resolved_at,resolution_code,revision,updated_at&community_id=eq.${community}&shift_log_id=${inFilter(logs.map(row=>row.id))}&order=created_at.desc`,identity);
 if(!response.ok)return NextResponse.json({error:"No se pudieron consultar los pendientes"},{status:502,headers:{"Cache-Control":"private, no-store"}});
 const followups=await response.json() as FollowupRow[];
 const logById=new Map(logs.map(row=>[row.id,row]));
 const shiftById=new Map(shifts.map(row=>[row.id,row]));
 return NextResponse.json({date,followups:followups.map(item=>{
  const log=logById.get(item.shift_log_id);const shift=log?shiftById.get(log.shift_assignment_id):undefined;
  return {id:item.id,shiftLogId:item.shift_log_id,roundId:item.round_id,incidentId:item.incident_id,actionCode:item.action_code,category:item.category,priority:item.priority,state:item.state,caseReference:item.case_reference,createdAt:item.created_at,acknowledgedAt:item.acknowledged_at,resolvedAt:item.resolved_at,resolutionCode:item.resolution_code,revision:item.revision,updatedAt:item.updated_at,shiftLogState:log?.state??null,shift:shift?{slotCode:shift.slot_code,startsAt:shift.starts_at,endsAt:shift.ends_at,status:shift.status}:null};
 })},{headers:{"Cache-Control":"private, no-store"}});
}
