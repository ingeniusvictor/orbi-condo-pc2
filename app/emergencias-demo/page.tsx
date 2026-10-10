"use client";
import { useEffect, useMemo, useState } from "react";
import {
  sanitizeDemoSummary,
  type EscalationRole,
  type IncidentArea,
  type IncidentOperationalState,
  type IncidentPriority,
} from "../../data/incident-escalation";

type DemoIncident = {
  id: string;
  serviceDate: string;
  area: IncidentArea;
  priority: IncidentPriority;
  state: IncidentOperationalState;
  assignedRole: EscalationRole | null;
  summary: string;
  openedAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "orbi-living-incident-demo-v1";
const areas: Record<IncidentArea,string> = {
  access:"Acceso", common_area:"Área común", water:"Agua", electricity:"Electricidad",
  elevator:"Ascensor", security:"Seguridad", medical:"Médica", fire:"Incendio", other:"Otro"
};
const priorities: Record<IncidentPriority,string> = { low:"Baja", medium:"Media", high:"Alta", critical:"Crítica" };
const states: Record<IncidentOperationalState,string> = {
  reported:"Reportado", acknowledged:"Reconocido", assigned:"Asignado", in_progress:"En gestión", resolved:"Resuelto", closed:"Cerrado"
};
const roles: Record<EscalationRole,string> = {
  concierge:"Conserjería", mayordomo:"Mayordomía", administrator:"Administración", committee:"Comité", external_service:"Servicio externo"
};
const panel: React.CSSProperties = { background:"#10283b", border:"1px solid #34566a", borderRadius:18, padding:20 };
const field: React.CSSProperties = { width:"100%", padding:11, borderRadius:9, border:"1px solid #52748a", background:"#091a29", color:"white", boxSizing:"border-box", marginTop:6 };

function todayISO(){
  const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function safeParse(raw:string|null):DemoIncident[]{
  if(!raw) return [];
  try{
    const data=JSON.parse(raw); if(!Array.isArray(data)) return [];
    return data.filter((x):x is DemoIncident => Boolean(x && typeof x.id==="string" && typeof x.summary==="string" && typeof x.state==="string"));
  }catch{return [];}
}

export default function EmergenciasDemo(){
  const [incidents,setIncidents]=useState<DemoIncident[]>([]);
  const [ready,setReady]=useState(false);
  const [summary,setSummary]=useState("");
  const [area,setArea]=useState<IncidentArea>("common_area");
  const [priority,setPriority]=useState<IncidentPriority>("medium");
  const [role,setRole]=useState<EscalationRole|null>("concierge");

  useEffect(()=>{ try{setIncidents(safeParse(localStorage.getItem(STORAGE_KEY)));}catch{} setReady(true); },[]);
  useEffect(()=>{ if(ready) try{localStorage.setItem(STORAGE_KEY,JSON.stringify(incidents));}catch{} },[incidents,ready]);
  const openCount=useMemo(()=>incidents.filter(i=>i.state!=="resolved"&&i.state!=="closed").length,[incidents]);
  const criticalCount=useMemo(()=>incidents.filter(i=>i.priority==="critical"&&i.state!=="resolved"&&i.state!=="closed").length,[incidents]);

  function addIncident(e:React.FormEvent){
    e.preventDefault(); const clean=sanitizeDemoSummary(summary); if(!clean) return;
    const now=new Date().toISOString();
    setIncidents(all=>[{id:`demo-${Date.now()}`,serviceDate:todayISO(),area,priority,state:"reported",assignedRole:role,summary:clean,openedAt:now,updatedAt:now},...all]);
    setSummary("");
  }
  function patch(id:string,patch:Partial<DemoIncident>){setIncidents(all=>all.map(i=>i.id===id?{...i,...patch,updatedAt:new Date().toISOString()}:i));}

  return <main style={{minHeight:"100vh",background:"radial-gradient(ellipse at top right,#173f50,#07131f 62%)",color:"#edfaff",padding:"clamp(16px,4vw,52px)",fontFamily:"system-ui,sans-serif"}}>
    <div style={{maxWidth:1120,margin:"auto"}}>
      <nav style={{display:"flex",gap:14,flexWrap:"wrap"}}><a href="/operaciones-demo" style={{color:"#78e5e1"}}>← Operaciones</a><a href="/calendario-turnos" style={{color:"#78e5e1"}}>Turnos</a><a href="/panel-operativo" style={{color:"#78e5e1"}}>Panel operativo</a></nav>
      <header style={{margin:"28px 0 20px"}}><p style={{color:"#74dfdc",letterSpacing:3,fontSize:12}}>ORBI LIVING · CONTINUIDAD OPERATIVA</p><h1 style={{fontSize:"clamp(34px,5vw,55px)",margin:"8px 0"}}>Centro de incidencias<span style={{color:"#6ee2de"}}>.</span></h1><p style={{color:"#aac4d1"}}>Prototipo para registrar, asignar y dar seguimiento a incidencias operativas sin información personal.</p></header>
      <p role="alert" style={{...panel,background:"#2c2929",borderColor:"#8f7059",fontSize:14}}>DEMO PÚBLICA: no ingreses nombres, teléfonos, departamentos, patentes ni detalles reales. En una emergencia real, la app no sustituye llamadas ni protocolos de emergencia existentes.</p>
      <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,margin:"18px 0"}}>
        {[{label:"Abiertas",value:openCount,note:"Requieren seguimiento"},{label:"Críticas abiertas",value:criticalCount,note:"Escalamiento manual inmediato"},{label:"Total demo",value:incidents.length,note:"Guardado local en este navegador"}].map(x=><article key={x.label} style={panel}><small style={{color:"#9db9c7"}}>{x.label}</small><div style={{fontSize:34,fontWeight:800,color:x.label.includes("Críticas")&&x.value?"#ffadad":"#79e4e1",margin:"7px 0"}}>{x.value}</div><small style={{color:"#adc6d2"}}>{x.note}</small></article>)}
      </section>
      <section style={{display:"grid",gridTemplateColumns:"minmax(280px,.8fr) minmax(320px,1.2fr)",gap:16,alignItems:"start"}}>
        <form onSubmit={addIncident} style={panel}><h2 style={{marginTop:0}}>Nueva incidencia ficticia</h2>
          <label style={{display:"block",fontSize:13,marginTop:12}}>Área<select value={area} onChange={e=>setArea(e.target.value as IncidentArea)} style={field}>{Object.entries(areas).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>
          <label style={{display:"block",fontSize:13,marginTop:12}}>Prioridad<select value={priority} onChange={e=>setPriority(e.target.value as IncidentPriority)} style={field}>{Object.entries(priorities).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>
          <label style={{display:"block",fontSize:13,marginTop:12}}>Responsable operativo<select value={role??""} onChange={e=>setRole(e.target.value?e.target.value as EscalationRole:null)} style={field}><option value="">Sin asignar</option>{Object.entries(roles).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>
          <label style={{display:"block",fontSize:13,marginTop:12}}>Descripción genérica<textarea required maxLength={180} value={summary} onChange={e=>setSummary(e.target.value)} placeholder="Ej.: filtración ficticia en área común" rows={4} style={field}/></label>
          <button type="submit" style={{...field,background:"#65deda",color:"#08222b",fontWeight:800,cursor:"pointer",marginTop:16}}>Registrar en la demo</button>
        </form>
        <div style={{display:"grid",gap:12}}>{incidents.length===0?<section style={panel}><h2>Sin incidencias demo</h2><p style={{color:"#a8c2cf"}}>Crea una incidencia ficticia para probar el flujo de seguimiento.</p></section>:incidents.map(i=><article key={i.id} style={{...panel,borderColor:i.priority==="critical"?"#a75b61":"#34566a"}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}><strong>{areas[i.area]} · {priorities[i.priority]}</strong><span style={{fontSize:12,color:i.state==="resolved"||i.state==="closed"?"#8fe0b0":"#ffd08b"}}>{states[i.state].toUpperCase()}</span></div>
          <p style={{lineHeight:1.5}}>{i.summary}</p><small style={{color:"#9cb9c8"}}>Responsable: {i.assignedRole?roles[i.assignedRole]:"Sin asignar"} · Fecha: {i.serviceDate}</small>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:8,marginTop:14}}>
            <select aria-label="Estado" value={i.state} onChange={e=>patch(i.id,{state:e.target.value as IncidentOperationalState})} style={field}>{Object.entries(states).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select>
            <select aria-label="Responsable" value={i.assignedRole??""} onChange={e=>patch(i.id,{assignedRole:e.target.value?e.target.value as EscalationRole:null})} style={field}><option value="">Sin asignar</option>{Object.entries(roles).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select>
          </div>
        </article>)}</div>
      </section>
      {incidents.length>0&&<button onClick={()=>setIncidents([])} style={{...field,width:"auto",marginTop:18,cursor:"pointer",background:"#213f50"}}>Limpiar datos de demostración</button>}
      <p style={{color:"#8eafbf",fontSize:12,marginTop:20}}>La versión productiva requerirá autenticación, permisos, auditoría y datos privados del lado servidor. Este prototipo no confirma que una persona haya sido contactada ni que una emergencia haya sido atendida.</p>
    </div>
  </main>;
}
