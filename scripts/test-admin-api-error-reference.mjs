import assert from "node:assert/strict";
import fs from "node:fs";
import {isAmbiguousMutationFailure,privateApiMethod,privateApiPath,safeRequestReference,shouldExposeFailureReference} from "../lib/client-request-reference.ts";

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

const oldWindow=globalThis.window;
globalThis.window={location:{origin:"https://orbi.test"}};
assert.equal(privateApiPath("/api/operations/incidents/report"),"/api/operations/incidents/report");
assert.equal(privateApiPath("https://orbi.test/api/operations/incidents/report?x=1"),"/api/operations/incidents/report");
assert.equal(privateApiPath("https://attacker.example/api/operations/incidents/report"),"");
globalThis.window=oldWindow;
assert.equal(privateApiMethod("/api/operations/x",{method:"post"}),"POST");
assert.equal(privateApiMethod("/api/operations/x"),"GET");

assert.equal(isAmbiguousMutationFailure("/api/operations/incidents/report","POST"),true);
for(const status of [500,502,503])assert.equal(isAmbiguousMutationFailure("/api/operations/incidents/report","POST",status),true);
for(const status of [200,201,400,409,422,429])assert.equal(isAmbiguousMutationFailure("/api/operations/incidents/report","POST",status),false);
assert.equal(isAmbiguousMutationFailure("/api/operations/incidents/report","GET",500),false);
assert.equal(isAmbiguousMutationFailure("/api/auth/login","POST",500),false);
assert.equal(isAmbiguousMutationFailure("/api/public/demo","POST",500),false);

const component=fs.readFileSync("app/operaciones/private-api-failure-reference.tsx","utf8");
const layout=fs.readFileSync("app/operaciones/layout.tsx","utf8");
assert.match(component,/response\.headers\.get\("x-orbi-request-id"\)/);
assert.match(component,/Referencia técnica disponible/);
assert.match(component,/Resultado no confirmado/);
assert.match(component,/No repitas la acción todavía/);
assert.match(component,/Actualiza la consola y verifica si el cambio ya quedó registrado/);
assert.match(component,/El aviso desaparecerá cuando la consola confirme una lectura nueva/);
assert.match(component,/pathname==="\/api\/operations\/dashboard"&&method==="GET"&&response\.ok/);
assert.match(component,/isAmbiguousMutationFailure\(pathname,method,response\.status\)/);
assert.match(component,/isAmbiguousMutationFailure\(pathname,method\)/);
assert.match(component,/!ambiguous&&<button/);
assert.match(component,/No copies contraseñas, datos personales ni contenido privado/);
assert.match(component,/window\.fetch===wrappedFetch/);
assert.match(layout,/PrivateApiFailureReference/);

for(const forbidden of ["response.json(","response.text(","response.clone(","console.log(","console.error(","sendBeacon(","localStorage","sessionStorage","document.cookie","error.message","error.stack","Authorization","Bearer "]){
 assert.equal(component.includes(forbidden),false,`forbidden client failure-reference behavior: ${forbidden}`);
}

console.log("PASS Administrator API failures expose safe references and block blind retries after ambiguous mutations");
