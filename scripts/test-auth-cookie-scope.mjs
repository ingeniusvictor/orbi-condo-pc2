import assert from "node:assert/strict";
import fs from "node:fs";

const source=fs.readFileSync("lib/server/operations-cookies.ts","utf8");
const login=fs.readFileSync("app/api/auth/login/route.ts","utf8");
const refresh=fs.readFileSync("app/api/auth/refresh/route.ts","utf8");
const logout=fs.readFileSync("app/api/auth/logout/route.ts","utf8");

assert.match(source,/httpOnly:true/);
assert.match(source,/secure:process\.env\.NODE_ENV==="production"/);
assert.match(source,/sameSite:"strict" as const/);
assert.match(source,/const sessionCookie=\{\.\.\.cookieSecurity,path:"\/api"\}/);
assert.match(source,/const refreshCookie=\{\.\.\.cookieSecurity,path:"\/api\/auth"\}/);
assert.doesNotMatch(source,/path:"\/"[},]/,"private auth cookies must not be site-wide");
assert.doesNotMatch(source,/domain\s*:/i,"cookies must remain host-only");

assert.match(source,/setOperationsSessionCookie[\s\S]*?\.\.\.sessionCookie,maxAge/);
assert.match(source,/setOperationsRefreshCookie[\s\S]*?token,refreshCookie/);
assert.match(source,/clearOperationsSessionCookie[\s\S]*?\.\.\.sessionCookie,maxAge:0/);
assert.match(source,/clearOperationsCookies[\s\S]*?OPERATIONS_REFRESH_COOKIE,"",\{\.\.\.refreshCookie,maxAge:0\}/);

assert.match(login,/setOperationsSessionCookie\(response,session\.access_token,expires\)/);
assert.match(login,/setOperationsRefreshCookie\(response,session\.refresh_token\)/);
assert.match(refresh,/clearOperationsCookies|clearOperationsSessionCookie/);
assert.match(refresh,/setOperationsSessionCookie\(response,session\.access_token,expires\)/);
assert.match(refresh,/setOperationsRefreshCookie\(response,rotatedRefresh\)/);
assert.match(logout,/clearOperationsCookies\(response\)/);

console.log("PASS access cookie is limited to /api and refresh cookie to /api/auth with path-matched clearing");
