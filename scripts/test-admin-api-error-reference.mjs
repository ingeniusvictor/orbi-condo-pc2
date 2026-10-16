import assert from "node:assert/strict";
import fs from "node:fs";
import {safeRequestReference,shouldExposeFailureReference} from "../lib/client-request-reference.ts";

const valid="7B55BCA8-2B4E-4F59-974C-17C8E6753F53";
assert.equal(safeRequestReference(valid),valid.toLowerCase());
assert.equal(safeRequestReference(`  ${valid}  `),valid.toLowerCase());
for(const bad of [null,"","not-a-uuid","00000000-0000-0000-0000-000000000000","7b55bca8-2b4e-5f59-974c-17c8e6753f53","7b55bca8-2b4e-4f59-774c-17c8e6753f53","Bearer secret-token"]){assert.equal(safeRequestReference(bad),null);}

for(const status of [400,409,422,429,500,503])assert.equal(shouldExposeFailureReference("/api/operations/incidents/report",status),true);
for(const status of [200,204,401,403])assert.equal(shouldExposeFailureReference("/api/operations/incidents/report",status),false);
assert.equal(shouldExposeFailureReference("/api/auth/login",429),true);
assert.equal(shouldExposeFailureReference("/api/auth/session",500),true);
for(const status of [400,401,403,404])assert.equal(shouldExposeFailureReference("/api/auth/login",status),false);
assert.equal(shouldExposeFailureReference("/api/public/demo",500),false);
assert.equal(shouldExposeFailureReference("https://attacker.example/api/operations/x",500),false);

const component=fs.readFileSync("app/operaciones/private-api-failure-reference.tsx","utf8");
const layout=fs.readFileSync("app/operaciones/layout.tsx","utf8");
assert.match(component,/response\.headers\.get\("x-orbi-request-id"\)/);
assert.match(component,/Referencia técnica disponible/);
assert.match(component,/No copies contraseñas, datos personales ni contenido privado/);
assert.match(component,/window\.fetch===wrappedFetch/);
assert.match(layout,/PrivateApiFailureReference/);

for(const forbidden of ["response.json(","response.text(","response.clone(","console.log(","console.error(","sendBeacon(","localStorage","sessionStorage","document.cookie","error.message","error.stack","Authorization","Bearer "]){
 assert.equal(component.includes(forbidden),false,`forbidden client failure-reference behavior: ${forbidden}`);
}

console.log("PASS Administrator API failures expose only validated opaque request references");
