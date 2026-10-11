"use client";

import {FormEvent,useCallback,useEffect,useMemo,useState} from "react";

type Incident={id:string;serviceDate:string;area:string;priority:string;state:string;assignedRole:string|null;revision:number;createdAt:string;updatedAt:string};
type ShiftLog={id:string;assignmentId:string;state:"open"|"closed";shift:{slotCode:string;startsAt:string;endsAt:string;status:string;revision:number}|null};
type ShiftLogPayload={date:string;logs:ShiftLog[]};
type RoundCheck={id:string;checkpointCode:string;result:"ok"|"attention"|"not_applicable";linkedIncidentId:string|null;caseReference:string|null;createdAt:string};
type Round={id:string;shiftLogId:string;roundType:"opening"|"routine"|"exception";state:"open"|"completed";startedAt:string;completedAt:string|null;revision:number;updatedAt:string;shiftLogState:"open"|"closed"|null;shift:{slotCode:string;startsAt:string;endsAt:string;status:string}|null;checks:RoundCheck[]};
type RoundPayload={date:string;rounds:Round[]};
type Props={date:string;today:string;incidents:Incident[];permissions:string[]};

const roundLabels={opening:"Apertura",routine:"Rutina",exception:"Excepción"} as const;
const checkpointLabels:Record<string,string>={access_control:"Control de acceso",common_areas:"Áreas comunes",safety_equipment:"Equipos de seguridad",utilities:"Servicios / suministros",perimeter:"Perímetro",handoff_readiness:"Preparación de relevo",other:"Otro checkpoint"};
const resultLabels:Record<string,string>={ok:"OK",attention:"Atención",not_applicable:"N/A"};
const checkpoints=["access_control","common_areas","safety_equipment","utilities","perimeter","handoff_readiness","other"] as const;

