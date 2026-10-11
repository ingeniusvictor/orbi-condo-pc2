import assert from "node:assert/strict";
import {deriveContinuityModel} from "../data/continuity-model.ts";

const empty=()=>({shifts:[],incidents:[],logs:[],entries:[],rounds:[],checks:[]});
const shift=(overrides={})=>({id:"shift-secret-id",slot_code:"Conserjería AM",status:"planned",...overrides});
const log=(overrides={})=>({id:"log-secret-id",shift_assignment_id:"shift-secret-id",state:"open",closure_code:null,pending_items_count:null,...overrides});
const round=(overrides={})=>({id:"round-secret-id",shift_log_id:"log-secret-id",round_type:"routine",state:"open",...overrides});
const incident=(overrides={})=>({id:"incident-secret-id",area:"security",priority:"medium",state:"reported",...overrides});
const entry=(overrides={})=>({id:"entry-secret-id",shift_log_id:"log-secret-id",entry_code:"routine_check",category:"security",severity:"info",incident_id:null,case_reference:null,...overrides});
const check=(overrides={})=>({id:"check-secret-id",round_id:"round-secret-id",checkpoint_code:"perimeter",result:"ok",incident_id:null,case_reference:null,...overrides});

function run(name,fn){
 try{fn();console.log(`PASS ${name}`)}catch(error){console.error(`FAIL ${name}`);throw error}
}

run("clear jornada stays clear",()=>{
 const model=deriveContinuityModel(empty());
 assert.equal(model.status.tone,"clear");
 assert.equal(model.metrics.technicalBlockers,0);
 assert.equal(model.items.length,0);
});

run("open round is the only technical close blocker",()=>{
 const model=deriveContinuityModel({
  ...empty(),
  shifts:[shift()],logs:[log()],rounds:[round()],
  incidents:[incident({priority:"critical"})],
 });
 assert.equal(model.status.tone,"blocked");
 assert.equal(model.metrics.technicalBlockers,1);
 assert.equal(model.items.filter(item=>item.kind==="blocker").length,1);
});

run("critical incident is critical but not a technical blocker",()=>{
 const model=deriveContinuityModel({...empty(),incidents:[incident({priority:"critical"})]});
 assert.equal(model.status.tone,"critical");
 assert.equal(model.metrics.technicalBlockers,0);
 assert.equal(model.metrics.criticalIncidents,1);
});

run("vacancy makes continuity critical without inventing close block",()=>{
 const model=deriveContinuityModel({...empty(),shifts:[shift({status:"vacant"})]});
 assert.equal(model.status.tone,"critical");
 assert.equal(model.metrics.technicalBlockers,0);
 assert.equal(model.metrics.vacant,1);
});

run("requested coverage and high incident remain attention",()=>{
 const model=deriveContinuityModel({...empty(),shifts:[shift({status:"requested"})],incidents:[incident({priority:"high"})]});
 assert.equal(model.status.tone,"attention");
 assert.equal(model.metrics.coveragePending,1);
 assert.equal(model.metrics.priorityIncidents,1);
});

run("urgent open-log entry escalates continuity to critical",()=>{
 const model=deriveContinuityModel({...empty(),shifts:[shift()],logs:[log()],entries:[entry({severity:"urgent",entry_code:"handoff_pending",case_reference:"EV-TEST-URGENT"})]});
 assert.equal(model.status.tone,"critical");
 assert.equal(model.items.some(item=>item.kind==="handoff"&&item.tone==="danger"),true);
});

run("closed handoff with pending follow-up remains attention",()=>{
 const model=deriveContinuityModel({...empty(),shifts:[shift()],logs:[log({state:"closed",closure_code:"pending_followup",pending_items_count:2})]});
 assert.equal(model.status.tone,"attention");
 assert.equal(model.metrics.handoffsWithFollowup,1);
});

run("attention checkpoint linked to incident does not duplicate signal",()=>{
 const linked=deriveContinuityModel({...empty(),shifts:[shift()],logs:[log()],rounds:[round({state:"completed"})],checks:[check({result:"attention",incident_id:"incident-secret-id"})]});
 assert.equal(linked.items.some(item=>item.kind==="round"),false);
 const unlinked=deriveContinuityModel({...empty(),shifts:[shift()],logs:[log()],rounds:[round({state:"completed"})],checks:[check({result:"attention"})]});
 assert.equal(unlinked.status.tone,"attention");
 assert.equal(unlinked.items.some(item=>item.kind==="round"),true);
});

run("snapshot does not expose source resource IDs",()=>{
 const model=deriveContinuityModel({
  shifts:[shift({status:"vacant"})],
  incidents:[incident({priority:"critical"})],
  logs:[log()],
  entries:[entry({severity:"urgent"})],
  rounds:[round()],
  checks:[check({result:"attention"})],
 });
 const serialized=JSON.stringify(model);
 for(const rawId of ["shift-secret-id","incident-secret-id","log-secret-id","entry-secret-id","round-secret-id","check-secret-id"]){
  assert.equal(serialized.includes(rawId),false,`raw source id leaked: ${rawId}`);
 }
 assert.match(model.items[0]?.id??"",/^continuity-\d+$/);
});

run("queue is capped while metrics retain full counts",()=>{
 const incidents=Array.from({length:30},(_,index)=>incident({id:`incident-${index}`,priority:"critical"}));
 const model=deriveContinuityModel({...empty(),incidents});
 assert.equal(model.metrics.criticalIncidents,30);
 assert.equal(model.items.length,24);
});

console.log("CONTINUITY CONTRACT GREEN");
