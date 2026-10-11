"use client";

import Link from "next/link";
import {useCallback,useEffect,useMemo,useState} from "react";

type OperationsRole="administrator"|"committee"|"concierge"|"mayordomo"|"resident";
type ShiftStatus="planned"|"vacant"|"requested"|"confirmed"|"received";
type IncidentPriority="low"|"medium"|"high"|"critical";
type SessionState={configured:boolean;authenticated:boolean;communityId:string|null;role:OperationsRole|null;permissions:string[]};
type Shift={id:string;serviceDate:string;slotCode:string;startsAt:string;endsAt:string;status:ShiftStatus;revision:number;hasAssignee:boolean};
type Incident={id:string;serviceDate:string;area:string;priority:IncidentPriority;state:string;assignedRole:string|null;revision:number;createdAt:string;updatedAt:string};
type Dashboard={date:string;communityId:string;role:OperationsRole;summary:{shiftTotal:number;vacant:number;requested:number;confirmed:number;received:number;openIncidents:number;criticalIncidents:number};shifts:Shift[];incidents:Incident[]};
type GateTone="ok"|"warn"|"block"|"neutral";
type Gate={id:string;label:string;detail:string;tone:GateTone};

const roleLabel:Record<OperationsRole,string>={administrator:"Administración",committee:"Comité",concierge:"Conserjería",mayordomo:"Mayordomía",resident:"Residente"};
const shiftLabel:Record<ShiftStatus,string>={planned:"Planificado",vacant:"Vacante",requested:"Reemplazo solicitado",confirmed:"Reemplazo confirmado",received:"Relevo recibido"};
const areaLabel:Record<string,string>={access:"Acceso",common_area:"Área común",water:"Agua",electricity:"Electricidad",elevator:"Ascensor",security:"Seguridad",medical:"Médica",fire:"Incendio",other:"Otra"};

