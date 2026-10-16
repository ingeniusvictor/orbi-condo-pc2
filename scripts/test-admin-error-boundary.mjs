import fs from "node:fs";

function read(path){return fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");}
function assert(condition,message){if(!condition)throw new Error(`FAIL ${message}`);console.log(`PASS ${message}`);}
function stripComments(source){return source.replace(/\/\*[\s\S]*?\*\//g,"").replace(/\/\/.*$/gm,"");}

const source=read("app/operaciones/error.tsx");
const code=stripComments(source);
const pkg=JSON.parse(read("package.json"));

assert(source.startsWith('"use client"'),"operations error boundary is a client error boundary");
assert(source.includes("reset:()=>void")&&source.includes("onClick={reset}"),"error boundary exposes an explicit safe retry action");
assert(source.includes('href="/panel-operativo"'),"error boundary offers a controlled local escape path");
assert(source.includes('role="alert"')&&source.includes('aria-live="assertive"'),"unexpected workspace failure is announced accessibly");
assert(source.includes("SAFE_DIGEST")&&source.includes("error.digest"),"only an opaque framework digest may become a support reference");
assert(/\^\[A-Za-z0-9_\-\]\{1,80\}\$/.test(source),"support digest uses a strict bounded allowlist");
assert(source.includes("Referencia técnica"),"safe support reference is labeled for the Administrator");

for(const property of ["message","stack","cause","name"]){
 assert(!new RegExp(`error\\s*\\.\\s*${property}\\b`).test(code),`error.${property} is never rendered or inspected`);
}
assert(!/console\.(?:log|error|warn|info)/.test(code),"error boundary does not duplicate exception content into browser/runtime logs");
assert(!/JSON\.stringify\s*\(\s*error\s*\)/.test(code),"raw error object is never serialized");
assert(!/fetch\s*\(/.test(code),"error boundary performs no network request or telemetry export");
assert(!/<input\b|<textarea\b|<form\b/i.test(source),"error state cannot solicit sensitive incident details");
assert(source.includes("No copies datos personales, credenciales ni contenido privado"),"support guidance explicitly forbids copying private data");
assert(!/https?:\/\//i.test(source),"error state contains no external support destination or exfiltration link");

assert(pkg.scripts["test:admin-error-boundary"]==="node scripts/test-admin-error-boundary.mjs","Administrator error-boundary contract has an explicit npm script");
assert(pkg.scripts.check.includes("npm run test:admin-error-boundary"),"full quality gate executes Administrator error-boundary contract");

console.log("ADMINISTRATOR ERROR BOUNDARY CONTRACT GREEN");
