import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(path,"utf8");
const procedure=read("docs/ADMINISTRATOR-DATA-HANDLING-PROCEDURES-DRAFT.md");
const inventory=read("docs/ADMINISTRATOR-PRIVATE-DATA-INVENTORY.md");
const baseSchema=read("supabase/migrations/20261010_p1b_operations_schema.sql");

assert.match(procedure,/BORRADOR TÉCNICO · NO APROBADO PARA DATOS REALES/i,"procedure must remain explicitly draft/not approved");
assert.match(procedure,/ADMINISTRATOR ONLY/i,"procedure must remain Administrator-only");
assert.match(procedure,/SYNTHETIC STAGING ONLY/i,"procedure must preserve synthetic-staging boundary");
assert.match(procedure,/NO REAL PII/i,"procedure must preserve no-real-PII boundary");

for(const field of ["display_name","staff_function","coverage_eligible","active","disabled_at","active_until"]){
 assert.ok(procedure.includes(`\`${field}\``),`procedure must address controlled field ${field}`);
}
assert.match(baseSchema,/coverage_eligible boolean not null default true/,"staff coverage deactivation field must remain present in schema");
assert.match(baseSchema,/active boolean not null default true/,"staff active deactivation field must remain present in schema");
assert.match(baseSchema,/disabled_at timestamptz/,"membership disabled_at must remain present in schema");
assert.match(baseSchema,/active_until timestamptz/,"membership active_until must remain present in schema");
console.log("PASS correction/deactivation draft maps only to existing technical controls");

assert.match(procedure,/No borrar en cascada asignaciones, eventos, bitácoras, rondas o auditoría histórica/i,"staff deactivation must preserve history");
assert.match(procedure,/no debe corregirse mediante `DELETE` o edición silenciosa/i,"historical evidence must not be silently rewritten/deleted");
assert.match(procedure,/evento compensatorio estructurado|registro de corrección enlazado/i,"historical correction must require an append-only/linked design decision");
console.log("PASS historical evidence remains append-only by default");

assert.match(procedure,/revocación inmediata de sesiones ya emitidas[\s\S]*no presume/i,"membership deactivation must not overclaim instant token revocation");
assert.match(procedure,/Sólo existe una identidad live QA autorizada: Administrator/i,"procedure must not activate deferred roles");
console.log("PASS access deactivation is fail-honest and does not expand live roles");

assert.match(procedure,/lectura de `audit_events` está restringida técnicamente a Administrator/i,"audit access draft must preserve Administrator-only read boundary");
assert.match(procedure,/Exportación de datos privados[\s\S]*No aprobada por defecto/i,"private export must remain disabled by policy draft");
assert.match(procedure,/No copiar resultados de auditoría a GitHub, issues, PRs o chats/i,"audit evidence must stay out of public development channels");
console.log("PASS audit/export draft remains least-privilege and non-public");

assert.match(procedure,/no fija días, meses ni años/i,"draft must not invent retention periods");
assert.doesNotMatch(procedure,/\b(?:retener|retención|conservar)[^\n]{0,40}\b\d+\s*(?:día|días|mes|meses|año|años)\b/i,"draft must not smuggle an unapproved retention duration");
for(const family of ["staff_private","memberships","shift_assignments","audit_events"]){
 assert.ok(procedure.includes(`\`${family}\``),`retention matrix must include ${family}`);
}
console.log("PASS retention remains an explicit approval worksheet, not an invented policy");

assert.match(procedure,/`shift_events\.note_private`[\s\S]*PROHIBITED NARRATIVE/i,"historical narrative field must stay prohibited for real data");
assert.match(inventory,/note_private[^\n]*PROHIBITED NARRATIVE|`note_private`[^\n]*PROHIBITED NARRATIVE/i,"procedure must agree with canonical private-data inventory");
console.log("PASS note_private prohibition remains consistent across governance documents");

assert.doesNotMatch(procedure,/service[_-]?role|sb_secret_/i,"procedure must not instruct operators to use privileged Supabase keys");
assert.doesNotMatch(procedure,/ORBI_QA_[A-Z_]+\s*=|SUPABASE_[A-Z_]+\s*=/,"procedure must not contain secret assignment instructions");
console.log("PASS procedure introduces no privileged-key operational workaround");

console.log("ADMINISTRATOR DATA HANDLING PROCEDURES DRAFT CONTRACT GREEN");
