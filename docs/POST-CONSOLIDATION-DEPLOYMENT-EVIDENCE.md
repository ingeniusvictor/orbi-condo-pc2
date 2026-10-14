# ORBI LIVING — Post-Consolidation Deployment Evidence

Evidence updated: **2026-10-14 · Chile**.

## Scope

This document records the infrastructure and staging-QA evidence after the controlled P1 stack consolidation and subsequent Vercel release-control correction. It does **not** approve production, create production Supabase, enable real data, close P1E Recovery, validate the condominium operating procedure, or unblock P2.

Current product/data state remains:

**SYNTHETIC STAGING ONLY · REAL DATA BLOCKED · P1E RESTORE NOT PROVEN · P2 BLOCKED**

## Canonical GitHub state

The canonical P1 stack #27 → #58 is consolidated on `main`.

Release-control PR #60 is also merged. Current canonical `main` is:

`12b878e55ab6b511af0516cb22c2e9ec0256de52`

Relevant state:

- #37 remains closed without merge and superseded;
- #22 remains outside the canonical P1 stack;
- #60 (`OC-PC2-73 · Vercel main release control`) merged with a merge commit;
- #60 pre-merge Quality Gate #263 completed GREEN;
- `Full contract - Node 22`: success;
- `Vercel runtime parity - Node 24`: success.

Repository ruleset `24866000` remains active on `refs/heads/main` with:

- no bypass actors;
- deletion blocked;
- non-fast-forward / force push blocked;
- pull requests required;
- merge commits only;
- review-thread resolution required;
- strict required checks:
  - `Full contract - Node 22` (GitHub Actions app `15368`);
  - `Vercel runtime parity - Node 24` (GitHub Actions app `15368`).

The external Vercel status context remains intentionally excluded from required GitHub checks because provider quota failures are not application-quality failures.

## Historical correction: automatic Production deployments occurred

Earlier infrastructure notes stated that Vercel Production deployments were historical and predated the P1 private-operations stack. That statement became false during consolidation.

Before release control was introduced, some controlled merges to repository `main` generated automatic Vercel Production deployments even though no manual promotion was requested.

Observed examples include:

- `main@fb33d1af4cb844b5dfbfe526a3676e60205d86c3` — merge of PR #27;
- `main@87ea5118447afaedbb6deaeab355b970d89696c1` — merge of PR #55;
- `main@eb05dddb583e5355bc2131f30b0aa91adcd80458` — merge of PR #56.

Latest observed automatic Production deployment:

- deployment: `dpl_86pWevoimG7KP8yYgVoF36TT7AUr`;
- Git SHA: `eb05dddb583e5355bc2131f30b0aa91adcd80458`;
- Git ref: `main`;
- state: `READY`;
- target: `production`.

That deployment remains historical evidence; it is not an approved ORBI LIVING production release.

## Production remains fail-closed

The historical automatic Production deployment did **not** create or attach a production Supabase backend.

Anonymous probes previously established:

`GET /api/auth/session`

- HTTP 200;
- `configured:false`;
- `authenticated:false`;
- `communityId:null`;
- `role:null`;
- `permissions:[]`;
- `Cache-Control: private, no-store`;
- hardened security headers present.

`GET /api/operations/continuity?date=2026-10-10`

- HTTP 403;
- body: `{"error":"No autorizado"}`;
- `Cache-Control: private, no-store`;
- no private operational payload returned.

Vercel environment inspection also established that the staging `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `ORBI_COMMUNITY_ID` are Preview-only and no production backend credentials are approved.

Therefore:

- code historically reached a Vercel Production target automatically;
- **real-data production did not become enabled**;
- the private boundary remains fail-closed without production backend configuration;
- no real resident/staff/private PC2 information is authorized or loaded.

## Release-control decision — CLOSED

PR #60 introduced a repository-versioned `vercel.json` control:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "git": {
    "deploymentEnabled": {
      "main": false
    }
  }
}
```

Accepted release model:

- feature/work branches continue to receive normal Vercel Preview deployments;
- protected `main` remains the canonical integration branch;
- pushes/merges to `main` do **not** trigger automatic Vercel deployments;
- any future Production deployment or promotion must be an explicit reviewed release action.

This behavior was verified before merge because the #60 branch produced a normal Preview deployment:

- deployment: `dpl_Fa5B9xeGPbWq3ZoHTYmtMv1qCVtS`;
- branch: `oc-pc2-73-vercel-release-control`;
- SHA: `38cead2c9aeb5dcf004f613080ed6ff19483144a`;
- state: `READY`;
- target: Preview (`null`).

