export type ContinuityShiftRow={id:string;slot_code:string;status:"planned"|"vacant"|"requested"|"confirmed"|"received"};
export type ContinuityIncidentRow={id:string;area:string;priority:"low"|"medium"|"high"|"critical";state:string};
export type ContinuityLogRow={id:string;shift_assignment_id:string;state:"open"|"closed";closure_code:"normal"|"pending_followup"|"escalated"|null;pending_items_count:number|null};
export type ContinuityEntryRow={id:string;shift_log_id:string;entry_code:string;category:string;severity:"info"|"attention"|"urgent";incident_id:string|null;case_reference:string|null};
export type ContinuityRoundRow={id:string;shift_log_id:string;round_type:"opening"|"routine"|"exception";state:"open"|"completed"};
export type ContinuityCheckRow={id:string;round_id:string;checkpoint_code:string;result:"ok"|"attention"|"not_applicable";incident_id:string|null;case_reference:string|null};
export type ContinuityTone="blocked"|"critical"|"attention"|"clear";
export type ContinuityItemTone="danger"|"warning"|"info";
export type ContinuityItem={id:string;kind:"blocker"|"coverage"|"incident"|"handoff"|"round";title:string;detail:string;tone:ContinuityItemTone};

export type ContinuityModelInput={
 shifts:ContinuityShiftRow[];
 incidents:ContinuityIncidentRow[];
 logs:ContinuityLogRow[];
 entries:ContinuityEntryRow[];
 rounds:ContinuityRoundRow[];
 checks:ContinuityCheckRow[];
};

export type ContinuityModel={
 status:{tone:ContinuityTone;label:string;detail:string};
 metrics:{
  technicalBlockers:number;
  coveragePending:number;
  vacant:number;
  requested:number;
  priorityIncidents:number;
  criticalIncidents:number;
  highIncidents:number;
  handoffsWithFollowup:number;
 };
 items:ContinuityItem[];
 sources:{shifts:number;incidents:number;logs:number;rounds:number;checks:number};
};

const areaLabel:Record<string,string>={access:"Acceso",common_area:"Área común",water:"Agua",electricity:"Electricidad",elevator:"Ascensor",security:"Seguridad",medical:"Médica",fire:"Incendio",other:"Otra"};
const roundLabel:Record<string,string>={opening:"Apertura",routine:"Rutina",exception:"Excepción"};
const checkpointLabel:Record<string,string>={access_control:"Control de acceso",common_areas:"Áreas comunes",safety_equipment:"Equipos de seguridad",utilities:"Servicios",perimeter:"Perímetro",handoff_readiness:"Preparación de relevo",other:"Otro"};

