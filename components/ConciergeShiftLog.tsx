"use client";

import {FormEvent,useCallback,useEffect,useMemo,useState} from "react";

type ShiftStatus="planned"|"vacant"|"requested"|"confirmed"|"received";
type Shift={id:string;serviceDate:string;slotCode:string;startsAt:string;endsAt:string;status:ShiftStatus;revision:number;hasAssignee:boolean};
type Incident={id:string;serviceDate:string;area:string;priority:string;state:string;assignedRole:string|null;revision:number;createdAt:string;updatedAt:string};
type LogEntry={id:string;entryCode:string;category:string;severity:string;linkedIncidentId:string|null;caseReference:string|null;createdAt:string};
type ShiftLog={id:string;assignmentId:string;state:"open"|"closed";openedAt:string;closedAt:string|null;closureCode:string|null;accessControlStatus:string|null;equipmentStatus:string|null;openIncidentsReviewed:boolean|null;pendingItemsCount:number|null;revision:number;updatedAt:string;shift:{slotCode:string;startsAt:string;endsAt:string;status:string;revision:number}|null;entries:LogEntry[]};
type LogPayload={date:string;logs:ShiftLog[]};

type Props={date:string;today:string;shifts:Shift[];incidents:Incident[];permissions:string[]};

const entryLabels:Record<string,string>={routine_check:"Ronda / chequeo",visitor_flow:"Flujo de visitas",delivery_received:"Recepción / entrega",equipment_check:"Chequeo de equipos",maintenance_notice:"Aviso de mantención",incident_followup:"Seguimiento de incidencia",handoff_pending:"Pendiente para relevo",other:"Otro registro"};
const categoryLabels:Record<string,string>={access:"Acceso",security:"Seguridad",maintenance:"Mantención",utilities:"Servicios",resident_support:"Atención residente",delivery:"Recepción",other:"Otro"};
const severityLabels:Record<string,string>={info:"Informativo",attention:"Atención",urgent:"Urgente"};
const closureLabels:Record<string,string>={normal:"Entrega normal",pending_followup:"Entrega con pendientes",escalated:"Entrega escalada"};

