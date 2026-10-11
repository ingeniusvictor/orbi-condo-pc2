"use client";

import {useCallback,useEffect,useMemo,useState} from "react";

type ShiftStatus="planned"|"vacant"|"requested"|"confirmed"|"received";
type IncidentPriority="low"|"medium"|"high"|"critical";
type Shift={id:string;slotCode:string;status:ShiftStatus;hasAssignee:boolean;revision:number};
type Incident={id:string;area:string;priority:IncidentPriority;state:string;assignedRole:string|null;revision:number};
type LogEntry={id:string;entryCode:string;category:string;severity:"info"|"attention"|"urgent";linkedIncidentId:string|null;caseReference:string|null;createdAt:string};
type ShiftLog={id:string;state:"open"|"closed";closureCode:"normal"|"pending_followup"|"escalated"|null;accessControlStatus:"normal"|"attention"|null;equipmentStatus:"normal"|"attention"|null;openIncidentsReviewed:boolean|null;pendingItemsCount:number|null;revision:number;shift:{slotCode:string;status:ShiftStatus}|null;entries:LogEntry[]};
type RoundCheck={id:string;checkpointCode:string;result:"ok"|"attention"|"not_applicable";linkedIncidentId:string|null;caseReference:string|null};
type OperationalRound={id:string;roundType:"opening"|"routine"|"exception";state:"open"|"completed";revision:number;shiftLogState:"open"|"closed"|null;shift:{slotCode:string;status:ShiftStatus}|null;checks:RoundCheck[]};
type LogPayload={date:string;logs:ShiftLog[]};
type RoundPayload={date:string;rounds:OperationalRound[]};
type Tone="blocked"|"critical"|"attention"|"clear";
type ContinuityItem={id:string;kind:"blocker"|"coverage"|"incident"|"handoff"|"round";title:string;detail:string;tone:"danger"|"warning"|"info"};

type Props={date:string;shifts:Shift[];incidents:Incident[];permissions:string[]};

const areaLabel:Record<string,string>={access:"Acceso",common_area:"Área común",water:"Agua",electricity:"Electricidad",elevator:"Ascensor",security:"Seguridad",medical:"Médica",fire:"Incendio",other:"Otra"};
const roundLabel:Record<string,string>={opening:"Apertura",routine:"Rutina",exception:"Excepción"};
const checkpointLabel:Record<string,string>={access_control:"Control de acceso",common_areas:"Áreas comunes",safety_equipment:"Equipos de seguridad",utilities:"Servicios",perimeter:"Perímetro",handoff_readiness:"Preparación de relevo",other:"Otro"};

