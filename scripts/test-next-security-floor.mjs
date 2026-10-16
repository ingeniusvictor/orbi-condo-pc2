import assert from "node:assert/strict";
import fs from "node:fs";

const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
const declared=pkg.dependencies?.next;
assert.equal(typeof declared,"string","Next.js dependency must be declared");
assert.match(declared,/^\d+\.\d+\.\d+$/,"security-sensitive Next.js dependency must be pinned to an exact stable version");

const [major,minor,patch]=declared.split(".").map(Number);
const patched=major>16||(major===16&&(minor>4||(minor===4&&patch>=1)));
assert.equal(patched,true,`Next.js ${declared} is below the patched security floor 16.4.1`);
assert.equal(declared,"16.4.1","current reviewed security baseline is pinned exactly to Next.js 16.4.1");

console.log(`PASS Next.js ${declared} meets the reviewed 16.4.1 security baseline`);
console.log("NEXT SECURITY FLOOR CONTRACT GREEN");
