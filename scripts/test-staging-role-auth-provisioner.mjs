import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const path="scripts/provision-staging-role-auth.ps1";
const source=readFileSync(path,"utf8");

assert.match(source,/ValidateSet\("mayordomo", "concierge"\)/,"provisioner must be restricted to Mayordomo and Concierge");
assert.doesNotMatch(source,/ValidateSet\([^\)]*(administrator|committee|resident)/i,"provisioner must not expand to other roles");
assert.match(source,/\$ProjectRef = "drqjpzydgihrrdnkhewh"/,"provisioner must pin the staging Supabase project ref");
assert.match(source,/\$BaseUrl = "https:\/\/drqjpzydgihrrdnkhewh\.supabase\.co"/,"provisioner must pin the staging Supabase URL");
assert.match(source,/\$CommunityId = "pc2"/,"provisioner must pin community pc2");
assert.match(source,/qa-mayordomo-pc2@example\.com/,"Mayordomo must use the synthetic reserved-domain QA email");
assert.match(source,/qa-concierge-pc2@example\.com/,"Concierge must use the synthetic reserved-domain QA email");
assert.match(source,/00000000-0000-4000-8000-000000000102/,"Mayordomo inert placeholder must be pinned");
assert.match(source,/00000000-0000-4000-8000-000000000103/,"Concierge inert placeholder must be pinned");

const dryRun=source.indexOf("if (-not $Apply)");
const firstSecretPrompt=source.indexOf("Read-Host \"Supabase staging secret/service key");
const firstLiveRead=source.indexOf("$users = Get-AdminUsers");
assert.ok(dryRun>=0,"provisioner must have an explicit dry-run gate");
assert.ok(firstSecretPrompt>dryRun,"dry-run gate must occur before secret prompts");
assert.ok(firstLiveRead>firstSecretPrompt,"network-backed provisioning must occur only after Apply + hidden secret prompts");
assert.match(source,/DRY-RUN: no network request or mutation was performed\./,"dry-run output must make the no-mutation state explicit");
assert.ok((source.match(/-AsSecureString/g)||[]).length>=2,"service key and role password must both be collected as SecureString values");

assert.match(source,/\$ServerUserAgent = "orbi-pc2-staging-auth-provisioner\/1\.1"/,"secret-key calls must use an explicit backend User-Agent");
assert.match(source,/UserAgent = \$ServerUserAgent/,"every staging HTTP request must override PowerShell's browser-like default User-Agent");
assert.doesNotMatch(source,/\$ServerUserAgent\s*=\s*"Mozilla\//i,"backend User-Agent must never look like a browser");
assert.match(source,/function New-ServiceHeaders/,"service-key header construction must be centralized");
assert.match(source,/\$Key\.StartsWith\("sb_secret_"\)/,"new opaque Supabase secret keys must have an explicit compatibility path");
assert.match(source,/apikey = \$Key/,"secret/service key must be sent via the apikey header");
assert.doesNotMatch(source,/Authorization\s*=\s*"Bearer \$serviceKey"/,"opaque secret key must never be duplicated directly as Bearer authorization");
assert.match(source,/\$headers\["Authorization"\] = "Bearer \$Key"/,"legacy service_role JWT compatibility may use Bearer only after key-format discrimination");
assert.match(source,/Unsupported staging Auth Admin key format/,"unknown key formats must fail closed before network access");

assert.match(source,/\/auth\/v1\/admin\/users/,"supported Auth Admin endpoint must be used");
assert.match(source,/email_confirm = \$true/,"supported Auth Admin flow must explicitly confirm the synthetic QA email");
assert.match(source,/\/rest\/v1\/memberships/,"membership reassignment must go through the staging API boundary");
assert.match(source,/Prefer"] = "return=representation"/,"membership mutation must return evidence for exact-row verification");
assert.match(source,/\/auth\/v1\/token\?grant_type=password/,"provisioner must verify real password sign-in");
assert.match(source,/\/auth\/v1\/logout/,"verification session must be logged out");
assert.match(source,/Authorization = "Bearer \$\(\$login\.access_token\)"/,"logout may use only the user session JWT as Bearer authorization");
assert.match(source,/Method DELETE -Path "\/auth\/v1\/admin\/users\/\$UserId"/,"new Auth user must have a rollback deletion path");
assert.match(source,/membership restored to the inert placeholder/i,"membership rollback must be explicit");

assert.doesNotMatch(source,/auth\.users/i,"provisioner must not manipulate Supabase Auth tables directly");
assert.doesNotMatch(source,/execute_sql/i,"provisioner must not depend on direct SQL Auth mutation");
assert.doesNotMatch(source,/orbi-condo-pc2\.vercel\.app/i,"provisioner must not contain the Production application hostname");
assert.doesNotMatch(source,/SUPABASE_SERVICE_ROLE_KEY\s*=/i,"no service-role secret may be hardcoded");
assert.doesNotMatch(source,/(Set-Content|Add-Content|Out-File).*\$(serviceKey|password)/i,"secret material must not be persisted to files");
assert.doesNotMatch(source,/Write-(Host|Output).*\$(serviceKey|password)/i,"secret material must not be printed");

assert.match(source,/ORBI_QA_MAYORDOMO_EMAIL/,"provisioner must name the Mayordomo GitHub email secret without storing its value");
assert.match(source,/ORBI_QA_MAYORDOMO_PASSWORD/,"provisioner must name the Mayordomo GitHub password secret without storing its value");
assert.match(source,/ORBI_QA_CONCIERGE_EMAIL/,"provisioner must name the Concierge GitHub email secret without storing its value");
assert.match(source,/ORBI_QA_CONCIERGE_PASSWORD/,"provisioner must name the Concierge GitHub password secret without storing its value");

console.log("PASS staging role Auth provisioner is staging-pinned, dry-run-first, supported-Auth-only and secret-safe");
console.log("PASS Supabase sb_secret transport uses backend User-Agent + apikey-only semantics");
console.log("STAGING ROLE AUTH PROVISIONER CONTRACT GREEN");
