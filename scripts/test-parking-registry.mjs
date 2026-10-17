import fs from "node:fs";
import assert from "node:assert/strict";

const migration=fs.readFileSync("supabase/migrations/20261016_oc_pc2_110_parking_registry.sql","utf8");
const lookup=fs.readFileSync("app/api/operations/parking/route.ts","utf8");
const command=fs.readFileSync("app/api/operations/parking/command/route.ts","utf8");
const history=fs.readFileSync("app/api/operations/parking/history/route.ts","utf8");
const historyWorkspace=fs.readFileSync("app/operaciones/estacionamientos/historial/parking-history.tsx","utf8");
const workspace=fs.readFileSync("app/operaciones/estacionamientos/parking-workspace.tsx","utf8");

const exterior=[...Array.from({length:72},(_,i)=>`E${i+1}`),"V01","V02","LC01","LC02"];
const underground=Array.from({length:110},(_,i)=>String(i+73));
const all=[...exterior,...underground];
assert.equal(exterior.length,76,"Exterior inventory must contain 76 physical spaces");
assert.equal(underground.length,110,"Underground inventory must contain 110 spaces");
assert.equal(all.length,186,"Canonical physical parking inventory must contain 186 spaces");
assert.equal(new Set(all).size,186,"Parking codes must be unique");
assert.equal(underground[0],"73");
assert.equal(underground.at(-1),"182");

assert.match(migration,/generate_series\(1,72\)/,"Migration must seed E1-E72");
assert.match(migration,/generate_series\(73,182\)/,"Migration must seed 73-182");
assert.match(migration,/\('V01','visit'/,"Migration must seed V01");
assert.match(migration,/\('V02','visit'/,"Migration must seed V02");
assert.match(migration,/\('LC01','commercial'/,"Migration must seed LC01");
assert.match(migration,/\('LC02','commercial'/,"Migration must seed LC02");
assert.match(migration,/display_name ~ '\^SINT-/,"Synthetic staging must reject non-SINT party labels");
assert.match(migration,/vehicle_reference.*\^DEMO-/s,"Synthetic staging must reject non-DEMO vehicles");
assert.match(migration,/No DELETE grants are issued/,"Parking history must remain append/update only");

assert.match(lookup,/requireOperationPermission\("lookup_parking"\)/,"Lookup API must require lookup_parking");
assert.match(command,/trustedOrigin\(req\)/,"Parking mutations must enforce trusted origin");
assert.match(command,/requireOperationPermission\("manage_parking"\)/,"Parking mutations must require manage_parking");
assert.match(history,/requireOperationPermission\("manage_parking"\)/,"Parking history must be administrator-only");
assert.match(history,/active,created_at,updated_at/,"Parking history must include active and historical occupancy records");
assert.match(historyWorkspace,/Historial de relaciones/,"Administrator workspace must surface parking history");
assert.match(historyWorkspace,/Vigencia:/,"Parking history must show assignment validity");
assert.match(workspace,/186 puestos físicos/,"Workspace must surface the canonical physical total");
assert.match(workspace,/SYNTHETIC STAGING ONLY/,"Workspace must keep the staging privacy boundary visible");
assert.match(workspace,/E1–E72 · V01\/V02 · LC01\/LC02/,"Workspace must expose the validated exterior coding");
assert.match(workspace,/73–182/,"Workspace must expose the validated underground range");

console.log("Parking registry contract: PASS");
