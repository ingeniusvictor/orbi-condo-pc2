"use client";

import Link from "next/link";
import {useCallback,useEffect,useMemo,useState} from "react";
import type {FormEvent} from "react";
import styles from "./parking-workspace.module.css";

type SessionState={configured:boolean;authenticated:boolean;communityId:string|null;role:string|null;permissions:string[]};
type ParkingStatus="available"|"assigned"|"leased"|"loaned"|"review";
type ParkingBasic={id:string;code:string;level:"exterior"|"subterranean";parkingClass:"resident"|"visit"|"commercial";zoneCode:string|null;status:ParkingStatus;sortOrder:number;revision:number;hasOwner:boolean;hasTenant:boolean};
type PartyDetail={id:string;displayName:string;unitCode:string|null};
type ParkingDetail=ParkingBasic&{linkedUnitCode:string|null;owner:PartyDetail|null;tenant:PartyDetail|null;vehicleReference:string|null};
type ParkingResponse={communityId:string;role:string;syntheticOnly:boolean;summary:{total:number;exterior:number;subterranean:number;resident:number;visit:number;commercial:number;leased:number;assigned:number;review:number};assets:ParkingBasic[];matches:ParkingDetail[]};

type EditDraft={ownerLabel:string;tenantLabel:string;linkedUnitCode:string;vehicleReference:string;markReview:boolean};

const roleLabels:Record<string,string>={administrator:"Administración",committee:"Comité",concierge:"Conserjería",mayordomo:"Mayordomía",resident:"Residente"};
const statusLabels:Record<ParkingStatus,string>={available:"Sin relación",assigned:"Propietario",leased:"Arrendado",loaned:"Cedido",review:"Revisión"};
const classLabels={resident:"Residente",visit:"Visita",commercial:"Comercio"} as const;
const levelLabels={exterior:"Exterior",subterranean:"Subterráneo"} as const;
const range=(from:number,to:number)=>Array.from({length:Math.abs(to-from)+1},(_,index)=>from<=to?from+index:from-index);
const exterior={west:range(14,1).map(n=>`E${n}`),upperSmall:range(18,15).map(n=>`E${n}`),upper:range(19,36).map(n=>`E${n}`),inner:range(52,37).map(n=>`E${n}`),east:range(53,72).map(n=>`E${n}`)};
const underground={west:range(73,84).map(String),southWest:range(85,90).map(String),south:range(91,101).map(String),east:range(126,102).map(String),northInner:range(127,142).map(String),north:range(160,143).map(String),northWest:range(161,166).map(String),centerTop:range(175,178).map(String),centerBottom:range(174,171).map(String),centerEast:range(168,170).map(String),ramp:range(182,179).map(String)};

async function readError(response:Response,fallback:string){try{const body=await response.json() as {error?:string};return body.error||fallback;}catch{return fallback;}}
async function getWithRefresh(url:string){let response=await fetch(url,{cache:"no-store"});if(response.status===401||response.status===403){const refresh=await fetch("/api/auth/refresh",{method:"POST",cache:"no-store"});if(refresh.ok)response=await fetch(url,{cache:"no-store"});}return response;}
async function postWithRefresh(url:string,payload:unknown){const run=()=>fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),cache:"no-store"});let response=await run();if(response.status===401||response.status===403){const refresh=await fetch("/api/auth/refresh",{method:"POST",cache:"no-store"});if(refresh.ok)response=await run();}return response;}

function ParkingSlot({code,asset,selected,onSelect}:{code:string;asset?:ParkingBasic;selected:boolean;onSelect:(code:string)=>void}){
 const state=asset?.status||"available";
 return <button type="button" className={`${styles.slot} ${styles[`status_${state}`]} ${selected?styles.slotSelected:""}`} onClick={()=>onSelect(code)} title={`${code} · ${asset?statusLabels[asset.status]:"Sin datos"}`}><span>{code}</span>{asset?.hasTenant?<i>A</i>:asset?.hasOwner?<i>P</i>:null}</button>;
}

