"use client";
import {useEffect,useMemo,useState} from "react";
import {NATIONAL_HOLIDAYS_2026,ROLE_LABELS,isISODate,isSpecialDate,shiftKey,shiftSlotsForDate,parseOverrides,type ShiftOverrideMap,type ShiftRole,type ShiftStatus} from "../../data/shift-calendar";
const storageKey="orbi-living-anonymous-shift-demo-v1";
const inputStyle:React.CSSProperties={width:"100%",background:"#0a1c2b",border:"1px solid #45677a",borderRadius:10,color:"#eafcff",padding:"11px 12px",fontSize:14};
const panel:React.CSSProperties={background:"#102a3b",border:"1px solid #34586c",borderRadius:18,padding:20};
const statusLabels:Record<ShiftStatus,string>={planned:"Programado",vacant:"Vacante",requested:"Reemplazo solicitado",confirmed:"Reemplazo confirmado",received:"Turno recibido"};
const statusColors:Record<ShiftStatus,string>={planned:"#8be2e4",vacant:"#ff9e9e",requested:"#ffd18a",confirmed:"#91e3b4",received:"#8bd8fa"};
function localDateISO(date:Date){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-");}
function moveDate(date:string,delta:number){const [y,m,d]=date.split("-").map(Number);const next=new Date(Date.UTC(y,m-1,d+delta));return next.toISOString().slice(0,10);}
export default function CalendarTurnos(){
 const [date,setDate]=useState("2026-10-12");
 const [overrides,setOverrides]=useState<ShiftOverrideMap>({});
 const [ready,setReady]=useState(false);
 const [showHelp,setShowHelp]=useState(false);
 useEffect(()=>{setDate(localDateISO(new Date()));try{setOverrides(parseOverrides(window.localStorage.getItem(storageKey)));}catch{}setReady(true);},[]);
 useEffect(()=>{if(ready)try{window.localStorage.setItem(storageKey,JSON.stringify(overrides));}catch{}},[overrides,ready]);
 const slots=useMemo(()=>isISODate(date)?shiftSlotsForDate(date):[],[date]);
 const special=isSpecialDate(date),holiday=NATIONAL_HOLIDAYS_2026[date];
 const effectiveRole=(slotId:string,defaultRole:ShiftRole):ShiftRole|null=>{const x=overrides[shiftKey(date,slotId)];return x?x.role:defaultRole;};
 const duplicateRoles=useMemo(()=>{
  const counts=new Map<ShiftRole,number>();
  for(const slot of slots){const role=effectiveRole(slot.id,slot.defaultRole);if(role)counts.set(role,(counts.get(role)??0)+1);}
  return new Set([...counts.entries()].filter(([,count])=>count>1).map(([role])=>role));
 },[date,overrides,slots]);
 const setField=(slotId:string,patch:Partial<{role:ShiftRole|null;status:ShiftStatus;note:string}>)=>{
  const key=shiftKey(date,slotId);
  const base=overrides[key]??{role:slots.find(s=>s.id===slotId)?.defaultRole??null,status:"planned" as ShiftStatus,note:"",updatedAt:""};
  const next={...base,...patch,updatedAt:new Date().toISOString()};
  if(next.status==="vacant")next.role=null;
  if(next.role===null&&next.status!=="vacant")next.status="vacant";
  setOverrides(prev=>({...prev,[key]:next}));
 };
 const count=slots.filter(s=>(overrides[shiftKey(date,s.id)]?.status==="vacant"||overrides[shiftKey(date,s.id)]?.role===null)).length;
 const requestCount=slots.filter(s=>overrides[shiftKey(date,s.id)]?.status==="requested").length;
 return <main style={{minHeight:"100vh",background:"radial-gradient(ellipse at top right,#16495a,#061321 65%)",color:"#eafcff",fontFamily:"system-ui,sans-serif",padding:"clamp(16px,4vw,50px)"}}>
 <div style={{maxWidth:1120,margin:"auto"}}>
 <nav style={{display:"flex",gap:14,flexWrap:"wrap"}}><a href="/turnos-planificador" style={{color:"#80e9e5"}}>← Planificador semanal</a><a href="/panel-operativo" style={{color:"#80e9e5"}}>Panel operativo</a><a href="/emergencias-demo" style={{color:"#80e9e5"}}>Incidencias</a></nav>
 <header style={{display:"flex",justifyContent:"space-between",gap:18,alignItems:"start",flexWrap:"wrap",margin:"25px 0"}}><div><p style={{letterSpacing:3,color:"#79dfe2",fontSize:12}}>ORBI LIVING · COBERTURA OPERATIVA</p><h1 style={{fontSize:"clamp(32px,5vw,52px)",margin:"6px 0"}}>Calendario de turnos<span style={{color:"#6de4df"}}>.</span></h1><p style={{color:"#a7c2d1"}}>Asignaciones, vacantes y suplencias por fecha · Parque Ciudadano II</p></div><span style={{padding:"9px 13px",border:"1px solid #467986",borderRadius:25,color:"#8ae5e2",fontSize:12}}>PROTOTIPO LOCAL · SIN DATOS PERSONALES</span></header>
 <p style={{...panel,background:"#262c30",borderColor:"#8c7754",fontSize:14}}>Demo sin autenticación: utiliza solo puestos genéricos. Los cambios se guardan en este navegador, no en un servidor y no se comparten con otros usuarios. No ingresar nombres, teléfonos ni información privada. El turno nocturno especial 20:00–08:00 se infiere de la cobertura de 24 h y está pendiente de validación.</p>
 <section style={{...panel,marginTop:18}}>
 <div style={{display:"flex",alignItems:"end",flexWrap:"wrap",gap:12}}>
 <button disabled={date<="2026-01-01"} onClick={()=>setDate(moveDate(date,-1))} style={{...inputStyle,width:"auto",cursor:"pointer"}} aria-label="Día anterior">←</button>
 <label style={{flex:"1 1 220px",fontSize:13,color:"#b9d4df"}}>Fecha de servicio<input type="date" value={date} min="2026-01-01" max="2026-12-31" onChange={e=>{if(isISODate(e.target.value))setDate(e.target.value);}} style={{...inputStyle,marginTop:7}}/></label>
 <button disabled={date>="2026-12-31"} onClick={()=>setDate(moveDate(date,1))} style={{...inputStyle,width:"auto",cursor:"pointer"}} aria-label="Día siguiente">→</button>
 <button onClick={()=>setDate(localDateISO(new Date()))} style={{...inputStyle,width:"auto",cursor:"pointer"}}>Hoy</button>
 </div>
 <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:16}}>
 <span style={{background:special?"#29495b":"#173b42",padding:"7px 12px",borderRadius:25,color:"#c4f5ee",fontSize:12}}>{holiday?"Feriado · "+holiday:special?"Domingo · cobertura especial":"Jornada habitual"}</span>
 <span style={{background:count?"#63353b":"#1a4147",padding:"7px 12px",borderRadius:25,fontSize:12}}>{count} vacantes</span>
 <span style={{background:requestCount?"#625038":"#1a4147",padding:"7px 12px",borderRadius:25,fontSize:12}}>{requestCount} reemplazos pendientes</span>
 {duplicateRoles.size>0&&<span style={{background:"#633f3a",padding:"7px 12px",borderRadius:25,fontSize:12}}>{duplicateRoles.size} asignación duplicada · revisar</span>}
 </div>
 </section>
 <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14,marginTop:18}}>
 {slots.map(s=>{const key=shiftKey(date,s.id),override=overrides[key],role=override?override.role:s.defaultRole,status=override?.status??"planned",duplicate=Boolean(role&&duplicateRoles.has(role));return <article key={key} style={{...panel,borderColor:status==="vacant"?"#bc6269":duplicate?"#b8795a":status==="requested"?"#ac8b4e":"#34586c"}}>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}><strong style={{fontSize:19}}>{s.label}</strong><span style={{fontSize:11,color:statusColors[status],fontWeight:700}}>{statusLabels[status].toUpperCase()}</span></div>
 <p style={{fontSize:23,fontWeight:750,margin:"12px 0"}}>{s.start}–{s.end}{s.nextDay?" +1 día":""}</p>
 <p style={{fontSize:12,color:"#a7c3d0"}}>Asignación habitual: {ROLE_LABELS[s.defaultRole]}</p>
 {duplicate&&<p role="status" style={{fontSize:12,color:"#ffc19e",background:"#3b2926",padding:9,borderRadius:8}}>Este mismo puesto genérico figura en más de un turno de la fecha. Puede ser intencional, pero conviene revisar la cobertura.</p>}
 <label style={{display:"block",fontSize:13,marginTop:18}}>Asignación efectiva<select style={{...inputStyle,marginTop:7}} value={role??""} onChange={e=>setField(s.id,{role:e.target.value?e.target.value as ShiftRole:null,status:e.target.value?"planned":"vacant"})}><option value="">Vacante · sin responsable</option>{Object.entries(ROLE_LABELS).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
 <label style={{display:"block",fontSize:13,marginTop:13}}>Estado<select style={{...inputStyle,marginTop:7}} value={status} onChange={e=>setField(s.id,{status:e.target.value as ShiftStatus})}><option value="planned">Programado</option><option value="vacant">Vacante</option><option value="requested">Reemplazo solicitado</option><option value="confirmed">Reemplazo confirmado</option><option value="received">Turno recibido</option></select></label>
 <label style={{display:"block",fontSize:13,marginTop:13}}>Nota operativa genérica (opcional)<input maxLength={140} placeholder="Ej.: suplencia pendiente" value={override?.note??""} onChange={e=>setField(s.id,{note:e.target.value})} style={{...inputStyle,marginTop:7}}/></label>
 <button onClick={()=>setOverrides(prev=>{const next={...prev};delete next[key];return next;})} style={{...inputStyle,cursor:"pointer",marginTop:14,background:"#214657"}}>Restablecer turno habitual</button>
 </article>})}
 </section>
 <section style={{...panel,marginTop:18}}>
 <button onClick={()=>setShowHelp(v=>!v)} aria-expanded={showHelp} style={{...inputStyle,cursor:"pointer",textAlign:"left"}}>{showHelp?"Ocultar":"Ver"} protocolo de reemplazo urgente</button>
 {showHelp&&<div style={{color:"#c6dce5",fontSize:14,lineHeight:1.7}}><p>1. Marcar Vacante cuando se informe ausencia.</p><p>2. Contactar por los canales existentes a mayordomía o administración.</p><p>3. Seleccionar Suplente 1 o 2 y marcar Reemplazo solicitado.</p><p>4. Marcar Reemplazo confirmado solo cuando exista aceptación.</p><p>5. Marcar Turno recibido solo después de comprobar la recepción efectiva.</p><p>La app no realiza llamadas, verifica presencia ni envía alertas automáticas en esta demo.</p></div>}
 </section>
 <p style={{color:"#8daebf",fontSize:12,marginTop:20}}>Cobertura operativa únicamente; no controla asistencia laboral, remuneraciones ni horas extraordinarias. Los feriados cargados corresponden a Chile 2026; feriados extraordinarios o locales deben validarse aparte.</p>
 </div></main>;
