# ORBI LIVING — Staging E2E Runbook

## Scope
This runbook is for **synthetic staging only**. It exists to certify live HTTP/Auth behavior without introducing real condominium data, production infrastructure, or unsupported Supabase Auth changes.

**Current working cut: Administrator / Administración only.** See `docs/ADMINISTRATOR-ONLY-CURRENT-CUT.md`.

Do not use real residents, workers, phones, RUTs, plates, contracts, private incident narratives or production credentials. Do not provision or activate additional live QA roles until an explicit future scope change authorizes them.

## Preferred execution path
Use `.github/workflows/staging-e2e.yml` only after the workflow has been reviewed and is present on `main`.

The workflow is intentionally `workflow_dispatch` only and the secret-bearing job has an additional `github.ref == 'refs/heads/main'` guard. Do **not** weaken that guard to execute credentials from an unreviewed PR branch.

The workflow validates the requested deployment origin before any Auth credential is exposed. It only accepts ORBI LIVING Preview hosts under the `orbi4` namespace and refuses the Production hostname.

## Active GitHub Actions secrets
For the current Administrator-only cut, the active role credentials are only:

```text
ORBI_QA_ADMIN_EMAIL
ORBI_QA_ADMIN_PASSWORD
```

If Vercel Deployment Protection blocks the Preview, optionally configure:

```text
ORBI_QA_VERCEL_BYPASS
```

That value must be a Vercel Protection Bypass for Automation secret scoped to this project. The runner sends it only once to the verified `.vercel.app` origin to obtain the scoped `_vercel_jwt` cookie; subsequent requests use the cookie and do not resend the bypass secret.

The workflow does not receive `VERCEL_TOKEN`, cannot deploy/promote, and has `contents: read` only.

### Deferred role secrets
The workflow code retains compatibility with these names for a possible future role-expansion phase:

```text
ORBI_QA_MAYORDOMO_EMAIL
ORBI_QA_MAYORDOMO_PASSWORD
ORBI_QA_CONCIERGE_EMAIL
ORBI_QA_CONCIERGE_PASSWORD
```

**Do not configure or use those deferred-role secrets in the current cut.** Their presence in the workflow contract does not make those roles active targets.

## Manual workflow inputs
When dispatching `Synthetic Staging E2E` from reviewed `main` during the current cut:

- `target_url`: exact ORBI LIVING Preview origin, e.g. `https://orbi-condo-pc2-...-orbi4.vercel.app`;
- `role`: use **`administrator` only**;
- `service_date`: optional `YYYY-MM-DD` Santiago operational date;
- `run_conflict`: optional reversible HTTP 409 concurrency check.

The workflow code can represent additional roles for future compatibility, but do not dispatch them until the scope is explicitly reopened.

The workflow serializes E2E runs so mutation checks cannot overlap.

## Deferred future-role Auth provisioning
The staging schema contains inert synthetic placeholder identities and memberships for future least-privilege testing of Mayordomía and Conserjería. Those placeholders intentionally have no usable password/identity.

`scripts/provision-staging-role-auth.ps1` is retained as **dormant future tooling**. It is pinned to project ref `drqjpzydgihrrdnkhewh`, community `pc2`, and is designed to use supported Supabase Auth Admin operations rather than direct Auth-table SQL.

**Do not execute that helper in the current Administrator-only cut.**

A future role-expansion decision must occur before any of the following:

- running the helper with `-Apply`;
- creating or confirming a Mayordomía/Conserjería Auth identity;
- configuring corresponding GitHub Actions role secrets;
- dispatching live E2E for those roles.

No direct Auth-table SQL workaround is permitted in any future phase.

## Local Administrator execution path
The same harness can be executed locally with environment variables. Before running `npm run qa:operations`:

1. Use the exact Preview/Staging deployment URL for the intended branch/head. `ORBI_QA_BASE_URL` is mandatory; the runner has no fallback URL.
2. The deployment must be configured against `orbi-living-pc2-staging` / community `pc2`.
3. Use the existing supported synthetic **Administrator** Auth account; keep its email/password only in local environment variables or an approved secret store.
4. Do not confirm users by direct SQL writes to the Auth schema.
5. Do not point the runner at the Production hostname. The runner refuses `https://orbi-condo-pc2.vercel.app` unless `ORBI_QA_ALLOW_PRODUCTION=1`; that override is out of scope while Production remains blocked.
6. P1E backup/restore remains frozen and pending; this runbook does not claim or replace recovery evidence.

Required local environment for the current cut:

