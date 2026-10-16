import fs from "node:fs";

function read(path){return fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");}
function assert(condition,message){if(!condition)throw new Error(`FAIL ${message}`);console.log(`PASS ${message}`);}

const runbook=read("docs/RELEASE-RECOVERY-RUNBOOK-DRAFT.md");
const evidence=JSON.parse(read("docs/evidence/STAGING-RELEASE-RECOVERY-REHEARSAL-2026-10-16.json"));
const pkg=JSON.parse(read("package.json"));

for(const marker of [
 "BORRADOR TÉCNICO",
 "NO APROBADO PARA PRODUCTION",
 "ADMINISTRATOR ONLY",
 "SYNTHETIC STAGING ONLY",
 "P1E está congelado/pending",
 "No hacer rollback ciego de la aplicación",
 "migración compensatoria/forward-fix",
 "NO PRODUCTION MUTATION",
 "NO REAL DATA",
 "NO P1E REOPENING",
]){
 assert(runbook.includes(marker),`release recovery boundary is explicit: ${marker}`);
}

assert(runbook.includes("aplicación")&&runbook.includes("base de datos"),"application rollback and database recovery are explicitly separate tracks");
assert(runbook.includes("deployment ID + Git SHA"),"application recovery identifies releases by immutable deployment ID and Git SHA");
assert(runbook.includes("La ausencia de una prueba de compatibilidad se trata como **incompatible hasta demostrar lo contrario**"),"schema compatibility fails closed before application rollback");
assert(runbook.includes("`DROP TABLE`")&&runbook.includes("`TRUNCATE`")&&runbook.includes("borrado masivo"),"destructive database rollback shortcuts are explicitly prohibited");
assert(!/\bvercel\s+(?:rollback|promote)\s+[^`\n]/i.test(runbook),"draft contains no copy-paste Production rollback/promote command");
assert(!/request_rollback\s*\(/i.test(runbook),"draft contains no executable Production rollback API call");
assert(!/service[_ -]?role|sb_secret_|SUPABASE_SERVICE/i.test(runbook),"runbook introduces no privileged Supabase key procedure");

assert(evidence.schemaVersion===1&&evidence.kind==="staging_release_recovery_rehearsal","rehearsal evidence schema and kind are pinned");
assert(evidence.scope==="administrator_only_synthetic_staging","rehearsal is Administrator-only synthetic staging");
assert(evidence.vercel.projectId==="prj_M8Su8hDIEyLgHWMyagPpQDJ6JoLQ"&&evidence.vercel.projectName==="orbi-condo-pc2","evidence is pinned to the ORBI LIVING Vercel project");
assert(evidence.vercel.teamSlug==="orbi4","evidence is pinned to the expected Vercel team");
assert(evidence.vercel.deploymentEnvironment==="preview"&&evidence.vercel.deploymentState==="READY","rehearsal source is a READY Preview, not Production");
assert(/^dpl_[A-Za-z0-9]+$/.test(evidence.vercel.deploymentId),"rehearsal records an immutable deployment ID");
assert(/^[0-9a-f]{40}$/.test(evidence.vercel.gitSha),"rehearsal records an exact Git SHA");
assert(/^[a-z0-9-]+\.vercel\.app$/.test(evidence.vercel.deploymentUrl),"rehearsal records a deployment hostname without credentials or query data");
assert(evidence.healthEvidence.path==="/api/auth/session"&&evidence.healthEvidence.status===200,"rehearsal uses a non-destructive private session health check");
assert(evidence.healthEvidence.configured===true&&evidence.healthEvidence.authenticated===false,"health evidence is configured but anonymous and carries no user identity");
assert(evidence.healthEvidence.privateNoStore===true&&evidence.healthEvidence.noindex===true,"health evidence preserves private cache/index boundaries");
assert(evidence.healthEvidence.requestCorrelationHeaderPresent===true,"rehearsal confirms request-correlation support");
assert(evidence.qualityEvidence.node22==="success"&&evidence.qualityEvidence.node24==="success","rehearsal source passed both quality runtimes");
assert(Number.isInteger(evidence.qualityEvidence.workflowRunId)&&evidence.qualityEvidence.workflowRunId>0,"rehearsal records the exact quality workflow run");

for(const [name,value] of Object.entries(evidence.mutations)){
 assert(value===false,`rehearsal proves no mutation: ${name}`);
}
assert(/not a Production rollback approval or database restore proof/i.test(evidence.claim),"evidence cannot be misread as Production or restore approval");

assert(pkg.scripts["test:release-recovery"]==="node scripts/test-release-recovery-runbook.mjs","release recovery contract has an explicit npm script");
assert(pkg.scripts.check.includes("npm run test:release-recovery"),"full quality gate executes release recovery contract");

console.log("RELEASE RECOVERY RUNBOOK CONTRACT GREEN");
