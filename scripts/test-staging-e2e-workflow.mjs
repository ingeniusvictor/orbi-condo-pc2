import assert from "node:assert/strict";
import fs from "node:fs";

const workflow=fs.readFileSync(".github/workflows/staging-e2e.yml","utf8");
const runner=fs.readFileSync("scripts/qa-private-operations.mjs","utf8");

function includes(value,label){assert(workflow.includes(value),`staging E2E workflow missing ${label}`)}

includes("workflow_dispatch:","manual dispatch trigger");
assert.equal(/^\s*push:/m.test(workflow),false,"secret-bearing staging E2E must not run on push");
assert.equal(/^\s*pull_request:/m.test(workflow),false,"secret-bearing staging E2E must not run on pull_request");
includes("permissions:\n  contents: read","read-only workflow permissions");
includes("if: github.ref == 'refs/heads/main'","reviewed-main execution guard");
includes("cancel-in-progress: false","serialized non-cancelling concurrency");
includes("actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1","pinned checkout action");
includes("actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1","pinned setup-node action");
includes("persist-credentials: false","non-persistent checkout credentials");
console.log("PASS staging E2E remains manual, read-only and reviewed-main only");

includes("orbi-condo-pc2.vercel.app","explicit production hostname rejection");
includes("/^orbi-condo-pc2-[a-z0-9-]+-orbi4\\.vercel\\.app$/","project/team Preview allowlist");
includes("target_url must contain only the deployment origin","origin-only target validation");
assert.equal(workflow.includes("ORBI_QA_ALLOW_PRODUCTION"),false,"manual staging workflow must never expose production override");
assert.equal(workflow.includes("VERCEL_TOKEN"),false,"staging E2E must not receive deployment credentials");
console.log("PASS target validation prevents production and foreign-project credential delivery");

for(const secret of [
 "ORBI_QA_ADMIN_EMAIL","ORBI_QA_ADMIN_PASSWORD",
 "ORBI_QA_MAYORDOMO_EMAIL","ORBI_QA_MAYORDOMO_PASSWORD",
 "ORBI_QA_CONCIERGE_EMAIL","ORBI_QA_CONCIERGE_PASSWORD",
 "ORBI_QA_VERCEL_BYPASS",
])includes(`secrets.${secret}`,`secret reference ${secret}`);
includes("run_conflict requires administrator or mayordomo","role-aware 409 guard");
includes("ORBI_QA_409: '0'","concierge mutation override disabled");
console.log("PASS role-specific synthetic credentials and reversible conflict guard are explicit");

assert(runner.includes('"x-vercel-protection-bypass":vercelBypass'),"runner missing scoped Vercel protection bootstrap header");
assert(runner.includes('"x-vercel-set-bypass-cookie":"true"'),"runner missing Vercel bypass cookie request");
assert(runner.includes('jar.has("_vercel_jwt")'),"runner must verify scoped Vercel JWT cookie");
assert.equal((runner.match(/x-vercel-protection-bypass/g)||[]).length,1,"bypass secret header must be used only during bootstrap");
assert(runner.includes("Refusing to send ORBI_QA_VERCEL_BYPASS to a non-Vercel hostname"),"runner must fail closed before sending bypass to foreign hosts");
console.log("PASS protected Preview bypass is bootstrap-only and cookie-scoped");

console.log("STAGING E2E WORKFLOW CONTRACT GREEN");
