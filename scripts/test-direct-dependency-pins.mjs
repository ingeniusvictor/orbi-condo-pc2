import assert from "node:assert/strict";
import fs from "node:fs";

const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
const groups={dependencies:pkg.dependencies??{},devDependencies:pkg.devDependencies??{}};
let count=0;
for(const [group,entries] of Object.entries(groups)){
 for(const [name,version] of Object.entries(entries)){
  count++;
  assert.equal(typeof version,"string",`${group}.${name} must declare a version`);
  assert.match(version,/^\d+\.\d+\.\d+$/,`${group}.${name} must be pinned to an exact stable version, not a range/tag/git source`);
 }
}
assert.ok(count>=8,"direct dependency pin contract must cover the current runtime and development surface");
assert.equal(pkg.dependencies.next,"16.4.1","Next.js patched security baseline must stay exact");
assert.equal(pkg.dependencies.react,"19.2.8","React RSC patched baseline must stay exact");
assert.equal(pkg.dependencies["react-dom"],"19.2.8","ReactDOM must remain aligned with React");

console.log(`PASS ${count} direct runtime/dev dependencies are exact-version pinned`);
console.log("DIRECT DEPENDENCY PIN CONTRACT GREEN");
