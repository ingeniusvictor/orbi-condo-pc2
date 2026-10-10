"use client";
import { useEffect, useMemo, useState } from "react";
import { PC2_INSTITUTIONAL_BASELINE } from "../../data/pc2-institutional-baseline";
import { parseOverrides, shiftKey, shiftSlotsForDate } from "../../data/shift-calendar";

type IncidentLite={id:string;priority:string;state:string;serviceDate:string};
const SHIFT_STORAGE="orbi-living-anonymous-shift-demo-v1";
const INCIDENT_STORAGE="orbi-living-incident-demo-v1";
const panel:React.CSSProperties={background:"#10293a",border:"1px solid #34576a",borderRadius:18,padding:20};
function todayISO(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function safeIncidents(raw:string|null):IncidentLite[]{if(!raw)return[];try{const x=JSON.parse(raw);return Array.isArray(x)?x.filter(i=>i&&typeof i.id==="string"):[];}catch{return[];}}
export default function PanelOperativo(){
 const [date,setDate]=useState("2026-10-10");
 const [shiftRaw,setShiftRaw]=useState<string|null>(null);
 const [incidentRaw,setIncidentRaw]=useState<string|null>(null);
 const [ready,setReady]=useState(false);
 useEffect(()=>{setDate(todayISO());try{setShiftRaw(localStorage.getItem(SHIFT_STORAGE));setIncidentRaw(localStorage.getItem(INCIDENT_STORAGE));}catch{}setReady(true);},[]);
 const stats=useMemo(()=>{
  const overrides=parseOverrides(shiftRaw),slots=shiftSlotsForDate(date);
  let vacant=0,pendingReplacement=0,confirmed=0;
  for(const slot of slots){const x=overrides[shiftKey(date,slot.id)];if(x?.role===null||x?.status==="vacant")vacant++;if(x?.status==="requested")pendingReplacement++;if(x?.status==="confirmed"||x?.status==="received")confirmed++;}
  const incidents=safeIncidents(incidentRaw);const open=incidents.filter(i=>i.state!=="resolved"&&i.state!=="closed");
  return {slots:slots.length,vacant,pendingReplacement,confirmed,openIncidents:open.length,critical:open.filter(i=>i.priority==="critical").length};
 },[date,shiftRaw,incidentRaw]);
 const refresh=()=>{try{setShiftRaw(localStorage.getItem(SHIFT_STORAGE));setIncidentRaw(localStorage.getItem(INCIDENT_STORAGE));}catch{}};
 return <main style={{minHeight:"100vh",background:"radial-gradient(ellipse at top right,#174a58,#06131f 62%)",color:"#eefbff",padding:"clamp(16px,4vw,52px)",fontFamily:"system-ui,sans-serif"}}><div style={{maxWidth:1160,margin:"auto"}}>
 <nav style={{display:"flex",gap:14,flexWrap:"wrap"}}><a href="/" style={{color:"#7ce6e2"}}>← ORBI LIVING</a><a href="/calendario-turnos" style={{color:"#7ce6e2"}}>Turnos</a><a href="/emergencias-demo" style={{color:"#7ce6e2"}}>Incidencias</a><a href="/operaciones-demo" style={{color:"#7ce6e2"}}>Bitácora</a><a href="/administracion-demo" style={{color:"#7ce6e2"}}>Administración</a></nav>
 <header style={{display:"flex",justifyContent:"space-between",gap:20,alignItems:"start",flexWrap:"wrap",margin:"28px 0"}}><div><p style={{color:"#76e1de",letterSpacing:3,fontSize:12}}>ORBI LIVING · PC2</p><h1 style={{fontSize:"clamp(34px,5vw,56px)",margin:"8px 0"}}>Panel operativo<span style={{color:"#6fe3df"}}>.</span></h1><p style={{color:"#aac4d1"}}>Vista integrada del prototipo: cobertura de turnos, incidencias y referencias institucionales documentadas.</p></div><button onClick={refresh} style={{background:"#1d5360",color:"white",border:"1px solid #54818b",padding:"10px 14px",borderRadius:10,cursor:"pointer"}}>Actualizar datos locales</button></header>
 <p style={{...panel,background:"#292c2d",borderColor:"#8b7652",fontSize:14}}>PROTOTIPO LOCAL: este panel solo resume datos ficticios guardados en este navegador. No representa la operación real del condominio ni sustituye los sistemas oficiales.</p>
 <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,margin:"18px 0"}}>
 {[{label:"Turnos del día",value:stats.slots,note:date},{label:"Vacantes",value:stats.vacant,note:"Sin responsable efectivo"},{label:"Reemplazos pendientes",value:stats.pendingReplacement,note:"Solicitados, no confirmados"},{label:"Coberturas confirmadas",value:stats.confirmed,note:"Confirmadas o recibidas"},{label:"Incidencias abiertas",value:stats.openIncidents,note:"Demo local"},{label:"Críticas abiertas",value:stats.critical,note:"Requieren escalamiento manual"}].map(x=><article key={x.label} style={panel}><small style={{color:"#9db9c7"}}>{x.label}</small><div style={{fontSize:34,fontWeight:800,color:(x.label==="Vacantes"||x.label==="Críticas abiertas")&&x.value?"#ffaaaa":"#79e3df",margin:"7px 0"}}>{ready?x.value:"—"}</div><small style={{color:"#abc5d1"}}>{x.note}</small></article>)}
 </section>
 <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14}}>
  <article style={panel}><h2 style={{marginTop:0}}>Continuidad de conserjería</h2><p style={{color:"#b7ced8",lineHeight:1.6}}>El calendario permite marcar una vacante, solicitar una suplencia y diferenciar la confirmación de la recepción efectiva del turno.</p><a href="/calendario-turnos" style={{color:"#78e4e0",fontWeight:700}}>Abrir calendario de cobertura →</a></article>
  <article style={panel}><h2 style={{marginTop:0}}>Incidencias y urgencias</h2><p style={{color:"#b7ced8",lineHeight:1.6}}>El flujo de prueba registra prioridad, estado y rol responsable sin contactos personales ni automatizaciones de emergencia.</p><a href="/emergencias-demo" style={{color:"#78e4e0",fontWeight:700}}>Abrir centro de incidencias →</a></article>
  <article style={panel}><h2 style={{marginTop:0}}>Bitácora y relevo</h2><p style={{color:"#b7ced8",lineHeight:1.6}}>Las novedades pendientes pueden prepararse para la entrega al turno siguiente y, en producción, quedar auditadas.</p><a href="/operaciones-demo" style={{color:"#78e4e0",fontWeight:700}}>Abrir bitácora demo →</a></article>
  <article style={panel}><h2 style={{marginTop:0}}>Administración documental</h2><p style={{color:"#b7ced8",lineHeight:1.6}}>Resume únicamente hechos institucionales derivados de los documentos recibidos y mantiene separadas las validaciones pendientes.</p><a href="/administracion-demo" style={{color:"#78e4e0",fontWeight:700}}>Abrir centro administrativo →</a></article>
 </section>
 <section style={{...panel,marginTop:18}}><h2 style={{marginTop:0}}>Base institucional documentada</h2><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12}}>
  <div><small style={{color:"#98b7c5"}}>Unidades habitacionales</small><p style={{fontSize:25,fontWeight:800,margin:"5px 0"}}>{PC2_INSTITUTIONAL_BASELINE.residentialUnits.value}</p><small style={{color:"#9db9c7"}}>Contrato 2024 · inventario vigente por verificar</small></div>
  <div><small style={{color:"#98b7c5"}}>Subadministraciones</small><p style={{fontSize:25,fontWeight:800,margin:"5px 0"}}>{PC2_INSTITUTIONAL_BASELINE.subAdministrations.value}</p><small style={{color:"#9db9c7"}}>Delimitación operativa pendiente</small></div>
  <div><small style={{color:"#98b7c5"}}>Atención de urgencias</small><p style={{fontSize:25,fontWeight:800,margin:"5px 0"}}>{PC2_INSTITUTIONAL_BASELINE.emergencyAttention.value}</p><small style={{color:"#9db9c7"}}>Obligación contractual de administración</small></div>
 </div></section>
 <p style={{color:"#8cacbc",fontSize:12,marginTop:20}}>No se muestran nombres, RUT, teléfonos, contratos individuales ni datos de residentes. La producción deberá usar almacenamiento privado, autorización por rol y bitácora inmutable.</p>
 </div></main>;
}
