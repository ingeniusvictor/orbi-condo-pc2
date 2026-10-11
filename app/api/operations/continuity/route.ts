import {NextResponse} from "next/server";
import {operationsDbFetch,requireOperationPermission} from "../../../../lib/server/operations-auth";
import {proposedPermission} from "../../../../data/operations-permissions";
import {isServiceDate} from "../../../../data/shift-log-rules";

type ShiftRow={id:string;slot_code:string;status:"planned"|"vacant"|"requested"|"confirmed"|"received"};
type IncidentRow={id:string;area:string;priority:"low"|"medium"|"high"|"critical";state:string};
type LogRow={id:string;shift_assignment_id:string;state:"open"|"closed";closure_code:"normal"|"pending_followup"|"escalated"|null;pending_items_count:number|null};
type EntryRow={id:string;shift_log_id:string;entry_code:string;category:string;severity:"info"|"attention"|"urgent";incident_id:string|null;case_reference:string|null};
type RoundRow={id:string;shift_log_id:string;round_type:"opening"|"routine"|"exception";state:"open"|"completed"};
type CheckRow={id:string;round_id:string;checkpoint_code:string;result:"ok"|"attention"|"not_applicable";incident_id:string|null;case_reference:string|null};
type Tone="blocked"|"critical"|"attention"|"clear";
type ItemTone="danger"|"warning"|"info";
type ContinuityItem={id:string;kind:"blocker"|"coverage"|"incident"|"handoff"|"round";title:string;detail:string;tone:ItemTone};

