"use client";
import { useMemo, useState } from "react";
type Slot={id:string;name:string;time:string;kind:"fixed"|"support";validation:"reported"|"inferred_unverified"};
const slots:Slot[]=[
 {id:"morning",name:"Mañana",time:"07:00–14:30",kind:"fixed",validation:"reported"},
 {id:"afternoon",name:"Tarde",time:"14:30–22:00",kind:"fixed",validation:"reported"},
 {id:"night",name:"Noche",time:"22:00–07:00 (+1 día)",kind:"fixed",validation:"reported"},
 {id:"supportDay",name:"Part-time diurno",time:"08:00–20:00 (domingos/feriados)",kind:"support",validation:"reported"},
 {id:"supportNight",name:"Cobertura nocturna especial · por validar",time:"20:00–08:00 (+1 día, franja complementaria)",kind:"support",validation:"inferred_unverified"}
];
const days=["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const names=["Vacante","Conserje fijo 1","Conserje fijo 2","Conserje fijo 3","Part-time 1","Part-time 2","Suplente 1","Suplente 2"];
type Change={day:number;slot:string;person:string;reason:string};
const card:React.CSSProperties={background:"#10283b",border:"1px solid #315368",borderRadius:18,padding:18};
export default function TurnosDemo(){
 const [day,setDay]=useState(0);const [changes,setChanges]=useState<Record<string,Change>>({});const [reason,setReason]=useState("Reemplazo");
 const key=(d:number,id:string)=>d+":"+id;
 const schedule=useMemo(()=>slots.map(s=>({
  ...s,
  base:s.id==="supportDay"?names[4]:s.id==="supportNight"?"Pendiente de validación":s.id==="morning"?names[1]:s.id==="afternoon"?names[2]:names[3],
  override:changes[key(day,s.id)]
 })),[day,changes]);
 const total=Object.keys(changes).length;
 return <main style={{minHeight:"100vh",background:"radial-gradient(ellipse at top right,#174056,#071320 60%)",color:"#effaff",padding:"clamp(16px,4vw,56px)",fontFamily:"system-ui,sans-serif"}}>
 <div style={{maxWidth:1140,margin:"auto",minWidth:0}}>
 <nav style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}><a href="/operaciones-demo" style={{color:"#77e8e5"}}>← ORBI Operaciones</a><a href="/calendario-turnos" style={{color:"#77e8e5"}}>Abrir calendario por fecha →</a></nav>
 <header style={{marginTop:30,display:"flex",justifyContent:"space-between",alignItems:"start",gap:16,flexWrap:"wrap"}}><div><p style={{letterSpacing:3,color:"#70dfdd",fontSize:12}}>ORBI LIVING · PERSONAL</p><h1 style={{fontSize:"clamp(32px,5vw,56px)",margin:"8px 0"}}>Centro de turnos<span style={{color:"#70dfdd"}}>.</span></h1><p style={{color:"#a8c0ce"}}>Calendario editable de asignaciones y reemplazos · Parque Ciudadano II</p></div><span style={{border:"1px solid #397782",padding:"10px 14px",borderRadius:30,color:"#7ae6e1",fontSize:12}}>DEMO CON DATOS FICTICIOS</span></header>
 <p role="note" style={{...card,borderColor:"#987d4e",background:"#2a2a29",fontSize:14}}>La distribución de personas es ilustrativa, no una nómina real. Los horarios de mañana, tarde, noche y la franja part-time 08:00–20:00 corresponden a información reportada y aún deben validarse formalmente. La franja complementaria 20:00–08:00 se muestra solo para mantener visible la pregunta de cobertura: no se presume que Part-time 2 ni otra persona la cubra. No ingreses nombres ni datos reales en esta demostración pública.</p>
 <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,200px),1fr))",gap:12,margin:"20px 0"}}>
 {([{label:"Turnos fijos reportados",value:"3",note:"Mañana · tarde · noche"},{label:"Franja especial reportada",value:"1",note:"08:00–20:00 · domingos/feriados"},{label:"Franja por validar",value:"1",note:"20:00–08:00 · sin asignado presumido"},{label:"Cambios simulados",value:String(total),note:"No persistentes"}]).map(x=><article key={x.label} style={card}><small style={{color:"#9bb9c8"}}>{x.label}</small><div style={{fontSize:34,fontWeight:800,color:"#76e5e2",margin:"8px 0"}}>{x.value}</div><small style={{color:"#a9c3d1"}}>{x.note}</small></article>)}
 </section>
 <section style={card}><h2 style={{marginTop:0}}>Planificación semanal</h2><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(72px,1fr))",gap:6,marginBottom:18}}>{days.map((d,i)=><button key={d} aria-pressed={day===i} aria-label={`Seleccionar ${d}`} onClick={()=>setDay(i)} style={{minHeight:44,padding:"10px 6px",borderRadius:10,border:day===i?"2px solid #76e5e2":"1px solid #38596b",background:day===i?"#205867":"#142f41",color:"white",fontSize:12,cursor:"pointer"}}>{d.slice(0,3)}</button>)}</div>
 <p style={{color:"#b6ccd8",fontSize:13}}>Selecciona un puesto genérico para editar la asignación de ese día. Puedes dejarlo vacante o elegir una suplente; la asignación habitual permanece intacta. En la franja nocturna especial, “Pendiente de validación” no equivale a vacante confirmada.</p>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,230px),1fr))",gap:12}}>
 {schedule.filter(s=>day===6?s.kind==="support":s.kind==="fixed").map(s=>{const effective=s.override?.person??s.base;const unresolved=s.validation==="inferred_unverified"&&!s.override;return <article key={s.id} style={{minWidth:0,background:"#162f44",border:unresolved?"1px solid #9b7d47":s.override?"1px solid #f3c479":"1px solid #3a5c70",borderRadius:14,padding:16}}>
 <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",flexWrap:"wrap"}}><strong>{s.name}</strong><span style={{color:unresolved?"#ffd18a":effective==="Vacante"?"#ff9e9e":s.override?"#f4c77b":"#8edbd9",fontSize:11}}>{unresolved?"POR VALIDAR":s.override?(effective==="Vacante"?"VACANTE":"EDITADO"):"HABITUAL / DEMO"}</span></div>
 <p style={{color:"#afc7d5",fontSize:13,overflowWrap:"anywhere"}}>{s.time}</p>
 <small style={{color:"#9db8c8"}}>Referencia: {s.base}</small><p style={{fontWeight:700,margin:"10px 0",overflowWrap:"anywhere"}}>Asignado: {effective}</p>
 {unresolved&&<p style={{fontSize:12,lineHeight:1.5,color:"#ffe0a6",background:"#3c3426",padding:9,borderRadius:8}}>No existe una asignación habitual confirmada para esta franja. Cualquier selección aquí es solo una simulación.</p>}
 <label style={{display:"block",fontSize:12}}>Cambiar responsable<select aria-label={"Asignación de "+s.name} value={s.override?.person??""} onChange={e=>setChanges(prev=>{const next={...prev};if(!e.target.value)delete next[key(day,s.id)];else next[key(day,s.id)]={day,slot:s.id,person:e.target.value,reason};return next})} style={{width:"100%",padding:10,marginTop:6,borderRadius:8,background:"#0b1b2b",color:"white",border:"1px solid #52748a"}}><option value="">{unresolved?"Mantener pendiente de validación":"Asignación habitual"}</option>{names.map(n=><option key={n} value={n}>{n}</option>)}</select></label>
 </article>})}
 </div>
 <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap",alignItems:"end",marginTop:20}}><label style={{fontSize:13,flex:"1 1 220px",maxWidth:360}}>Motivo ilustrativo<select value={reason} onChange={e=>setReason(e.target.value)} style={{display:"block",width:"100%",padding:10,marginTop:6,borderRadius:8,background:"#0b1b2b",color:"white",border:"1px solid #52748a"}}>{["Reemplazo","Permiso","Vacaciones","Cambio de turno","Otro"].map(v=><option key={v}>{v}</option>)}</select></label><button onClick={()=>setChanges({})} style={{minHeight:44,padding:"11px 16px",background:"#214b59",border:"1px solid #55818b",borderRadius:9,color:"white",cursor:"pointer"}}>Restablecer simulación</button></div>
 </section>
 <p style={{color:"#93b2c2",fontSize:13,marginTop:20}}>Esta sección sirve para planificar cobertura, no para registrar asistencia ni remuneraciones. La versión privada deberá guardar historial, permisos y confirmaciones de cambios.</p>
 </div></main>;
}
