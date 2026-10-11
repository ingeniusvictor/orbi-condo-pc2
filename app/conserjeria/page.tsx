"use client";

import Link from "next/link";
import {FormEvent,useCallback,useEffect,useMemo,useState} from "react";
import ConciergeShiftLog from "../../components/ConciergeShiftLog";
import ConciergeOperationalRounds from "../../components/ConciergeOperationalRounds";

type OperationsRole="administrator"|"committee"|"concierge"|"mayordomo"|"resident";
type ShiftStatus="planned"|"vacant"|"requested"|"confirmed"|"received";
type IncidentPriority="low"|"medium"|"high"|"critical";
type SessionState={configured:boolean;authenticated:boolean;communityId:string|null;role:OperationsRole|null;permissions:string[]};
type Shift={id:string;serviceDate:string;slotCode:string;startsAt:string;endsAt:string;status:ShiftStatus;revision:number;hasAssignee:boolean};
type Incident={id:string;serviceDate:string;area:string;priority:IncidentPriority;state:string;assignedRole:string|null;revision:number;createdAt:string;updatedAt:string};
type Dashboard={date:string;communityId:string;role:OperationsRole;summary:{shiftTotal:number;vacant:number;requested:number;confirmed:number;received:number;openIncidents:number;criticalIncidents:number};shifts:Shift[];incidents:Incident[]};

const roleLabel:Record<OperationsRole,string>={administrator:"Administración",committee:"Comité",concierge:"Conserjería",mayordomo:"Mayordomía",resident:"Residente"};
const shiftLabel:Record<ShiftStatus,string>={planned:"Planificado",vacant:"Vacante",requested:"Reemplazo solicitado",confirmed:"Reemplazo confirmado",received:"Relevo recibido"};
const priorityLabel:Record<IncidentPriority,string>={low:"Baja",medium:"Media",high:"Alta",critical:"Crítica"};
const areaLabel:Record<string,string>={access:"Acceso",common_area:"Área común",water:"Agua",electricity:"Electricidad",elevator:"Ascensor",security:"Seguridad",medical:"Médica",fire:"Incendio",other:"Otra"};