function santiagoDate(){
 return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Santiago",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
}
function clock(value:string){
 return new Intl.DateTimeFormat("es-CL",{timeZone:"America/Santiago",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(value));
}
function toneLabel(tone:GateTone){
 if(tone==="ok")return "OK";
 if(tone==="warn")return "Atención";
 if(tone==="block")return "Pendiente";
 return "Info";
}

export default function StructuredHandoverPage(){
 const [session,setSession]=useState<SessionState|null>(null);
 const [date,setDate]=useState(santiagoDate);
 const [dashboard,setDashboard]=useState<Dashboard|null>(null);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState<string|null>(null);

 const loadSession=useCallback(async()=>{
  const read=async()=>fetch("/api/auth/session",{cache:"no-store"}).then(response=>response.json() as Promise<SessionState>);
  let next=await read();
  if(next.configured&&!next.authenticated){
   const refresh=await fetch("/api/auth/refresh",{method:"POST",cache:"no-store"});
   if(refresh.ok)next=await read();
  }
  setSession(next);
  return next;
 },[]);

 const loadDashboard=useCallback(async(targetDate:string)=>{
  const read=()=>fetch(`/api/operations/dashboard?date=${encodeURIComponent(targetDate)}`,{cache:"no-store"});
  let response=await read();
  if(response.status===401||response.status===403){
   const refresh=await fetch("/api/auth/refresh",{method:"POST",cache:"no-store"});
   if(refresh.ok)response=await read();
  }
  if(!response.ok){setDashboard(null);setNotice("No se pudo cargar la preparación del relevo.");return false;}
  setDashboard(await response.json() as Dashboard);
  return true;
 },[]);

 useEffect(()=>{
  let active=true;
  void(async()=>{
   setLoading(true);
   try{
    const next=await loadSession();
    if(!active)return;
    if(next.authenticated&&next.role&&["administrator","mayordomo","concierge"].includes(next.role))await loadDashboard(date);
   }finally{if(active)setLoading(false);}
  })();
  return()=>{active=false};
 },[date,loadDashboard,loadSession]);

 const allowedRole=Boolean(session?.role&&["administrator","mayordomo","concierge"].includes(session.role));
 const canHandoff=session?.permissions.includes("confirm_shift_handoff")??false;
 const today=santiagoDate();

 const orderedShifts=useMemo(()=>dashboard?[...dashboard.shifts].sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt)):[],[dashboard]);
 const handoffTarget=useMemo(()=>{
  if(!orderedShifts.length)return null;
  const confirmed=orderedShifts.find(shift=>shift.status==="confirmed"&&shift.hasAssignee);
  if(confirmed)return confirmed;
  const received=orderedShifts.find(shift=>shift.status==="received");
  if(received)return received;
  return orderedShifts.find(shift=>shift.status!=="vacant"&&shift.status!=="requested")??orderedShifts[0]??null;
 },[orderedShifts]);
 const criticalIncidents=dashboard?.incidents.filter(item=>item.priority==="critical")??[];
 const highIncidents=dashboard?.incidents.filter(item=>item.priority==="high")??[];
 const coveragePending=dashboard?.shifts.filter(shift=>shift.status==="vacant"||shift.status==="requested")??[];

 const gates=useMemo<Gate[]>(()=>{
  if(!dashboard)return [];
  const targetReady=Boolean(handoffTarget&&handoffTarget.status==="confirmed"&&handoffTarget.hasAssignee);
  const alreadyReceived=handoffTarget?.status==="received";
  return [
   {id:"coverage",label:"Cobertura de la jornada",detail:coveragePending.length?`${coveragePending.length} turno(s) con cobertura pendiente.`:"Sin vacantes ni solicitudes pendientes.",tone:coveragePending.some(item=>item.status==="vacant")?"block":coveragePending.length?"warn":"ok"},
   {id:"critical",label:"Incidencias críticas",detail:criticalIncidents.length?`${criticalIncidents.length} novedad(es) crítica(s) siguen abiertas.`:"No hay incidencias críticas abiertas.",tone:criticalIncidents.length?"block":"ok"},
   {id:"high",label:"Incidencias de alta prioridad",detail:highIncidents.length?`${highIncidents.length} novedad(es) alta(s) requieren continuidad.`:"No hay incidencias altas abiertas.",tone:highIncidents.length?"warn":"ok"},
   {id:"target",label:"Relevo identificado",detail:alreadyReceived?"El relevo seleccionado ya fue recibido.":targetReady?`${handoffTarget?.slotCode} está confirmado y tiene responsable asignado.`:handoffTarget?`${handoffTarget.slotCode} está en estado ${shiftLabel[handoffTarget.status].toLowerCase()}.`:"No existe un turno candidato a relevo para esta fecha.",tone:alreadyReceived||targetReady?"ok":handoffTarget?"warn":"neutral"}
  ];
 },[coveragePending,criticalIncidents,dashboard,handoffTarget,highIncidents]);

 const readiness=useMemo(()=>{
  if(!dashboard)return {label:"Sin datos",tone:"neutral" as GateTone,detail:"No hay jornada cargada."};
  if(criticalIncidents.length||coveragePending.some(item=>item.status==="vacant"))return {label:"Atención prioritaria",tone:"block" as GateTone,detail:"Hay señales operativas que deben quedar claramente entregadas al siguiente turno."};
  if(coveragePending.length||highIncidents.length)return {label:"Preparado con observaciones",tone:"warn" as GateTone,detail:"El relevo puede continuar, pero existen pendientes que deben permanecer visibles."};
  if(handoffTarget?.status==="received")return {label:"Relevo recibido",tone:"ok" as GateTone,detail:"La recepción ya quedó registrada en el flujo controlado."};
  if(handoffTarget?.status==="confirmed"&&handoffTarget.hasAssignee)return {label:"Listo para recibir",tone:"ok" as GateTone,detail:"El turno está confirmado, con responsable y sin señales críticas de cobertura."};
  return {label:"Preparación incompleta",tone:"neutral" as GateTone,detail:"Todavía no existe un relevo confirmado listo para recepción."};
 },[coveragePending,criticalIncidents,dashboard,handoffTarget,highIncidents]);

 const receiveHandoff=async()=>{
  if(!handoffTarget||!canHandoff||handoffTarget.status!=="confirmed"||!handoffTarget.hasAssignee||busy)return;
  setBusy(true);setNotice(null);
  try{
   let response=await fetch("/api/operations/shifts/handoff",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({assignmentId:handoffTarget.id,expectedRevision:handoffTarget.revision})});
   if(response.status===401||response.status===403){
    const refresh=await fetch("/api/auth/refresh",{method:"POST",cache:"no-store"});
    if(refresh.ok)response=await fetch("/api/operations/shifts/handoff",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({assignmentId:handoffTarget.id,expectedRevision:handoffTarget.revision})});
   }
   const payload=await response.json().catch(()=>({error:"Error inesperado"})) as {error?:string};
   if(!response.ok)throw new Error(payload.error||`Error HTTP ${response.status}`);
   setNotice("Relevo recibido mediante el comando controlado.");
   await loadDashboard(date);
  }catch(error){
   setNotice(error instanceof Error?error.message:"No se pudo registrar el relevo.");
   await loadDashboard(date);
  }finally{setBusy(false);}
 };

 if(loading)return <main className="concierge-shell concierge-center"><div className="concierge-loader"><span/>Preparando relevo estructurado…</div></main>;
 if(!session?.configured)return <main className="concierge-shell concierge-center"><section className="concierge-access-card"><p className="eyebrow">ORBI LIVING · RELEVO</p><h1>Operación privada no configurada</h1><p>Este corte continúa limitado a staging sintético.</p><Link href="/">Volver al sitio</Link></section></main>;
 if(!session.authenticated)return <main className="concierge-shell concierge-center"><section className="concierge-access-card"><p className="eyebrow">ORBI LIVING · RELEVO</p><h1>Sesión privada requerida</h1><p>El relevo estructurado sólo utiliza la sesión privada existente.</p><Link className="concierge-primary-link" href="/operaciones">Ir al acceso privado</Link></section></main>;
 if(!allowedRole)return <main className="concierge-shell concierge-center"><section className="concierge-access-card"><p className="eyebrow">ACCESO RESTRINGIDO</p><h1>Este rol no prepara relevos</h1><p>La vista está limitada a Conserjería, Mayordomía y Administración.</p><Link href="/operaciones">Volver a Operaciones</Link></section></main>;

 return <main className="concierge-shell">
  <header className="concierge-topbar">
   <div><p className="eyebrow">ORBI LIVING · P1H</p><h1>Relevo estructurado</h1><p className="concierge-subtitle">Preparación del cambio de turno · <strong>{session.role?roleLabel[session.role]:""}</strong> · {session.communityId}</p></div>
   <nav aria-label="Navegación privada"><Link href="/conserjeria">Conserjería</Link><Link href="/operaciones">Operaciones</Link></nav>
  </header>

  <section className="concierge-toolbar" aria-label="Fecha de relevo">
   <div><span>Fecha operativa</span><input type="date" value={date} onChange={event=>setDate(event.target.value)} /></div>
   <button type="button" onClick={()=>setDate(today)} disabled={date===today}>Hoy</button>
   <div className="concierge-live"><i/>SYNTHETIC STAGING ONLY</div>
  </section>

  {notice&&<div className="concierge-notice" role="status">{notice}</div>}

  {dashboard?<>
   <section className="handover-hero">
    <article className={`handover-readiness ${readiness.tone}`}>
     <span className="eyebrow">ESTADO DEL RELEVO</span>
     <strong>{readiness.label}</strong>
     <p>{readiness.detail}</p>
    </article>
    <article className="handover-target">
     <span className="eyebrow">TURNO OBJETIVO</span>
     {handoffTarget?<><h2>{handoffTarget.slotCode}</h2><p>{clock(handoffTarget.startsAt)}–{clock(handoffTarget.endsAt)} · {shiftLabel[handoffTarget.status]}</p><small>{handoffTarget.hasAssignee?"Responsable asignado":"Sin responsable asignado"} · rev. {handoffTarget.revision}</small></>:<p className="concierge-empty">No existe un turno candidato para esta fecha.</p>}
     {handoffTarget&&handoffTarget.status==="confirmed"&&handoffTarget.hasAssignee&&canHandoff&&<button className="handover-primary" disabled={busy} onClick={receiveHandoff}>{busy?"Registrando…":"Recibir relevo"}</button>}
    </article>
   </section>

   <section className="handover-grid">
    <div className="concierge-panel">
     <div className="concierge-section-heading"><div><span className="eyebrow">CHECKLIST</span><h2>Control antes del cambio</h2></div><span>{gates.length} verificaciones</span></div>
     <div className="handover-checklist">{gates.map(gate=><article key={gate.id} className={`handover-gate ${gate.tone}`}><div><span className="handover-dot"/><div><strong>{gate.label}</strong><p>{gate.detail}</p></div></div><b>{toneLabel(gate.tone)}</b></article>)}</div>
    </div>

    <div className="concierge-panel">
     <div className="concierge-section-heading"><div><span className="eyebrow">CONTINUIDAD</span><h2>Novedades a entregar</h2></div><span>{criticalIncidents.length+highIncidents.length}</span></div>
     <div className="concierge-incident-list">{[...criticalIncidents,...highIncidents].length?[...criticalIncidents,...highIncidents].slice(0,8).map(item=><article key={item.id}><div><b>{areaLabel[item.area]||item.area}</b><span>{item.state.replaceAll("_"," ")}</span></div><strong className={`priority ${item.priority}`}>{item.priority==="critical"?"Crítica":"Alta"}</strong></article>):<p className="concierge-empty">No hay incidencias críticas o altas que deban destacarse en el relevo.</p>}</div>
    </div>
   </section>

   <section className="concierge-panel handover-coverage">
    <div className="concierge-section-heading"><div><span className="eyebrow">COBERTURA</span><h2>Pendientes de turno</h2></div><span>{coveragePending.length}</span></div>
    <div className="concierge-shift-list">{coveragePending.length?coveragePending.map(shift=><article key={shift.id} className="concierge-shift-row"><div className="concierge-shift-time"><strong>{clock(shift.startsAt)}</strong><span>{clock(shift.endsAt)}</span></div><div className="concierge-shift-copy"><h3>{shift.slotCode}</h3><p>{shift.status==="vacant"?"Sin cobertura":"Cobertura solicitada, pendiente de confirmación"}</p></div><b className={`shift-chip ${shift.status==="vacant"?"danger":"warn"}`}>{shiftLabel[shift.status]}</b></article>):<p className="concierge-empty">Sin vacantes ni reemplazos pendientes para esta fecha.</p>}</div>
   </section>
  </>:<section className="concierge-access-card"><h2>Sin datos operativos disponibles</h2><p>La sesión está activa, pero no fue posible cargar la preparación del relevo.</p></section>}

  <footer className="concierge-footer"><span>ORBI LIVING · STRUCTURED HANDOVER</span><span>Sin texto libre · sin PII · sin esquema nuevo</span></footer>
 </main>;
}
