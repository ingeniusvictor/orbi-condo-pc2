"use client";

import Link from "next/link";
import {useCallback,useEffect,useMemo,useState} from "react";
import type {FormEvent} from "react";
import styles from "./compact-workspace.module.css";

type SessionState={configured:boolean;authenticated:boolean;communityId:string|null;role:string|null;permissions:string[]};
type ShiftStatus="planned"|"vacant"|"requested"|"confirmed"|"received";
type IncidentState="reported"|"acknowledged"|"assigned"|"in_progress"|"resolved"|"closed";
type IncidentPriority="low"|"medium"|"high"|"critical";
type SectionKey="resumen"|"turnos"|"incidencias"|"equipo"|"continuidad"|"seguridad"|"mas";
type ShiftItem={id:string;serviceDate:string;slotCode:string;startsAt:string;endsAt:string;status:ShiftStatus;revision:number;hasAssignee:boolean};
type IncidentItem={id:string;serviceDate:string;area:string;priority:IncidentPriority;state:IncidentState;assignedRole:string|null;revision:number;createdAt:string;updatedAt:string};
type StaffItem={id:string;displayName:string;staffFunction:string};
type DashboardData={date:string;communityId:string;role:string;summary:{shiftTotal:number;vacant:number;requested:number;confirmed:number;received:number;openIncidents:number;criticalIncidents:number};shifts:ShiftItem[];incidents:IncidentItem[];staff:StaffItem[]};
type ApiError={error?:string};

const roleLabels:Record<string,string>={administrator:"Administración",committee:"Comité",concierge:"Conserjería",mayordomo:"Mayordomía",resident:"Residente"};
const shiftLabels:Record<ShiftStatus,string>={planned:"Planificado",vacant:"Vacante",requested:"Reemplazo solicitado",confirmed:"Confirmado",received:"Recibido"};
const incidentLabels:Record<IncidentState,string>={reported:"Reportada",acknowledged:"Reconocida",assigned:"Asignada",in_progress:"En gestión",resolved:"Resuelta",closed:"Cerrada"};
const priorityLabels:Record<IncidentPriority,string>={low:"Baja",medium:"Media",high:"Alta",critical:"Crítica"};
const areaLabels:Record<string,string>={access:"Acceso",common_area:"Área común",water:"Agua",electricity:"Electricidad",elevator:"Ascensor",security:"Seguridad",medical:"Médica",fire:"Incendio",other:"Otra"};
const staffLabels:Record<string,string>={concierge:"Conserjería",cleaning:"Aseo",mayordomo:"Mayordomía",administrative:"Administrativo"};
const incidentTransitions:Record<IncidentState,readonly IncidentState[]>={reported:["acknowledged","assigned","resolved"],acknowledged:["assigned","in_progress","resolved"],assigned:["in_progress","resolved","acknowledged"],in_progress:["resolved","assigned"],resolved:["closed","in_progress"],closed:[]};
const sections:{key:SectionKey;label:string;icon:string}[]=[
 {key:"resumen",label:"Resumen",icon:"⌂"},{key:"turnos",label:"Turnos",icon:"▣"},{key:"incidencias",label:"Incidencias",icon:"△"},{key:"continuidad",label:"Continuidad",icon:"▥"},{key:"equipo",label:"Equipo",icon:"◎"},{key:"seguridad",label:"Seguridad",icon:"◇"},{key:"mas",label:"Más módulos",icon:"＋"},
];

