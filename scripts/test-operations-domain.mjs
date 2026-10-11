import assert from "node:assert/strict";
import {
 canTransitionIncidentCommand,
 canTransitionShift,
 isIncidentCommandState,
 isPositiveRevision,
 isShiftAssignmentStatus,
 isUuid,
 shiftStatusRequiresAssignee,
} from "../data/operations-command-rules.ts";
import {proposedPermission,proposedPermissionsFor} from "../data/operations-permissions.ts";
import {
 isCaseReference,
 isPendingCount,
 isServiceDate,
 isShiftLogCategory,
 isShiftLogCheckStatus,
 isShiftLogClosureCode,
 isShiftLogEntryCode,
 isShiftLogSeverity,
} from "../data/shift-log-rules.ts";
import {
 isOperationalCaseReference,
 isOperationalCheckpoint,
 isOperationalCheckResult,
 isOperationalRoundType,
} from "../data/operational-round-rules.ts";

function run(name,fn){
 try{fn();console.log(`PASS ${name}`)}catch(error){console.error(`FAIL ${name}`);throw error}
}

run("resident has no operational permissions",()=>{
 assert.deepEqual([...proposedPermissionsFor("resident")],[]);
});

run("committee remains read/review only",()=>{
 assert.equal(proposedPermission("committee","view_shift_schedule"),true);
 assert.equal(proposedPermission("committee","review_staff_functions"),true);
 for(const permission of ["report_shift_gap","manage_shift_schedule","view_shift_log","view_operational_round","report_incident","manage_incident","manage_resident"]){
  assert.equal(proposedPermission("committee",permission),false,`committee unexpectedly has ${permission}`);
 }
});

run("concierge can operate but cannot administer coverage or incidents",()=>{
 for(const permission of ["view_shift_schedule","report_shift_gap","confirm_shift_handoff","view_shift_log","write_shift_log","close_shift_log","view_operational_round","write_operational_round","complete_operational_round","report_incident"]){
  assert.equal(proposedPermission("concierge",permission),true,`concierge missing ${permission}`);
 }
 for(const permission of ["request_shift_replacement","manage_shift_schedule","manage_incident","manage_resident","review_staff_contract"]){
  assert.equal(proposedPermission("concierge",permission),false,`concierge unexpectedly has ${permission}`);
 }
});

run("mayordomo manages operations but not resident administration or contracts",()=>{
 for(const permission of ["request_shift_replacement","manage_shift_schedule","manage_incident","review_staff_functions"]){
  assert.equal(proposedPermission("mayordomo",permission),true,`mayordomo missing ${permission}`);
 }
 assert.equal(proposedPermission("mayordomo","manage_resident"),false);
 assert.equal(proposedPermission("mayordomo","review_staff_contract"),false);
});

run("administrator retains full declared permission set",()=>{
 const permissions=proposedPermissionsFor("administrator");
 assert.equal(permissions.length,19);
 for(const permission of ["manage_shift_schedule","manage_incident","manage_resident","manage_parking","review_staff_contract"]){
  assert.equal(proposedPermission("administrator",permission),true,`administrator missing ${permission}`);
 }
});

run("shift transition matrix preserves controlled lifecycle",()=>{
 const allowed={
  planned:["planned","vacant","received"],
  vacant:["vacant","requested","confirmed","planned"],
  requested:["requested","confirmed","vacant"],
  confirmed:["confirmed","received","vacant"],
  received:["received"],
 };
 const statuses=["planned","vacant","requested","confirmed","received"];
 for(const from of statuses){
  for(const to of statuses){
   assert.equal(canTransitionShift(from,to),allowed[from].includes(to),`${from} -> ${to}`);
  }
 }
});

run("confirmed and received shifts require assignee",()=>{
 assert.equal(shiftStatusRequiresAssignee("confirmed"),true);
 assert.equal(shiftStatusRequiresAssignee("received"),true);
 for(const status of ["planned","vacant","requested"])assert.equal(shiftStatusRequiresAssignee(status),false);
});

