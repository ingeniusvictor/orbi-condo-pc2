# ORBI LIVING — Staging E2E Runbook

## Scope
This runbook is for **synthetic staging only**. It exists to close the remaining live HTTP/Auth gates without introducing real condominium data, production infrastructure, or unsupported Supabase Auth changes.

Do not use real residents, workers, phones, RUTs, plates, contracts, private incident narratives or production credentials.

## Preferred execution path
Use `.github/workflows/staging-e2e.yml` after this workflow has been reviewed and is present on `main`.

The workflow is intentionally `workflow_dispatch` only and the secret-bearing job has an additional `github.ref == 'refs/heads/main'` guard. Do **not** weaken that guard to execute credentials from an unreviewed PR branch.

The workflow validates the requested deployment origin before any Auth credential is exposed. It only accepts ORBI LIVING Preview hosts under the `orbi4` namespace and refuses the production hostname.

## GitHub Actions secrets
Configure these directly in GitHub Actions; never paste their values into chat, PR descriptions, issues or repository files:

```text
ORBI_QA_ADMIN_EMAIL
ORBI_QA_ADMIN_PASSWORD
ORBI_QA_MAYORDOMO_EMAIL
ORBI_QA_MAYORDOMO_PASSWORD
ORBI_QA_CONCIERGE_EMAIL
ORBI_QA_CONCIERGE_PASSWORD
```

If Vercel Deployment Protection blocks the Preview, optionally configure:

```text
ORBI_QA_VERCEL_BYPASS
```

That value must be a Vercel Protection Bypass for Automation secret scoped to this project. The runner sends it only once to the verified `.vercel.app` origin to obtain the scoped `_vercel_jwt` cookie; subsequent requests use the cookie and do not resend the bypass secret.

The workflow does not receive `VERCEL_TOKEN`, cannot deploy/promote, and has `contents: read` only.

## Manual workflow inputs
When dispatching `Synthetic Staging E2E` from reviewed `main`:

- `target_url`: exact ORBI LIVING Preview origin, e.g. `https://orbi-condo-pc2-...-orbi4.vercel.app`;
- `role`: `administrator`, `mayordomo` or `concierge`;
- `service_date`: optional `YYYY-MM-DD` Santiago operational date;
- `run_conflict`: optional reversible HTTP 409 concurrency check.

`run_conflict=true` is accepted only for Administrator or Mayordomo. The workflow serializes E2E runs so two mutation checks cannot overlap.

## Local execution path
The same harness can still be executed locally with environment variables. Before running `npm run qa:operations`:

1. Use the exact Preview/Staging deployment URL for the intended branch/head. `ORBI_QA_BASE_URL` is mandatory; the runner has no fallback URL.
2. The deployment must be configured against `orbi-living-pc2-staging` / community `pc2`.
3. Use a **supported Supabase Auth account** whose email/password are stored only in local environment variables or an approved secret store.
4. The expected operations role must already exist as an active server-side membership.
5. Do not confirm users by direct SQL writes to `auth.users`.
6. Do not point the runner at the production hostname. The runner refuses `https://orbi-condo-pc2.vercel.app` unless `ORBI_QA_ALLOW_PRODUCTION=1`; that override is out of scope while production remains blocked.
7. P1E backup/restore remains frozen and pending; this runbook does not claim or replace recovery evidence.

Required local environment:

```text
ORBI_QA_BASE_URL=https://<exact-preview-host>
ORBI_QA_EMAIL=<synthetic-auth-email>
ORBI_QA_PASSWORD=<synthetic-auth-password>
ORBI_QA_ROLE=administrator|mayordomo|concierge|committee|resident
ORBI_QA_COMMUNITY_ID=pc2
ORBI_QA_DATE=YYYY-MM-DD
```

Optional:

```text
ORBI_QA_409=1
ORBI_QA_VERCEL_BYPASS=<automation-bypass-secret>
```

Do not set `ORBI_QA_ALLOW_PRODUCTION=1` during the current staging phase.

## What the runner proves
The runner performs a real HTTP flow through the deployed Next application:

1. optional protected-Preview bootstrap to a scoped Vercel cookie;
2. anonymous preflight `/api/auth/session`;
3. backend is configured and browser starts anonymous;
4. password login;
5. authenticated session resolves the expected community and role;
6. dashboard read through RLS;
7. role-specific privacy projection checks for Concierge/Committee;
8. shift-log read when permitted;
9. operational-round read when permitted;
10. server continuity snapshot when permitted;
11. refresh and re-check that role/community did not drift;
12. optional concurrent stale-revision `200/409` test for a role with `manage_shift_schedule`;
13. logout;
14. anonymous access denied again.

Private responses must retain `no-store`, `nosniff` and no CORS opt-in where the runner asserts them.

## HTTP 409 fixture safety
`ORBI_QA_409=1` is intentionally limited to a synthetic `planned` shift.

The runner sends two concurrent `report-gap` commands with the same revision and expects exactly one `200` plus one `409`. The fixture is then restored to `planned` in a `finally` path.

If cleanup cannot restore the synthetic shift, the runner prints `QA CLEANUP WARNING`. Treat that as a manual staging-cleanup requirement before another run. Never ignore a cleanup warning.

Do not use the 409 option with Concierge because it requires `manage_shift_schedule`.

## Expected role runs
### Administrator
Use first because one supported confirmed synthetic Administrator account already exists in staging. It can prove the full login/session/refresh/logout path and, optionally, the reversible HTTP 409 mapping.

### Mayordomo
Run only after the synthetic Mayordomo Auth account has been confirmed through a supported Auth flow. Expected: operational administration available, resident/contract administration absent.

### Concierge
Run only after the synthetic Concierge Auth account has been confirmed through a supported Auth flow. Expected: operational execution available; shift/incident administration denied; dashboard exposes no private staff catalog or assignee linkage.

### Committee / Resident
Optional for live HTTP role confirmation through local execution. Committee must remain read/review-only; Resident must not acquire private operational access.

## Evidence to record
For each live staging run, record in the corresponding PR/readiness document:

- exact branch and Git head SHA;
- exact deployment ID/hostname;
- Quality Gate run covering that head;
- role and community only (do not record email/password);
- date used for synthetic fixtures;
- PASS/FAIL lines from the runner;
- whether `ORBI_QA_409=1` was used;
- whether cleanup completed without warning.

Never paste cookies, access tokens, refresh tokens, anon keys, service-role keys, bypass secrets or passwords into GitHub.

## Gates this can close
A successful supported staging run can provide evidence for:

- G2 supported synthetic login → session → refresh → logout;
- G3 real HTTP role matrix for the specific confirmed role exercised;
- G4 real HTTP 409 when `ORBI_QA_409=1` is used successfully.

It does **not** close:

- visual/responsive/accessibility QA;
- append-only shift-log write lifecycle and round write lifecycle unless those workflows are separately exercised and documented;
- private data governance approvals;
- P1E independent restore;
- real PC2 operating procedure;
- production infrastructure/security gates.

## Current blocker
Staging currently has active synthetic memberships/users for Concierge and Mayordomo, but their Auth email confirmation is still pending. The available connector does not expose Supabase Auth Admin operations, so the project intentionally does not bypass that gate through direct SQL changes to `auth.users`.

Current state remains:

**SYNTHETIC STAGING ONLY · PRODUCTION BLOCKED · P1E RESTORE NOT PROVEN**.
