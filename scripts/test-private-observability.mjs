import fs from "node:fs";

function read(path){return fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");}
function assert(condition,message){if(!condition)throw new Error(`FAIL ${message}`);console.log(`PASS ${message}`);}
function stripComments(source){return source.replace(/\/\*[\s\S]*?\*\//g,"").replace(/\/\/.*$/gm,"");}

const proxy=read("proxy.ts");
const instrumentation=read("instrumentation.ts");
const instrumentationCode=stripComments(instrumentation);
const doc=read("docs/ADMINISTRATOR-OBSERVABILITY.md");
const pkg=JSON.parse(read("package.json"));

assert(proxy.includes('crypto.randomUUID()'),"private API correlation uses a fresh opaque UUID");
assert(proxy.includes('requestHeaders.set(ORBI_REQUEST_ID_HEADER,requestId)'),"client correlation value is overwritten before reaching private handlers");
assert(proxy.includes('response.headers.set(ORBI_REQUEST_ID_HEADER,requestId)'),"same correlation UUID is returned to the caller");
assert(proxy.includes('"/api/auth/:path*"')&&proxy.includes('"/api/operations/:path*"'),"proxy matcher is limited to private API families");
assert(!proxy.includes('matcher:"/:path*"')&&!proxy.includes('matcher:["/:path*"'),"proxy does not instrument the whole site");

assert(instrumentation.includes('orbi.private.unhandled_error'),"uncaught private errors use a fixed event code");
assert(instrumentation.includes('normalizeRoute(context.routePath)'),"error logging uses framework route templates rather than raw request URLs");
assert(instrumentation.includes('SAFE_ROUTE'),"only private auth/operations route templates can be logged");
assert(instrumentation.includes('console.error(JSON.stringify(entry))'),"runtime failure evidence is one structured JSON log line");
assert(!/\b(?:err|error|_error)\s*\.\s*(?:message|stack|cause|name)\b/.test(instrumentationCode),"exception message, stack, cause and name are not logged");
assert(!/request\s*\.\s*path\b/.test(instrumentationCode),"raw request path and query string are not logged");
assert(!/request\s*\.\s*(?:body|url|nextUrl|cookies?)\b/.test(instrumentationCode),"request body, URL and cookies are not logged");
assert(!/headers\s*\[\s*["'](?:authorization|cookie|user-agent|x-forwarded-for)["']\s*\]/i.test(instrumentationCode),"sensitive request headers are not read by instrumentation");
assert(!/JSON\.stringify\s*\(\s*(?:request|_error|error|err)\s*\)/.test(instrumentationCode),"raw request/error objects are never serialized");

for(const marker of ["SYNTHETIC STAGING ONLY","NO REAL PII","PRODUCTION BLOCKED","no activa monitoring de Production","No se crea log drain"]){
 assert(doc.includes(marker),`observability document preserves boundary: ${marker}`);
}
assert(doc.includes("body o payload")&&doc.includes("query string")&&doc.includes("access token")&&doc.includes("stack trace"),"documentation explicitly prohibits private payload/error-detail logging");

assert(pkg.scripts["test:private-observability"]==="node scripts/test-private-observability.mjs","private observability contract has an explicit npm script");
assert(pkg.scripts.check.includes("npm run test:private-observability"),"full quality gate executes private observability contract");

console.log("PRIVATE OBSERVABILITY CONTRACT GREEN");
