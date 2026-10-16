import fs from "node:fs";

function read(path){return fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");}
function assert(condition,message){if(!condition)throw new Error(`FAIL ${message}`);console.log(`PASS ${message}`);}

const readiness=read("docs/PRODUCTION-READINESS-GATE.md");
const handoff=read("docs/ADMINISTRATOR-READINESS-HANDOFF.md");
const pkg=JSON.parse(read("package.json"));

for(const marker of [
  "Evidence snapshot: **2026-10-16 · Chile**",
  "main@087745e3d314c984530b207c49deedd2e5b0394e",
  "ADMINISTRATOR ONLY",
  "SYNTHETIC STAGING ONLY",
  "PRODUCTION BLOCKED",
  "P1E FROZEN",
  "P2 BLOCKED",
]) assert(readiness.includes(marker)||handoff.includes(marker),`current cut marker remains explicit: ${marker}`);

for(const closed of [
  "Preview observability/error-handling strategy is implemented",
  "Read-only application release-recovery rehearsal",
  "Technical region/data-residency recommendation exists",
  "Framework security baseline upgraded to Next.js `16.4.1`",
  "A committed `package-lock.json` (`lockfileVersion: 3`)",
  "PR #89 — reproducible `package-lock.json` + `npm ci`",
]) assert(readiness.includes(closed),`reconciled technical evidence recorded: ${closed}`);

for(const pending of [
  "Production Supabase project/plan explicitly approved",
  "Production region/data-residency **decision** approved",
  "Production monitoring ownership, alerting/escalation, log retention and SLO/threshold policy approved and enabled",
  "Database recovery remains tied to G6/P1E",
  "Exact Sunday/holiday night coverage schedule formally validated",
  "Private field inventory **approved for real-data use**",
]) assert(readiness.includes(`- [ ] ${pending}`),`human/Production decision remains unchecked: ${pending}`);

assert(readiness.includes("G7 · Operational procedure — awaiting Administration"),"G7 is explicitly waiting on Administration rather than engineering invention");
assert(readiness.includes("G6 · Backup / recovery — P1E remains frozen/pending"),"P1E remains frozen and separate from application recovery");
assert(!/\- \[x\] Production Supabase project\/plan explicitly approved/i.test(readiness),"Production Supabase approval is not fabricated");
assert(!/\- \[x\] Production region\/data-residency \*\*decision\*\* approved/i.test(readiness),"Production residency approval is not fabricated");
assert(!/\- \[x\] (?:First logical staging backup|Independent restore target|Restore completed)/i.test(readiness),"P1E restore evidence is not fabricated");

for(const marker of [
  "La ausencia temporal de respuestas de Administración **no bloquea trabajo técnico independiente**",
  "No se provisionan Mayordomía, Conserjería, Committee ni Resident",
  "No se inventan plazos de retención",
  "La recomendación técnica regional y el rehearsal de release recovery **no son aprobaciones de Production**",
  "No se reabre backup/restore por este handoff",
  "nunca como contenido del repositorio",
]) assert(handoff.includes(marker),`handoff preserves boundary: ${marker}`);

assert(pkg.scripts["test:readiness-reconciliation"]==="node scripts/test-readiness-reconciliation.mjs","readiness reconciliation has an explicit npm script");
assert(pkg.scripts.check.includes("npm run test:readiness-reconciliation"),"full Quality Gate executes readiness reconciliation contract");

console.log("ADMINISTRATOR READINESS RECONCILIATION CONTRACT GREEN");