function santiagoDate(){return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Santiago",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())}
function clock(value:string){return new Intl.DateTimeFormat("es-CL",{timeZone:"America/Santiago",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(value))}
function statusTone(status:ShiftStatus){if(status==="vacant")return "danger";if(status==="requested")return "warn";if(status==="confirmed")return "ready";if(status==="received")return "done";return "neutral"}

export default function ConciergeDailyPage(){
 const [session,setSession]=useState<SessionState|null>(null);
 const [date,setDate]=useState(santiagoDate);
 const [dashboard,setDashboard]=useState<Dashboard|null>(null);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState<string|null>(null);
 const [area,setArea]=useState("common_area");
 const [priority,setPriority]=useState<IncidentPriority>("medium");
 const [reference,setReference]=useState("");

 const loadSession=useCallback(async()=>{
  const read=async()=>fetch("/api/auth/session",{cache:"no-store"}).then(r=>r.json() as Promise<SessionState>);
  let next=await read();
  if(next.configured&&!next.authenticated){const refresh=await fetch("/api/auth/refresh",{method:"POST",cache:"no-store"});if(refresh.ok)next=await read()}
  setSession(next);return next;
 },[]);

 const loadDashboard=useCallback(async(targetDate:string)=>{
  const path=`/api/operations/dashboard?date=${encodeURIComponent(targetDate)}`;
  let response=await fetch(path,{cache:"no-store"});
  if(response.status===401||response.status===403){const refresh=await fetch("/api/auth/refresh",{method:"POST",cache:"no-store"});if(refresh.ok)response=await fetch(path,{cache:"no-store"})}
  if(!response.ok){setNotice("No se pudo cargar la operación diaria.");setDashboard(null);return false}
  setDashboard(await response.json() as Dashboard);return true;
 },[]);

 useEffect(()=>{let active=true;(async()=>{setLoading(true);try{const next=await loadSession();if(active&&next.authenticated&&next.role&&["administrator","mayordomo","concierge"].includes(next.role))await loadDashboard(date)}finally{if(active)setLoading(false)}})();return()=>{active=false}},[date,loadDashboard,loadSession]);

 const permissions=session?.permissions??[];
 const canReportGap=permissions.includes("report_shift_gap");
 const canHandoff=permissions.includes("confirm_shift_handoff");
 const canReportIncident=permissions.includes("report_incident");
 const allowedRole=Boolean(session?.role&&["administrator","mayordomo","concierge"].includes(session.role));
 const today=santiagoDate();
 const currentShift=useMemo(()=>{if(!dashboard||date!==today)return null;const now=Date.now();return dashboard.shifts.find(shift=>Date.parse(shift.startsAt)<=now&&now<Date.parse(shift.endsAt))??null},[dashboard,date,today]);
 const nextShift=useMemo(()=>{if(!dashboard)return null;const threshold=date===today?Date.now():Date.parse(date+"T00:00:00-03:00");return dashboard.shifts.find(shift=>Date.parse(shift.startsAt)>threshold)??null},[dashboard,date,today]);
 const attentionShift=dashboard?.shifts.find(shift=>shift.status==="vacant"||shift.status==="requested")??null;

 const post=async(path:string,body:unknown)=>{
  let response=await fetch(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  if(response.status===401||response.status===403){const refresh=await fetch("/api/auth/refresh",{method:"POST",cache:"no-store"});if(refresh.ok)response=await fetch(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})}
  const payload=await response.json().catch(()=>({error:"Error inesperado"})) as {error?:string};if(!response.ok)throw new Error(payload.error||`Error HTTP ${response.status}`);
 };

 const runShiftAction=async(path:string,shift:Shift,success:string)=>{if(busy)return;setBusy(true);setNotice(null);try{await post(path,{assignmentId:shift.id,expectedRevision:shift.revision});setNotice(success);await loadDashboard(date)}catch(error){setNotice(error instanceof Error?error.message:"No se pudo completar la acción.");await loadDashboard(date)}finally{setBusy(false)}};
 const submitIncident=async(event:FormEvent)=>{event.preventDefault();if(busy||!canReportIncident)return;setBusy(true);setNotice(null);try{await post("/api/operations/incidents/report",{serviceDate:date,area,priority,caseReference:reference.trim()||undefined});setReference("");setNotice("Novedad registrada en la bitácora operativa.");await loadDashboard(date)}catch(error){setNotice(error instanceof Error?error.message:"No se pudo registrar la novadad.")}finally{setBusy(false)}};

 if(loading)return <main className="concierge-shell concierge-center"><div className="concierge-loader"><span/>Validando turno y sesión privada…</div></main>;
 if(!session?.configured)return <main className="concierge-shell concierge-center"><section className="concierge-access-card"><p className="eyebrow">ORBI LIVING · CONSERJERÍA</p><h1>Operación privada no configurada</h1><p>Este corte continúa limitado a staging sintético.</p><Link href="/">Volver al sitio</Link></section></main>;
 if(!session.authenticated)return <main className="concierge-shell concierge-center"><section className="concierge-access-card"><p className="eyebrow">ORBI LIVING · CONSERJERÍA</p><h1>Inicia sesión para abrir el turno</h1><p>La consola diaria reutiliza la sesión privada de ORBI LIVING y nunca expone tokens al navegador.</p><Link className="concierge-primary-link" href="/operaciones">Ir al acceso privado</Link></section></main>;
 if(!allowedRole)return <main className="concierge-shell concierge-center"><section className="concierge-access-card"><p className="eyebrow">ACCESO RESTRINGIDO</p><h1>Este rol no opera la conserjería diaria</h1><p>La vista está limitada a Conserjería, Mayordomía y Administración.</p><Link href="/operaciones">Volver a Operaciones</Link></section></main>;

 return <main className="concierge-shell">
  <header className="concierge-topbar"><div><p className="eyebrow">ORBI LIVING · OPERACIÓN DIARIA</p><h1>Conserjería</h1><p className="concierge-subtitle">Turno, relevo y novedades del día · <strong>{session.role?roleLabel[session.role]:""}</strong> · {session.communityId}</p></div><nav aria-label="Navegación privada"><Link href="/operaciones">Operaciones</Link><Link href="/">Inicio</Link></nav></header>
  <section className="concierge-toolbar" aria-label="Fecha operativa"><div><span>Fecha operativa</span><input type="date" value={date} onChange={event=>setDate(event.target.value)}/></div><button type="button" onClick={()=>setDate(today)} disabled={date===today}>Hoy</button><div className="concierge-live"><i/>STAGING SINTÉTICO</div></section>
  {notice&&<div className="concierge-notice" role="status">{notice}</div>}
  {dashboard?<>
   <section className="concierge-kpis" aria-label="Resumen diario"><article><span>Turnos</span><strong>{dashboard.summary.shiftTotal}</strong><small>programados hoy</small></article><article className={dashboard.summary.vacant?"attention":""}><span>Vacantes</span><strong>{dashboard.summary.vacant}</strong><small>requieren cobertura</small></article><article className={dashboard.summary.requested?"warning":""}><span>Solicitudes</span><strong>{dashboard.summary.requested}</strong><small>reemplazos en curso</small></article><article className={dashboard.summary.criticalIncidents?"attention":""}><span>Novedades</span><strong>{dashboard.summary.openIncidents}</strong><small>{dashboard.summary.criticalIncidents} críticas</small></article></section>
   <section className="concierge-focus-grid">
    <article className="concierge-focus-card current"><div className="concierge-card-heading"><div><span className="eyebrow">AHORA</span><h2>Turno actual</h2></div>{currentShift&&<b className={`shift-chip ${statusTone(currentShift.status)}`}>{shiftLabel[currentShift.status]}</b>}</div>{currentShift?<><h3>{currentShift.slotCode}</h3><p>{clock(currentShift.startsAt)}–{clock(currentShift.endsAt)} · {currentShift.hasAssignee?"Responsable asignado":"Sin responsable"}</p><div className="concierge-actions">{canReportGap&&(currentShift.status==="planned"||currentShift.status==="confirmed")&&<button disabled={busy} onClick={()=>runShiftAction("/api/operations/shifts/report-gap",currentShift,"Vacante reportada. Administración/Mayordomía puede gestionar la cobertura.")}>Reportar vacante</button>}{canHandoff&&currentShift.status==="confirmed"&&currentShift.hasAssignee&&<button className="primary" disabled={busy} onClick={()=>runShiftAction("/api/operations/shifts/handoff",currentShift,"Relevo recibido y registrado.")}>Recibir relevo</button>}</div></>:<p className="concierge-empty">No hay un turno activo en este momento para la fecha seleccionada.</p>}</article>
    <article className="concierge-focus-card"><div className="concierge-card-heading"><div><span className="eyebrow">SIGUIENTE</span><h2>Próximo relevo</h2></div>{nextShift&&<b className={`shift-chip ${statusTone(nextShift.status)}`}>{shiftLabel[nextShift.status]}</b>}</div>{nextShift?<><h3>{nextShift.slotCode}</h3><p>{clock(nextShift.startsAt)}–{clock(nextShift.endsAt)} · {nextShift.hasAssignee?"Responsable asignado":"Sin responsable"}</p></>:<p className="concierge-empty">No quedan turnos posteriores cargados para este día.</p>}</article>
    <article className={`concierge-focus-card ${attentionShift?"attention-card":""}`}><div className="concierge-card-heading"><div><span className="eyebrow">ATENCIÓN</span><h2>Cobertura pendiente</h2></div></div>{attentionShift?<><h3>{attentionShift.slotCode}</h3><p>{clock(attentionShift.startsAt)}–{clock(attentionShift.endsAt)} · {shiftLabel[attentionShift.status]}</p><small>Conserjería informa; la decisión de cobertura permanece en los roles autorizados.</small></>:<p className="concierge-empty">Sin vacantes ni solicitudes pendientes para esta fecha.</p>}</article>
   </section>
   <section className="concierge-columns">
    <div className="concierge-panel"><div className="concierge-section-heading"><div><span className="eyebrow">JORNADA</span><h2>Turnos del día</h2></div><span>{dashboard.shifts.length} registros</span></div><div className="concierge-shift-list">{dashboard.shifts.map(shift=><article key={shift.id} className="concierge-shift-row"><div className="concierge-shift-time"><strong>{clock(shift.startsAt)}</strong><span>{clock(shift.endsAt)}</span></div><div className="concierge-shift-copy"><h3>{shift.slotCode}</h3><p>{shift.hasAssignee?"Responsable asignado":"Sin responsable asignado"} · rev. {shift.revision}</p></div><b className={`shift-chip ${statusTone(shift.status)}`}>{shiftLabel[shift.status]}</b><div className="concierge-row-actions">{canReportGap&&(shift.status==="planned"||shift.status==="confirmed")&&<button disabled={busy} onClick={()=>runShiftAction("/api/operations/shifts/report-gap",shift,"Vacante reportada.")}>Vacante</button>}{canHandoff&&shift.status==="confirmed"&&shift.hasAssignee&&<button disabled={busy} onClick={()=>runShiftAction("/api/operations/shifts/handoff",shift,"Relevo recibido.")}>Recibir</button>}</div></article>)}</div></div>
    <div className="concierge-panel"><div className="concierge-section-heading"><div><span className="eyebrow">INCIDENCIAS</span><h2>Novedades abiertas</h2></div><span>{dashboard.incidents.length}</span></div><div className="concierge-incident-list">{dashboard.incidents.length?dashboard.incidents.slice(0,8).map(incident=><article key={incident.id}><div><b>{areaLabel[incident.area]||incident.area}</b><span>{incident.state.replaceAll("_"," ")}</span></div><strong className={`priority ${incident.priority}`}>{priorityLabel[incident.priority]}</strong></article>):<p className="concierge-empty">No hay novedades abiertas.</p>}</div>{canReportIncident&&<form className="concierge-report" onSubmit={submitIncident}><div><span className="eyebrow">NUEVA NOVEDAD</span><h3>Registrar incidencia</h3></div><label>Área<select value={area} onChange={event=>setArea(event.target.value)}><option value="access">Acceso</option><option value="common_area">Área común</option><option value="water">Agua</option><option value="electricity">Electricidad</option><option value="elevator">Ascensor</option><option value="security">Seguridad</option><option value="medical">Médica</option><option value="fire">Incendio</option><option value="other">Otra</option></select></label><label>Prioridad<select value={priority} onChange={event=>setPriority(event.target.value as IncidentPriority)}><option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option><option value="critical">Crítica</option></select></label><label>Referencia sintética opcional<input value={reference} onChange={event=>setReference(event.target.value.replace(/[^A-Za-z0-9._-]/g,"").slice(0,80))} placeholder="EV-TEST-01"/></label><button className="primary" disabled={busy} type="submit">{busy?"Registrando…":"Registrar novedad"}</button></form>}</div>
   </section>
   <ConciergeShiftLog date={date} today={today} shifts={dashboard.shifts} incidents={dashboard.incidents} permissions={permissions}/>
   <ConciergeOperationalRounds date={date} today={today} incidents={dashboard.incidents} permissions={permissions}/>
  </>:<section className="concierge-access-card"><h2>Sin datos operativos disponibles</h2><p>La sesión está activa, pero no fue posible cargar la jornada.</p></section>}
  <footer className="concierge-footer"><span>ORBI LIVING · SYNTHETIC STAGING ONLY</span><span>Sin PII · RLS activo · comandos server-side</span></footer>
 </main>;
}
