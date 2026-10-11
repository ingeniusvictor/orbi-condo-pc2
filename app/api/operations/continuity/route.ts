import {NextResponse} from "next/server";
import {operationsDbFetch,requireOperationPermission} from "../../../../lib/server/operations-auth";
import {proposedPermission} from "../../../../data/operations-permissions";
import {isServiceDate} from "../../../../data/shift-log-rules";
import {
 deriveContinuityModel,
 type ContinuityCheckRow,
 type ContinuityEntryRow,
 type ContinuityIncidentRow,
 type ContinuityLogRow,
 type ContinuityRoundRow,
 type ContinuityShiftRow,
} from "../../../../data/continuity-model";

function inFilter(ids:string[]){return `in.(${ids.map(id=>encodeURIComponent(id)).join(",")})`}

export async function GET(req:Request){
 const identity=await requireOperationPermission("view_shift_log");
 if(!identity||!proposedPermission(identity.role,"view_operational_round")||!proposedPermission(identity.role,"view_shift_schedule")){
  return NextResponse.json({error:"No autorizado"},{status:403,headers:{"Cache-Control":"private, no-store"}});
 }
 const date=new URL(req.url).searchParams.get("date");
 if(!isServiceDate(date))return NextResponse.json({error:"Fecha inválida"},{status:400,headers:{"Cache-Control":"private, no-store"}});

 const community=encodeURIComponent(identity.communityId);
 const serviceDate=encodeURIComponent(date);
 const [shiftResponse,incidentResponse]=await Promise.all([
  operationsDbFetch(`shift_assignments?select=id,slot_code,status&community_id=eq.${community}&service_date=eq.${serviceDate}&order=starts_at.asc`,identity),
  operationsDbFetch(`incidents?select=id,area,priority,state&community_id=eq.${community}&state=not.in.(resolved,closed)&order=created_at.desc&limit=50`,identity),
 ]);
 if(!shiftResponse.ok)return NextResponse.json({error:"No se pudo consultar la cobertura"},{status:502,headers:{"Cache-Control":"private, no-store"}});
 if(!incidentResponse.ok)return NextResponse.json({error:"No se pudieron consultar las incidencias"},{status:502,headers:{"Cache-Control":"private, no-store"}});
 const shifts=await shiftResponse.json() as ContinuityShiftRow[];
 const incidents=await incidentResponse.json() as ContinuityIncidentRow[];

 let logs:ContinuityLogRow[]=[];
 let entries:ContinuityEntryRow[]=[];
 let rounds:ContinuityRoundRow[]=[];
 let checks:ContinuityCheckRow[]=[];
 if(shifts.length){
  const logResponse=await operationsDbFetch(`shift_logs?select=id,shift_assignment_id,state,closure_code,pending_items_count&community_id=eq.${community}&shift_assignment_id=${inFilter(shifts.map(row=>row.id))}&order=opened_at.asc`,identity);
  if(!logResponse.ok)return NextResponse.json({error:"No se pudo consultar la bitácora"},{status:502,headers:{"Cache-Control":"private, no-store"}});
  logs=await logResponse.json() as ContinuityLogRow[];
 }
 if(logs.length){
  const logIds=logs.map(row=>row.id);
  const [entryResponse,roundResponse]=await Promise.all([
   operationsDbFetch(`shift_log_entries?select=id,shift_log_id,entry_code,category,severity,incident_id,case_reference&community_id=eq.${community}&shift_log_id=${inFilter(logIds)}&order=created_at.asc`,identity),
   operationsDbFetch(`operational_rounds?select=id,shift_log_id,round_type,state&community_id=eq.${community}&shift_log_id=${inFilter(logIds)}&order=started_at.desc`,identity),
  ]);
  if(!entryResponse.ok)return NextResponse.json({error:"No se pudieron consultar las entradas de bitácora"},{status:502,headers:{"Cache-Control":"private, no-store"}});
  if(!roundResponse.ok)return NextResponse.json({error:"No se pudieron consultar las rondas"},{status:502,headers:{"Cache-Control":"private, no-store"}});
  entries=await entryResponse.json() as ContinuityEntryRow[];
  rounds=await roundResponse.json() as ContinuityRoundRow[];
 }
 if(rounds.length){
  const checkResponse=await operationsDbFetch(`operational_round_checks?select=id,round_id,checkpoint_code,result,incident_id,case_reference&community_id=eq.${community}&round_id=${inFilter(rounds.map(row=>row.id))}&order=created_at.asc`,identity);
  if(!checkResponse.ok)return NextResponse.json({error:"No se pudieron consultar los checkpoints"},{status:502,headers:{"Cache-Control":"private, no-store"}});
  checks=await checkResponse.json() as ContinuityCheckRow[];
 }

 const model=deriveContinuityModel({shifts,incidents,logs,entries,rounds,checks});
 return NextResponse.json({date,generatedAt:new Date().toISOString(),...model},{headers:{"Cache-Control":"private, no-store"}});
}
