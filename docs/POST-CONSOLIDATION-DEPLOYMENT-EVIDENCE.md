# ORBI LIVING — Post-Consolidation Deployment Evidence

Evidence captured: **2026-10-11 · Chile**.

## Scope

This document corrects the infrastructure picture after the controlled P1 stack consolidation. It is evidence-only: it does not approve production, create production secrets, change Vercel settings, promote a deployment, enable real data, close P1E Recovery, or unblock P2.

Current product/data state remains:

**SYNTHETIC STAGING ONLY · REAL DATA BLOCKED · P1E RESTORE NOT PROVEN · P2 BLOCKED**

## Canonical GitHub state

The canonical P1 stack #27 → #58 is consolidated on `main`.

- final `main` SHA: `3693912e83f9f118511b3a876e529d87646b1388`;
- #37 remains closed without merge and superseded;
- #22 remains outside the canonical P1 stack;
- final push Quality Gate #261 completed GREEN;
- `Full contract - Node 22`: success;
- `Vercel runtime parity - Node 24`: success.

Repository ruleset `24866000` is active on `refs/heads/main` with:

- no bypass actors;
- deletion blocked;
- non-fast-forward / force push blocked;
- pull requests required;
- merge commits only;
- review-thread resolution required;
- strict required checks:
  - `Full contract - Node 22` (GitHub Actions app `15368`);
  - `Vercel runtime parity - Node 24` (GitHub Actions app `15368`).

The external Vercel status context is intentionally not a required GitHub check because provider quota failures are not application-quality failures.

## Important correction: Production deployments occurred automatically

Earlier infrastructure notes stated that Vercel Production deployments were historical and predated the P1 private-operations stack. That statement is no longer correct after consolidation.

Because the Vercel Git integration treats repository `main` as a Production source, some controlled merges to `main` generated automatic Production deployments even though no manual promotion was requested.

Observed examples include:

- `main@fb33d1af4cb844b5dfbfe526a3676e60205d86c3` — merge of PR #27;
- `main@87ea5118447afaedbb6deaeab355b970d89696c1` — merge of PR #55;
- `main@eb05dddb583e5355bc2131f30b0aa91adcd80458` — merge of PR #56.

The latest observed Production deployment at this audit is:

- deployment: `dpl_86pWevoimG7KP8yYgVoF36TT7AUr`;
- Git SHA: `eb05dddb583e5355bc2131f30b0aa91adcd80458`;
- Git ref: `main`;
- state: `READY`;
- target: `production`.

At the time of this audit, no Vercel deployment was found for the final canonical SHA `3693912e83f9f118511b3a876e529d87646b1388`.

## Why this does not mean ORBI LIVING is production-ready

The automatic code deployment did **not** create or attach a production Supabase backend.

The latest observed Production deployment was probed anonymously:

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

This is consistent with the previously verified Vercel environment scope: staging `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `ORBI_COMMUNITY_ID` are Preview-only and no production backend credentials were approved.

Therefore:

- code reached a Vercel Production target automatically;
- **real-data production did not become enabled**;
- the deployed private boundary remains fail-closed without backend configuration;
- no real resident/staff/private PC2 information is authorized or loaded.

## Governance meaning of “Production blocked”

From this point forward, **Production blocked** means that ORBI LIVING is not approved for real operational use, real credentials, production Supabase, real data, or release acceptance.

It must not be interpreted as “no Vercel Production deployment object exists”, because Git integration has already proven that merges to `main` can generate those objects automatically.

## Required infrastructure decision before routine future merges

Before future feature work begins merging routinely into `main`, explicitly decide how Vercel release control should work.

Acceptable directions to evaluate include:

1. keep `main` canonical but prevent automatic Production release until an explicit release action;
2. use a dedicated release/production branch while `main` continues as the protected integration branch;
3. another reviewed Vercel Git/deployment policy that cleanly separates merge from production release.

No Vercel project setting is changed by this evidence document. Pausing, changing domains, changing release branch behavior, promoting, rolling back, or altering deployment policy requires a separate reviewed decision.

## Staging E2E status

A QA branch was created at the exact final main SHA:

`qa/p1-final-3693912` → `3693912e83f9f118511b3a876e529d87646b1388`

No Preview deployment was observed for that exact branch/SHA at the time of this audit. No API deployment was forced because the project previously encountered Hobby deployment/API quota limits.

This documentation-only branch (`oc-pc2-72-production-deployment-evidence`) is based directly on the final canonical main and changes no application runtime source. If Git integration produces a Preview for it, that Preview may be considered a **runtime-equivalent candidate** for the staging E2E only after all of the following are verified:

- deployment target is Preview, never Production;
- deployment belongs to project `orbi-condo-pc2` / team `orbi4`;
- branch base is final canonical main;
- PR diff remains documentation-only;
- `/api/auth/session` reports `configured:true` and anonymous before credentials are used;
- the QA workflow continues to reject production hostnames.

## Gates still open

- deployed Administrator staging Auth E2E;
- deployed reversible HTTP 200/409 conflict + cleanup evidence;
- supported Auth confirmation and E2E for Mayordomía/Conserjería;
- authenticated shift-log/round write lifecycle E2E;
- browser/responsive/accessibility QA;
- P1E logical backup + independent restore;
- real PC2 operating procedure validation;
- production Supabase/credentials/region/monitoring/rollback decisions;
- explicit Vercel release-control decision before routine future merges;
- P2 remains blocked.

## Status

**P1 STACK CONSOLIDATED · MAIN PROTECTED · AUTOMATIC VERCEL PRODUCTION DEPLOYMENTS RECORDED · PRODUCTION BACKEND UNCONFIGURED / FAIL-CLOSED · SYNTHETIC STAGING ONLY · REAL DATA BLOCKED**
