"use client";

import {FormEvent,useCallback,useEffect,useMemo,useState} from "react";

type Incident={id:string;serviceDate:string;area:string;priority:string;state:string;assignedRole:string|null;revision:number;createdAt:string;updatedAt:string};
type ShiftLog={id:string;assignmentId:string;state:"open"|"closed";shift:{slotCode:string;startsAt:string;endsAt:string;status:string;revision:number}|null};
type ShiftLogPayload={date:string;logs:ShiftLog[]};
type Round={id:string;shiftLogId:string;roundType:string;state:string;shift:{slotCode:string}|null};
type RoundPayload={date:string;rounds:Round[]};
type Followup={id:string;shiftLogId:string;roundId:string|null;incidentId:string|null;actionCode:string;category:string;priority:"low"|"medium"|"high";state:"open"|"acknowledged"|"resolved";caseReference:string|null;createdAt:string;acknowledgedAt:string|null;resolvedAt:string|null;resolutionCode:string|null;revision:number;updatedAt:string;shiftLogState:string|null;shift:{slotCode:string;startsAt:string;endsAt:string;status:string}|null};
type FollowupPayload={date:string;followups:Followup[]};
type Props={date:string;today:string;incidents:Incident[];permissions:string[]};

const actionLabels:Record<string,string>={verify_condition:"Verificar condición",coordinate_maintenance:"Coordinar mantención",monitor_incident:"Monitorear incidencia",recheck_checkpoint:"Revisar checkpoint",handoff_action:"Acción para relevo",other:"Otro seguimiento"};
const categoryLabels:Record<string,string>={access:"Acceso",security:"Seguridad",maintenance:"Mantención",utilities:"Servicios",resident_support:"Atención residente",delivery:"Recepción",other:"Otro"};
const priorityLabels:Record<string,string>={low:"Baja",medium:"Media",high:"Alta"};
const stateLabels:Record<string,string>={open:"Abierto",acknowledged:"Reconocido",resolved:"Resuelto"};
const resolutionLabels:Record<string,string>={completed:"Completado",transferred:"Transferido",no_action_required:"Sin acción adicional"};