```text
ORBI_QA_BASE_URL=https://<exact-preview-host>
ORBI_QA_EMAIL=<synthetic-administrator-auth-email>
ORBI_QA_PASSWORD=<synthetic-administrator-auth-password>
ORBI_QA_ROLE=administrator
ORBI_QA_COMMUNITY_ID=pc2
ORBI_QA_DATE=YYYY-MM-DD
```

Optional:

```text
ORBI_QA_409=1
ORBI_QA_VERCEL_BYPASS=<automation-bypass-secret>
```

Do not set `ORBI_QA_ALLOW_PRODUCTION=1` during the current staging phase.

## What the Administrator runner proves
The runner performs a real HTTP flow through the deployed Next application:

1. optional protected-Preview bootstrap to a scoped Vercel cookie;
2. anonymous preflight `/api/auth/session`;
3. backend is configured and browser starts anonymous;
4. password login;
5. authenticated session resolves community `pc2` and role `administrator`;
6. exact canonical Administrator permission set is verified;
7. dashboard read through RLS;
8. shift-log read when permitted;
9. operational-round read when permitted;
10. server continuity snapshot when permitted;
11. refresh and re-check that role, community and exact permission set did not drift;
12. optional concurrent stale-revision `200/409` test;
13. logout;
14. anonymous access denied again.

Private responses must retain `no-store`, `nosniff` and no accidental CORS opt-in where the runner asserts them.

## HTTP 409 fixture safety
`ORBI_QA_409=1` uses a synthetic `planned` shift.

The runner sends two concurrent `report-gap` commands with the same revision and expects exactly one `200` plus one `409`. The fixture is then restored to `planned` in a `finally` path.

If cleanup cannot restore the synthetic shift, the runner prints `QA CLEANUP WARNING`. Treat that as a manual staging-cleanup requirement before another run. Never ignore a cleanup warning.

This Administrator conflict gate is already certified by Actions run `38490781620`.

## Administrator write lifecycle
The one-shot deployed write-lifecycle certification is Administrator-only. It requires a dedicated fresh synthetic assignment UUID and the current Santiago operational date.

The certified flow covers:

- shift log open;
- structured append-only log entry;
- operational round start;
- HTTP 409 when closing a log with an open round;
- rejection of empty round completion;
- checkpoint persistence;
- duplicate checkpoint rejection;
- round completion and completed-round immutability;
- final shift-log closure;
- closed-log immutability;
- final read preserving append-only evidence;
- logout and return to anonymous denial.

This gate is already certified by Actions run `38495816498`.

## Current Administrator evidence
The live staging/browser gates already closed for the current scope are:

```text
38490618996  Synthetic Staging E2E  clean Administrator Auth/HTTP flow       GREEN
38490781620  Synthetic Staging E2E  reversible Administrator HTTP 200/409   GREEN
38495816498  Synthetic Staging E2E  Administrator + write lifecycle          GREEN
38497812117  Administrator UI QA    responsive/keyboard/accessibility         GREEN
```

Run `38495816498` explicitly skipped the Mayordomía and Conserjería E2E steps; no live certification for those deferred roles is claimed or required in the current cut.

## Evidence to record for any future Administrator rerun
Record:

- exact branch and Git head SHA;
- exact deployment ID/hostname;
- Quality Gate run covering that head;
- role `administrator` and community `pc2` only — never record the email/password;
- date used for synthetic fixtures;
- PASS/FAIL lines from the runner;
- whether `ORBI_QA_409=1` was used;
- whether cleanup completed without warning.

Never paste cookies, access tokens, refresh tokens, anon keys, service-role/secret keys, bypass secrets or passwords into GitHub.

## Gates already closed by live Administrator evidence
For the current selected scope, live evidence has closed:

- G1 Administrator browser responsive + keyboard/focus/accessibility evidence;
- G2 supported synthetic Administrator login → session → refresh → logout;
- G3 Administrator deployed session against the exact canonical permission contract;
- G4 real deployed HTTP `200/409` conflict mapping with cleanup;
- G4 deployed shift-log and operational-round write lifecycle.

These closures do **not** enable real data or Production.

## Current next work — Administrator-only cut
There is no remaining Mayordomía/Conserjería provisioning blocker in the current scope.

The meaningful remaining gates are:

- durable app-level login-abuse/rate-limit strategy;
- private field inventory, retention and audit/data-governance decisions before any real data;
- validation by Administration of the actual PC2 operating procedure;
- P1E independent backup/restore only when that frozen gate is explicitly reopened;
- Production region, monitoring, rollback, MFA/password and leaked-password-protection decisions before any Production enablement.

Do **not** run the deferred role provisioner merely because it exists.

Current state:

**ADMINISTRATOR ONLY · SYNTHETIC STAGING ONLY · PRODUCTION BLOCKED · P1E RESTORE NOT PROVEN**.
