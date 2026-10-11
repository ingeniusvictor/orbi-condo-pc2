"use client";

import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";

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

export default function PrivateOperationsActivity(){
 const pathname=usePathname();
 const [items,setItems]=useState<ActivityItem[]|null>(null);
 const [role,setRole]=useState<string|null>(null);

 useEffect(()=>{
  if(pathname!=="/operaciones"){setItems(null);setRole(null);return;}
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
 },[pathname]);

 if(pathname!=="/operaciones"||items===null)return null;
 return <section aria-label="Bitácora operativa reciente" style={{background:"#06131f",color:"#efffff",fontFamily:"system-ui,sans-serif",padding:"0 clamp(14px,3vw,42px) clamp(34px,5vw,64px)"}}>
  <div style={{maxWidth:1260,margin:"0 auto",border:"1px solid #31576c",borderRadius:20,padding:"clamp(16px,3vw,22px)",background:"linear-gradient(160deg,rgba(15,43,60,.96),rgba(7,25,38,.96))",boxShadow:"0 20px 50px rgba(0,0,0,.18)"}}>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:12,flexWrap:"wrap"}}><div><p style={{margin:0,color:"#77e6e1",fontSize:12,letterSpacing:1.5}}>BITÁCORA PRIVADA</p><h2 style={{margin:"5px 0 0"}}>Actividad operativa reciente</h2></div><small style={{color:"#8eabb7"}}>Rol: {role||"operativo"} · actualización automática</small></div>
   {items.length?<div style={{display:"grid",gap:8,marginTop:14}}>{items.map(item=><article key={item.id} style={{display:"grid",gridTemplateColumns:"auto minmax(0,1fr) auto",alignItems:"center",gap:10,border:"1px solid #294d61",borderRadius:13,padding:"11px 12px",background:"#0a2332"}}><span style={{borderRadius:999,padding:"5px 8px",fontSize:10,fontWeight:850,letterSpacing:.5,background:item.kind==="shift"?"#173b4c":"#23433f",color:"#d9ffff"}}>{item.kind==="shift"?"TURNO":"INCIDENCIA"}</span><div style={{minWidth:0}}><strong style={{display:"block",fontSize:13,textTransform:"capitalize"}}>{item.eventType.replaceAll("_"," ")}</strong><span style={{display:"block",marginTop:2,color:"#9ebbc8",fontSize:12,overflowWrap:"anywhere"}}>{describe(item)}{item.reasonCode?` · ${item.reasonCode}`:""}</span></div><time dateTime={item.createdAt} style={{color:"#8faab6",fontSize:11,whiteSpace:"nowrap"}}>{formatWhen(item.createdAt)}</time></article>)}</div>:<p style={{color:"#91adba",margin:"14px 0 0"}}>Todavía no hay eventos operativos visibles para este rol.</p>}
  </div>
  <style jsx global>{`@media(max-width:620px){section[aria-label="Bitácora operativa reciente"] article{grid-template-columns:1fr!important} section[aria-label="Bitácora operativa reciente"] time{white-space:normal!important}}`}</style>
 </section>;
}
