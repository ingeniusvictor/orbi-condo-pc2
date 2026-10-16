import assert from "node:assert/strict";
import fs from "node:fs";

const source=fs.readFileSync("next.config.ts","utf8");

const match=/const structuralContentSecurityPolicy="([^"]+)";/.exec(source);
assert.ok(match,"next.config must declare a structural CSP constant");
const csp=match[1];

for(const directive of ["base-uri 'self'","form-action 'self'","frame-ancestors 'self'","object-src 'none'"]){
 assert.equal(csp.includes(directive),true,`CSP must include ${directive}`);
}
assert.equal(/(?:^|;\s*)default-src\b/.test(csp),false,"structural CSP must not accidentally introduce default-src before nonce/hash design");
assert.equal(/(?:^|;\s*)script-src\b/.test(csp),false,"structural CSP must not block Next bootstrap scripts before nonce/hash design");
assert.equal(/(?:^|;\s*)style-src\b/.test(csp),false,"structural CSP must not block Next inline styles before nonce/hash design");
assert.equal(csp.includes("'unsafe-eval'"),false,"CSP must never opt into unsafe-eval");
assert.equal(csp.includes("*"),false,"CSP must not contain wildcard sources");
assert.match(source,/\{key:"Content-Security-Policy",value:structuralContentSecurityPolicy\}/,"CSP must be emitted as an enforced response header");
assert.match(source,/\{source:"\/\(\.\*\)",headers:securityHeaders\}/,"CSP must cover the whole application through the shared security header set");

console.log("STRUCTURAL CONTENT SECURITY POLICY CONTRACT GREEN");
