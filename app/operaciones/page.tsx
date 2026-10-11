"use client";

import {useCallback,useEffect,useMemo,useState} from "react";
import type {CSSProperties,FormEvent} from "react";

type SessionState={configured:boolean;authenticated:boolean;communityId:string|null;role:string|null;permissions:string[]};
type ShiftStatus="planned"|"vacant"|"requested"|"confirmed"|"received";
type IncidentState="reported"|"acknowledged"|"assigned"|"in_progress"|"resolved"|"closed";
type IncidentPriority="low"|"medium"|"high"|"critical";
type ShiftItem={id:string;serviceDate:string;slotCode:string;startsAt:string;endsAt:string;status:ShiftStatus;revision:number;hasAssignee:boolean};
type IncidentItem={id:string;serviceDate:string;area:string;priority:IncidentPriority;state:IncidentState;assignedRole:string|null;revision:number;createdAt:string;updatedAt:string};
type StaffItem={id:string;displayName:string;staffFunction:string};
type DashboardData={
 date:string;
 communityId:string;
 role:string;
 summary:{shiftTotal:number;vacant:number;requested:number;confirmed:number;received:number;openIncidents:number;criticalIncidents:number};
 shifts:ShiftItem[];
 incidents:IncidentItem[];
 staff:StaffItem[];
};
type ApiError={error?:string};

const panel:CSSProperties={background:"linear-gradient(160deg,rgba(15,43,60,.96),rgba(7,25,38,.96))",border:"1px solid #31576c",borderRadius:20,padding:20,boxShadow:"0 20px 50px rgba(0,0,0,.18)"};
const button:CSSProperties={minHeight:42,borderRadius:10,border:"1px solid #47798b",background:"#164c5a",color:"#f3ffff",padding:"9px 13px",fontWeight:750,cursor:"pointer"};
const subtleButton:CSSProperties={...button,background:"#102f42",borderColor:"#355b70"};
const dangerButton:CSSProperties={...button,background:"#552f38",borderColor:"#855461"};
const input:CSSProperties={width:"100%",minHeight:42,boxSizing:"border-box",borderRadius:10,border:"1px solid #315b70",background:"#071d2a",color:"#efffff",padding:"9px 11px",outline:"none"};

const roleLabels:Record<string,string>={administrator:"Administración",committee:"Comité",concierge:"Conserjería",mayordomo:"Mayordomía",resident:"Residente"};
const shiftLabels:Record<ShiftStatus,string>={planned:"Planificado",vacant:"Vacante",requested:"Reemplazo solicitado",confirmed:"Confirmado",received:"Recibido"};
const incidentLabels:Record<IncidentState,string>={reported:"Reportada",acknowledged:"Reconocida",assigned:"Asignada",in_progress:"En gestión",resolved:"Resuelta",closed:"Cerrada"};
const priorityLabels:Record<IncidentPriority,string>={low:"Baja",medium:"Media",high:"Alta",critical:"Crítica"};
const areaLabels:Record<string,string>={access:"Acceso",common_area:"Área común",water:"Agua",electricity:"Electricidad",elevator:"Ascensor",security:"Seguridad",medical:"Médica",fire:"Incendio",other:"Otra"};
const staffLabels:Record<string,string>={concierge:"Conserjería",cleaning:"Aseo",mayordomo:"Mayordomía",administrative:"Administrativo"};
const incidentTransitions:Record<IncidentState,readonly IncidentState[]>={
 reported:["acknowledged","assigned","resolved"],
 acknowledged:["assigned","in_progress","resolved"],
 assigned:["in_progress","resolved","acknowledged"],
 in_progress:["resolved","assigned"],
 resolved:["closed","in_progress"],
 closed:[],
};