const areaLabel:Record<string,string>={access:"Acceso",common_area:"Área común",water:"Agua",electricity:"Electricidad",elevator:"Ascensor",security:"Seguridad",medical:"Médica",fire:"Incendio",other:"Otra"};
const roundLabel:Record<string,string>={opening:"Apertura",routine:"Rutina",exception:"Excepción"};
const checkpointLabel:Record<string,string>={access_control:"Control de acceso",common_areas:"Áreas comunes",safety_equipment:"Equipos de seguridad",utilities:"Servicios",perimeter:"Perímetro",handoff_readiness:"Preparación de relevo",other:"Otro"};

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
 const shifts=await shiftResponse.json() as ShiftRow[];
 const incidents=await incidentResponse.json() as IncidentRow[];

 let logs:LogRow[]=[];
 let entries:EntryRow[]=[];
 let rounds:RoundRow[]=[];
 let checks:CheckRow[]=[];
 if(shifts.length){
  const logResponse=await operationsDbFetch(`shift_logs?select=id,shift_assignment_id,state,closure_code,pending_items_count&community_id=eq.${community}&shift_assignment_id=${inFilter(shifts.map(row=>row.id))}&order=opened_at.asc`,identity);
  if(!logResponse.ok)return NextResponse.json({error:"No se pudo consultar la bitácora"},{status:502,headers:{"Cache-Control":"private, no-store"}});
  logs=await logResponse.json() as LogRow[];
 }
 if(logs.length){
  const logIds=logs.map(row=>row.id);
  const [entryResponse,roundResponse]=await Promise.all([
   operationsDbFetch(`shift_log_entries?select=id,shift_log_id,entry_code,category,severity,incident_id,case_reference&community_id=eq.${community}&shift_log_id=${inFilter(logIds)}&order=created_at.asc`,identity),
   operationsDbFetch(`operational_rounds?select=id,shift_log_id,round_type,state&community_id=eq.${community}&shift_log_id=${inFilter(logIds)}&order=started_at.desc`,identity),
  ]);
  if(!entryResponse.ok)return NextResponse.json({error:"No se pudieron consultar las entradas de bitácora"},{status:502,headers:{"Cache-Control":"private, no-store"}});
  if(!roundResponse.ok)return NextResponse.json({error:"No se pudieron consultar las rondas"},{status:502,headers:{"Cache-Control":"private, no-store"}});
  entries=await entryResponse.json() as EntryRow[];
  rounds=await roundResponse.json() as RoundRow[];
 }
 if(rounds.length){
  const checkResponse=await operationsDbFetch(`operational_round_checks?select=id,round_id,checkpoint_code,result,incident_id,case_reference&community_id=eq.${community}&round_id=${inFilter(rounds.map(row=>row.id))}&order=created_at.asc`,identity);
  if(!checkResponse.ok)return NextResponse.json({error:"No se pudieron consultar los checkpoints"},{status:502,headers:{"Cache-Control":"private, no-store"}});
  checks=await checkResponse.json() as CheckRow[];
 }

 const shiftById=new Map(shifts.map(row=>[row.id,row]));
 const logById=new Map(logs.map(row=>[row.id,row]));
 const roundById=new Map(rounds.map(row=>[row.id,row]));
 const openRounds=rounds.filter(round=>round.state==="open");
 const criticalIncidents=incidents.filter(item=>item.priority==="critical");
 const highIncidents=incidents.filter(item=>item.priority==="high");
 const vacant=shifts.filter(shift=>shift.status==="vacant");
 const requested=shifts.filter(shift=>shift.status==="requested");
 const closedWithPending=logs.filter(log=>log.state==="closed"&&((log.pending_items_count??0)>0||log.closure_code==="pending_followup"||log.closure_code==="escalated"));
 const currentPendingEntries=entries.filter(entry=>{
  const log=logById.get(entry.shift_log_id);
  return log?.state==="open"&&(entry.entry_code==="handoff_pending"||entry.severity==="urgent");
 });
 const attentionChecks=checks.filter(check=>check.result==="attention"&&!check.incident_id);
 const items:ContinuityItem[]=[];
 const addItem=(item:Omit<ContinuityItem,"id">)=>items.push({id:`continuity-${items.length+1}`,...item});

 openRounds.forEach(round=>{
  const log=logById.get(round.shift_log_id);const shift=log?shiftById.get(log.shift_assignment_id):undefined;
  addItem({kind:"blocker",title:`Ronda ${roundLabel[round.round_type]??round.round_type} abierta`,detail:`${shift?.slot_code??"Turno"}: debe completarse antes de cerrar la bitácora.`,tone:"danger"});
 });
 vacant.forEach(shift=>addItem({kind:"coverage",title:`${shift.slot_code} sin cobertura`,detail:"Vacante operativa; Conserjería informa y el rol autorizado gestiona la cobertura.",tone:"danger"}));
 criticalIncidents.forEach(item=>addItem({kind:"incident",title:`Incidencia crítica · ${areaLabel[item.area]??item.area}`,detail:`Estado ${item.state.replaceAll("_"," ")}; debe permanecer visible en la continuidad del turno.`,tone:"danger"}));
 requested.forEach(shift=>addItem({kind:"coverage",title:`${shift.slot_code} · reemplazo solicitado`,detail:"La cobertura continúa pendiente de confirmación por un rol autorizado.",tone:"warning"}));
 highIncidents.forEach(item=>addItem({kind:"incident",title:`Incidencia alta · ${areaLabel[item.area]??item.area}`,detail:`Estado ${item.state.replaceAll("_"," ")}; mantener seguimiento en el relevo.`,tone:"warning"}));
 closedWithPending.forEach(log=>{
  const shift=shiftById.get(log.shift_assignment_id);
  addItem({kind:"handoff",title:`Entrega con pendientes · ${shift?.slot_code??"Turno"}`,detail:`Cierre ${log.closure_code?.replaceAll("_"," ")??"con seguimiento"} · ${log.pending_items_count??0} pendiente(s) declarado(s).`,tone:log.closure_code==="escalated"?"danger":"warning"});
 });
 currentPendingEntries.forEach(entry=>{
  const log=logById.get(entry.shift_log_id);const shift=log?shiftById.get(log.shift_assignment_id):undefined;
  addItem({kind:"handoff",title:`Bitácora · ${shift?.slot_code??"Turno"}`,detail:entry.entry_code==="handoff_pending"?`Pendiente para relevo${entry.case_reference?` · ${entry.case_reference}`:""}.`:`Entrada urgente ${entry.category}${entry.case_reference?` · ${entry.case_reference}`:""}.`,tone:entry.severity==="urgent"?"danger":"warning"});
 });
 attentionChecks.forEach(check=>{
  const round=roundById.get(check.round_id);const log=round?logById.get(round.shift_log_id):undefined;const shift=log?shiftById.get(log.shift_assignment_id):undefined;
  addItem({kind:"round",title:`Checkpoint en atención · ${checkpointLabel[check.checkpoint_code]??check.checkpoint_code}`,detail:`Ronda ${roundLabel[round?.round_type??""]??round?.round_type??"operativa"}${shift?.slot_code?` · ${shift.slot_code}`:""}${check.case_reference?` · ${check.case_reference}`:""}.`,tone:"warning"});
 });

 const urgentEntries=currentPendingEntries.filter(entry=>entry.severity==="urgent").length;
 let tone:Tone="clear";
 let label="Sin señales pendientes";
 let detail="No se detectan bloqueos ni señales de continuidad prioritaria en los datos visibles.";
 if(openRounds.length){tone="blocked";label="Cierre bloqueado";detail="Existe al menos una ronda abierta. El backend impide cerrar la bitácora hasta completarla.";}
 else if(vacant.length||criticalIncidents.length||urgentEntries){tone="critical";label="Continuidad crítica";detail="Hay cobertura vacante, incidencia crítica o evidencia urgente que debe mantenerse visible en el relevo.";}
 else if(requested.length||highIncidents.length||closedWithPending.length||attentionChecks.length||currentPendingEntries.length){tone="attention";label="Continuidad con pendientes";detail="La jornada puede continuar, pero existen observaciones o seguimientos que no deben perderse entre turnos.";}

 return NextResponse.json({
  date,
  generatedAt:new Date().toISOString(),
  status:{tone,label,detail},
  metrics:{
   technicalBlockers:openRounds.length,
   coveragePending:vacant.length+requested.length,
   vacant:vacant.length,
   requested:requested.length,
   priorityIncidents:criticalIncidents.length+highIncidents.length,
   criticalIncidents:criticalIncidents.length,
   highIncidents:highIncidents.length,
   handoffsWithFollowup:closedWithPending.length,
  },
  items:items.slice(0,24),
  sources:{shifts:shifts.length,incidents:incidents.length,logs:logs.length,rounds:rounds.length,checks:checks.length},
 },{headers:{"Cache-Control":"private, no-store"}});
}
