"use client";

import Link from "next/link";
import {useEffect,useState} from "react";

type SessionState={configured:boolean;authenticated:boolean;role:string|null};
type ActivityItem={
 id:string;
 kind:"shift"|"incident";
 eventType:string;
 fromValue:string|null;
 toValue:string|null;
 secondaryFrom:string|null;
 secondaryTo:string|null;
 reasonCode:string|null;
 createdAt:string;
};
type DashboardPayload={recentActivity?:ActivityItem[]};

const shiftLabels:Record<string,string>={planned:"Planificado",vacant:"Vacante",requested:"Reemplazo solicitado",confirmed:"Confirmado",received:"Recibido"};
const incidentLabels:Record<string,string>={reported:"Reportada",acknowledged:"Reconocida",assigned:"Asignada",in_progress:"En gestión",resolved:"Resuelta",closed:"Cerrada"};
const priorityLabels:Record<string,string>={low:"Baja",medium:"Media",high:"Alta",critical:"Crítica"};

function santiagoDate(){
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Santiago",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
 const get=(type:string)=>parts.find(part=>part.type===type)?.value||"";
 return `${get("year")}-${get("month")}-${get("day")}`;
}

function formatWhen(value:string){
 try{return new Intl.DateTimeFormat("es-CL",{timeZone:"America/Santiago",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(value));}
 catch{return "—";}
}

function describe(item:ActivityItem){
 if(item.kind==="shift"){
  const from=item.fromValue?shiftLabels[item.fromValue]||item.fromValue:null;
  const to=item.toValue?shiftLabels[item.toValue]||item.toValue:null;
  if(from&&to)return `${from} → ${to}`;
  if(to)return to;
  return item.eventType.replaceAll("_"," ");
 }
 const from=item.fromValue?incidentLabels[item.fromValue]||item.fromValue:null;
 const to=item.toValue?incidentLabels[item.toValue]||item.toValue:null;
 if(from&&to)return `${from} → ${to}`;
 if(item.secondaryFrom||item.secondaryTo){
  const pFrom=item.secondaryFrom?priorityLabels[item.secondaryFrom]||item.secondaryFrom:null;
  const pTo=item.secondaryTo?priorityLabels[item.secondaryTo]||item.secondaryTo:null;
  return pFrom&&pTo?`Prioridad ${pFrom} → ${pTo}`:`Prioridad ${pTo||pFrom}`;
 }
 return item.eventType.replaceAll("_"," ");
}

export default function CompactActivityDrawer(){
 const [open,setOpen]=useState(false);
 const [items,setItems]=useState<ActivityItem[]|null>(null);
 const [role,setRole]=useState<string|null>(null);

 useEffect(()=>{
  let alive=true;
  const load=async()=>{
   try{
    const sessionResponse=await fetch("/api/auth/session",{cache:"no-store"});
    const session=await sessionResponse.json() as SessionState;
    if(!alive||!session.configured||!session.authenticated){setItems(null);return;}
    setRole(session.role);
    const response=await fetch(`/api/operations/dashboard?date=${encodeURIComponent(santiagoDate())}`,{cache:"no-store"});
    if(!response.ok){if(alive)setItems([]);return;}
    const payload=await response.json() as DashboardPayload;
    if(alive)setItems((payload.recentActivity||[]).slice(0,12));
   }catch{if(alive)setItems([]);}
  };
  void load();
  const timer=window.setInterval(()=>void load(),30_000);
  return ()=>{alive=false;window.clearInterval(timer);};
 },[]);

 if(items===null)return null;

 return <aside aria-label="Actividad operativa reciente compacta" style={{position:"fixed",right:12,bottom:"max(86px,calc(70px + env(safe-area-inset-bottom)))",zIndex:70,fontFamily:"system-ui,sans-serif",color:"#efffff",width:open?"min(430px,calc(100vw - 24px))":"auto"}}>
  {!open?<button type="button" onClick={()=>setOpen(true)} aria-expanded="false" style={{minHeight:46,border:"1px solid #2f7387",borderRadius:14,padding:"10px 14px",background:"linear-gradient(135deg,#0b5368,#092c40)",color:"#eaffff",fontWeight:850,boxShadow:"0 16px 42px rgba(0,0,0,.38)",cursor:"pointer"}}>☷ Actividad reciente</button>:
  <section style={{maxHeight:"min(72vh,680px)",overflowY:"auto",border:"1px solid #315f73",borderRadius:18,padding:14,background:"linear-gradient(160deg,rgba(9,38,54,.98),rgba(5,23,35,.98))",boxShadow:"0 24px 70px rgba(0,0,0,.48)",backdropFilter:"blur(18px)"}}>
   <header style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,position:"sticky",top:-14,margin:"-14px -14px 10px",padding:14,background:"rgba(6,28,41,.96)",borderBottom:"1px solid rgba(103,214,220,.12)",zIndex:2}}>
    <div><p style={{margin:0,color:"#6fe5df",fontSize:10,letterSpacing:1.4,fontWeight:850}}>BITÁCORA PRIVADA</p><h2 style={{margin:"3px 0 0",fontSize:17}}>Actividad reciente</h2><small style={{color:"#86a9b8"}}>Rol: {role||"operativo"} · actualización automática</small></div>
    <button type="button" onClick={()=>setOpen(false)} aria-label="Cerrar actividad reciente" aria-expanded="true" style={{width:40,height:40,border:"1px solid #315c70",borderRadius:10,background:"#0b2b3d",color:"#dffcff",fontSize:18,cursor:"pointer"}}>×</button>
   </header>
   {items.length?<div style={{display:"grid",gap:7}}>{items.map(item=><article key={item.id} style={{display:"grid",gridTemplateColumns:"auto minmax(0,1fr)",gap:9,alignItems:"start",border:"1px solid #294f63",borderRadius:12,padding:10,background:"#082535"}}><span style={{borderRadius:999,padding:"5px 7px",fontSize:9,fontWeight:850,background:item.kind==="shift"?"#173f52":"#244941",color:"#d9ffff"}}>{item.kind==="shift"?"TURNO":"INCIDENCIA"}</span><div style={{minWidth:0}}><strong style={{display:"block",fontSize:12,textTransform:"capitalize"}}>{item.eventType.replaceAll("_"," ")}</strong><span style={{display:"block",marginTop:2,color:"#a0bdc7",fontSize:11,overflowWrap:"anywhere"}}>{describe(item)}{item.reasonCode?` · ${item.reasonCode}`:""}</span><time dateTime={item.createdAt} style={{display:"block",marginTop:3,color:"#7699a8",fontSize:10}}>{formatWhen(item.createdAt)}</time></div></article>)}</div>:<p style={{color:"#90afbb",fontSize:12}}>Todavía no hay eventos operativos visibles para este rol.</p>}
   <Link href="/conserjeria" style={{display:"flex",justifyContent:"center",alignItems:"center",minHeight:42,marginTop:10,border:"1px solid rgba(95,232,223,.28)",borderRadius:10,background:"rgba(20,111,111,.18)",color:"#d9fffc",textDecoration:"none",fontSize:12,fontWeight:850}}>Abrir Conserjería</Link>
  </section>}
 </aside>;
}
