import assert from "node:assert/strict";
import fs from "node:fs";

const page=fs.readFileSync("app/operaciones/page.tsx","utf8");
const compact=fs.readFileSync("app/operaciones/compact-workspace.tsx","utf8");
const compactCss=fs.readFileSync("app/operaciones/compact-workspace.module.css","utf8");
const compactActivity=fs.readFileSync("app/operaciones/compact-activity-drawer.tsx","utf8");
const extended=fs.readFileSync("app/operaciones/extended-workspace.tsx","utf8");
const extendedRoute=fs.readFileSync("app/operaciones/extendida/page.tsx","utf8");
const legacyActivity=fs.readFileSync("components/PrivateOperationsActivity.tsx","utf8");
const viewport=fs.readFileSync("components/PrivateOperationsViewport.tsx","utf8");
const floatingNav=fs.readFileSync("components/FloatingNav.tsx","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));

assert.match(page,/CompactOperationsWorkspace/,"/operaciones must render compact workspace by default");
assert.match(page,/CompactActivityDrawer/,"compact view must retain recent operational activity without adding a long page section");
assert.match(compact,/Modo de vista/);
assert.match(compact,/Compacta/);
assert.match(compact,/\/operaciones\/extendida/);
assert.match(extendedRoute,/ExtendedOperationsWorkspace/);
assert.match(extendedRoute,/\/operaciones/);

for(const marker of [
 "Turnos de hoy","Incidencias activas","Acciones rápidas","Cobertura y personal","Continuidad del corte","Seguridad y trazabilidad","Nuevo módulo","Más módulos"
]) assert.ok(compact.includes(marker),`compact workspace must include ${marker}`);

for(const endpoint of [
 "/api/auth/session","/api/auth/login","/api/auth/logout","/api/auth/refresh","/api/operations/dashboard","/api/operations/shifts/report-gap","/api/operations/shifts/handoff","/api/operations/shifts/command","/api/operations/incidents/report","/api/operations/incidents/command"
]) assert.ok(compact.includes(endpoint),`compact workspace must preserve current operational endpoint ${endpoint}`);

for(const marker of ["Turnos privados","Continuidad y escalamiento","Registro estructurado","Frontera P1F"])
 assert.ok(extended.includes(marker),`extended workspace must preserve legacy surface ${marker}`);

assert.match(compactActivity,/Actividad reciente/);
assert.match(compactActivity,/BITÁCORA PRIVADA/);
assert.match(compactActivity,/\/api\/operations\/dashboard/);
assert.match(compactActivity,/Abrir Conserjería/);
assert.doesNotMatch(compactActivity,/\/api\/operations\/(?:shifts|incidents|shift-log|rounds)\//,"compact activity drawer must remain read-only");
assert.doesNotMatch(compactActivity,/localStorage|sessionStorage|document\.cookie/,"compact activity drawer must not persist or inspect private credentials");

assert.ok(legacyActivity.includes('pathname!=="/operaciones/extendida"'),"full legacy activity stream must follow the extended view");
assert.ok(!legacyActivity.includes('pathname!=="/operaciones"'),"legacy full activity stream must not append below the compact dashboard");
assert.ok(viewport.includes('pathname==="/operaciones"||pathname==="/operaciones/extendida"'),"both modes must inherit the private viewport class");
assert.ok(floatingNav.includes('pathname==="/operaciones"||pathname==="/operaciones/extendida"||pathname==="/conserjeria"'),"public floating navigation must stay hidden on both private operations modes");

assert.ok(compact.includes('useState<SectionKey>("resumen")'),"compact summary must be the default section");
assert.ok(!compact.includes("localStorage")&&!compact.includes("sessionStorage"),"view selection must not persist private state in browser storage");
assert.ok(compactCss.includes("grid-template-columns:230px")&&compactCss.includes("@media(max-width:860px)"),"compact workspace must define desktop and mobile layouts");
assert.ok(compactCss.includes(".mobileTabs"),"compact workspace must provide a mobile navigation surface");
assert.equal(pkg.scripts["test:operations-view-modes"],"node scripts/test-operations-view-modes.mjs");
assert.ok(pkg.scripts.check.includes("test:operations-view-modes"),"full Quality Gate must execute dual-view contract");

console.log("PASS compact view is the default and extended view remains available");
console.log("PASS compact view preserves all currently exposed private operational commands");
console.log("PASS recent activity remains available without extending compact-page scroll");
console.log("PASS extended view preserves the previous private shell and full activity surface");
console.log("PASS modular navigation and responsive growth surfaces are present");
console.log("OPERATIONS DUAL VIEW CONTRACT GREEN");