export function deriveContinuityModel(input:ContinuityModelInput):ContinuityModel{
 const {shifts,incidents,logs,entries,rounds,checks}=input;
 const shiftById=new Map(shifts.map(row=>[row.id,row]));
 const logById=new Map(logs.map(row=>[row.id,row]));
 const roundById=new Map(rounds.map(row=>[row.id,row]));
 const openRounds=rounds.filter(round=>round.state==="open");
 const criticalIncidents=incidents.filter(item=>item.priority==="critical");
 const highIncidents=incidents.filter(item=>item.priority==="high");
 const vacant=shifts.filter(shift=>shift.status==="vacant");
 const requested=shifts.filter(shift=>shift.status==="requested");
 const closedWithPending=logs.filter(log=>log.state==="closed"&&((log.pending_items_count??0)>0||log.closure_code==="pending_followup"||log.closure_code==="escalated"));
 const currentPendingEntries=entries.filter(entry=>{
  const log=logById.get(entry.shift_log_id);
  return log?.state==="open"&&(entry.entry_code==="handoff_pending"||entry.severity==="urgent");
 });
 const attentionChecks=checks.filter(check=>check.result==="attention"&&!check.incident_id);
 const items:ContinuityItem[]=[];
 const addItem=(item:Omit<ContinuityItem,"id">)=>items.push({id:`continuity-${items.length+1}`,...item});

 openRounds.forEach(round=>{
  const log=logById.get(round.shift_log_id);const shift=log?shiftById.get(log.shift_assignment_id):undefined;
  addItem({kind:"blocker",title:`Ronda ${roundLabel[round.round_type]??round.round_type} abierta`,detail:`${shift?.slot_code??"Turno"}: debe completarse antes de cerrar la bitácora.`,tone:"danger"});
 });
 vacant.forEach(shift=>addItem({kind:"coverage",title:`${shift.slot_code} sin cobertura`,detail:"Vacante operativa; Conserjería informa y el rol autorizado gestiona la cobertura.",tone:"danger"}));
 criticalIncidents.forEach(item=>addItem({kind:"incident",title:`Incidencia crítica · ${areaLabel[item.area]??item.area}`,detail:`Estado ${item.state.replaceAll("_"," ")}; debe permanecer visible en la continuidad del turno.`,tone:"danger"}));
 requested.forEach(shift=>addItem({kind:"coverage",title:`${shift.slot_code} · reemplazo solicitado`,detail:"La cobertura continúa pendiente de confirmación por un rol autorizado.",tone:"warning"}));
 highIncidents.forEach(item=>addItem({kind:"incident",title:`Incidencia alta · ${areaLabel[item.area]??item.area}`,detail:`Estado ${item.state.replaceAll("_"," ")}; mantener seguimiento en el relevo.`,tone:"warning"}));
 closedWithPending.forEach(log=>{
  const shift=shiftById.get(log.shift_assignment_id);
  addItem({kind:"handoff",title:`Entrega con pendientes · ${shift?.slot_code??"Turno"}`,detail:`Cierre ${log.closure_code?.replaceAll("_"," ")??"con seguimiento"} · ${log.pending_items_count??0} pendiente(s) declarado(s).`,tone:log.closure_code==="escalated"?"danger":"warning"});
 });
 currentPendingEntries.forEach(entry=>{
  const log=logById.get(entry.shift_log_id);const shift=log?shiftById.get(log.shift_assignment_id):undefined;
  addItem({kind:"handoff",title:`Bitácora · ${shift?.slot_code??"Turno"}`,detail:entry.entry_code==="handoff_pending"?`Pendiente para relevo${entry.case_reference?` · ${entry.case_reference}`:""}.`:`Entrada urgente ${entry.category}${entry.case_reference?` · ${entry.case_reference}`:""}.`,tone:entry.severity==="urgent"?"danger":"warning"});
 });
 attentionChecks.forEach(check=>{
  const round=roundById.get(check.round_id);const log=round?logById.get(round.shift_log_id):undefined;const shift=log?shiftById.get(log.shift_assignment_id):undefined;
  addItem({kind:"round",title:`Checkpoint en atención · ${checkpointLabel[check.checkpoint_code]??check.checkpoint_code}`,detail:`Ronda ${roundLabel[round?.round_type??""]??round?.round_type??"operativa"}${shift?.slot_code?` · ${shift.slot_code}`:""}${check.case_reference?` · ${check.case_reference}`:""}.`,tone:"warning"});
 });

 const urgentEntries=currentPendingEntries.filter(entry=>entry.severity==="urgent").length;
 let tone:ContinuityTone="clear";
 let label="Sin señales pendientes";
 let detail="No se detectan bloqueos ni señales de continuidad prioritaria en los datos visibles.";
 if(openRounds.length){tone="blocked";label="Cierre bloqueado";detail="Existe al menos una ronda abierta. El backend impide cerrar la bitácora hasta completarla.";}
 else if(vacant.length||criticalIncidents.length||urgentEntries){tone="critical";label="Continuidad crítica";detail="Hay cobertura vacante, incidencia crítica o evidencia urgente que debe mantenerse visible en el relevo.";}
 else if(requested.length||highIncidents.length||closedWithPending.length||attentionChecks.length||currentPendingEntries.length){tone="attention";label="Continuidad con pendientes";detail="La jornada puede continuar, pero existen observaciones o seguimientos que no deben perderse entre turnos.";}

 return {
  status:{tone,label,detail},
  metrics:{
   technicalBlockers:openRounds.length,
   coveragePending:vacant.length+requested.length,
   vacant:vacant.length,
   requested:requested.length,
   priorityIncidents:criticalIncidents.length+highIncidents.length,
   criticalIncidents:criticalIncidents.length,
   highIncidents:highIncidents.length,
   handoffsWithFollowup:closedWithPending.length,
  },
  items:items.slice(0,24),
  sources:{shifts:shifts.length,incidents:incidents.length,logs:logs.length,rounds:rounds.length,checks:checks.length},
 };
}
