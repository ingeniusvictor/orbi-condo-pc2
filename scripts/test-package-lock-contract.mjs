import assert from "node:assert/strict";
import fs from "node:fs";

assert.equal(fs.existsSync("package-lock.json"),true,"package-lock.json must be committed");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
const lock=JSON.parse(fs.readFileSync("package-lock.json","utf8"));
const workflow=fs.readFileSync(".github/workflows/quality.yml","utf8");

assert.equal(lock.lockfileVersion,3,"npm lockfileVersion must stay at 3");
assert.deepEqual(lock.packages?.[""]?.dependencies,pkg.dependencies,"lockfile root runtime dependencies must exactly match package.json");
assert.deepEqual(lock.packages?.[""]?.devDependencies,pkg.devDependencies,"lockfile root dev dependencies must exactly match package.json");

const reviewed={
 "node_modules/next":"16.4.1",
 "node_modules/react":"19.2.8",
 "node_modules/react-dom":"19.2.8",
 "node_modules/framer-motion":"12.23.25",
 "node_modules/motion-dom":"12.40.0",
 "node_modules/motion-utils":"12.39.0",
};
for(const [path,version] of Object.entries(reviewed)){
 assert.equal(lock.packages?.[path]?.version,version,`${path} must stay at reviewed locked version ${version}`);
}
assert.equal(pkg.overrides?.["motion-dom"],"12.40.0");
assert.equal(pkg.overrides?.["motion-utils"],"12.39.0");

const ciCommands=workflow.match(/run: npm ci --no-audit --no-fund/g)??[];
assert.equal(ciCommands.length,2,"both Node 22 and Node 24 jobs must install with npm ci");
const cachePaths=workflow.match(/cache-dependency-path: package-lock\.json/g)??[];
assert.equal(cachePaths.length,2,"both npm caches must be keyed by package-lock.json");
assert.doesNotMatch(workflow,/npm install --no-audit --no-fund/,"Quality Gate must not fall back to range-resolving npm install");

assert.equal(fs.existsSync("app/api/dependency-lock-bootstrap/route.ts"),false,"temporary Preview lockfile endpoint must be absent");
assert.equal(fs.existsSync(".github/workflows/bootstrap-lock.yml"),false,"one-shot lock bootstrap workflow must be absent");

console.log("PASS committed npm lockfile exactly matches direct dependency declarations");
console.log("PASS reviewed Next/React/Motion dependency tree is transitively locked");
console.log("PASS Node 22/24 Quality Gate installs reproducibly with npm ci and lockfile-based cache keys");
console.log("PASS lockfile bootstrap surfaces are absent from the final branch");
console.log("PACKAGE LOCK REPRODUCIBILITY CONTRACT GREEN");
