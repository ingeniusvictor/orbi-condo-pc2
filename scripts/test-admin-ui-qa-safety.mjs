import {readFile} from "node:fs/promises";

const workflow=await readFile(new URL("../.github/workflows/admin-ui-qa.yml",import.meta.url),"utf8");
const runner=await readFile(new URL("./qa-admin-ui.mjs",import.meta.url),"utf8");
const css=await readFile(new URL("../app/private-operations.css",import.meta.url),"utf8");

function assert(condition,message){if(!condition)throw new Error(message)}

assert(workflow.includes("workflow_dispatch:"),"UI QA workflow must remain manual-only");
assert(workflow.includes("github.ref == 'refs/heads/main'"),"UI QA workflow must execute only from reviewed main");
assert(workflow.includes("permissions:\n  contents: read"),"UI QA workflow token must stay read-only");
assert(workflow.includes("persist-credentials: false"),"UI QA checkout must not persist Git credentials");
assert(workflow.includes("Validate requested target before secrets"),"Target validation must occur before secret-bearing UI QA step");
assert(workflow.includes("ORBI_QA_ADMIN_EMAIL")&&workflow.includes("ORBI_QA_ADMIN_PASSWORD")&&workflow.includes("ORBI_QA_VERCEL_BYPASS"),"Administrator UI QA must use the existing scoped QA secrets");
assert(!workflow.includes("SUPABASE_SERVICE_ROLE")&&!workflow.includes("sb_secret_")&&!workflow.includes("SERVICE_ROLE"),"UI QA must not receive database-admin/service-role secrets");
assert(runner.includes('baseUrl.hostname==="orbi-condo-pc2.vercel.app"'),"UI runner must reject the production hostname");
assert(runner.includes("/^orbi-condo-pc2-[a-z0-9-]+-orbi4\\.vercel\\.app$/"),"UI runner must allow only ORBI LIVING orbi4 Preview hostnames");
assert(runner.includes("390,height:844")&&runner.includes("430,height:932")&&runner.includes("768,height:1024")&&runner.includes("1440,height:900")&&runner.includes("1920,height:1080"),"UI runner must cover all five canonical responsive viewports");
assert(runner.includes("page.keyboard.press(\"Tab\")")&&runner.includes("focusIsVisible"),"UI runner must verify keyboard order and visible focus");
assert(runner.includes("Accessible-name audit")&&runner.includes("horizontal overflow"),"UI runner must fail on accessibility-name or horizontal-overflow regressions");
assert(!runner.includes("/api/operations/shifts/command")&&!runner.includes("/api/operations/incidents/command")&&!runner.includes("/api/operations/incidents/report")&&!runner.includes("/api/operations/shift-log/")&&!runner.includes("/api/operations/rounds/"),"Browser UI QA must remain read-only for operational data");
assert(css.includes("min-height: 44px !important")&&css.includes(":focus-visible"),"Private route must preserve 44px controls and visible focus styling");

console.log("PASS Administrator UI QA safety contract");