function santiagoDate(){
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Santiago",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
 const get=(type:string)=>parts.find(part=>part.type===type)?.value||"";
 return `${get("year")}-${get("month")}-${get("day")}`;
}
function formatTime(value:string){
 try{return new Intl.DateTimeFormat("es-CL",{timeZone:"America/Santiago",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(value));}catch{return "—";}
}
function formatDate(value:string){
 try{return new Intl.DateTimeFormat("es-CL",{timeZone:"America/Santiago",day:"2-digit",month:"short"}).format(new Date(value+"T12:00:00Z"));}catch{return value;}
}
async function readError(response:Response,fallback:string){
 try{const body=await response.json() as ApiError;return body.error||fallback;}catch{return fallback;}
}
async function postWithRefresh(url:string,payload?:unknown){
 const run=()=>fetch(url,{method:"POST",headers:payload===undefined?undefined:{"Content-Type":"application/json"},body:payload===undefined?undefined:JSON.stringify(payload),cache:"no-store"});
 let response=await run();
 if(response.status===401||response.status===403){
  const refresh=await fetch("/api/auth/refresh",{method:"POST",cache:"no-store"});
  if(refresh.ok)response=await run();
 }
 return response;
}
async function getWithRefresh(url:string){
 let response=await fetch(url,{cache:"no-store"});
 if(response.status===401||response.status===403){
  const refresh=await fetch("/api/auth/refresh",{method:"POST",cache:"no-store"});
  if(refresh.ok)response=await fetch(url,{cache:"no-store"});
 }
 return response;
}

export default function PrivateOperationsWorkspace(){
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
   if(next.configured&&!next.authenticated&&attemptRefresh){
    const refresh=await fetch("/api/auth/refresh",{method:"POST",cache:"no-store"});
    if(refresh.ok){
     response=await fetch("/api/auth/session",{cache:"no-store"});
     next=await response.json() as SessionState;
    }
   }
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
 useEffect(()=>{
  if(session?.authenticated&&session.permissions.includes("view_shift_schedule"))void loadDashboard(date);
  else{setDashboard(null);setDashboardError("");}
 },[session,date,loadDashboard]);

 const can=(permission:string)=>Boolean(session?.permissions.includes(permission));
 const canManageShifts=can("manage_shift_schedule");
 const canReportGap=can("report_shift_gap");
 const canHandoff=can("confirm_shift_handoff");
 const canReportIncident=can("report_incident");
 const canManageIncident=can("manage_incident");

 const login=async(event:FormEvent)=>{
  event.preventDefault();setLoginBusy(true);setLoginError("");
  try{
   const response=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password}),cache:"no-store"});
   if(!response.ok){setLoginError(await readError(response,"No fue posible iniciar sesión"));return;}
   setPassword("");await loadSession(false);
  }catch{setLoginError("No fue posible conectar con autenticación");}
  finally{setLoginBusy(false);}
 };
 const logout=async()=>{
  setActionKey("logout");setNotice("");
  try{await fetch("/api/auth/logout",{method:"POST",cache:"no-store"});}finally{setDashboard(null);await loadSession(false);setActionKey("");}
 };

 const runCommand=async(key:string,url:string,payload:unknown,success:string)=>{
  setActionKey(key);setNotice("");
  try{
   const response=await postWithRefresh(url,payload);
   if(!response.ok){
    const message=await readError(response,"No se pudo aplicar el cambio");
    setNotice(message);
    if(response.status===409)await loadDashboard(date);
    return;
   }
   setNotice(success);await loadDashboard(date);
  }catch{setNotice("No se pudo conectar con el servicio operativo");}
  finally{setActionKey("");}
 };

 const reportGap=(shift:ShiftItem)=>runCommand(`gap-${shift.id}`,"/api/operations/shifts/report-gap",{assignmentId:shift.id,expectedRevision:shift.revision},"Vacante registrada y auditada.");
 const receiveHandoff=(shift:ShiftItem)=>runCommand(`handoff-${shift.id}`,"/api/operations/shifts/handoff",{assignmentId:shift.id,expectedRevision:shift.revision},"Recepción del turno registrada.");
 const requestReplacement=(shift:ShiftItem)=>runCommand(`request-${shift.id}`,"/api/operations/shifts/command",{assignmentId:shift.id,expectedRevision:shift.revision,nextStatus:"requested"},"Solicitud de reemplazo registrada.");
 const confirmReplacement=(shift:ShiftItem)=>{
  const staffId=assigneeDraft[shift.id];
  if(!staffId){setNotice("Selecciona una persona habilitada antes de confirmar el reemplazo.");return;}
  void runCommand(`confirm-${shift.id}`,"/api/operations/shifts/command",{assignmentId:shift.id,expectedRevision:shift.revision,nextStatus:"confirmed",assigneeStaffId:staffId},"Reemplazo confirmado.");
 };
 const reportIncident=async(event:FormEvent)=>{
  event.preventDefault();
  const ref=caseReference.trim();
  await runCommand("incident-new","/api/operations/incidents/report",{serviceDate:date,area:incidentArea,priority:incidentPriority,...(ref?{caseReference:ref}:{})},"Incidencia registrada.");
  setCaseReference("");
 };
 const transitionIncident=(incident:IncidentItem,nextState:IncidentState)=>runCommand(`incident-state-${incident.id}`,"/api/operations/incidents/command",{incidentId:incident.id,expectedRevision:incident.revision,nextState},`Incidencia actualizada a “${incidentLabels[nextState]}”.`);
 const changeIncidentPriority=(incident:IncidentItem)=>{
  const priority=incidentPriorityDraft[incident.id]||incident.priority;
  if(priority===incident.priority){setNotice("Selecciona una prioridad distinta antes de aplicar el cambio.");return;}
  void runCommand(`incident-priority-${incident.id}`,"/api/operations/incidents/command",{incidentId:incident.id,expectedRevision:incident.revision,priority},"Prioridad actualizada.");
 };
 const changeIncidentRole=(incident:IncidentItem)=>{
  const assignedRole=incidentRoleDraft[incident.id]??incident.assignedRole??"";
  if(assignedRole===(incident.assignedRole||"")){setNotice("Selecciona un rol distinto antes de aplicar el cambio.");return;}
  void runCommand(`incident-role-${incident.id}`,"/api/operations/incidents/command",{incidentId:incident.id,expectedRevision:incident.revision,assignedRole:assignedRole||null},"Responsable operativo actualizado.");
 };

 const stats=useMemo(()=>dashboard?[{label:"Turnos",value:dashboard.summary.shiftTotal},{label:"Vacantes",value:dashboard.summary.vacant},{label:"Reemplazos solicitados",value:dashboard.summary.requested},{label:"Confirmados",value:dashboard.summary.confirmed},{label:"Recibidos",value:dashboard.summary.received},{label:"Incidencias abiertas",value:dashboard.summary.openIncidents},{label:"Críticas",value:dashboard.summary.criticalIncidents}]:[],[dashboard]);

 if(sessionLoading)return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#06131f",color:"#dffcff",fontFamily:"system-ui,sans-serif"}}>Validando sesión privada…</main>;

 if(!session?.configured)return <main style={{minHeight:"100vh",background:"radial-gradient(ellipse at top right,#174a58,#06131f 62%)",color:"#efffff",padding:"clamp(18px,5vw,58px)",fontFamily:"system-ui,sans-serif"}}><div style={{maxWidth:760,margin:"auto"}}><a href="/panel-operativo" style={{color:"#78e4e0"}}>← Panel operativo demo</a><section style={{...panel,marginTop:28}}><p style={{color:"#77e6e1",letterSpacing:2,fontSize:12}}>ORBI LIVING · CONSOLA PRIVADA</p><h1 style={{fontSize:"clamp(34px,6vw,54px)",margin:"8px 0"}}>Backend no configurado<span style={{color:"#71e5df"}}>.</span></h1><p style={{color:"#b8d0db",lineHeight:1.7}}>Esta superficie solo se habilita cuando el Preview tiene las variables privadas de Supabase staging. La demo pública continúa separada.</p></section></div></main>;

 if(!session.authenticated)return <main style={{minHeight:"100vh",background:"radial-gradient(ellipse at top right,#174a58,#06131f 62%)",color:"#efffff",padding:"clamp(18px,5vw,58px)",fontFamily:"system-ui,sans-serif"}}><div style={{maxWidth:720,margin:"auto"}}><a href="/panel-operativo" style={{color:"#78e4e0"}}>← Volver al prototipo público</a><section style={{...panel,marginTop:28,padding:"clamp(22px,5vw,42px)"}}><p style={{color:"#77e6e1",letterSpacing:2,fontSize:12}}>ORBI LIVING · ACCESO OPERATIVO</p><h1 style={{fontSize:"clamp(34px,6vw,58px)",margin:"8px 0 12px"}}>Consola privada<span style={{color:"#71e5df"}}>.</span></h1><p style={{color:"#b7ced8",lineHeight:1.65,maxWidth:570}}>Ingreso para identidades habilitadas de staging. La sesión usa cookies HttpOnly; el navegador no recibe tokens de Supabase.</p><form onSubmit={login} style={{display:"grid",gap:14,marginTop:24}}><label style={{display:"grid",gap:6}}><span style={{color:"#9fbcca",fontSize:13}}>Correo</span><input type="email" autoComplete="username" value={email} onChange={event=>setEmail(event.target.value)} style={input} required maxLength={254}/></label><label style={{display:"grid",gap:6}}><span style={{color:"#9fbcca",fontSize:13}}>Contraseña</span><input type="password" autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)} style={input} required maxLength={512}/></label>{loginError&&<p role="alert" style={{margin:0,color:"#ffb5b5"}}>{loginError}</p>}<button disabled={loginBusy} style={{...button,opacity:loginBusy?.7:1}}>{loginBusy?"Validando…":"Ingresar a ORBI LIVING"}</button></form><p style={{color:"#829fad",fontSize:12,lineHeight:1.6,marginTop:20}}>Corte P1F: staging sintético únicamente. No ingresar datos reales de residentes, trabajadores, contactos, patentes ni narrativas privadas.</p></section></div></main>;

 if(!session.permissions.includes("view_shift_schedule"))return <main style={{minHeight:"100vh",background:"#06131f",color:"#efffff",padding:"clamp(18px,5vw,58px)",fontFamily:"system-ui,sans-serif"}}><div style={{maxWidth:760,margin:"auto"}}><section style={panel}><p style={{color:"#77e6e1",letterSpacing:2,fontSize:12}}>ORBI LIVING · ACCESO LIMITADO</p><h1>Sesión válida, sin permiso operativo.</h1><p style={{color:"#b7ced8"}}>Rol: {session.role?roleLabels[session.role]||session.role:"sin rol"}. La autorización se resolvió en servidor; ocultar la interfaz no reemplaza el control de permisos.</p><button onClick={logout} disabled={actionKey==="logout"} style={subtleButton}>Cerrar sesión</button></section></div></main>;

 return <main style={{minHeight:"100vh",background:"radial-gradient(ellipse at top right,#174a58,#06131f 62%)",color:"#efffff",padding:"clamp(14px,3vw,42px)",fontFamily:"system-ui,sans-serif"}}><div style={{maxWidth:1260,margin:"auto",minWidth:0}}>
  <nav style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}><a href="/" style={{color:"#78e4e0"}}>ORBI LIVING</a><a href="/panel-operativo" style={{color:"#9ccbd2"}}>Demo pública</a><span style={{marginLeft:"auto",color:"#a9c6d0",fontSize:13}}>{roleLabels[session.role||""]||session.role} · {session.communityId}</span><button onClick={logout} disabled={actionKey==="logout"} style={{...subtleButton,minHeight:36,padding:"6px 10px"}}>Salir</button></nav>
  <header style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:18,flexWrap:"wrap",margin:"28px 0 18px"}}><div><p style={{color:"#77e6e1",letterSpacing:2.5,fontSize:12,marginBottom:7}}>ORBI LIVING · P1F PRIVATE WORKSPACE</p><h1 style={{fontSize:"clamp(34px,5vw,58px)",margin:0}}>Operación en vivo<span style={{color:"#71e5df"}}>.</span></h1><p style={{color:"#adc8d3",maxWidth:720,lineHeight:1.55}}>Lecturas y comandos pasan por endpoints server-side con identidad, comunidad, RLS y revisión optimista. Esta rama sigue limitada a staging sintético.</p></div><label style={{display:"grid",gap:5,minWidth:180}}><span style={{fontSize:12,color:"#9ab8c7"}}>Fecha de cobertura</span><input type="date" value={date} onChange={event=>setDate(event.target.value)} style={input}/></label></header>
  <div style={{...panel,background:"#252d31",borderColor:"#85744f",padding:14,fontSize:13,lineHeight:1.55}}>SYNTHETIC STAGING ONLY · La recuperación P1E queda pendiente y producción con datos reales continúa bloqueada. Esta consola no publica tokens, IDs de personal en el cliente fuera del catálogo autorizado ni campos de contacto.</div>
  {notice&&<div role="status" style={{...panel,marginTop:14,padding:14,borderColor:notice.includes("No se pudo")||notice.includes("Selecciona")?"#8a5863":"#3f7b75",color:notice.includes("No se pudo")?"#ffc0c0":"#c9fff4"}}>{notice}</div>}
  {dashboardError&&<div role="alert" style={{...panel,marginTop:14,padding:14,borderColor:"#8a5863",color:"#ffc0c0"}}>{dashboardError}</div>}

  <section aria-label="Resumen operativo" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,145px),1fr))",gap:10,margin:"16px 0"}}>{stats.map(item=><article key={item.label} style={{...panel,padding:15}}><small style={{color:"#9fbac7"}}>{item.label}</small><div style={{fontSize:31,fontWeight:850,marginTop:5,color:(item.label==="Vacantes"||item.label==="Críticas")&&item.value?"#ffb5b5":"#79e3df"}}>{dashboardLoading?"—":item.value}</div></article>)}</section>

  <section style={{display:"grid",gridTemplateColumns:"minmax(0,1.25fr) minmax(300px,.75fr)",gap:16,alignItems:"start"}} className="orbi-private-grid">
   <div style={{display:"grid",gap:16}}>
    <section style={panel}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}><div><p style={{margin:0,color:"#77e6e1",fontSize:12,letterSpacing:1.5}}>COBERTURA · {date}</p><h2 style={{margin:"5px 0 0"}}>Turnos privados</h2></div><button onClick={()=>void loadDashboard(date)} disabled={dashboardLoading} style={subtleButton}>{dashboardLoading?"Actualizando…":"Actualizar"}</button></div>
     <div style={{display:"grid",gap:10,marginTop:16}}>{dashboard?.shifts.length?dashboard.shifts.map(shift=>{
      const mayGap=canReportGap&&["planned","requested","confirmed"].includes(shift.status);
      const mayReceive=canHandoff&&shift.status==="confirmed"&&shift.hasAssignee;
      const mayRequest=canManageShifts&&shift.status==="vacant";
      const mayConfirm=canManageShifts&&(shift.status==="vacant"||shift.status==="requested");
      return <article key={shift.id} style={{border:"1px solid #294d61",borderRadius:15,padding:14,background:"#0a2332"}}><div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><div><strong>{shift.slotCode}</strong><div style={{color:"#9ebbc8",fontSize:13,marginTop:4}}>{formatTime(shift.startsAt)}–{formatTime(shift.endsAt)} · rev. {shift.revision}</div></div><span style={{alignSelf:"start",borderRadius:999,padding:"6px 9px",background:shift.status==="vacant"?"#5b3139":shift.status==="received"?"#184d46":"#173b4c",color:shift.status==="vacant"?"#ffd0d0":"#d8ffff",fontSize:12,fontWeight:800}}>{shiftLabels[shift.status]}</span></div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}>{mayGap&&<button onClick={()=>void reportGap(shift)} disabled={Boolean(actionKey)} style={dangerButton}>Reportar vacante</button>}{mayRequest&&<button onClick={()=>void requestReplacement(shift)} disabled={Boolean(actionKey)} style={button}>Solicitar reemplazo</button>}{mayReceive&&<button onClick={()=>void receiveHandoff(shift)} disabled={Boolean(actionKey)} style={button}>Registrar relevo</button>}</div>{mayConfirm&&<div style={{display:"grid",gridTemplateColumns:"minmax(180px,1fr) auto",gap:8,marginTop:10}}><select value={assigneeDraft[shift.id]||""} onChange={event=>setAssigneeDraft(current=>({...current,[shift.id]:event.target.value}))} style={input}><option value="">Seleccionar cobertura habilitada…</option>{dashboard.staff.map(person=><option key={person.id} value={person.id}>{person.displayName} · {staffLabels[person.staffFunction]||person.staffFunction}</option>)}</select><button onClick={()=>confirmReplacement(shift)} disabled={Boolean(actionKey)} style={button}>Confirmar</button></div>}</article>;
     }):<p style={{color:"#91adba"}}>{dashboardLoading?"Consultando cobertura…":"No hay turnos registrados para la fecha seleccionada."}</p>}</div>
    </section>

    <section style={panel}><p style={{margin:0,color:"#77e6e1",fontSize:12,letterSpacing:1.5}}>INCIDENCIAS ABIERTAS</p><h2 style={{margin:"5px 0 14px"}}>Continuidad y escalamiento</h2><div style={{display:"grid",gap:10}}>{dashboard?.incidents.length?dashboard.incidents.map(incident=><article key={incident.id} style={{border:"1px solid #294d61",borderRadius:15,padding:14,background:"#0a2332"}}><div style={{display:"flex",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}><div><strong>{areaLabels[incident.area]||incident.area}</strong><div style={{fontSize:12,color:"#96b2c0",marginTop:4}}>{formatDate(incident.serviceDate)} · rev. {incident.revision} · {incident.assignedRole?roleLabels[incident.assignedRole]||incident.assignedRole:"sin rol asignado"}</div></div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}><span style={{borderRadius:999,padding:"5px 8px",fontSize:11,fontWeight:800,background:incident.priority==="critical"?"#60313b":"#183b4c",color:incident.priority==="critical"?"#ffd0d0":"#d9ffff"}}>{priorityLabels[incident.priority]}</span><span style={{borderRadius:999,padding:"5px 8px",fontSize:11,fontWeight:800,background:"#173b4c",color:"#d9ffff"}}>{incidentLabels[incident.state]}</span></div></div>{canManageIncident&&<><div style={{display:"flex",gap:7,flexWrap:"wrap",marginTop:11}}>{incidentTransitions[incident.state].map(next=><button key={next} onClick={()=>void transitionIncident(incident,next)} disabled={Boolean(actionKey)} style={subtleButton}>{incidentLabels[next]}</button>)}</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:8,marginTop:10}}><div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:6}}><select value={incidentPriorityDraft[incident.id]||incident.priority} onChange={event=>setIncidentPriorityDraft(current=>({...current,[incident.id]:event.target.value as IncidentPriority}))} style={input}>{(["low","medium","high","critical"] as IncidentPriority[]).map(priority=><option key={priority} value={priority}>{priorityLabels[priority]}</option>)}</select><button onClick={()=>changeIncidentPriority(incident)} disabled={Boolean(actionKey)} style={subtleButton}>Prioridad</button></div><div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:6}}><select value={incidentRoleDraft[incident.id]??incident.assignedRole??""} onChange={event=>setIncidentRoleDraft(current=>({...current,[incident.id]:event.target.value}))} style={input}><option value="">Sin rol</option><option value="administrator">Administración</option><option value="mayordomo">Mayordomía</option><option value="concierge">Conserjería</option><option value="committee">Comité</option></select><button onClick={()=>changeIncidentRole(incident)} disabled={Boolean(actionKey)} style={subtleButton}>Asignar</button></div></div></>}</article>):<p style={{color:"#91adba"}}>{dashboardLoading?"Consultando incidencias…":"No hay incidencias abiertas visibles para este rol."}</p>}</div></section>
   </div>

   <aside style={{display:"grid",gap:16}}>
    {canReportIncident&&<section style={panel}><p style={{margin:0,color:"#77e6e1",fontSize:12,letterSpacing:1.5}}>NUEVA INCIDENCIA</p><h2 style={{margin:"5px 0 14px"}}>Registro estructurado</h2><form onSubmit={reportIncident} style={{display:"grid",gap:11}}><label style={{display:"grid",gap:5}}><span style={{fontSize:12,color:"#9ab8c7"}}>Área</span><select value={incidentArea} onChange={event=>setIncidentArea(event.target.value)} style={input}>{Object.entries(areaLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label style={{display:"grid",gap:5}}><span style={{fontSize:12,color:"#9ab8c7"}}>Prioridad</span><select value={incidentPriority} onChange={event=>setIncidentPriority(event.target.value as IncidentPriority)} style={input}>{(["low","medium","high","critical"] as IncidentPriority[]).map(priority=><option key={priority} value={priority}>{priorityLabels[priority]}</option>)}</select></label><label style={{display:"grid",gap:5}}><span style={{fontSize:12,color:"#9ab8c7"}}>Referencia opcional</span><input value={caseReference} onChange={event=>setCaseReference(event.target.value)} pattern="[A-Za-z0-9._-]*" maxLength={80} placeholder="Ej: ASC-2026-001" style={input}/></label><button disabled={Boolean(actionKey)} style={button}>Registrar incidencia</button><small style={{color:"#819faa",lineHeight:1.55}}>Sin narrativa libre, teléfonos, RUT, patentes ni datos de residentes en este corte.</small></form></section>}
    <section style={panel}><p style={{margin:0,color:"#77e6e1",fontSize:12,letterSpacing:1.5}}>SEGURIDAD DEL CORTE</p><h2 style={{margin:"5px 0 10px"}}>Frontera P1F</h2><p style={{color:"#aec7d2",lineHeight:1.65,fontSize:14}}>La UI no habla directamente con tablas privadas. Todos los cambios pasan por comandos server-side, usan la identidad de la cookie HttpOnly y conservan RLS como segunda barrera.</p><div style={{display:"grid",gap:7,fontSize:13,color:"#91adba"}}><span>✓ comunidad resuelta en servidor</span><span>✓ revisión optimista por mutación</span><span>✓ eventos/auditoría generados en DB</span><span>✓ sin DELETE operativo</span><span>○ Auth E2E y recovery siguen pendientes</span></div></section>
   </aside>
  </section>
  <style jsx global>{`@media (max-width: 860px){.orbi-private-grid{grid-template-columns:1fr!important}} button:focus-visible,input:focus-visible,select:focus-visible,a:focus-visible{outline:3px solid #82eee8;outline-offset:2px} button:disabled{cursor:not-allowed;opacity:.55}`}</style>
 </div></main>;
}