function Strip({codes,assets,selected,onSelect,vertical=false,className=""}:{codes:string[];assets:Map<string,ParkingBasic>;selected:string|null;onSelect:(code:string)=>void;vertical?:boolean;className?:string}){
 return <div className={`${styles.strip} ${vertical?styles.vertical:""} ${className}`}>{codes.map(code=><ParkingSlot key={code} code={code} asset={assets.get(code)} selected={selected===code} onSelect={onSelect}/>)}</div>;
}

export default function ParkingWorkspace(){
 const [session,setSession]=useState<SessionState|null>(null);
 const [loadingSession,setLoadingSession]=useState(true);
 const [inventory,setInventory]=useState<ParkingResponse|null>(null);
 const [loadingInventory,setLoadingInventory]=useState(false);
 const [error,setError]=useState("");
 const [query,setQuery]=useState("");
 const [matches,setMatches]=useState<ParkingDetail[]>([]);
 const [selected,setSelected]=useState<ParkingDetail|null>(null);
 const [searching,setSearching]=useState(false);
 const [notice,setNotice]=useState("");
 const [editing,setEditing]=useState(false);
 const [saving,setSaving]=useState(false);
 const [draft,setDraft]=useState<EditDraft>({ownerLabel:"",tenantLabel:"",linkedUnitCode:"",vehicleReference:"",markReview:false});

 const loadSession=useCallback(async()=>{
  setLoadingSession(true);
  try{const response=await getWithRefresh("/api/auth/session");setSession(await response.json() as SessionState);}catch{setSession({configured:false,authenticated:false,communityId:null,role:null,permissions:[]});}finally{setLoadingSession(false);}
 },[]);
 const loadInventory=useCallback(async()=>{
  setLoadingInventory(true);setError("");
  try{const response=await getWithRefresh("/api/operations/parking");if(!response.ok){setError(await readError(response,"No se pudo cargar el registro"));return;}setInventory(await response.json() as ParkingResponse);}catch{setError("No se pudo conectar con el registro privado de estacionamientos");}finally{setLoadingInventory(false);}
 },[]);
 const runSearch=useCallback(async(raw:string)=>{
  const value=raw.trim();setQuery(raw);setNotice("");
  if(!value){setMatches([]);setSelected(null);return;}
  setSearching(true);setError("");
  try{const response=await getWithRefresh(`/api/operations/parking?q=${encodeURIComponent(value)}`);if(!response.ok){setError(await readError(response,"No se pudo buscar el estacionamiento"));return;}const data=await response.json() as ParkingResponse;setMatches(data.matches);const exact=data.matches.find(item=>item.code.toUpperCase()===value.toUpperCase()||(/^[0-9]+$/.test(value)&&((Number(value)<=72&&item.code===`E${Number(value)}`)||item.code===String(Number(value)))));setSelected(exact||data.matches[0]||null);}catch{setError("No se pudo completar la búsqueda");}finally{setSearching(false);}
 },[]);

 useEffect(()=>{void loadSession();},[loadSession]);
 useEffect(()=>{if(session?.authenticated&&session.permissions.includes("lookup_parking"))void loadInventory();},[session,loadInventory]);
 useEffect(()=>{if(selected)setDraft({ownerLabel:selected.owner?.displayName||"",tenantLabel:selected.tenant?.displayName||"",linkedUnitCode:selected.linkedUnitCode||"",vehicleReference:selected.vehicleReference||"",markReview:selected.status==="review"});},[selected]);

 const assetMap=useMemo(()=>new Map((inventory?.assets||[]).map(asset=>[asset.code,asset])),[inventory]);
 const canManage=Boolean(session?.permissions.includes("manage_parking"));
 const chooseCode=(code:string)=>{setEditing(false);void runSearch(code);};
 const submitSearch=(event:FormEvent)=>{event.preventDefault();setEditing(false);void runSearch(query);};
 const save=async(event:FormEvent)=>{
  event.preventDefault();if(!selected)return;setSaving(true);setNotice("");setError("");
  try{const response=await postWithRefresh("/api/operations/parking/command",{assetId:selected.id,expectedRevision:selected.revision,...draft});if(!response.ok){setError(await readError(response,"No se pudo guardar el cambio"));return;}setNotice(`Puesto ${selected.code} actualizado y auditado.`);setEditing(false);await loadInventory();await runSearch(selected.code);}catch{setError("No se pudo conectar con el comando de estacionamientos");}finally{setSaving(false);}
 };

 if(loadingSession)return <main className={styles.statePage}>Validando sesión privada…</main>;
 if(!session?.configured)return <main className={styles.statePage}><section><b>ORBI LIVING</b><h1>Backend privado no configurado.</h1><p>El módulo requiere el Supabase de staging configurado.</p><Link href="/operaciones">← Volver a Operaciones</Link></section></main>;
 if(!session.authenticated)return <main className={styles.statePage}><section><b>ORBI LIVING</b><h1>Inicia sesión para consultar estacionamientos.</h1><p>La autenticación se realiza desde la consola privada.</p><Link href="/operaciones">Ir a Operaciones →</Link></section></main>;
 if(!session.permissions.includes("lookup_parking"))return <main className={styles.statePage}><section><b>ACCESO LIMITADO</b><h1>Tu rol no puede consultar este registro.</h1><Link href="/operaciones">← Volver</Link></section></main>;

 return <main className={styles.workspace}>
  <header className={styles.topbar}><div><Link href="/operaciones" className={styles.back}>← Operaciones</Link><p>ORBI LIVING · {roleLabels[session.role||""]||session.role}</p><h1>Estacionamientos <span>y ocupación</span></h1></div><div className={styles.staging}>SYNTHETIC STAGING ONLY<strong>186 puestos físicos</strong></div></header>

  <section className={styles.searchPanel} aria-label="Buscador rápido de estacionamientos"><div><small>BÚSQUEDA OPERATIVA</small><h2>Encuentra el puesto en segundos.</h2><p>Busca por puesto, unidad DEMO, alias SINT-* o vehículo DEMO-*.</p></div><form onSubmit={submitSearch} className={styles.searchForm}><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Ej: 126, E12, SINT-PROPIETARIO-01, DEMO-AB12" maxLength={80} autoFocus/><button disabled={searching}>{searching?"Buscando…":"Buscar"}</button></form></section>

  {error&&<div role="alert" className={styles.error}>{error}</div>}{notice&&<div role="status" className={styles.notice}>{notice}</div>}

  <section className={styles.stats} aria-label="Resumen del inventario"><article><b>{inventory?.summary.total??"—"}</b><span>Total físico</span></article><article><b>{inventory?.summary.exterior??"—"}</b><span>Exterior</span></article><article><b>{inventory?.summary.subterranean??"—"}</b><span>Subterráneo</span></article><article><b>{inventory?.summary.leased??"—"}</b><span>Arrendados demo</span></article><article><b>{inventory?.summary.review??"—"}</b><span>En revisión</span></article></section>

  <div className={styles.layout}>
   <section className={styles.maps} aria-label="Mapas interactivos de estacionamientos">
    <article className={styles.mapCard}><div className={styles.cardHead}><div><small>76 PUESTOS</small><h2>Exterior</h2></div><span>E1–E72 · V01/V02 · LC01/LC02</span></div>
     <div className={styles.exteriorMap}>
      <div className={`${styles.tower} ${styles.towerC}`}>TORRE C</div><div className={`${styles.tower} ${styles.towerD}`}>TORRE D</div><div className={`${styles.tower} ${styles.towerB}`}>TORRE B</div><div className={`${styles.tower} ${styles.towerA}`}>TORRE A</div>
      <Strip codes={exterior.upperSmall} assets={assetMap} selected={selected?.code||null} onSelect={chooseCode} vertical className={styles.extSmall}/>
      <Strip codes={exterior.upper} assets={assetMap} selected={selected?.code||null} onSelect={chooseCode} className={styles.extUpper}/>
      <Strip codes={exterior.inner} assets={assetMap} selected={selected?.code||null} onSelect={chooseCode} className={styles.extInner}/>
      <Strip codes={exterior.west} assets={assetMap} selected={selected?.code||null} onSelect={chooseCode} vertical className={styles.extWest}/>
      <Strip codes={exterior.east} assets={assetMap} selected={selected?.code||null} onSelect={chooseCode} vertical className={styles.extEast}/>
      <div className={styles.extSpecialWest}><ParkingSlot code="LC01" asset={assetMap.get("LC01")} selected={selected?.code==="LC01"} onSelect={chooseCode}/></div>
      <div className={styles.extSpecialEast}><ParkingSlot code="V02" asset={assetMap.get("V02")} selected={selected?.code==="V02"} onSelect={chooseCode}/><ParkingSlot code="V01" asset={assetMap.get("V01")} selected={selected?.code==="V01"} onSelect={chooseCode}/><ParkingSlot code="LC02" asset={assetMap.get("LC02")} selected={selected?.code==="LC02"} onSelect={chooseCode}/></div>
      <div className={styles.driveLabel}>CIRCULACIÓN VEHICULAR<br/><span>↑ ↓</span></div>
     </div>
    </article>

    <article className={styles.mapCard}><div className={styles.cardHead}><div><small>110 PUESTOS</small><h2>Subterráneo</h2></div><span>73–182</span></div>
     <div className={styles.undergroundMap}>
      <div className={`${styles.tower} ${styles.subTowerC}`}>PROYECCIÓN C</div><div className={`${styles.tower} ${styles.subTowerD}`}>PROYECCIÓN D</div><div className={`${styles.tower} ${styles.subTowerB}`}>PROYECCIÓN B</div><div className={`${styles.tower} ${styles.subTowerA}`}>PROYECCIÓN A</div>
      <Strip codes={underground.north} assets={assetMap} selected={selected?.code||null} onSelect={chooseCode} className={styles.subNorth}/>
      <Strip codes={underground.northWest} assets={assetMap} selected={selected?.code||null} onSelect={chooseCode} vertical className={styles.subNorthWest}/>
      <Strip codes={underground.northInner} assets={assetMap} selected={selected?.code||null} onSelect={chooseCode} className={styles.subNorthInner}/>
      <Strip codes={underground.west} assets={assetMap} selected={selected?.code||null} onSelect={chooseCode} vertical className={styles.subWest}/>
      <Strip codes={underground.southWest} assets={assetMap} selected={selected?.code||null} onSelect={chooseCode} className={styles.subSouthWest}/>
      <Strip codes={underground.south} assets={assetMap} selected={selected?.code||null} onSelect={chooseCode} vertical className={styles.subSouth}/>
      <Strip codes={underground.east} assets={assetMap} selected={selected?.code||null} onSelect={chooseCode} vertical className={styles.subEast}/>
      <div className={styles.subRamp}><span>RAMPA VEHICULAR</span><Strip codes={underground.ramp} assets={assetMap} selected={selected?.code||null} onSelect={chooseCode}/><ParkingSlot code="167" asset={assetMap.get("167")} selected={selected?.code==="167"} onSelect={chooseCode}/></div>
      <div className={styles.subCenter}><Strip codes={underground.centerTop} assets={assetMap} selected={selected?.code||null} onSelect={chooseCode}/><div className={styles.centerRow}><Strip codes={underground.centerBottom} assets={assetMap} selected={selected?.code||null} onSelect={chooseCode}/><Strip codes={underground.centerEast} assets={assetMap} selected={selected?.code||null} onSelect={chooseCode} vertical/></div></div>
      <div className={styles.electrical}>SALA ELÉCTRICA</div>
     </div>
    </article>
   </section>

   <aside className={styles.detailPanel} aria-live="polite">
    <div className={styles.cardHead}><div><small>FICHA RÁPIDA</small><h2>{selected?`Puesto ${selected.code}`:"Selecciona un puesto"}</h2></div>{selected&&<span className={`${styles.pill} ${styles[`pill_${selected.status}`]}`}>{statusLabels[selected.status]}</span>}</div>
    {!selected&&<div className={styles.placeholder}><b>⌖</b><p>Haz clic en un puesto del mapa o utiliza el buscador.</p><small>Conserjería y Mayordomía consultan. Administración puede editar.</small></div>}
    {selected&&<>
     <dl className={styles.detailGrid}><div><dt>Nivel</dt><dd>{levelLabels[selected.level]}</dd></div><div><dt>Tipo</dt><dd>{classLabels[selected.parkingClass]}</dd></div><div><dt>Sector</dt><dd>{selected.zoneCode||"—"}</dd></div><div><dt>Unidad</dt><dd>{selected.linkedUnitCode||"Sin vínculo"}</dd></div><div className={styles.full}><dt>Propietario</dt><dd>{selected.owner?.displayName||"Sin propietario registrado"}</dd></div><div className={styles.full}><dt>Arrendatario</dt><dd>{selected.tenant?.displayName||"No arrendado"}</dd></div><div className={styles.full}><dt>Vehículo</dt><dd>{selected.vehicleReference||"Sin vehículo registrado"}</dd></div></dl>
     {canManage&&<button className={styles.editButton} onClick={()=>setEditing(value=>!value)}>{editing?"Cerrar edición":"Editar relación"}</button>}
     {editing&&canManage&&<form className={styles.editor} onSubmit={save}><div className={styles.syntheticWarning}><b>Datos sintéticos solamente</b>Los alias deben comenzar con SINT- y unidad/vehículo con DEMO-. La carga de PII real continúa bloqueada.</div><label>Alias propietario<input value={draft.ownerLabel} onChange={event=>setDraft(current=>({...current,ownerLabel:event.target.value}))} placeholder="SINT-PROPIETARIO-04" maxLength={96}/></label><label>Alias arrendatario<input value={draft.tenantLabel} onChange={event=>setDraft(current=>({...current,tenantLabel:event.target.value}))} placeholder="SINT-ARRENDATARIO-03" maxLength={96}/></label><label>Unidad DEMO<input value={draft.linkedUnitCode} onChange={event=>setDraft(current=>({...current,linkedUnitCode:event.target.value}))} placeholder="DEMO-C402" maxLength={40}/></label><label>Vehículo DEMO<input value={draft.vehicleReference} onChange={event=>setDraft(current=>({...current,vehicleReference:event.target.value}))} placeholder="DEMO-EF56" maxLength={32}/></label><label className={styles.check}><input type="checkbox" checked={draft.markReview} onChange={event=>setDraft(current=>({...current,markReview:event.target.checked}))}/> Marcar para revisión administrativa</label><button disabled={saving}>{saving?"Guardando…":"Guardar cambio auditado"}</button></form>}
    </>}
    {matches.length>1&&<div className={styles.matchList}><small>OTRAS COINCIDENCIAS</small>{matches.slice(0,8).map(item=><button key={item.id} onClick={()=>setSelected(item)}><b>{item.code}</b><span>{item.linkedUnitCode||statusLabels[item.status]}</span></button>)}</div>}
   </aside>
  </div>

  <footer className={styles.legend}><span><i className={styles.legendAvailable}/>Sin relación</span><span><i className={styles.legendAssigned}/>Propietario</span><span><i className={styles.legendLeased}/>Arrendado</span><span><i className={styles.legendReview}/>Revisión</span><b>{loadingInventory?"Sincronizando…":"Mapa interactivo · clic para consultar"}</b></footer>
 </main>;
}
