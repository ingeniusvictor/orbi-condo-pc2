import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(path,"utf8");
const pack=read("docs/ADMINISTRATOR-VALIDATION-PACK.md");
const response=read("docs/ADMINISTRATOR-VALIDATION-RESPONSE-TEMPLATE.md");

for(const text of [pack,response]){
 assert.match(text,/PENDIENTE/i,"validation artifacts must remain pending by default");
 assert.match(text,/ADMINISTRATOR ONLY/i,"validation artifacts must remain Administrator-only");
 assert.match(text,/SYNTHETIC STAGING ONLY/i,"validation artifacts must preserve synthetic-staging boundary");
 assert.match(text,/PRODUCTION BLOCKED/i,"validation artifacts must preserve Production block");
 assert.doesNotMatch(text,/\b(?:service[_-]?role|sb_secret_|SUPABASE_SERVICE_ROLE)\b/i,"validation artifacts must not instruct use of privileged backend secrets");
}
console.log("PASS validation artifacts preserve staging-only Administrator boundary");

assert.match(pack,/RECOMENDADA · PROPUESTA TÉCNICA, NO APROBACIÓN/i,"recommendations must be labeled as proposals, not approvals");
assert.doesNotMatch(pack,/\[x\]/i,"validation pack must not pre-check any decision");
assert.doesNotMatch(response,/\[x\]/i,"response template must not pre-check final approval state");
assert.match(response,/DEFAULT: TODO PENDIENTE/i,"response template must default every decision to pending");
console.log("PASS package cannot silently pre-approve administrative decisions");

assert.match(pack,/no fija días, meses ni años/i,"pack must explicitly refuse to invent retention duration");
assert.doesNotMatch(pack,/\b(?:retener|retención|conservar)[^\n]{0,60}\b\d+\s*(?:día|días|mes|meses|año|años)\b/i,"pack must not invent numeric retention periods");
for(const family of ["staff_private","memberships","audit_events"]){
 assert.ok(pack.includes(`\`${family}\``),`pack must cover ${family}`);
 assert.ok(response.includes(`\`${family}\``),`response template must cover ${family}`);
}
console.log("PASS retention and private-data decisions stay explicit without invented durations");

for(const topic of [
 "Cobertura nocturna de domingo/feriado",
 "Quién puede activar un reemplazo",
 "Canal para solicitar y confirmar un reemplazo",
 "Entrega de turno",
 "Bitácora",
 "Rondas",
 "Escalamiento de emergencias fuera de horario",
]){
 assert.ok(pack.includes(topic),`pack must include operational validation topic: ${topic}`);
}
console.log("PASS current G7 administrative procedure blockers are represented in the package");

assert.match(pack,/shift_events\.note_private[\s\S]*PROHIBITED NARRATIVE/i,"historical narrative field must remain prohibited for real data");
assert.match(pack,/no habilita Production ni datos reales por sí solo/i,"administrative response must not auto-enable production/real data");
assert.match(pack,/no.*crear identidades live de Mayordomía, Conserjería, Committee o Resident/is,"pack must not activate deferred roles");
assert.match(pack,/no.*reabrir P1E/is,"pack must preserve frozen recovery scope");
assert.match(pack,/no.*activar P2/is,"pack must preserve blocked P2 scope");
console.log("PASS package preserves no-role-expansion, no-P1E and no-P2 boundaries");

assert.match(response,/no incluir[\s\S]*RUT[\s\S]*credenciales/i,"response template must warn against copying real PII/secrets");
assert.match(response,/Rol de quien responde: PENDIENTE/i,"response template identifies approver by role rather than requiring personal identity in repo");
console.log("PASS response template minimizes personal information in repository evidence");

console.log("ADMINISTRATOR VALIDATION PACK CONTRACT GREEN");