function santiagoDate(){
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Santiago",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
 const get=(type:string)=>parts.find(part=>part.type===type)?.value||"";
 return `${get("year")}-${get("month")}-${get("day")}`;
}
function formatTime(value:string){try{return new Intl.DateTimeFormat("es-CL",{timeZone:"America/Santiago",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(value));}catch{return "—";}}
function formatDate(value:string){try{return new Intl.DateTimeFormat("es-CL",{timeZone:"America/Santiago",day:"2-digit",month:"short"}).format(new Date(value+"T12:00:00Z"));}catch{return value;}}
async function readError(response:Response,fallback:string){try{const body=await response.json() as ApiError;return body.error||fallback;}catch{return fallback;}}
async function postWithRefresh(url:string,payload?:unknown){
 const run=()=>fetch(url,{method:"POST",headers:payload===undefined?undefined:{"Content-Type":"application/json"},body:payload===undefined?undefined:JSON.stringify(payload),cache:"no-store"});
 let response=await run();
 if(response.status===401||response.status===403){const refresh=await fetch("/api/auth/refresh",{method:"POST",cache:"no-store"});if(refresh.ok)response=await run();}
 return response;
}
async function getWithRefresh(url:string){
 let response=await fetch(url,{cache:"no-store"});
 if(response.status===401||response.status===403){const refresh=await fetch("/api/auth/refresh",{method:"POST",cache:"no-store"});if(refresh.ok)response=await fetch(url,{cache:"no-store"});}
 return response;
}

function StatusPill({children,tone="blue"}:{children:React.ReactNode;tone?:"blue"|"green"|"red"|"amber"}){
 const toneClass=tone==="green"?styles.statusGreen:tone==="red"?styles.statusRed:tone==="amber"?styles.statusAmber:"";
 return <span className={`${styles.status} ${toneClass}`}><span className={styles.dot}/>{children}</span>;
}

export default function CompactOperationsWorkspace(){
 const [session,setSession]=useState<SessionState|null>(null);
 const [sessionLoading,setSessionLoading]=useState(true);
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [loginError,setLoginError]=useState("");
 const [loginBusy,setLoginBusy]=useState(false);
 const [date,setDate]=useState(santiagoDate);
 const [dashboard,setDashboard]=useState<DashboardData|null>(null);
 const [dashboardLoading,setDashboardLoading]=useState(false);
 const [dashboardError,setDashboardError]=useState("");
 const [actionKey,setActionKey]=useState("");
 const [notice,setNotice]=useState("");
 const [activeSection,setActiveSection]=useState<SectionKey>("resumen");
 const [assigneeDraft,setAssigneeDraft]=useState<Record<string,string>>({});
 const [incidentArea,setIncidentArea]=useState("common_area");
 const [incidentPriority,setIncidentPriority]=useState<IncidentPriority>("medium");
 const [caseReference,setCaseReference]=useState("");
 const [incidentPriorityDraft,setIncidentPriorityDraft]=useState<Record<string,IncidentPriority>>({});
 const [incidentRoleDraft,setIncidentRoleDraft]=useState<Record<string,string>>({});

 const loadSession=useCallback(async(attemptRefresh=true)=>{
  setSessionLoading(true);
  try{
   let response=await fetch("/api/auth/session",{cache:"no-store"});
   let next=await response.json() as SessionState;
   if(next.configured&&!next.authenticated&&attemptRefresh){const refresh=await fetch("/api/auth/refresh",{method:"POST",cache:"no-store"});if(refresh.ok){response=await fetch("/api/auth/session",{cache:"no-store"});next=await response.json() as SessionState;}}
   setSession(next);
  }catch{setSession({configured:false,authenticated:false,communityId:null,role:null,permissions:[]});}
  finally{setSessionLoading(false);}
 },[]);

 const loadDashboard=useCallback(async(targetDate:string)=>{
  setDashboardLoading(true);setDashboardError("");
  try{
   const response=await getWithRefresh(`/api/operations/dashboard?date=${encodeURIComponent(targetDate)}`);
   if(!response.ok){setDashboard(null);setDashboardError(await readError(response,"No se pudo cargar la consola"));return;}
   setDashboard(await response.json() as DashboardData);
  }catch{setDashboard(null);setDashboardError("No se pudo conectar con la consola privada");}
  finally{setDashboardLoading(false);}
 },[]);

 useEffect(()=>{void loadSession();},[loadSession]);
 useEffect(()=>{if(session?.authenticated&&session.permissions.includes("view_shift_schedule"))void loadDashboard(date);else{setDashboard(null);setDashboardError("");}},[session,date,loadDashboard]);

 const can=(permission:string)=>Boolean(session?.permissions.includes(permission));
 const canManageShifts=can("manage_shift_schedule");
 const canReportGap=can("report_shift_gap");
 const canHandoff=can("confirm_shift_handoff");
 const canReportIncident=can("report_incident");
 const canManageIncident=can("manage_incident");

 const login=async(event:FormEvent)=>{
  event.preventDefault();setLoginBusy(true);setLoginError("");
  try{const response=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password}),cache:"no-store"});if(!response.ok){setLoginError(await readError(response,"No fue posible iniciar sesión"));return;}setPassword("");await loadSession(false);}catch{setLoginError("No fue posible conectar con autenticación");}finally{setLoginBusy(false);}
 };
 const logout=async()=>{setActionKey("logout");setNotice("");try{await fetch("/api/auth/logout",{method:"POST",cache:"no-store"});}finally{setDashboard(null);await loadSession(false);setActionKey("");}};
 const runCommand=async(key:string,url:string,payload:unknown,success:string)=>{
  setActionKey(key);setNotice("");
  try{const response=await postWithRefresh(url,payload);if(!response.ok){setNotice(await readError(response,"No se pudo aplicar el cambio"));if(response.status===409)await loadDashboard(date);return;}setNotice(success);await loadDashboard(date);}catch{setNotice("No se pudo conectar con el servicio operativo");}finally{setActionKey("");}
 };
 const reportGap=(shift:ShiftItem)=>runCommand(`gap-${shift.id}`,"/api/operations/shifts/report-gap",{assignmentId:shift.id,expectedRevision:shift.revision},"Vacante registrada y auditada.");
 const receiveHandoff=(shift:ShiftItem)=>runCommand(`handoff-${shift.id}`,"/api/operations/shifts/handoff",{assignmentId:shift.id,expectedRevision:shift.revision},"Recepción del turno registrada.");
 const requestReplacement=(shift:ShiftItem)=>runCommand(`request-${shift.id}`,"/api/operations/shifts/command",{assignmentId:shift.id,expectedRevision:shift.revision,nextStatus:"requested"},"Solicitud de reemplazo registrada.");
 const confirmReplacement=(shift:ShiftItem)=>{const staffId=assigneeDraft[shift.id];if(!staffId){setNotice("Selecciona una persona habilitada antes de confirmar el reemplazo.");return;}void runCommand(`confirm-${shift.id}`,"/api/operations/shifts/command",{assignmentId:shift.id,expectedRevision:shift.revision,nextStatus:"confirmed",assigneeStaffId:staffId},"Reemplazo confirmado.");};
 const reportIncident=async(event:FormEvent)=>{event.preventDefault();const ref=caseReference.trim();await runCommand("incident-new","/api/operations/incidents/report",{serviceDate:date,area:incidentArea,priority:incidentPriority,...(ref?{caseReference:ref}:{})},"Incidencia registrada.");setCaseReference("");};
 const transitionIncident=(incident:IncidentItem,nextState:IncidentState)=>runCommand(`incident-state-${incident.id}`,"/api/operations/incidents/command",{incidentId:incident.id,expectedRevision:incident.revision,nextState},`Incidencia actualizada a “${incidentLabels[nextState]}”.`);
 const changeIncidentPriority=(incident:IncidentItem)=>{const priority=incidentPriorityDraft[incident.id]||incident.priority;if(priority===incident.priority){setNotice("Selecciona una prioridad distinta antes de aplicar el cambio.");return;}void runCommand(`incident-priority-${incident.id}`,"/api/operations/incidents/command",{incidentId:incident.id,expectedRevision:incident.revision,priority},"Prioridad actualizada.");};
 const changeIncidentRole=(incident:IncidentItem)=>{const assignedRole=incidentRoleDraft[incident.id]??incident.assignedRole??"";if(assignedRole===(incident.assignedRole||"")){setNotice("Selecciona un rol distinto antes de aplicar el cambio.");return;}void runCommand(`incident-role-${incident.id}`,"/api/operations/incidents/command",{incidentId:incident.id,expectedRevision:incident.revision,assignedRole:assignedRole||null},"Responsable operativo actualizado.");};

 const summary=dashboard?.summary;
 const compactKpis=useMemo(()=>[
  {label:"Turnos hoy",value:summary?.shiftTotal??0,meta:`${summary?.confirmed??0} confirmados · ${Math.max((summary?.shiftTotal??0)-(summary?.confirmed??0),0)} pendientes`,icon:"▣",danger:false},
  {label:"Incidencias activas",value:summary?.openIncidents??0,meta:`${summary?.criticalIncidents??0} críticas`,icon:"△",danger:Boolean(summary?.criticalIncidents)},
  {label:"Vacantes",value:summary?.vacant??0,meta:(summary?.vacant??0)?"Requieren cobertura":"Sin vacantes",icon:"◎",danger:Boolean(summary?.vacant)},
  {label:"Reemplazos",value:summary?.requested??0,meta:"Solicitados",icon:"↔",danger:false},
  {label:"Confirmados",value:summary?.confirmed??0,meta:"Turnos del día",icon:"✓",danger:false},
  {label:"Críticas",value:summary?.criticalIncidents??0,meta:"Requieren atención",icon:"!",danger:Boolean(summary?.criticalIncidents)},
 ],[summary]);

 if(sessionLoading)return <main className={styles.workspace} style={{display:"grid",placeItems:"center"}}>Validando sesión privada…</main>;

 if(!session?.configured)return <main className={styles.loginWrap}><section className={styles.loginCard}><p className={styles.eyebrow}>ORBI LIVING · CONSOLA PRIVADA</p><h1>Backend no configurado<span style={{color:"#71e5df"}}>.</span></h1><p>Esta superficie se habilita únicamente cuando el Preview dispone de las variables privadas de Supabase staging.</p><Link href="/panel-operativo" className={styles.navLink}>← Panel operativo demo</Link></section></main>;

 if(!session.authenticated)return <main className={styles.loginWrap}><section className={styles.loginCard}><p className={styles.eyebrow}>ORBI LIVING · ACCESO OPERATIVO</p><h1>Consola privada<span style={{color:"#71e5df"}}>.</span></h1><p>Ingreso para identidades habilitadas de staging. La sesión usa cookies HttpOnly; el navegador no recibe tokens de Supabase.</p><form onSubmit={login} className={styles.loginForm}><label className={styles.label}>Correo<input className={styles.input} type="email" autoComplete="username" value={email} onChange={event=>setEmail(event.target.value)} required maxLength={254}/></label><label className={styles.label}>Contraseña<input className={styles.input} type="password" autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)} required maxLength={512}/></label>{loginError&&<p role="alert" className={styles.error}>{loginError}</p>}<button className={styles.actionButton} disabled={loginBusy}>{loginBusy?"Validando…":"Ingresar a ORBI LIVING"}</button></form><p style={{fontSize:12}}>SYNTHETIC STAGING ONLY · No ingresar datos reales de residentes, trabajadores, contactos, patentes ni narrativas privadas.</p></section></main>;

 if(!session.permissions.includes("view_shift_schedule"))return <main className={styles.loginWrap}><section className={styles.loginCard}><p className={styles.eyebrow}>ORBI LIVING · ACCESO LIMITADO</p><h1>Sesión válida, sin permiso operativo.</h1><p>Rol: {session.role?roleLabels[session.role]||session.role:"sin rol"}. La autorización se resuelve en servidor.</p><button className={styles.logout} onClick={logout} disabled={actionKey==="logout"}>Cerrar sesión</button></section></main>;

 const renderShiftRows=(items:ShiftItem[])=>items.length?items.map(shift=><div key={shift.id} className={styles.row}><div><strong>{formatTime(shift.startsAt)} – {formatTime(shift.endsAt)}</strong><div className={styles.rowMeta}>Rev. {shift.revision}</div></div><div><strong>{shift.slotCode}</strong><div className={styles.rowMeta}>{shift.hasAssignee?"Cobertura asignada":"Sin cobertura asignada"}</div></div><StatusPill tone={shift.status==="vacant"?"red":shift.status==="received"?"green":"blue"}>{shiftLabels[shift.status]}</StatusPill></div>):<p className={styles.empty}>{dashboardLoading?"Consultando cobertura…":"No hay turnos registrados para la fecha seleccionada."}</p>;
 const renderIncidentRows=(items:IncidentItem[])=>items.length?items.map(incident=><div key={incident.id} className={styles.row}><div><strong>{areaLabels[incident.area]||incident.area}</strong><div className={styles.rowMeta}>{formatDate(incident.serviceDate)} · rev. {incident.revision}</div></div><div><strong>{incident.assignedRole?roleLabels[incident.assignedRole]||incident.assignedRole:"Sin rol asignado"}</strong><div className={styles.rowMeta}>{incidentLabels[incident.state]}</div></div><StatusPill tone={incident.priority==="critical"?"red":incident.priority==="medium"?"amber":"blue"}>{priorityLabels[incident.priority]}</StatusPill></div>):<p className={styles.empty}>{dashboardLoading?"Consultando incidencias…":"No hay incidencias abiertas visibles para este rol."}</p>;

 return <main className={styles.workspace}>
  <div className={styles.shell}>
   <aside className={styles.sidebar} aria-label="Navegación de operaciones">
    <div><div className={styles.brand}><span className={styles.brandMark}/><span>ORBI <b>LIVING</b></span></div><div className={styles.community}>Condominio<strong>Parque Ciudadano II</strong>{session.communityId}</div></div>
    <nav className={styles.sideNav}>{sections.slice(0,6).map(item=><button key={item.key} onClick={()=>setActiveSection(item.key)} className={`${styles.navButton} ${activeSection===item.key?styles.navActive:""}`} aria-pressed={activeSection===item.key}><span className={styles.navIcon}>{item.icon}</span>{item.label}</button>)}</nav>
    <div className={styles.moduleGroup}><p className={styles.groupLabel}>MÁS MÓDULOS</p><button onClick={()=>setActiveSection("mas")} className={`${styles.navButton} ${activeSection==="mas"?styles.navActive:""}`}><span className={styles.navIcon}>＋</span>Secciones futuras</button><div className={styles.futureLink}><strong>+ Añadir módulo</strong>Espacio preparado para reportes, documentos, comunicaciones e integraciones.</div></div>
    <div className={styles.environment}><strong>● Entorno privado P1F</strong>Staging · Datos de prueba</div>
   </aside>

   <div className={styles.main}>
    <div className={styles.topbar}><div className={styles.topIdentity}>ORBI LIVING · {roleLabels[session.role||""]||session.role} · {session.communityId}</div><div className={styles.topActions}><label className={styles.dateControl}><span>Fecha de cobertura</span><input className={styles.dateInput} type="date" value={date} onChange={event=>setDate(event.target.value)}/></label><button className={styles.logout} onClick={logout} disabled={actionKey==="logout"}>Salir</button></div></div>

    <header className={styles.hero}><div><p className={styles.eyebrow}>ORBI LIVING · ADMINISTRATOR WORKSPACE</p><h1>Operación <span>en vivo</span></h1><p>Gestiona turnos, incidencias y continuidad del corte desde una vista simple. El detalle completo sigue disponible cuando lo necesites.</p></div><div className={styles.viewSwitch} aria-label="Modo de vista"><span className={styles.viewLabel}>Modo de vista</span><span className={styles.viewActive}>▦ Compacta</span><Link href="/operaciones/extendida" className={styles.viewOption}>☷ Extendida</Link></div></header>

    <div className={styles.staging}><div className={styles.stagingIcon}>◉</div><div><strong>SYNTHETIC STAGING ONLY</strong>La recuperación P1E sigue pendiente y producción con datos reales continúa bloqueada. Esta consola no publica tokens ni datos privados fuera del catálogo autorizado.</div><span className={styles.stagingTag}>Entorno de staging</span></div>
    {notice&&<div role="status" className={styles.notice}>{notice}</div>}
    {dashboardError&&<div role="alert" className={styles.error}>{dashboardError}</div>}

    <section className={styles.kpis} aria-label="Resumen operativo">{compactKpis.map(item=><article key={item.label} className={styles.kpi}><div className={styles.kpiTop}><span className={styles.kpiIcon}>{item.icon}</span><div><small>{item.label}</small><b className={item.danger?styles.dangerValue:""}>{dashboardLoading?"—":item.value}</b></div></div><div className={styles.kpiMeta}>{item.meta}</div></article>)}</section>

    <nav className={styles.sectionTabs} aria-label="Secciones de la vista compacta">{sections.map(item=><button key={item.key} className={`${styles.tab} ${activeSection===item.key?styles.tabActive:""}`} onClick={()=>setActiveSection(item.key)}>{item.icon} {item.label}</button>)}</nav>

    {activeSection==="resumen"&&<section className={styles.grid} aria-label="Resumen compacto">
      <article className={`${styles.card} ${styles.span6}`}><div className={styles.cardHead}><div className={styles.cardTitle}><span className={styles.cardIcon}>▣</span><div><h2>Turnos de hoy</h2><div className={styles.sub}>Personal y estado de los turnos programados.</div></div></div><button className={styles.linkButton} onClick={()=>setActiveSection("turnos")}>Ver todos →</button></div><div className={styles.rowList}>{renderShiftRows(dashboard?.shifts.slice(0,2)??[])}</div></article>
      <article className={`${styles.card} ${styles.span6}`}><div className={styles.cardHead}><div className={styles.cardTitle}><span className={styles.cardIcon}>△</span><div><h2>Incidencias activas</h2><div className={styles.sub}>Requieren atención y seguimiento.</div></div></div><button className={styles.linkButton} onClick={()=>setActiveSection("incidencias")}>Ver todas →</button></div><div className={styles.rowList}>{renderIncidentRows(dashboard?.incidents.slice(0,2)??[])}</div></article>
      <article className={`${styles.card} ${styles.span4}`}><div className={styles.cardHead}><div className={styles.cardTitle}><span className={styles.cardIcon}>⚡</span><div><h2>Acciones rápidas</h2><div className={styles.sub}>Tareas frecuentes, en un solo clic.</div></div></div></div><div className={styles.quickGrid}><button className={styles.quick} onClick={()=>setActiveSection("incidencias")}>Registrar incidencia<small>Reporta un problema</small></button><button className={styles.quick} onClick={()=>setActiveSection("turnos")}>Reportar vacante<small>Gestiona una falta de personal</small></button><button className={styles.quick} onClick={()=>setActiveSection("turnos")}>Solicitar relevo<small>Gestiona un reemplazo</small></button><button className={styles.quick} onClick={()=>void loadDashboard(date)}>Actualizar estado<small>Sincroniza la información</small></button></div></article>
      <article className={`${styles.card} ${styles.span4}`}><div className={styles.cardHead}><div className={styles.cardTitle}><span className={styles.cardIcon}>◎</span><div><h2>Cobertura y personal</h2><div className={styles.sub}>Estado del equipo y cobertura del día.</div></div></div><button className={styles.linkButton} onClick={()=>setActiveSection("equipo")}>Ver equipo →</button></div><div className={styles.progressGrid}><div className={styles.metric}><b>{summary?.shiftTotal??0}</b><small>Turnos</small></div><div className={styles.metric}><b>{summary?.vacant??0}</b><small>Vacantes</small></div><div className={styles.metric}><b>{summary?.requested??0}</b><small>Reemplazos</small></div><div className={styles.metric}><b>{summary?.confirmed??0}</b><small>Confirmados</small></div></div><div className={styles.staffList}>{(dashboard?.staff.slice(0,3)??[]).map(person=><div key={person.id} className={styles.staffRow}><strong>{person.displayName}</strong><span>{staffLabels[person.staffFunction]||person.staffFunction}</span></div>)}{!dashboard?.staff.length&&<span className={styles.empty}>Sin catálogo visible para este rol.</span>}</div></article>
      <article className={`${styles.card} ${styles.span4}`}><div className={styles.cardHead}><div className={styles.cardTitle}><span className={styles.cardIcon}>▥</span><div><h2>Continuidad del corte</h2><div className={styles.sub}>Controles técnicos y estado general.</div></div></div><button className={styles.linkButton} onClick={()=>setActiveSection("continuidad")}>Ver detalle →</button></div><div className={styles.checkList}><div className={styles.check}><span className={styles.checkBadge}>✓</span>Comunidad resuelta en servidor</div><div className={styles.check}><span className={styles.checkBadge}>✓</span>Revisión optimista por mutación</div><div className={styles.check}><span className={styles.checkBadge}>✓</span>Eventos/auditoría generados en DB</div><div className={styles.check}><span className={styles.checkBadge}>✓</span>Sin DELETE operativo</div><div className={styles.check}><span className={`${styles.checkBadge} ${styles.checkPending}`}>○</span>Auth E2E y recovery pendientes</div></div></article>
      <article className={`${styles.card} ${styles.span8}`}><div className={styles.cardHead}><div className={styles.cardTitle}><span className={styles.cardIcon}>◇</span><div><h2>Seguridad y trazabilidad</h2><div className={styles.sub}>La vista compacta conserva las mismas fronteras de seguridad.</div></div></div><button className={styles.linkButton} onClick={()=>setActiveSection("seguridad")}>Ver controles →</button></div><div className={styles.checkList}><div className={styles.check}><span className={styles.checkBadge}>✓</span>Cookies HttpOnly y autorización server-side</div><div className={styles.check}><span className={styles.checkBadge}>✓</span>RLS como segunda barrera</div><div className={styles.check}><span className={styles.checkBadge}>✓</span>Referencias técnicas seguras para errores</div></div></article>
      <article className={`${styles.card} ${styles.span4} ${styles.future}`}><div><b>⬡</b><strong>Nuevo módulo</strong><span>La plataforma puede crecer con nuevas secciones sin recargar el resumen principal.</span><br/><button className={styles.linkButton} style={{marginTop:12}} onClick={()=>setActiveSection("mas")}>+ Explorar secciones</button></div></article>
     </section>}

    {activeSection==="turnos"&&<section className={styles.grid} aria-label="Gestión completa de turnos">
      <article className={`${styles.card} ${styles.span12}`}><div className={styles.cardHead}><div className={styles.cardTitle}><span className={styles.cardIcon}>▣</span><div><h2>Turnos y cobertura</h2><div className={styles.sub}>Todas las acciones existentes siguen disponibles en la vista compacta.</div></div></div><button className={styles.linkButton} onClick={()=>void loadDashboard(date)} disabled={dashboardLoading}>{dashboardLoading?"Actualizando…":"Actualizar"}</button></div><div className={styles.rowList}>{dashboard?.shifts.length?dashboard.shifts.map(shift=>{
       const mayGap=canReportGap&&["planned","requested","confirmed"].includes(shift.status);const mayReceive=canHandoff&&shift.status==="confirmed"&&shift.hasAssignee;const mayRequest=canManageShifts&&shift.status==="vacant";const mayConfirm=canManageShifts&&(shift.status==="vacant"||shift.status==="requested");
       return <article key={shift.id} className={styles.detailItem}><div className={styles.detailTop}><div><h3>{shift.slotCode}</h3><div className={styles.rowMeta}>{formatTime(shift.startsAt)}–{formatTime(shift.endsAt)} · rev. {shift.revision} · {shift.hasAssignee?"con cobertura":"sin cobertura"}</div></div><StatusPill tone={shift.status==="vacant"?"red":shift.status==="received"?"green":"blue"}>{shiftLabels[shift.status]}</StatusPill></div><div className={styles.buttonLine}>{mayGap&&<button className={styles.dangerButton} onClick={()=>void reportGap(shift)} disabled={Boolean(actionKey)}>Reportar vacante</button>}{mayRequest&&<button className={styles.actionButton} onClick={()=>void requestReplacement(shift)} disabled={Boolean(actionKey)}>Solicitar reemplazo</button>}{mayReceive&&<button className={styles.actionButton} onClick={()=>void receiveHandoff(shift)} disabled={Boolean(actionKey)}>Registrar relevo</button>}</div>{mayConfirm&&<div className={styles.manageLine} style={{marginTop:9}}><select className={styles.input} value={assigneeDraft[shift.id]||""} onChange={event=>setAssigneeDraft(current=>({...current,[shift.id]:event.target.value}))}><option value="">Seleccionar cobertura habilitada…</option>{dashboard.staff.map(person=><option key={person.id} value={person.id}>{person.displayName} · {staffLabels[person.staffFunction]||person.staffFunction}</option>)}</select><button className={styles.actionButton} onClick={()=>confirmReplacement(shift)} disabled={Boolean(actionKey)}>Confirmar</button></div>}</article>;
      }):<p className={styles.empty}>{dashboardLoading?"Consultando cobertura…":"No hay turnos registrados para la fecha seleccionada."}</p>}</div></article>
     </section>}

    {activeSection==="incidencias"&&<section className={styles.grid} aria-label="Gestión completa de incidencias">
      <article className={`${styles.card} ${canReportIncident?styles.span8:styles.span12}`}><div className={styles.cardHead}><div className={styles.cardTitle}><span className={styles.cardIcon}>△</span><div><h2>Continuidad y escalamiento</h2><div className={styles.sub}>Estados, prioridad y responsable operativo.</div></div></div></div><div className={styles.rowList}>{dashboard?.incidents.length?dashboard.incidents.map(incident=><article key={incident.id} className={styles.detailItem}><div className={styles.detailTop}><div><h3>{areaLabels[incident.area]||incident.area}</h3><div className={styles.rowMeta}>{formatDate(incident.serviceDate)} · rev. {incident.revision} · {incident.assignedRole?roleLabels[incident.assignedRole]||incident.assignedRole:"sin rol asignado"}</div></div><div className={styles.chips}><StatusPill tone={incident.priority==="critical"?"red":incident.priority==="medium"?"amber":"blue"}>{priorityLabels[incident.priority]}</StatusPill><StatusPill>{incidentLabels[incident.state]}</StatusPill></div></div>{canManageIncident&&<><div className={styles.buttonLine}>{incidentTransitions[incident.state].map(next=><button key={next} className={styles.linkButton} onClick={()=>void transitionIncident(incident,next)} disabled={Boolean(actionKey)}>{incidentLabels[next]}</button>)}</div><div className={styles.manageGrid}><div className={styles.manageLine}><select className={styles.input} value={incidentPriorityDraft[incident.id]||incident.priority} onChange={event=>setIncidentPriorityDraft(current=>({...current,[incident.id]:event.target.value as IncidentPriority}))}>{(["low","medium","high","critical"] as IncidentPriority[]).map(priority=><option key={priority} value={priority}>{priorityLabels[priority]}</option>)}</select><button className={styles.linkButton} onClick={()=>changeIncidentPriority(incident)} disabled={Boolean(actionKey)}>Prioridad</button></div><div className={styles.manageLine}><select className={styles.input} value={incidentRoleDraft[incident.id]??incident.assignedRole??""} onChange={event=>setIncidentRoleDraft(current=>({...current,[incident.id]:event.target.value}))}><option value="">Sin rol</option><option value="administrator">Administración</option><option value="mayordomo">Mayordomía</option><option value="concierge">Conserjería</option><option value="committee">Comité</option></select><button className={styles.linkButton} onClick={()=>changeIncidentRole(incident)} disabled={Boolean(actionKey)}>Asignar</button></div></div></>}</article>):<p className={styles.empty}>{dashboardLoading?"Consultando incidencias…":"No hay incidencias abiertas visibles para este rol."}</p>}</div></article>
      {canReportIncident&&<aside className={`${styles.card} ${styles.span4}`}><div className={styles.cardHead}><div className={styles.cardTitle}><span className={styles.cardIcon}>＋</span><div><h2>Nueva incidencia</h2><div className={styles.sub}>Registro estructurado y simple.</div></div></div></div><form className={styles.form} onSubmit={reportIncident}><label className={styles.label}>Área<select className={styles.input} value={incidentArea} onChange={event=>setIncidentArea(event.target.value)}>{Object.entries(areaLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label className={styles.label}>Prioridad<select className={styles.input} value={incidentPriority} onChange={event=>setIncidentPriority(event.target.value as IncidentPriority)}>{(["low","medium","high","critical"] as IncidentPriority[]).map(priority=><option key={priority} value={priority}>{priorityLabels[priority]}</option>)}</select></label><label className={styles.label}>Referencia opcional<input className={styles.input} value={caseReference} onChange={event=>setCaseReference(event.target.value)} pattern="[A-Za-z0-9._-]*" maxLength={80} placeholder="Ej: ASC-2026-001"/></label><button className={styles.actionButton} disabled={Boolean(actionKey)}>Registrar incidencia</button><small className={styles.sub}>Sin narrativa libre, teléfonos, RUT, patentes ni datos de residentes.</small></form></aside>}
     </section>}

    {activeSection==="equipo"&&<section className={styles.grid} aria-label="Cobertura y personal"><article className={`${styles.card} ${styles.span7}`}><div className={styles.cardHead}><div className={styles.cardTitle}><span className={styles.cardIcon}>◎</span><div><h2>Cobertura y personal</h2><div className={styles.sub}>Catálogo mínimo habilitado para la operación.</div></div></div></div><div className={styles.progressGrid}><div className={styles.metric}><b>{summary?.shiftTotal??0}</b><small>Turnos</small></div><div className={styles.metric}><b>{summary?.vacant??0}</b><small>Vacantes</small></div><div className={styles.metric}><b>{summary?.requested??0}</b><small>Reemplazos</small></div><div className={styles.metric}><b>{summary?.confirmed??0}</b><small>Confirmados</small></div></div><div className={styles.staffList}>{dashboard?.staff.length?dashboard.staff.map(person=><div key={person.id} className={styles.staffRow}><strong>{person.displayName}</strong><span>{staffLabels[person.staffFunction]||person.staffFunction}</span></div>):<span className={styles.empty}>No hay catálogo de cobertura visible para este rol.</span>}</div></article><article className={`${styles.card} ${styles.span5}`}><div className={styles.cardTitle}><span className={styles.cardIcon}>↔</span><div><h2>Gestión de cobertura</h2><div className={styles.sub}>Las acciones de vacantes y reemplazos se realizan sobre cada turno.</div></div></div><div className={styles.checkList} style={{marginTop:14}}><div className={styles.check}><span className={styles.checkBadge}>✓</span>Reportar vacante desde Turnos</div><div className={styles.check}><span className={styles.checkBadge}>✓</span>Solicitar reemplazo según permiso</div><div className={styles.check}><span className={styles.checkBadge}>✓</span>Confirmar cobertura habilitada</div><div className={styles.check}><span className={styles.checkBadge}>✓</span>Registrar recepción de relevo</div></div><button className={styles.actionButton} style={{marginTop:14}} onClick={()=>setActiveSection("turnos")}>Ir a Turnos</button></article></section>}

    {activeSection==="continuidad"&&<section className={styles.grid} aria-label="Continuidad del corte"><article className={`${styles.card} ${styles.span6}`}><div className={styles.cardTitle}><span className={styles.cardIcon}>▥</span><div><h2>Continuidad operativa</h2><div className={styles.sub}>Lectura rápida de señales del corte actual.</div></div></div><div className={styles.progressGrid} style={{marginTop:16}}><div className={styles.metric}><b>{summary?.openIncidents??0}</b><small>Incidencias</small></div><div className={styles.metric}><b>{summary?.criticalIncidents??0}</b><small>Críticas</small></div><div className={styles.metric}><b>{summary?.vacant??0}</b><small>Vacantes</small></div><div className={styles.metric}><b>{summary?.requested??0}</b><small>Reemplazos</small></div></div></article><article className={`${styles.card} ${styles.span6}`}><div className={styles.cardTitle}><span className={styles.cardIcon}>✓</span><div><h2>Frontera P1F</h2><div className={styles.sub}>Estado técnico de la superficie privada.</div></div></div><div className={styles.checkList} style={{marginTop:14}}><div className={styles.check}><span className={styles.checkBadge}>✓</span>Comunidad resuelta en servidor</div><div className={styles.check}><span className={styles.checkBadge}>✓</span>Revisión optimista por mutación</div><div className={styles.check}><span className={styles.checkBadge}>✓</span>Eventos/auditoría generados en DB</div><div className={styles.check}><span className={styles.checkBadge}>✓</span>Sin DELETE operativo</div><div className={styles.check}><span className={`${styles.checkBadge} ${styles.checkPending}`}>○</span>Auth E2E y recovery siguen pendientes</div></div></article></section>}

    {activeSection==="seguridad"&&<section className={styles.grid} aria-label="Seguridad del corte"><article className={`${styles.card} ${styles.span7}`}><div className={styles.cardTitle}><span className={styles.cardIcon}>◇</span><div><h2>Seguridad y trazabilidad</h2><div className={styles.sub}>Mismas fronteras certificadas, nueva organización visual.</div></div></div><div className={styles.checkList} style={{marginTop:16}}><div className={styles.check}><span className={styles.checkBadge}>✓</span>La UI no accede directamente a tablas privadas</div><div className={styles.check}><span className={styles.checkBadge}>✓</span>Comandos server-side con identidad y comunidad</div><div className={styles.check}><span className={styles.checkBadge}>✓</span>Cookies HttpOnly con alcance mínimo</div><div className={styles.check}><span className={styles.checkBadge}>✓</span>RLS como segunda barrera</div><div className={styles.check}><span className={styles.checkBadge}>✓</span>Correlación técnica segura de errores</div></div></article><article className={`${styles.card} ${styles.span5}`}><div className={styles.cardTitle}><span className={styles.cardIcon}>☷</span><div><h2>Detalle operativo</h2><div className={styles.sub}>Para inspección intensiva, abre la vista existente completa.</div></div></div><p className={styles.empty}>La vista extendida conserva la presentación anterior y todas sus superficies visibles en una sola página.</p><Link href="/operaciones/extendida" className={styles.navLink} style={{borderColor:"#2c7186",background:"#0a3447",color:"#e9ffff"}}>Abrir vista extendida →</Link></article></section>}

    {activeSection==="mas"&&<section className={styles.grid} aria-label="Módulos futuros"><article className={`${styles.card} ${styles.span12} ${styles.future}`}><div><b>⬡</b><strong>Arquitectura preparada para crecer</strong><span>La navegación compacta separa el contenido por módulos, de modo que nuevas áreas no vuelvan a convertir el resumen en una página interminable.</span><div className={styles.quickGrid} style={{marginTop:16,maxWidth:680}}><button className={styles.quick} disabled>Reportes<small>Espacio futuro</small></button><button className={styles.quick} disabled>Documentos<small>Espacio futuro</small></button><button className={styles.quick} disabled>Comunicaciones<small>Espacio futuro</small></button><button className={styles.quick} disabled>Integraciones<small>Espacio futuro</small></button></div></div></article></section>}
   </div>
  </div>

  <nav className={styles.mobileTabs} aria-label="Navegación móvil"><button className={activeSection==="resumen"?styles.mobileActive:""} onClick={()=>setActiveSection("resumen")}>⌂<br/>Inicio</button><button className={activeSection==="turnos"?styles.mobileActive:""} onClick={()=>setActiveSection("turnos")}>▣<br/>Turnos</button><button className={activeSection==="incidencias"?styles.mobileActive:""} onClick={()=>setActiveSection("incidencias")}>△<br/>Incidencias</button><button className={activeSection==="mas"?styles.mobileActive:""} onClick={()=>setActiveSection("mas")}>☰<br/>Más</button></nav>
 </main>;
}
