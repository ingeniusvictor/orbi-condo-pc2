import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(path,"utf8");
const inventory=read("docs/ADMINISTRATOR-PRIVATE-DATA-INVENTORY.md");
const dashboard=read("app/api/operations/dashboard/route.ts");
const incidentReport=read("app/api/operations/incidents/report/route.ts");
const baseSchema=read("supabase/migrations/20261010_p1b_operations_schema.sql");
const shiftLogSchema=read("supabase/migrations/20261010_p1h_shift_log_handoff.sql");
const roundsSchema=read("supabase/migrations/20261010_p1i_operational_rounds.sql");

const schemaByTable={
 communities:baseSchema,
 memberships:baseSchema,
 staff_private:baseSchema,
 shift_assignments:baseSchema,
 shift_events:baseSchema,
 incidents:baseSchema,
 incident_events:baseSchema,
 audit_events:baseSchema,
 shift_logs:shiftLogSchema,
 shift_log_entries:shiftLogSchema,
 operational_rounds:roundsSchema,
 operational_round_checks:roundsSchema,
};

function tableColumns(source,table){
 const marker=`create table if not exists public.${table}(`;
 const start=source.indexOf(marker);
 assert.ok(start>=0,`schema must declare ${table}`);
 const bodyStart=start+marker.length;
 const bodyEnd=source.indexOf("\n);",bodyStart);
 assert.ok(bodyEnd>bodyStart,`schema table ${table} must have a parseable body`);
 const ignored=new Set(["primary","unique","foreign","check","constraint"]);
 return source.slice(bodyStart,bodyEnd).split("\n").map(line=>line.match(/^ ([a-z_][a-z0-9_]*)\b/i)?.[1]??null).filter(name=>name&&!ignored.has(name));
}

for(const [table,source] of Object.entries(schemaByTable)){
 assert.ok(inventory.includes(`### \`${table}\``),`inventory must contain table ${table}`);
 const columns=tableColumns(source,table);
 assert.ok(columns.length>0,`${table} must expose inventory columns`);
 for(const column of columns){
  assert.ok(inventory.includes(`\`${column}\``),`inventory must name ${table}.${column}`);
 }
}
console.log("PASS exact current operational table fields are represented in the Administrator private-data inventory");

assert.match(inventory,/note_private[^\n]*PROHIBITED NARRATIVE|`note_private`[^\n]*PROHIBITED NARRATIVE/i,"historical narrative field must be explicitly prohibited for real data");
assert.match(baseSchema,/note_private text/,"test must remain aware that the historical narrative column still exists");
assert.doesNotMatch(dashboard,/shiftEventPath=`[^`]*(?:note_private|from_assignee_staff_id|to_assignee_staff_id)/,"dashboard event projection must not query narrative or assignee-history identifiers");
console.log("PASS historical shift narrative/assignee history remains outside the Administrator dashboard projection");

assert.match(dashboard,/hasAssignee:Boolean\(row\.assignee_staff_id\)/,"shift projection must reduce assignee linkage to a boolean");
assert.doesNotMatch(dashboard,/assigneeStaffId\s*:/,"browser shift projection must not expose the staff UUID");
assert.match(dashboard,/staff_private\?select=id,display_name,staff_function&/,"staff catalog must remain explicitly column-minimized");
console.log("PASS Administrator shift/staff projection remains minimized");

const incidentPath=dashboard.match(/const incidentPath=`([^`]+)`;/)?.[1]??"";
assert.ok(incidentPath,"dashboard must declare the incident query");
assert.equal(incidentPath.includes("private_case_reference"),false,"dashboard incident query must not request private case reference");
assert.doesNotMatch(dashboard,/privateCaseReference\s*:/,"browser dashboard response must not expose private case reference");
assert.match(incidentReport,/body\.caseReference\.length>80/,"incident case reference must stay length-bounded");
assert.match(incidentReport,/\^\[A-Za-z0-9\._-\]\*\$/,"incident case reference must stay restricted to opaque-token characters");
const incidentWriteSelect=incidentReport.match(/operationsDbFetch\("incidents\?select=([^\"]+)"/)?.[1]??"";
assert.ok(incidentWriteSelect,"incident creation must declare an explicit return projection");
assert.equal(incidentWriteSelect.includes("private_case_reference"),false,"incident creation response must not echo private case reference");
console.log("PASS private incident case reference remains opaque, bounded and excluded from browser projections");

assert.doesNotMatch(shiftLogSchema,/\b(note|notes|description|details|narrative|free_text)\s+text\b/i,"shift log schema must not introduce free-text narrative columns");
assert.doesNotMatch(roundsSchema,/\b(note|notes|description|details|narrative|free_text)\s+text\b/i,"round schema must not introduce free-text narrative columns");
console.log("PASS shift-log and operational-round evidence remains structured rather than narrative");

assert.match(inventory,/RUT|passport\/identity-document|personal phone numbers|vehicle plates/i,"inventory must explicitly identify out-of-scope direct identifiers");
assert.match(inventory,/No final real-data retention periods are approved yet/i,"inventory must not invent a retention decision");
assert.match(inventory,/SYNTHETIC STAGING ONLY/i,"inventory must preserve the current staging-only boundary");
console.log("PASS inventory preserves no-real-PII, no-invented-retention and staging-only boundaries");

console.log("ADMINISTRATOR PRIVATE DATA GOVERNANCE CONTRACT GREEN");