run("incident transition matrix prevents invalid jumps",()=>{
 const allowed={
  reported:["reported","acknowledged","assigned","resolved"],
  acknowledged:["acknowledged","assigned","in_progress","resolved"],
  assigned:["assigned","in_progress","resolved","acknowledged"],
  in_progress:["in_progress","resolved","assigned"],
  resolved:["resolved","closed","in_progress"],
  closed:["closed"],
 };
 const states=["reported","acknowledged","assigned","in_progress","resolved","closed"];
 for(const from of states){
  for(const to of states){
   assert.equal(canTransitionIncidentCommand(from,to),allowed[from].includes(to),`${from} -> ${to}`);
  }
 }
 assert.equal(canTransitionIncidentCommand("in_progress","closed"),false);
 assert.equal(canTransitionIncidentCommand("reported","closed"),false);
});

run("identifier and revision validators reject malformed input",()=>{
 assert.equal(isUuid("123e4567-e89b-42d3-a456-426614174000"),true);
 for(const value of ["", "not-a-uuid", "123e4567-e89b-12d3-a456-42661417400Z", null, 12])assert.equal(isUuid(value),false);
 assert.equal(isPositiveRevision(1),true);
 assert.equal(isPositiveRevision(Number.MAX_SAFE_INTEGER),true);
 for(const value of [0,-1,1.5,Number.MAX_SAFE_INTEGER+1,"1",null])assert.equal(isPositiveRevision(value),false);
});

run("shift and incident enum validators reject unknown states",()=>{
 for(const status of ["planned","vacant","requested","confirmed","received"])assert.equal(isShiftAssignmentStatus(status),true);
 assert.equal(isShiftAssignmentStatus("cancelled"),false);
 for(const state of ["reported","acknowledged","assigned","in_progress","resolved","closed"])assert.equal(isIncidentCommandState(state),true);
 assert.equal(isIncidentCommandState("deleted"),false);
});

run("shift log structured vocabularies remain closed",()=>{
 for(const value of ["routine_check","visitor_flow","delivery_received","equipment_check","maintenance_notice","incident_followup","handoff_pending","other"])assert.equal(isShiftLogEntryCode(value),true);
 assert.equal(isShiftLogEntryCode("free_text"),false);
 for(const value of ["access","security","maintenance","utilities","resident_support","delivery","other"])assert.equal(isShiftLogCategory(value),true);
 assert.equal(isShiftLogCategory("personal_data"),false);
 for(const value of ["info","attention","urgent"])assert.equal(isShiftLogSeverity(value),true);
 assert.equal(isShiftLogSeverity("secret"),false);
 for(const value of ["normal","pending_followup","escalated"])assert.equal(isShiftLogClosureCode(value),true);
 assert.equal(isShiftLogClosureCode("ignored"),false);
 for(const value of ["normal","attention"])assert.equal(isShiftLogCheckStatus(value),true);
 assert.equal(isShiftLogCheckStatus("unknown"),false);
});

run("pending count and case references enforce bounded structured input",()=>{
 assert.equal(isPendingCount(0),true);
 assert.equal(isPendingCount(99),true);
 for(const value of [-1,100,1.5,"2",null])assert.equal(isPendingCount(value),false);
 for(const value of ["EV-TEST-01","ABC_123.test","x"])assert.equal(isCaseReference(value),true);
 for(const value of ["","contains space","../escape?",`${"A".repeat(81)}`,null])assert.equal(isCaseReference(value),false);
});

run("service date accepts real ISO dates only",()=>{
 assert.equal(isServiceDate("2026-10-10"),true);
 assert.equal(isServiceDate("2024-02-29"),true);
 for(const value of ["2026-02-29","2026-13-01","2026-00-10","10-10-2026","2026-1-01","",null])assert.equal(isServiceDate(value),false);
});

run("operational round vocabularies remain closed",()=>{
 for(const value of ["opening","routine","exception"])assert.equal(isOperationalRoundType(value),true);
 assert.equal(isOperationalRoundType("ad_hoc_free_text"),false);
 for(const value of ["access_control","common_areas","safety_equipment","utilities","perimeter","handoff_readiness","other"])assert.equal(isOperationalCheckpoint(value),true);
 assert.equal(isOperationalCheckpoint("resident_name"),false);
 for(const value of ["ok","attention","not_applicable"])assert.equal(isOperationalCheckResult(value),true);
 assert.equal(isOperationalCheckResult("failed_free_text"),false);
 assert.equal(isOperationalCaseReference("ROUND_TEST-01"),true);
 assert.equal(isOperationalCaseReference("contains space"),false);
});

console.log("OPERATIONS DOMAIN CONTRACT GREEN");