export default function ConciergeContinuityBoard({date,shifts,incidents,permissions}:Props){
 const canViewLogs=permissions.includes("view_shift_log");
 const canViewRounds=permissions.includes("view_operational_round");
 const [logs,setLogs]=useState<ShiftLog[]>([]);
 const [rounds,setRounds]=useState<OperationalRound[]>([]);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [updatedAt,setUpdatedAt]=useState<Date|null>(null);

 const load=useCallback(async()=>{
  if(!canViewLogs||!canViewRounds){setLogs([]);setRounds([]);return;}
  setLoading(true);setError(null);
  const logPath=`/api/operations/shift-log?date=${encodeURIComponent(date)}`;
  const roundPath=`/api/operations/rounds?date=${encodeURIComponent(date)}`;
  const read=()=>Promise.all([fetch(logPath,{cache:"no-store"}),fetch(roundPath,{cache:"no-store"})]);
  try{
   let [logResponse,roundResponse]=await read();
   if([logResponse,roundResponse].some(response=>response.status===401||response.status===403)){
    const refresh=await fetch("/api/auth/refresh",{method:"POST",cache:"no-store"});
    if(refresh.ok)[logResponse,roundResponse]=await read();
   }
   if(!logResponse.ok||!roundResponse.ok)throw new Error("No se pudo consolidar la continuidad operativa.");
   const logPayload=await logResponse.json() as LogPayload;
   const roundPayload=await roundResponse.json() as RoundPayload;
   setLogs(logPayload.logs??[]);setRounds(roundPayload.rounds??[]);setUpdatedAt(new Date());
  }catch(err){setError(err instanceof Error?err.message:"No se pudo cargar la continuidad operativa.");}
  finally{setLoading(false);}
 },[canViewLogs,canViewRounds,date]);

 useEffect(()=>{void load()},[load]);

 const model=useMemo(()=>{
  const openRounds=rounds.filter(round=>round.state==="open");
  const criticalIncidents=incidents.filter(item=>item.priority==="critical");
  const highIncidents=incidents.filter(item=>item.priority==="high");
  const vacant=shifts.filter(shift=>shift.status==="vacant");
  const requested=shifts.filter(shift=>shift.status==="requested");
  const closedWithPending=logs.filter(log=>log.state==="closed"&&((log.pendingItemsCount??0)>0||log.closureCode==="pending_followup"||log.closureCode==="escalated"));
  const currentPendingEntries=logs.filter(log=>log.state==="open").flatMap(log=>log.entries.map(entry=>({log,entry}))).filter(({entry})=>entry.entryCode==="handoff_pending"||entry.severity==="urgent");
  const attentionChecks=rounds.flatMap(round=>round.checks.map(check=>({round,check}))).filter(({check})=>check.result==="attention"&&!check.linkedIncidentId);
  const items:ContinuityItem[]=[];
  openRounds.forEach(round=>items.push({id:`round-open-${round.id}`,kind:"blocker",title:`Ronda ${roundLabel[round.roundType]??round.roundType} abierta`,detail:`${round.shift?.slotCode??"Turno"}: debe completarse antes de cerrar la bitácora.`,tone:"danger"}));
  vacant.forEach(shift=>items.push({id:`vacant-${shift.id}`,kind:"coverage",title:`${shift.slotCode} sin cobertura`,detail:"Vacante operativa; Conserjería informa y el rol autorizado gestiona la cobertura.",tone:"danger"}));
  criticalIncidents.forEach(item=>items.push({id:`incident-critical-${item.id}`,kind:"incident",title:`Incidencia crítica · ${areaLabel[item.area]??item.area}`,detail:`Estado ${item.state.replaceAll("_"," ")}; debe permanecer visible en la continuidad del turno.`,tone:"danger"}));
  requested.forEach(shift=>items.push({id:`requested-${shift.id}`,kind:"coverage",title:`${shift.slotCode} · reemplazo solicitado`,detail:"La cobertura continúa pendiente de confirmación por un rol autorizado.",tone:"warning"}));
  highIncidents.forEach(item=>items.push({id:`incident-high-${item.id}`,kind:"incident",title:`Incidencia alta · ${areaLabel[item.area]??item.area}`,detail:`Estado ${item.state.replaceAll("_"," ")}; mantener seguimiento en el relevo.`,tone:"warning"}));
  closedWithPending.forEach(log=>items.push({id:`closed-pending-${log.id}`,kind:"handoff",title:`Entrega con pendientes · ${log.shift?.slotCode??"Turno"}`,detail:`Cierre ${log.closureCode?.replaceAll("_"," ")??"con seguimiento"} · ${log.pendingItemsCount??0} pendiente(s) declarado(s).`,tone:log.closureCode==="escalated"?"danger":"warning"}));
  currentPendingEntries.forEach(({log,entry})=>items.push({id:`entry-${entry.id}`,kind:"handoff",title:`Bitácora · ${log.shift?.slotCode??"Turno"}`,detail:entry.entryCode==="handoff_pending"?`Pendiente para relevo${entry.caseReference?` · ${entry.caseReference}`:""}.`:`Entrada urgente ${entry.category}${entry.caseReference?` · ${entry.caseReference}`:""}.`,tone:entry.severity==="urgent"?"danger":"warning"}));
  attentionChecks.forEach(({round,check})=>items.push({id:`check-${check.id}`,kind:"round",title:`Checkpoint en atención · ${checkpointLabel[check.checkpointCode]??check.checkpointCode}`,detail:`Ronda ${roundLabel[round.roundType]??round.roundType}${round.shift?.slotCode?` · ${round.shift.slotCode}`:""}${check.caseReference?` · ${check.caseReference}`:""}.`,tone:"warning"}));
  const urgentEntries=currentPendingEntries.filter(({entry})=>entry.severity==="urgent").length;
  let tone:Tone="clear";
  let label="Sin señales pendientes";
  let detail="No se detectan bloqueos ni señales de continuidad prioritaria en los datos visibles.";
  if(openRounds.length){tone="blocked";label="Cierre bloqueado";detail="Existe al menos una ronda abierta. El backend impide cerrar la bitácora hasta completarla.";}
  else if(vacant.length||criticalIncidents.length||urgentEntries){tone="critical";label="Continuidad crítica";detail="Hay cobertura vacante, incidencia crítica o evidencia urgente que debe mantenerse visible en el relevo.";}
  else if(requested.length||highIncidents.length||closedWithPending.length||attentionChecks.length||currentPendingEntries.length){tone="attention";label="Continuidad con pendientes";detail="La jornada puede continuar, pero existen observaciones o seguimientos que no deben perderse entre turnos.";}
  return {openRounds,criticalIncidents,highIncidents,vacant,requested,closedWithPending,currentPendingEntries,attentionChecks,items,tone,label,detail};
 },[incidents,logs,rounds,shifts]);

 if(!canViewLogs||!canViewRounds)return null;
 return <section className="continuity-board" aria-label="Continuidad operativa del turno">
  <div className="continuity-heading">
   <div><span className="eyebrow">CONTINUIDAD OPERATIVA</span><h2>Qué debe sobrevivir al cambio de turno</h2><p>Vista derivada de jornada, incidencias, bitácora y rondas. No crea estados nuevos ni sustituye las reglas de cierre.</p></div>
   <button type="button" onClick={()=>void load()} disabled={loading}>{loading?"Actualizando…":"Actualizar"}</button>
  </div>
  {error&&<div className="continuity-error" role="status">{error}</div>}
  <div className={`continuity-status ${model.tone}`}><div><span>Estado derivado</span><strong>{model.label}</strong><p>{model.detail}</p></div><b>{model.items.length}</b></div>
  <div className="continuity-metrics">
   <article><span>Bloqueos de cierre</span><strong>{model.openRounds.length}</strong><small>rondas todavía abiertas</small></article>
   <article><span>Cobertura pendiente</span><strong>{model.vacant.length+model.requested.length}</strong><small>{model.vacant.length} vacante(s) · {model.requested.length} solicitada(s)</small></article>
   <article><span>Incidencias prioritarias</span><strong>{model.criticalIncidents.length+model.highIncidents.length}</strong><small>{model.criticalIncidents.length} crítica(s) · {model.highIncidents.length} alta(s)</small></article>
   <article><span>Entregas con seguimiento</span><strong>{model.closedWithPending.length}</strong><small>cierres con pendiente o escalamiento</small></article>
  </div>
  <div className="continuity-list">
   {model.items.length?model.items.slice(0,12).map(item=><article key={item.id} className={`continuity-item ${item.tone}`}><span className="continuity-marker"/><div><strong>{item.title}</strong><p>{item.detail}</p></div><b>{item.kind==="blocker"?"Bloqueo":item.kind==="coverage"?"Cobertura":item.kind==="incident"?"Incidencia":item.kind==="handoff"?"Relevo":"Ronda"}</b></article>):<div className="continuity-clear"><strong>Jornada sin señales de continuidad pendientes</strong><p>La ausencia de señales aquí no reemplaza el checklist de cierre ni la revisión humana del turno.</p></div>}
  </div>
  <footer><span>Solo lectura · RLS vigente · sin PII</span>{updatedAt&&<span>Actualizado {new Intl.DateTimeFormat("es-CL",{timeZone:"America/Santiago",hour:"2-digit",minute:"2-digit",hour12:false}).format(updatedAt)}</span>}</footer>
 </section>;
}