function dateTime(value:string|null){
 if(!value)return "—";
 return new Intl.DateTimeFormat("es-CL",{timeZone:"America/Santiago",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(value));
}
function clock(value:string){return new Intl.DateTimeFormat("es-CL",{timeZone:"America/Santiago",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(value));}

export default function ConciergeOperationalRounds({date,today,incidents,permissions}:Props){
 const canView=permissions.includes("view_operational_round");
 const canWrite=permissions.includes("write_operational_round");
 const canComplete=permissions.includes("complete_operational_round");
 const [logs,setLogs]=useState<ShiftLog[]>([]);
 const [rounds,setRounds]=useState<Round[]>([]);
 const [selectedRoundId,setSelectedRoundId]=useState<string|null>(null);
 const [selectedLogId,setSelectedLogId]=useState("");
 const [roundType,setRoundType]=useState<"opening"|"routine"|"exception">("routine");
 const [checkpoint,setCheckpoint]=useState<(typeof checkpoints)[number]>("access_control");
 const [result,setResult]=useState<"ok"|"attention"|"not_applicable">("ok");
 const [incidentId,setIncidentId]=useState("");
 const [caseReference,setCaseReference]=useState("");
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState<string|null>(null);

 const fetchWithRefresh=useCallback(async(path:string,init?:RequestInit)=>{
  let response=await fetch(path,{...init,cache:"no-store"});
  if(response.status===401||response.status===403){
   const refresh=await fetch("/api/auth/refresh",{method:"POST",cache:"no-store"});
   if(refresh.ok)response=await fetch(path,{...init,cache:"no-store"});
  }
  return response;
 },[]);

 const load=useCallback(async()=>{
  if(!canView){setLogs([]);setRounds([]);return;}
  const [logResponse,roundResponse]=await Promise.all([
   fetchWithRefresh(`/api/operations/shift-log?date=${encodeURIComponent(date)}`),
   fetchWithRefresh(`/api/operations/rounds?date=${encodeURIComponent(date)}`),
  ]);
  if(logResponse.ok){const data=await logResponse.json() as ShiftLogPayload;setLogs(data.logs);}
  else setLogs([]);
  if(roundResponse.ok){
   const data=await roundResponse.json() as RoundPayload;
   setRounds(data.rounds);
   setSelectedRoundId(current=>current&&data.rounds.some(item=>item.id===current)?current:data.rounds.find(item=>item.state==="open")?.id??data.rounds[0]?.id??null);
  }else{setRounds([]);setNotice("No se pudieron cargar las rondas operativas.");}
 },[canView,date,fetchWithRefresh]);

 useEffect(()=>{void load();},[load]);

 const openLogs=useMemo(()=>logs.filter(log=>log.state==="open"),[logs]);
 useEffect(()=>{
  if(selectedLogId&&openLogs.some(log=>log.id===selectedLogId))return;
  setSelectedLogId(openLogs[0]?.id??"");
 },[openLogs,selectedLogId]);
 const selected=rounds.find(item=>item.id===selectedRoundId)??null;
 const usedCheckpoints=new Set(selected?.checks.map(item=>item.checkpointCode)??[]);
 const availableCheckpoints=checkpoints.filter(item=>!usedCheckpoints.has(item));
 useEffect(()=>{if(!availableCheckpoints.includes(checkpoint))setCheckpoint(availableCheckpoints[0]??"other");},[availableCheckpoints,checkpoint]);

 const post=async(path:string,body:unknown)=>{
  const response=await fetchWithRefresh(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const payload=await response.json().catch(()=>({error:"Error inesperado"})) as {error?:string;round?:{id?:string}};
  if(!response.ok)throw new Error(payload.error||`Error HTTP ${response.status}`);
  return payload;
 };

 const startRound=async(event:FormEvent)=>{
  event.preventDefault();
  if(!selectedLogId||busy)return;
  setBusy(true);setNotice(null);
  try{
   const payload=await post("/api/operations/rounds/start",{shiftLogId:selectedLogId,roundType});
   setNotice("Ronda iniciada.");
   await load();
   if(payload.round?.id)setSelectedRoundId(payload.round.id);
  }catch(error){setNotice(error instanceof Error?error.message:"No se pudo iniciar la ronda.");await load();}
  finally{setBusy(false);}
 };

 const addCheck=async(event:FormEvent)=>{
  event.preventDefault();
  if(!selected||selected.state!=="open"||busy||!availableCheckpoints.length)return;
  setBusy(true);setNotice(null);
  try{
   await post("/api/operations/rounds/check",{roundId:selected.id,checkpointCode:checkpoint,result,incidentId:result==="attention"&&incidentId?incidentId:undefined,caseReference:caseReference.trim()||undefined});
   setIncidentId("");setCaseReference("");setResult("ok");
   setNotice("Checkpoint registrado.");
   await load();
  }catch(error){setNotice(error instanceof Error?error.message:"No se pudo registrar el checkpoint.");}
  finally{setBusy(false);}
 };

 const completeRound=async()=>{
  if(!selected||selected.state!=="open"||busy)return;
  setBusy(true);setNotice(null);
  try{
   await post("/api/operations/rounds/complete",{roundId:selected.id,expectedRevision:selected.revision});
   setNotice("Ronda completada y sellada.");
   await load();
  }catch(error){setNotice(error instanceof Error?error.message:"No se pudo completar la ronda.");await load();}
  finally{setBusy(false);}
 };

 if(!canView)return null;
 return <section className="rounds-workspace" aria-label="Rondas operativas estructuradas">
  <div className="rounds-heading"><div><p className="eyebrow">RONDAS OPERATIVAS</p><h2>Checkpoints del turno</h2><p>Inspecciones estructuradas ligadas a la bitácora abierta.</p></div><div className="rounds-summary"><span><b>{rounds.filter(item=>item.state==="open").length}</b> en curso</span><span><b>{rounds.filter(item=>item.state==="completed").length}</b> completadas</span></div></div>
  {notice&&<div className="rounds-notice" role="status">{notice}</div>}
  <div className="rounds-layout">
   <aside className="rounds-sidebar">
    {date===today&&canWrite&&openLogs.length>0&&<form className="round-start-form" onSubmit={startRound}><h3>Iniciar ronda</h3><label>Bitácora abierta<select value={selectedLogId} onChange={event=>setSelectedLogId(event.target.value)}>{openLogs.map(log=><option key={log.id} value={log.id}>{log.shift?.slotCode||"Turno"} · {log.shift?`${clock(log.shift.startsAt)}–${clock(log.shift.endsAt)}`:""}</option>)}</select></label><label>Tipo<select value={roundType} onChange={event=>setRoundType(event.target.value as typeof roundType)}><option value="opening">Apertura</option><option value="routine">Rutina</option><option value="exception">Excepción</option></select></label><button className="primary" disabled={busy||rounds.some(item=>item.state==="open"&&item.shiftLogId===selectedLogId)}>{busy?"Iniciando…":"Iniciar ronda"}</button></form>}
    {date===today&&openLogs.length===0&&<div className="rounds-callout">Primero abre una bitácora de turno para iniciar una ronda.</div>}
    <div className="rounds-list">{rounds.length?rounds.map(item=><button type="button" key={item.id} className={selectedRoundId===item.id?"selected":""} onClick={()=>setSelectedRoundId(item.id)}><div><strong>{roundLabels[item.roundType]}</strong><span>{item.shift?.slotCode||"Turno"}</span></div><b className={`round-state ${item.state}`}>{item.state==="open"?"EN CURSO":"COMPLETA"}</b><small>{dateTime(item.startedAt)} · {item.checks.length} checkpoints</small></button>):<p>Sin rondas para esta fecha.</p>}</div>
   </aside>
   <div className="round-detail">
    {!selected?<div className="round-empty"><h3>Sin ronda seleccionada</h3><p>Inicia una ronda desde una bitácora abierta o revisa una ronda histórica.</p></div>:<>
     <div className="round-detail-head"><div><p className="eyebrow">{roundLabels[selected.roundType]}</p><h3>{selected.shift?.slotCode||"Turno"}</h3><span>Iniciada {dateTime(selected.startedAt)} · rev. {selected.revision}</span></div><b className={`round-state ${selected.state}`}>{selected.state==="open"?"EN CURSO":"COMPLETA"}</b></div>
     <div className="round-check-grid">{selected.checks.length?selected.checks.map(check=><article key={check.id} className={`round-check ${check.result}`}><div><strong>{checkpointLabels[check.checkpointCode]||check.checkpointCode}</strong><span>{dateTime(check.createdAt)}</span></div><b>{resultLabels[check.result]||check.result}</b>{check.caseReference&&<small>{check.caseReference}</small>}{check.linkedIncidentId&&<small>Incidencia vinculada</small>}</article>):<p className="round-empty-line">Aún no hay checkpoints registrados.</p>}</div>
     {selected.state==="open"&&canWrite&&availableCheckpoints.length>0&&<form className="round-check-form" onSubmit={addCheck}><h4>Registrar checkpoint</h4><div className="round-form-grid"><label>Checkpoint<select value={checkpoint} onChange={event=>setCheckpoint(event.target.value as typeof checkpoint)}>{availableCheckpoints.map(item=><option key={item} value={item}>{checkpointLabels[item]}</option>)}</select></label><label>Resultado<select value={result} onChange={event=>{setResult(event.target.value as typeof result);if(event.target.value!=="attention")setIncidentId("");}}><option value="ok">OK</option><option value="attention">Atención</option><option value="not_applicable">No aplica</option></select></label>{result==="attention"&&<label>Incidencia opcional<select value={incidentId} onChange={event=>setIncidentId(event.target.value)}><option value="">Sin vínculo</option>{incidents.map(incident=><option key={incident.id} value={incident.id}>{incident.area} · {incident.priority} · {incident.state}</option>)}</select></label>}<label className={result==="attention"?"":"wide"}>Referencia sintética {result==="attention"&&!incidentId?"requerida":"opcional"}<input required={result==="attention"&&!incidentId} value={caseReference} onChange={event=>setCaseReference(event.target.value.replace(/[^A-Za-z0-9._-]/g,"").slice(0,80))} placeholder="ROUND-TEST-01" /></label></div><button className="primary" disabled={busy}>{busy?"Registrando…":"Guardar checkpoint"}</button></form>}
     {selected.state==="open"&&canComplete&&<div className="round-complete"><div><strong>Completar ronda</strong><span>Una ronda completada queda inmutable. La bitácora no puede cerrarse mientras exista una ronda abierta.</span></div><button disabled={busy||selected.checks.length<1} onClick={completeRound}>{busy?"Completando…":"Completar ronda"}</button></div>}
     {selected.state==="completed"&&<div className="round-completed-summary">Completada {dateTime(selected.completedAt)} · {selected.checks.length} checkpoints sellados.</div>}
    </>}
   </div>
  </div>
 </section>;
}
