import {NextResponse} from "next/server";
import {operationsDbFetch,requireOperationPermission} from "../../../../lib/server/operations-auth";
import {isServiceDate} from "../../../../data/shift-log-rules";

type ShiftRow={id:string;slot_code:string;starts_at:string;ends_at:string;status:string};
type LogRow={id:string;shift_assignment_id:string;state:"open"|"closed"};
type RoundRow={id:string;shift_log_id:string;round_type:string;state:"open"|"completed";started_at:string;completed_at:string|null;revision:number;updated_at:string};
type CheckRow={id:string;round_id:string;checkpoint_code:string;result:string;incident_id:string|null;case_reference:string|null;created_at:string};

function inFilter(ids:string[]){return `in.(${ids.map(id=>encodeURIComponent(id)).join(",")})`}

export async function GET(req:Request){
 const identity=await requireOperationPermission("view_operational_round");
 if(!identity)return NextResponse.json({error:"No autorizado"},{status:403,headers:{"Cache-Control":"private, no-store"}});
 const date=new URL(req.url).searchParams.get("date");
 if(!isServiceDate(date))return NextResponse.json({error:"Fecha inválida"},{status:400,headers:{"Cache-Control":"private, no-store"}});
 const community=encodeURIComponent(identity.communityId);
 const shiftsResponse=await operationsDbFetch(`shift_assignments?select=id,slot_code,starts_at,ends_at,status&community_id=eq.${community}&service_date=eq.${encodeURIComponent(date)}&order=starts_at.asc`,identity);
 if(!shiftsResponse.ok)return NextResponse.json({error:"No se pudo consultar la jornada"},{status:502,headers:{"Cache-Control":"private, no-store"}});
 const shifts=await shiftsResponse.json() as ShiftRow[];
 if(!shifts.length)return NextResponse.json({date,rounds:[]},{headers:{"Cache-Control":"private, no-store"}});
 const shiftIds=shifts.map(row=>row.id);
 const logsResponse=await operationsDbFetch(`shift_logs?select=id,shift_assignment_id,state&community_id=eq.${community}&shift_assignment_id=${inFilter(shiftIds)}`,identity);
 if(!logsResponse.ok)return NextResponse.json({error:"No se pudo consultar la bitácora"},{status:502,headers:{"Cache-Control":"private, no-store"}});
 const logs=await logsResponse.json() as LogRow[];
 if(!logs.length)return NextResponse.json({date,rounds:[]},{headers:{"Cache-Control":"private, no-store"}});
 const logIds=logs.map(row=>row.id);
 const roundsResponse=await operationsDbFetch(`operational_rounds?select=id,shift_log_id,round_type,state,started_at,completed_at,revision,updated_at&community_id=eq.${community}&shift_log_id=${inFilter(logIds)}&order=started_at.desc`,identity);
 if(!roundsResponse.ok)return NextResponse.json({error:"No se pudieron consultar las rondas"},{status:502,headers:{"Cache-Control":"private, no-store"}});
 const rounds=await roundsResponse.json() as RoundRow[];
 let checks:CheckRow[]=[];
 if(rounds.length){
  const checkResponse=await operationsDbFetch(`operational_round_checks?select=id,round_id,checkpoint_code,result,incident_id,case_reference,created_at&community_id=eq.${community}&round_id=${inFilter(rounds.map(row=>row.id))}&order=created_at.asc`,identity);
  if(!checkResponse.ok)return NextResponse.json({error:"No se pudieron consultar los checkpoints"},{status:502,headers:{"Cache-Control":"private, no-store"}});
  checks=await checkResponse.json() as CheckRow[];
 }
 const logById=new Map(logs.map(row=>[row.id,row]));
 const shiftById=new Map(shifts.map(row=>[row.id,row]));
 return NextResponse.json({date,rounds:rounds.map(round=>{
  const log=logById.get(round.shift_log_id);
  const shift=log?shiftById.get(log.shift_assignment_id):undefined;
  return {id:round.id,shiftLogId:round.shift_log_id,roundType:round.round_type,state:round.state,startedAt:round.started_at,completedAt:round.completed_at,revision:round.revision,updatedAt:round.updated_at,shiftLogState:log?.state??null,shift:shift?{slotCode:shift.slot_code,startsAt:shift.starts_at,endsAt:shift.ends_at,status:shift.status}:null,checks:checks.filter(check=>check.round_id===round.id).map(check=>({id:check.id,checkpointCode:check.checkpoint_code,result:check.result,linkedIncidentId:check.incident_id,caseReference:check.case_reference,createdAt:check.created_at}))};
 })},{headers:{"Cache-Control":"private, no-store"}});
}
