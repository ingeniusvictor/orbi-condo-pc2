import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {EXPECTED_ROLE_PERMISSIONS,assertExactRolePermissions} from "./qa-role-permissions.mjs";

const script="scripts/qa-private-operations.mjs";
const cleanBaseEnv={...process.env};
for(const key of [
 "ORBI_QA_BASE_URL","ORBI_QA_EMAIL","ORBI_QA_PASSWORD","ORBI_QA_ROLE","ORBI_QA_COMMUNITY_ID","ORBI_QA_409","ORBI_QA_ALLOW_PRODUCTION","ORBI_QA_DATE","ORBI_QA_VERCEL_BYPASS",
])delete cleanBaseEnv[key];

function run(extraEnv={}){
 const result=spawnSync(process.execPath,[script],{
  env:{...cleanBaseEnv,...extraEnv},
  encoding:"utf8",
  timeout:5000,
 });
 return {status:result.status,output:`${result.stdout||""}${result.stderr||""}`};
}
function expectExit2(result,label,needle){
 assert.equal(result.status,2,`${label} should fail closed with exit 2; output=${result.output}`);
 assert.match(result.output,new RegExp(needle,"i"),`${label} should explain rejection`);
}
function sorted(values){return [...values].sort()}

const permissionSource=readFileSync("data/operations-permissions.ts","utf8");
for(const role of ["administrator","committee","concierge","mayordomo","resident"]){
 const marker=`${role}: [`;
 const start=permissionSource.indexOf(marker);
 assert.notEqual(start,-1,`canonical permission source missing role ${role}`);
 const contentStart=start+marker.length;
 const end=permissionSource.indexOf("]",contentStart);
 assert.notEqual(end,-1,`canonical permission source has unterminated role ${role}`);
 const canonical=[...permissionSource.slice(contentStart,end).matchAll(/"([^"]+)"/g)].map((match)=>match[1]);
 assert.deepEqual(sorted(EXPECTED_ROLE_PERMISSIONS[role]),sorted(canonical),`QA permission contract drifted from canonical role ${role}`);
 assert.equal(assertExactRolePermissions(role,canonical),canonical.length,`exact permission assertion failed for canonical role ${role}`);
}
assert.throws(()=>assertExactRolePermissions("concierge",[...EXPECTED_ROLE_PERMISSIONS.concierge,"manage_shift_schedule"]),/unexpected=.*manage_shift_schedule/i);
assert.throws(()=>assertExactRolePermissions("mayordomo",EXPECTED_ROLE_PERMISSIONS.mayordomo.filter((permission)=>permission!=="manage_incident")),/missing=.*manage_incident/i);
assert.throws(()=>assertExactRolePermissions("concierge",[...EXPECTED_ROLE_PERMISSIONS.concierge,"report_incident"]),/duplicates/i);
console.log("PASS QA exact-permission matrix matches canonical role contract and fails closed on drift");

const missingBase=run();
expectExit2(missingBase,"missing base URL","Missing ORBI_QA_BASE_URL");
console.log("PASS QA runner has no implicit deployment default");

const production=run({
 ORBI_QA_BASE_URL:"https://orbi-condo-pc2.vercel.app",
 ORBI_QA_EMAIL:"synthetic@example.invalid",
 ORBI_QA_PASSWORD:"synthetic-password",
});
expectExit2(production,"production hostname","Refusing to run QA against the production hostname");
console.log("PASS QA runner blocks production by default");

const insecureRemote=run({
 ORBI_QA_BASE_URL:"http://preview.example.invalid",
 ORBI_QA_EMAIL:"synthetic@example.invalid",
 ORBI_QA_PASSWORD:"synthetic-password",
});
expectExit2(insecureRemote,"insecure remote URL","HTTPS is required");
console.log("PASS QA runner rejects non-HTTPS remote targets");

const embeddedCredentials=run({
 ORBI_QA_BASE_URL:"https://user:pass@preview.example.invalid",
 ORBI_QA_EMAIL:"synthetic@example.invalid",
 ORBI_QA_PASSWORD:"synthetic-password",
});
expectExit2(embeddedCredentials,"URL credentials","Embedded credentials");
console.log("PASS QA runner rejects credentials embedded in target URL");

const invalidRole=run({
 ORBI_QA_BASE_URL:"http://localhost:3999",
 ORBI_QA_EMAIL:"synthetic@example.invalid",
 ORBI_QA_PASSWORD:"synthetic-password",
 ORBI_QA_ROLE:"superadmin",
});
expectExit2(invalidRole,"invalid role","Invalid ORBI_QA_ROLE");
console.log("PASS QA runner rejects undeclared operational roles before network access");

const bypassSecret="qa-vercel-bypass-secret-must-not-leak";
const foreignBypass=run({
 ORBI_QA_BASE_URL:"https://preview.example.invalid",
 ORBI_QA_EMAIL:"synthetic@example.invalid",
 ORBI_QA_PASSWORD:"synthetic-password",
 ORBI_QA_VERCEL_BYPASS:bypassSecret,
});
expectExit2(foreignBypass,"foreign bypass target","non-Vercel hostname");
assert.equal(foreignBypass.output.includes(bypassSecret),false,"bypass secret must never be echoed in failure output");
console.log("PASS Vercel bypass secret is host-scoped and never echoed");

console.log("QA RUNNER SAFETY CONTRACT GREEN");
