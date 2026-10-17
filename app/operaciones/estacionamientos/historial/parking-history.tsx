"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import type {FormEvent} from "react";
import styles from "./history.module.css";

type SessionState={configured:boolean;authenticated:boolean;permissions:string[]};
type HistoryEntry={id:string;relationship:"owner"|"tenant"|"authorized_user"|"loaned";displayName:string;unitCode:string|null;vehicleReference:string|null;validFrom:string;validUntil:string|null;active:boolean;createdAt:string;updatedAt:string};
type HistoryResponse={syntheticOnly:boolean;asset:{id:string;code:string;level:"exterior"|"subterranean";parkingClass:"resident"|"visit"|"commercial";zoneCode:string|null;status:string;linkedUnitCode:string|null};history:HistoryEntry[]};

const relationLabel:Record<HistoryEntry["relationship"],string>={owner:"Propietario",tenant:"Arrendatario",authorized_user:"Autorizado",loaned:"Cedido"};
const levelLabel={exterior:"Exterior",subterranean:"Subterráneo"} as const;
const classLabel={resident:"Residente",visit:"Visita",commercial:"Comercio"} as const;

async function readError(response:Response,fallback:string){try{const body=await response.json() as {error?:string};return body.error||fallback;}catch{return fallback;}}
async function getWithRefresh(url:string){let response=await fetch(url,{cache:"no-store"});if(response.status===401||response.status===403){const refresh=await fetch("/api/auth/refresh",{method:"POST",cache:"no-store"});if(refresh.ok)response=await fetch(url,{cache:"no-store"});}return response;}

export default function ParkingHistory(){
 const [session,setSession]=useState<SessionState|null>(null);
 const [query,setQuery]=useState("126");
 const [data,setData]=useState<HistoryResponse|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");

 useEffect(()=>{void (async()=>{try{const response=await getWithRefresh("/api/auth/session");setSession(await response.json() as SessionState);}catch{setSession({configured:false,authenticated:false,permissions:[]});}})();},[]);

 const search=async(event?:FormEvent)=>{
  event?.preventDefault();const value=query.trim();if(!value)return;
  setLoading(true);setError("");
  try{const response=await getWithRefresh(`/api/operations/parking/history?q=${encodeURIComponent(value)}`);if(!response.ok){setData(null);setError(await readError(response,"No se pudo consultar el historial"));return;}setData(await response.json() as HistoryResponse);}catch{setData(null);setError("No se pudo conectar con el historial privado");}finally{setLoading(false);}
 };

 if(!session)return <main className={styles.page}><div className={styles.shell}>Validando sesión…</div></main>;
 if(!session.configured||!session.authenticated||!session.permissions.includes("manage_parking"))return <main className={styles.page}><div className={styles.shell}><div className={styles.top}><div><Link href="/operaciones/estacionamientos">← Volver a Estacionamientos</Link><h1>Historial de estacionamientos</h1><p>Esta vista está reservada para Administración.</p></div></div></div></main>;

 return <main className={styles.page}><div className={styles.shell}>
  <header className={styles.top}><div><Link href="/operaciones/estacionamientos">← Volver a Estacionamientos</Link><h1>Historial de relaciones</h1><p>Consulta cambios de propietario, arrendatario y vehículo sin perder trazabilidad.</p></div><div className={styles.badge}>SYNTHETIC STAGING ONLY</div></header>
  <form className={styles.search} onSubmit={search}><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Ej: E12, 126, V01" maxLength={40}/><button disabled={loading}>{loading?"Consultando…":"Consultar historial"}</button></form>
  {error&&<div className={styles.error}>{error}</div>}
  {data&&<>
   <section className={styles.asset} aria-label="Ficha del estacionamiento"><div><small>Puesto</small><b>{data.asset.code}</b></div><div><small>Nivel</small><b>{levelLabel[data.asset.level]}</b></div><div><small>Tipo</small><b>{classLabel[data.asset.parkingClass]}</b></div><div><small>Unidad vigente</small><b>{data.asset.linkedUnitCode||"Sin vínculo"}</b></div></section>
   <section className={styles.timeline} aria-label="Historial de relaciones">
    {data.history.length===0?<div className={styles.empty}>Este puesto todavía no tiene relaciones registradas.</div>:data.history.map(entry=><article key={entry.id} className={`${styles.entry} ${entry.active?styles.active:""}`}>
     <div><strong>{relationLabel[entry.relationship]}</strong><span>{entry.displayName}</span>{entry.unitCode&&<span>{entry.unitCode}</span>}</div>
     <div><strong>{entry.vehicleReference||"Sin vehículo"}</strong><span>Vigencia: {entry.validFrom}{entry.validUntil?` → ${entry.validUntil}`:" → actual"}</span></div>
     <div><span className={`${styles.status} ${entry.active?styles.current:""}`}>{entry.active?"Vigente":"Histórico"}</span><time dateTime={entry.updatedAt}>{new Date(entry.updatedAt).toLocaleString("es-CL")}</time></div>
    </article>)}
   </section>
  </>}
  <p className={styles.note}>Administración puede consultar esta trazabilidad; Conserjería y Mayordomía continúan viendo sólo la relación operativa vigente desde el buscador principal.</p>
 </div></main>;
}
