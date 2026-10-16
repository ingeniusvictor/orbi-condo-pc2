import fs from "node:fs";

function read(path){return fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");}
function assert(condition,message){if(!condition)throw new Error(`FAIL ${message}`);console.log(`PASS ${message}`);}

const doc=read("docs/REGION-DATA-RESIDENCY-RECOMMENDATION.md");
const evidence=JSON.parse(read("docs/evidence/STAGING-REGION-INVENTORY-2026-10-16.json"));
const pkg=JSON.parse(read("package.json"));

for(const marker of [
 "RECOMENDACIÓN TÉCNICA",
 "NO APROBACIÓN LEGAL",
 "SYNTHETIC STAGING ONLY",
 "PRODUCTION BLOCKED",
 "NO LEGAL CLAIM",
 "NO PRODUCTION MUTATION",
 "NO REAL DATA",
]){
 assert(doc.includes(marker),`region recommendation boundary is explicit: ${marker}`);
}

assert(doc.includes("Supabase Production: `sa-east-1`"),"document records sa-east-1 only as the future Supabase candidate");
assert(doc.includes("Vercel Functions: `gru1`")&&doc.includes("sujeto a revalidar"),"Vercel region remains a revalidation-gated candidate");
assert(doc.includes("no aparece una región específica de Chile"),"document does not fabricate a Chile Supabase region");
assert(doc.includes("no debe prometer “datos alojados en Chile”"),"document forbids unsupported Chile-hosting claims");
assert(doc.includes("cambiar la región de un proyecto requiere crear otro proyecto y migrar"),"Supabase region immutability/migration implication is captured");
assert(doc.includes("backups, logs, exportaciones")&&doc.includes("subprocesadores"),"residency analysis is not reduced to primary database location");
assert(doc.includes("No se propone multi-region ni failover"),"unsupported multi-region/failover is not proposed for Hobby");
assert(!doc.includes('"regions": ["gru1"]')&&!doc.includes("regions: ['gru1']"),"recommendation does not embed deployable Vercel region configuration");

assert(evidence.schemaVersion===1&&evidence.kind==="staging_region_inventory","region evidence schema and kind are pinned");
assert(evidence.scope==="administrator_only_synthetic_staging","region evidence is Administrator-only synthetic staging");
assert(evidence.supabase.projectRef==="drqjpzydgihrrdnkhewh"&&evidence.supabase.projectName==="orbi-living-pc2-staging","evidence is pinned to the staging Supabase project");
assert(evidence.supabase.status==="ACTIVE_HEALTHY"&&evidence.supabase.primaryRegion==="sa-east-1","Supabase staging health and region are recorded exactly");
assert(evidence.supabase.productionProjectCreated===false,"evidence cannot claim Supabase Production exists");
assert(evidence.vercel.teamSlug==="orbi4"&&evidence.vercel.teamPlanObserved==="hobby","Vercel team and observed plan are recorded");
assert(evidence.vercel.projectId==="prj_M8Su8hDIEyLgHWMyagPpQDJ6JoLQ"&&evidence.vercel.projectName==="orbi-condo-pc2","Vercel project is pinned exactly");
assert(evidence.vercel.projectLiveObserved===false&&evidence.vercel.nodeVersionObserved==="24.x","current Vercel project/runtime observations are recorded");
assert(/^dpl_[A-Za-z0-9]+$/.test(evidence.vercel.previewDeploymentId)&&evidence.vercel.previewDeploymentRegionObserved==="iad1","observed Preview deployment and Function region are pinned");
assert(evidence.analysis.currentDynamicComputeAndDatabaseColocated===false,"current staging regional separation is explicit");
assert(evidence.analysis.recommendedSupabaseProductionRegionCandidate==="sa-east-1","Supabase Production recommendation remains a candidate only");
assert(evidence.analysis.recommendedVercelFunctionRegionCandidate==="gru1"&&evidence.analysis.vercelCandidateMustBeRevalidatedBeforeConfiguration===true,"Vercel candidate must be revalidated before mutation");
assert(evidence.analysis.legalOrContractualApprovalForBrazilRecorded===false,"no legal/contractual Brazil approval is invented");
assert(evidence.analysis.chileSupabaseRegionObservedInCurrentDocs===false,"no Chile Supabase region is invented");
for(const [name,value] of Object.entries(evidence.mutations)){
 assert(value===false,`region inventory proves no mutation: ${name}`);
}
assert(/not legal approval/i.test(evidence.claim)&&/not.*Production configuration/i.test(evidence.claim),"evidence claim cannot be misread as legal or Production approval");

assert(pkg.scripts["test:region-residency"]==="node scripts/test-region-residency-recommendation.mjs","region recommendation contract has an explicit npm script");
assert(pkg.scripts.check.includes("npm run test:region-residency"),"full quality gate executes region recommendation contract");

console.log("REGION / DATA RESIDENCY RECOMMENDATION CONTRACT GREEN");