function clock(value:string|null){
 if(!value)return "—";
 return new Intl.DateTimeFormat("es-CL",{timeZone:"America/Santiago",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(value));
}
function dateTime(value:string|null){
 if(!value)return "—";
 return new Intl.DateTimeFormat("es-CL",{timeZone:"America/Santiago",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(value));
}

export default function ConciergeShiftLog({date,today,shifts,incidents,permissions}:Props){
 const canView=permissions.includes("view_shift_log");
 const canWrite=permissions.includes("write_shift_log");
 const canClose=permissions.includes("close_shift_log");
 const [payload,setPayload]=useState<LogPayload|null>(null);
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState<string|null>(null);
 const [entryCode,setEntryCode]=useState("routine_check");
 const [category,setCategory]=useState("access");
 const [severity,setSeverity]=useState("info");
 const [incidentId,setIncidentId]=useState("");
 const [caseReference,setCaseReference]=useState("");
 const [closureCode,setClosureCode]=useState("normal");
 const [accessStatus,setAccessStatus]=useState("normal");
 const [equipmentStatus,setEquipmentStatus]=useState("normal");
 const [reviewed,setReviewed]=useState(false);
 const [pendingCount,setPendingCount]=useState(0);

 const fetchWithRefresh=useCallback(async(path:string,init?:RequestInit)=>{
  let response=await fetch(path,{...init,cache:"no-store"});
  if(response.status===401||response.status===403){
   const refresh=await fetch("/api/auth/refresh",{method:"POST",cache:"no-store"});
   if(refresh.ok)response=await fetch(path,{...init,cache:"no-store"});
  }
  return response;
 },[]);

 const load=useCallback(async()=>{
  if(!canView){setPayload({date,logs:[]});return;}
  const response=await fetchWithRefresh(`/api/operations/shift-log?date=${encodeURIComponent(date)}`);
  if(!response.ok){setNotice("No se pudo cargar la bitácora de turno.");setPayload({date,logs:[]});return;}
  const next=await response.json() as LogPayload;
  setPayload(next);
  setSelectedId(current=>{
   if(current&&next.logs.some(log=>log.id===current))return current;
   return next.logs.find(log=>log.state==="open")?.id??next.logs[0]?.id??null;
  });
 },[canView,date,fetchWithRefresh]);

 useEffect(()=>{void load();},[load,shifts]);

 const logs=payload?.logs??[];
 const logByAssignment=useMemo(()=>new Map(logs.map(log=>[log.assignmentId,log])),[logs]);
 const selected=logs.find(log=>log.id===selectedId)??null;
 const openCount=logs.filter(log=>log.state==="open").length;
 const closedCount=logs.filter(log=>log.state==="closed").length;

 const post=async(path:string,body:unknown)=>{
  const response=await fetchWithRefresh(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const result=await response.json().catch(()=>({error:"Error inesperado"})) as {error?:string;log?:{id?:string}};
  if(!response.ok)throw new Error(result.error||`Error HTTP ${response.status}`);
  return result;
 };

 const openLog=async(shift:Shift)=>{
  if(busy)return;
  setBusy(true);setNotice(null);
  try{
   const result=await post("/api/operations/shift-log/open",{assignmentId:shift.id,expectedAssignmentRevision:shift.revision});
   setNotice("Bitácora de turno abierta.");
   await load();
   if(result.log?.id)setSelectedId(result.log.id);
  }catch(error){setNotice(error instanceof Error?error.message:"No se pudo abrir la bitácora.");await load();}
  finally{setBusy(false);}
 };

 const addEntry=async(event:FormEvent)=>{
  event.preventDefault();
  if(!selected||selected.state!=="open"||busy)return;
  setBusy(true);setNotice(null);
  try{
   await post("/api/operations/shift-log/entry",{logId:selected.id,entryCode,category,severity,incidentId:entryCode==="incident_followup"?incidentId||undefined:undefined,caseReference:caseReference.trim()||undefined});
   setCaseReference("");
   if(entryCode!=="incident_followup")setIncidentId("");
   setNotice("Entrada agregada a la bitácora.");
   await load();
  }catch(error){setNotice(error instanceof Error?error.message:"No se pudo agregar la entrada.");}
  finally{setBusy(false);}
 };

 const closeLog=async(event:FormEvent)=>{
  event.preventDefault();
  if(!selected||selected.state!=="open"||busy)return;
  setBusy(true);setNotice(null);
  try{
   await post("/api/operations/shift-log/close",{logId:selected.id,expectedRevision:selected.revision,closureCode,accessControlStatus:accessStatus,equipmentStatus,openIncidentsReviewed:reviewed,pendingItemsCount:pendingCount});
   setNotice("Turno cerrado y entrega registrada.");
   setReviewed(false);setPendingCount(0);setClosureCode("normal");setAccessStatus("normal");setEquipmentStatus("normal");
   await load();
  }catch(error){setNotice(error instanceof Error?error.message:"No se pudo cerrar la bitácora.");await load();}
  finally{setBusy(false);}
 };

 if(!canView)return null;
 return <section className="shift-log-workspace" aria-label="Bitácora estructurada de turno">
  <div className="shift-log-heading">
   <div><p className="eyebrow">BITÁCORA DE TURNO</p><h2>Apertura, novedades y entrega</h2><p>Registro estructurado sin narrativa libre ni PII.</p></div>
   <div className="shift-log-counts"><span><b>{openCount}</b> abiertas</span><span><b>{closedCount}</b> cerradas</span></div>
  </div>

  {notice&&<div className="shift-log-notice" role="status">{notice}</div>}

  <div className="shift-log-layout">
   <div className="shift-log-shifts">
    {shifts.map(shift=>{
     const log=logByAssignment.get(shift.id);
     const eligible=date===today&&shift.hasAssignee&&shift.status!=="vacant"&&shift.status!=="requested";
     return <article key={shift.id} className={`shift-log-shift ${selectedId===log?.id?"selected":""}`}>
      <div className="shift-log-shift-main"><div><strong>{shift.slotCode}</strong><span>{clock(shift.startsAt)}–{clock(shift.endsAt)}</span></div><b className={`log-state ${log?.state||"none"}`}>{log?log.state==="open"?"ABIERTA":"CERRADA":"SIN ABRIR"}</b></div>
      {log?<button type="button" onClick={()=>setSelectedId(log.id)}>Ver bitácora · {log.entries.length} entradas</button>:canWrite&&eligible?<button className="primary" type="button" disabled={busy} onClick={()=>openLog(shift)}>Abrir bitácora</button>:<small>{date!==today?"Solo lectura histórica":shift.hasAssignee?"Turno no habilitado para apertura":"Sin responsable asignado"}</small>}
     </article>;
    })}
   </div>

   <div className="shift-log-detail">
    {!selected?<div className="shift-log-empty"><h3>Selecciona una bitácora</h3><p>Abre un turno habilitado o selecciona un registro existente para revisar su trazabilidad.</p></div>:<>
     <div className="shift-log-detail-head"><div><span className="eyebrow">{selected.state==="open"?"EN CURSO":"ENTREGA CERRADA"}</span><h3>{selected.shift?.slotCode||"Turno"}</h3><p>Abierta {dateTime(selected.openedAt)} · rev. {selected.revision}</p></div><b className={`log-state ${selected.state}`}>{selected.state==="open"?"ABIERTA":"CERRADA"}</b></div>

     <div className="shift-log-timeline">
      {selected.entries.length?selected.entries.map(entry=><article key={entry.id} className={`shift-log-entry ${entry.severity}`}><time>{dateTime(entry.createdAt)}</time><div><strong>{entryLabels[entry.entryCode]||entry.entryCode}</strong><span>{categoryLabels[entry.category]||entry.category} · {severityLabels[entry.severity]||entry.severity}{entry.caseReference?` · ${entry.caseReference}`:""}</span>{entry.linkedIncidentId&&<small>Incidencia vinculada</small>}</div></article>):<p className="shift-log-empty-line">Sin entradas todavía.</p>}
     </div>

     {selected.state==="open"&&canWrite&&<form className="shift-log-entry-form" onSubmit={addEntry}>
      <div><span className="eyebrow">NUEVA ENTRADA</span><h4>Registrar novedad del turno</h4></div>
      <div className="shift-log-form-grid">
       <label>Tipo<select value={entryCode} onChange={event=>{setEntryCode(event.target.value);if(event.target.value!=="incident_followup")setIncidentId("");}}><option value="routine_check">Ronda / chequeo</option><option value="visitor_flow">Flujo de visitas</option><option value="delivery_received">Recepción / entrega</option><option value="equipment_check">Chequeo de equipos</option><option value="maintenance_notice">Aviso de mantención</option><option value="incident_followup">Seguimiento de incidencia</option><option value="handoff_pending">Pendiente para relevo</option><option value="other">Otro registro</option></select></label>
       <label>Categoría<select value={category} onChange={event=>setCategory(event.target.value)}><option value="access">Acceso</option><option value="security">Seguridad</option><option value="maintenance">Mantención</option><option value="utilities">Servicios</option><option value="resident_support">Atención residente</option><option value="delivery">Recepción</option><option value="other">Otro</option></select></label>
       <label>Severidad<select value={severity} onChange={event=>setSeverity(event.target.value)}><option value="info">Informativo</option><option value="attention">Atención</option><option value="urgent">Urgente</option></select></label>
       {entryCode==="incident_followup"&&<label>Incidencia<select value={incidentId} required onChange={event=>setIncidentId(event.target.value)}><option value="">Seleccionar…</option>{incidents.map(incident=><option key={incident.id} value={incident.id}>{incident.area} · {incident.priority} · {incident.state}</option>)}</select></label>}
       <label className="wide">Referencia sintética opcional<input value={caseReference} onChange={event=>setCaseReference(event.target.value.replace(/[^A-Za-z0-9._-]/g,"").slice(0,80))} placeholder="CHK-TEST-01" /></label>
      </div>
      <button className="primary" type="submit" disabled={busy}>{busy?"Registrando…":"Agregar a bitácora"}</button>
     </form>}

     {selected.state==="open"&&canClose&&<form className="shift-log-close-form" onSubmit={closeLog}>
      <div><span className="eyebrow">CIERRE Y ENTREGA</span><h4>Checklist estructurado</h4></div>
      <div className="shift-log-form-grid">
       <label>Control de acceso<select value={accessStatus} onChange={event=>setAccessStatus(event.target.value)}><option value="normal">Normal</option><option value="attention">Requiere atención</option></select></label>
       <label>Equipos / puesto<select value={equipmentStatus} onChange={event=>setEquipmentStatus(event.target.value)}><option value="normal">Normal</option><option value="attention">Requiere atención</option></select></label>
       <label>Pendientes<input type="number" min={0} max={99} value={pendingCount} onChange={event=>setPendingCount(Math.max(0,Math.min(99,Number(event.target.value)||0)))} /></label>
       <label>Resultado<select value={closureCode} onChange={event=>setClosureCode(event.target.value)}><option value="normal">Entrega normal</option><option value="pending_followup">Con pendientes</option><option value="escalated">Escalada</option></select></label>
      </div>
      <label className="shift-log-check"><input type="checkbox" checked={reviewed} onChange={event=>setReviewed(event.target.checked)} /><span>Revisé las incidencias abiertas antes de entregar el turno.</span></label>
      <button className="danger-action" type="submit" disabled={busy||!reviewed}>{busy?"Cerrando…":"Cerrar y entregar turno"}</button>
     </form>}

     {selected.state==="closed"&&<div className="shift-log-closure-summary"><div><span>Resultado</span><strong>{closureLabels[selected.closureCode||""]||selected.closureCode}</strong></div><div><span>Acceso</span><strong>{selected.accessControlStatus==="normal"?"Normal":"Atención"}</strong></div><div><span>Equipos</span><strong>{selected.equipmentStatus==="normal"?"Normal":"Atención"}</strong></div><div><span>Pendientes</span><strong>{selected.pendingItemsCount??0}</strong></div><small>Cerrada {dateTime(selected.closedAt)} · incidencias revisadas: {selected.openIncidentsReviewed?"sí":"no"}</small></div>}
    </>}
   </div>
  </div>
 </section>;
}
