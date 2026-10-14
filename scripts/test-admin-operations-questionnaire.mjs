import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const questionnaire=readFileSync("docs/ADMINISTRATOR-OPERATIONS-QUESTIONNAIRE.md","utf8");
const map=readFileSync("docs/ADMINISTRATOR-VALIDATION-DOCUMENT-MAP.md","utf8");

assert.match(map,/ADMINISTRATOR-OPERATIONS-QUESTIONNAIRE\.md/,"document map must point Administration to the simple questionnaire");
assert.match(map,/material técnico interno/i,"technical validation package must remain internal ORBI material");
console.log("PASS Administration-facing and internal technical documents are separated");

for(let i=1;i<=10;i++){
  assert.match(questionnaire,new RegExp(`^## ${i}\\. `,"m"),`questionnaire must keep simple question ${i}`);
}
for(const topic of ["Turnos actuales","Ausencia de una persona","Quién decide el reemplazo","Personas autorizadas para reemplazos","Confirmación del reemplazo","Entrega de turno","Bitácora","Rondas","Situaciones que deben avisarse de inmediato","Emergencias fuera del horario administrativo"]){
  assert.ok(questionnaire.includes(topic),`questionnaire must cover ${topic}`);
}
console.log("PASS questionnaire covers the ten practical Administration topics");

for(const jargon of ["Supabase","PostgREST","RLS","Vercel","staff_private","memberships","audit_events","service_role","sb_secret_","GitHub","CI"]){
  assert.equal(questionnaire.includes(jargon),false,`Administration questionnaire must not expose technical jargon: ${jargon}`);
}
console.log("PASS Administration questionnaire is free of implementation jargon");

assert.match(questionnaire,/puede responderse \*\*“por definir”\*\*/i,"unknown procedures must be allowed to remain undefined");
assert.match(questionnaire,/No autoriza el uso de datos reales/i,"questionnaire must preserve the no-real-data boundary");
assert.match(questionnaire,/no incluir RUT, teléfonos, correos personales, claves, contratos/i,"questionnaire must tell reviewers not to copy sensitive data into the technical evidence copy");
assert.doesNotMatch(questionnaire,/\[[xX]\]/,"questionnaire must not pre-answer Administration choices");
console.log("PASS questionnaire remains neutral, privacy-minimized and non-authorizing");

console.log("ADMINISTRATOR SIMPLE OPERATIONS QUESTIONNAIRE CONTRACT GREEN");