After #60 was merged, Vercel was queried for the new canonical main SHA:

`12b878e55ab6b511af0516cb22c2e9ec0256de52`

Result: **0 deployments**.

The Vercel `main` deployment history still ends at the older automatic Production deployment `eb05dddb...`; no new Production deployment was created by merge #60. Vercel project `latestDeployment` remained the #60 branch Preview, not `main`.

Thus the release-control gate is closed.

## Runtime-equivalent staging Preview

The documentation-only PR #59 generated a Preview that was verified as runtime-equivalent to the consolidated P1 application code:

- deployment: `dpl_3e8DhCkLvBgUY33HNMNE27kdH2yd`;
- URL: `https://orbi-condo-pc2-jn7mtixie-orbi4.vercel.app`;
- project: `orbi-condo-pc2`;
- team: `orbi4`;
- branch: `oc-pc2-72-production-deployment-evidence`;
- target: Preview;
- source runtime differs from consolidated main only by documentation.

Anonymous preflight on this Preview:

`GET /api/auth/session`

- HTTP 200;
- `configured:true`;
- `authenticated:false`;
- private `no-store` response;
- hardened security headers present.

`GET /api/operations/continuity?date=2026-10-10`

- HTTP 403;
- `{"error":"No autorizado"}`;
- private `no-store` response.

## Administrator staging Auth E2E — CLOSED

GitHub Actions workflow `Synthetic Staging E2E` was executed manually against the protected Preview using the synthetic Administrator and scoped Vercel Automation Bypass.

Clean authenticated run:

- workflow run: `38490618996`;
- branch: `main`;
- tested source SHA: `3693912e83f9f118511b3a876e529d87646b1388`;
- role: `administrator`;
- community: `pc2`;
- `run_conflict=false`;
- result: `success` / `QA GREEN`.

Evidence included:

- protected Preview access established using the scoped bypass cookie;
- preflight configured + anonymous + hardened private headers;
- login HTTP 200 with HttpOnly session cookies;
- authenticated Administrator session with 19 permissions;
- dashboard RLS read;
- shift-log RLS read;
- operational-round RLS read;
- server continuity snapshot;
- session refresh without role/scope drift;
- logout cleared session;
- continuity returned HTTP 403 after logout.

No secret values were emitted in the workflow logs; GitHub masked credential and bypass values.

## Reversible HTTP 409 concurrency E2E — CLOSED

A second Administrator E2E enabled the reversible concurrency check:

- workflow run: `38490781620`;
- `run_conflict=true`;
- result: `success` / `QA GREEN`.

Observed evidence:

- concurrent expected-revision commands produced HTTP `200/409` as designed;
- the conflict fixture was restored successfully to `planned`;
- logout completed;
- anonymous continuity access returned HTTP 403.

This closes the deployed conflict/CAS gate without leaving synthetic fixture mutation behind.

## Governance meaning of “Production blocked”

**Production blocked** means ORBI LIVING is not approved for real operational use, real credentials, production Supabase, real data, or release acceptance.

The historical presence of Vercel Production deployment objects does not alter this governance state. Release control now prevents routine `main` merges from creating new automatic Vercel deployments, but an explicit production release remains prohibited until the remaining governance, recovery, security and operating-procedure gates are completed.

## Gates still open

- supported Auth confirmation and E2E for Mayordomía and Conserjería;
- authenticated shift-log / operational-round write lifecycle E2E beyond the existing read coverage;
- UI/browser E2E by role;
- responsive manual QA at 390×844, 430×932, 768×1024, 1440×900 and 1920×1080;
- keyboard/focus/accessibility QA;
- P1E logical backup + independent restore;
- production login abuse/rate/MFA/password/leaked-password policy decision;
- privacy governance and real PC2 operating-procedure validation;
- production Supabase/secrets/region/monitoring/rollback decisions;
- P2 remains blocked;
- real resident/visitor/contact/vehicle/staff-personal data remains blocked.

## Status

**P1 STACK CONSOLIDATED · MAIN PROTECTED · MAIN AUTO-DEPLOY DISABLED · ADMIN AUTH E2E GREEN · HTTP 409 + CLEANUP GREEN · PRODUCTION BACKEND UNCONFIGURED / FAIL-CLOSED · SYNTHETIC STAGING ONLY · REAL DATA BLOCKED**
