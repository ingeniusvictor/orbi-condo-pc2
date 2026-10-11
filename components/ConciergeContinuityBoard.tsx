"use client";

import {useCallback,useEffect,useState} from "react";

type ShiftStatus="planned"|"vacant"|"requested"|"confirmed"|"received";
type IncidentPriority="low"|"medium"|"high"|"critical";
type Shift={id:string;slotCode:string;status:ShiftStatus;hasAssignee:boolean;revision:number};
type Incident={id:string;area:string;priority:IncidentPriority;state:string;assignedRole:string|null;revision:number};
type Tone="blocked"|"critical"|"attention"|"clear";
type ContinuityItem={id:string;kind:"blocker"|"coverage"|"incident"|"handoff"|"round";title:string;detail:string;tone:"danger"|"warning"|"info"};
type ContinuityPayload={
 date:string;
 generatedAt:string;
 status:{tone:Tone;label:string;detail:string};
 metrics:{technicalBlockers:number;coveragePending:number;vacant:number;requested:number;priorityIncidents:number;criticalIncidents:number;highIncidents:number;handoffsWithFollowup:number};
 items:ContinuityItem[];
 sources:{shifts:number;incidents:number;logs:number;rounds:number;checks:number};
};
type Props={date:string;shifts:Shift[];incidents:Incident[];permissions:string[]};

export default function ConciergeContinuityBoard({date,permissions}:Props){
 const canViewLogs=permissions.includes("view_shift_log");
 const canViewRounds=permissions.includes("view_operational_round");
 const canViewShifts=permissions.includes("view_shift_schedule");
 const [snapshot,setSnapshot]=useState<ContinuityPayload|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState<string|null>(null);

 const load=useCallback(async()=>{
  if(!canViewLogs||!canViewRounds||!canViewShifts){setSnapshot(null);return;}
  setLoading(true);setError(null);
  const path=`/api/operations/continuity?date=${encodeURIComponent(date)}`;
  const read=()=>fetch(path,{cache:"no-store"});
  try{
   let response=await read();
   if(response.status===401||response.status===403){
    const refresh=await fetch("/api/auth/refresh",{method:"POST",cache:"no-store"});
    if(refresh.ok)response=await read();
   }
   const payload=await response.json().catch(()=>({error:"Error inesperado"})) as ContinuityPayload&{error?:string};
   if(!response.ok)throw new Error(payload.error||"No se pudo consolidar la continuidad operativa.");
   setSnapshot(payload);
  }catch(err){setSnapshot(null);setError(err instanceof Error?err.message:"No se pudo cargar la continuidad operativa.");}
  finally{setLoading(false);}
 },[canViewLogs,canViewRounds,canViewShifts,date]);

 useEffect(()=>{void load()},[load]);

 if(!canViewLogs||!canViewRounds||!canViewShifts)return null;
 const status=snapshot?.status??{tone:"clear" as Tone,label:"Sin snapshot",detail:"Actualiza para consultar la continuidad operativa autorizada."};
 const metrics=snapshot?.metrics??{technicalBlockers:0,coveragePending:0,vacant:0,requested:0,priorityIncidents:0,criticalIncidents:0,highIncidents:0,handoffsWithFollowup:0};
 const items=snapshot?.items??[];
 return <section className="continuity-board" aria-label="Continuidad operativa del turno">
  <div className="continuity-heading">
   <div><span className="eyebrow">CONTINUIDAD OPERATIVA</span><h2>Qué debe sobrevivir al cambio de turno</h2><p>Snapshot derivado en servidor bajo RLS. El navegador no recompone reglas ni crea una segunda fuente de verdad.</p></div>
   <button type="button" onClick={()=>void load()} disabled={loading}>{loading?"Actualizando…":"Actualizar"}</button>
  </div>
  {error&&<div className="continuity-error" role="status">{error}</div>}
  <div className={`continuity-status ${status.tone}`}><div><span>Estado derivado</span><strong>{status.label}</strong><p>{status.detail}</p></div><b>{items.length}</b></div>
  <div className="continuity-metrics">
   <article><span>Bloqueos de cierre</span><strong>{metrics.technicalBlockers}</strong><small>rondas todavía abiertas</small></article>
   <article><span>Cobertura pendiente</span><strong>{metrics.coveragePending}</strong><small>{metrics.vacant} vacante(s) · {metrics.requested} solicitada(s)</small></article>
   <article><span>Incidencias prioritarias</span><strong>{metrics.priorityIncidents}</strong><small>{metrics.criticalIncidents} crítica(s) · {metrics.highIncidents} alta(s)</small></article>
   <article><span>Entregas con seguimiento</span><strong>{metrics.handoffsWithFollowup}</strong><small>cierres con pendiente o escalamiento</small></article>
  </div>
  <div className="continuity-list">
   {items.length?items.slice(0,12).map(item=><article key={item.id} className={`continuity-item ${item.tone}`}><span className="continuity-marker"/><div><strong>{item.title}</strong><p>{item.detail}</p></div><b>{item.kind==="blocker"?"Bloqueo":item.kind==="coverage"?"Cobertura":item.kind==="incident"?"Incidencia":item.kind==="handoff"?"Relevo":"Ronda"}</b></article>):<div className="continuity-clear"><strong>Jornada sin señales de continuidad pendientes</strong><p>La ausencia de señales aquí no reemplaza el checklist de cierre ni la revisión humana del turno.</p></div>}
  </div>
  <footer><span>Solo lectura · RLS vigente · derivación server-side</span>{snapshot?.generatedAt&&<span>Generado {new Intl.DateTimeFormat("es-CL",{timeZone:"America/Santiago",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(snapshot.generatedAt))}</span>}</footer>
 </section>;
}