function dateTime(value:string|null){if(!value)return "—";return new Intl.DateTimeFormat("es-CL",{timeZone:"America/Santiago",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(value))}
function clock(value:string){return new Intl.DateTimeFormat("es-CL",{timeZone:"America/Santiago",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(value))}

export default function ConciergeFollowups({date,today,incidents,permissions}:Props){
 const canView=permissions.includes("view_operational_followup");
 const canWrite=permissions.includes("write_operational_followup");
 const canManage=permissions.includes("manage_operational_followup");
 const [logs,setLogs]=useState<ShiftLog[]>([]);
 const [rounds,setRounds]=useState<Round[]>([]);
 const [followups,setFollowups]=useState<Followup[]>([]);
 const [shiftLogId,setShiftLogId]=useState("");
 const [roundId,setRoundId]=useState("");
 const [incidentId,setIncidentId]=useState("");
 const [actionCode,setActionCode]=useState("handoff_action");
 const [category,setCategory]=useState("other");
 const [priority,setPriority]=useState<"low"|"medium"|"high">("medium");
 const [caseReference,setCaseReference]=useState("");
 const [resolutionCode,setResolutionCode]=useState("completed");
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState<string|null>(null);

 const fetchWithRefresh=useCallback(async(path:string,init?:RequestInit)=>{let response=await fetch(path,{...init,cache:"no-store"});if(response.status===401||response.status===403){const refresh=await fetch("/api/auth/refresh",{method:"POST",cache:"no-store"});if(refresh.ok)response=await fetch(path,{...init,cache:"no-store"})}return response},[]);
 const load=useCallback(async()=>{
  if(!canView){setLogs([]);setRounds([]);setFollowups([]);return}
  const [logResponse,roundResponse,followupResponse]=await Promise.all([
   fetchWithRefresh(`/api/operations/shift-log?date=${encodeURIComponent(date)}`),
   fetchWithRefresh(`/api/operations/rounds?date=${encodeURIComponent(date)}`),
   fetchWithRefresh(`/api/operations/followups?date=${encodeURIComponent(date)}`),
  ]);
  if(logResponse.ok)setLogs((await logResponse.json() as ShiftLogPayload).logs);else setLogs([]);
  if(roundResponse.ok)setRounds((await roundResponse.json() as RoundPayload).rounds);else setRounds([]);
  if(followupResponse.ok)setFollowups((await followupResponse.json() as FollowupPayload).followups);else{setFollowups([]);setNotice("No se pudo cargar la cola de pendientes.")}
 },[canView,date,fetchWithRefresh]);
 useEffect(()=>{void load()},[load]);

 const openLogs=useMemo(()=>logs.filter(log=>log.state==="open"),[logs]);
 useEffect(()=>{if(shiftLogId&&openLogs.some(log=>log.id===shiftLogId))return;setShiftLogId(openLogs[0]?.id??"")},[openLogs,shiftLogId]);
 const linkedRounds=rounds.filter(round=>round.shiftLogId===shiftLogId);
 useEffect(()=>{if(roundId&&linkedRounds.some(round=>round.id===roundId))return;setRoundId("")},[linkedRounds,roundId]);
 const unresolved=followups.filter(item=>item.state!=="resolved");
 const resolved=followups.filter(item=>item.state==="resolved");

 const post=async(path:string,body:unknown)=>{const response=await fetchWithRefresh(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const payload=await response.json().catch(()=>({error:"Error inesperado"})) as {error?:string};if(!response.ok)throw new Error(payload.error||`Error HTTP ${response.status}`)};

 const create=async(event:FormEvent)=>{event.preventDefault();if(!shiftLogId||busy)return;setBusy(true);setNotice(null);try{await post("/api/operations/followups/create",{shiftLogId,roundId:roundId||undefined,incidentId:incidentId||undefined,actionCode,category,priority,caseReference:caseReference.trim()||undefined});setRoundId("");setIncidentId("");setCaseReference("");setNotice("Pendiente operativo registrado.");await load()}catch(error){setNotice(error instanceof Error?error.message:"No se pudo registrar el pendiente.")}finally{setBusy(false)}};
 const acknowledge=async(item:Followup)=>{if(busy)return;setBusy(true);setNotice(null);try{await post("/api/operations/followups/acknowledge",{followupId:item.id,expectedRevision:item.revision});setNotice("Pendiente reconocido.");await load()}catch(error){setNotice(error instanceof Error?error.message:"No se pudo reconocer el pendiente.");await load()}finally{setBusy(false)}};
 const resolve=async(item:Followup)=>{if(busy)return;setBusy(true);setNotice(null);try{await post("/api/operations/followups/resolve",{followupId:item.id,expectedRevision:item.revision,resolutionCode});setNotice("Pendiente resuelto y sellado.");await load()}catch(error){setNotice(error instanceof Error?error.message:"No se pudo resolver el pendiente.");await load()}finally{setBusy(false)}};

 if(!canView)return null;
 return <section className="followups-workspace" aria-label="Pendientes operativos de relevo">
  <div className="followups-heading"><div><p className="eyebrow">PENDIENTES DE RELEVO</p><h2>Cola operativa trazable</h2><p>Los pendientes no resueltos deben coincidir con el contador usado al cerrar el turno.</p></div><div className="followups-summary"><span><b>{unresolved.length}</b> pendientes</span><span><b>{resolved.length}</b> resueltos</span></div></div>
  {notice&&<div className="followups-notice" role="status">{notice}</div>}
  <div className="followups-layout">
   <div className="followups-queue">
    <div className="followups-section-title"><strong>En curso</strong><span>{unresolved.length}</span></div>
    {unresolved.length?unresolved.map(item=><article key={item.id} className={`followup-card ${item.priority}`}><div className="followup-card-head"><div><strong>{actionLabels[item.actionCode]||item.actionCode}</strong><span>{item.shift?.slotCode||"Turno"} · {categoryLabels[item.category]||item.category}</span></div><b className={`followup-state ${item.state}`}>{stateLabels[item.state]}</b></div><div className="followup-meta"><span>Prioridad {priorityLabels[item.priority]}</span><span>rev. {item.revision}</span><span>{dateTime(item.createdAt)}</span></div>{item.caseReference&&<small>{item.caseReference}</small>}{item.incidentId&&<small>Incidencia vinculada</small>}{item.roundId&&<small>Ronda vinculada</small>}{canManage&&<div className="followup-actions">{item.state==="open"&&<button disabled={busy} onClick={()=>acknowledge(item)}>Reconocer</button>}{item.state==="acknowledged"&&<><select value={resolutionCode} onChange={event=>setResolutionCode(event.target.value)}><option value="completed">Completado</option><option value="transferred">Transferido</option><option value="no_action_required">Sin acción adicional</option></select><button className="primary" disabled={busy} onClick={()=>resolve(item)}>Resolver</button></>}</div>}</article>):<p className="followups-empty">No hay pendientes abiertos para esta fecha.</p>}
    {resolved.length>0&&<details className="followups-history"><summary>Resueltos ({resolved.length})</summary><div>{resolved.map(item=><article key={item.id}><strong>{actionLabels[item.actionCode]||item.actionCode}</strong><span>{resolutionLabels[item.resolutionCode||""]||item.resolutionCode} · {dateTime(item.resolvedAt)}</span></article>)}</div></details>}
   </div>

   <div className="followups-create-panel">
    <div><p className="eyebrow">NUEVO PENDIENTE</p><h3>Crear seguimiento estructurado</h3></div>
    {date===today&&canWrite&&openLogs.length?<form onSubmit={create} className="followup-create-form"><label>Bitácora abierta<select value={shiftLogId} onChange={event=>setShiftLogId(event.target.value)}>{openLogs.map(log=><option key={log.id} value={log.id}>{log.shift?.slotCode||"Turno"} {log.shift?`· ${clock(log.shift.startsAt)}–${clock(log.shift.endsAt)}`:""}</option>)}</select></label><label>Acción<select value={actionCode} onChange={event=>setActionCode(event.target.value)}><option value="verify_condition">Verificar condición</option><option value="coordinate_maintenance">Coordinar mantención</option><option value="monitor_incident">Monitorear incidencia</option><option value="recheck_checkpoint">Revisar checkpoint</option><option value="handoff_action">Acción para relevo</option><option value="other">Otro seguimiento</option></select></label><label>Categoría<select value={category} onChange={event=>setCategory(event.target.value)}><option value="access">Acceso</option><option value="security">Seguridad</option><option value="maintenance">Mantención</option><option value="utilities">Servicios</option><option value="resident_support">Atención residente</option><option value="delivery">Recepción</option><option value="other">Otro</option></select></label><label>Prioridad<select value={priority} onChange={event=>setPriority(event.target.value as typeof priority)}><option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option></select></label><label>Ronda {actionCode==="recheck_checkpoint"?"requerida":"opcional"}<select required={actionCode==="recheck_checkpoint"} value={roundId} onChange={event=>setRoundId(event.target.value)}><option value="">Sin vínculo</option>{linkedRounds.map(round=><option key={round.id} value={round.id}>{round.roundType} · {round.state}</option>)}</select></label><label>Incidencia {actionCode==="monitor_incident"?"requerida":"opcional"}<select required={actionCode==="monitor_incident"} value={incidentId} onChange={event=>setIncidentId(event.target.value)}><option value="">Sin vínculo</option>{incidents.map(incident=><option key={incident.id} value={incident.id}>{incident.area} · {incident.priority} · {incident.state}</option>)}</select></label><label className="wide">Referencia sintética {actionCode==="other"?"requerida":"opcional"}<input required={actionCode==="other"} value={caseReference} onChange={event=>setCaseReference(event.target.value.replace(/[^A-Za-z0-9._-]/g,"").slice(0,80))} placeholder="FOLLOW-TEST-01"/></label><button className="primary" disabled={busy}>{busy?"Registrando…":"Crear pendiente"}</button></form>:<p className="followups-empty">{date!==today?"La fecha histórica es solo de consulta.":"Necesitas una bitácora abierta para crear pendientes."}</p>}
   </div>
  </div>
 </section>;
}
