# ORBI LIVING — Controlled Stack Consolidation & Staging E2E Handoff

## Purpose
This runbook defines the safe handoff from the current stacked P1 development line to the first real authenticated staging E2E run.

It does **not** authorize a merge, production deployment, real data, P1E completion or P2 notifications.

Current state remains:

**SYNTHETIC STAGING ONLY · PRODUCTION BLOCKED · P1E RESTORE NOT PROVEN**

## Canonical baseline
At the time this handoff was prepared:

- repository: `ingeniusvictor/orbi-condo-pc2`;
- `main`: `a20c03ff9a84715772250a0daab6cd110d8235c2`;
- current stack tip: PR #58 / `oc-pc2-71-node-runtime-parity`;
- P1AD pre-handoff head: `45739c05958d131de2b5dc6f8001d47ecd224454`;
- #58 Quality Gate #219: Node 22 full contract GREEN + Node 24 runtime-parity GREEN;
- Vercel project: `orbi-condo-pc2` / team `orbi4`;
- Supabase synthetic staging remains Preview-only in Vercel;
- no production Supabase has been approved or created for this P1 line.

## Precondition 0 — protect `main` before consolidation
Read-only GitHub inspection currently reports:

- `main` branch protection: disabled;
- repository rulesets: none.

Before starting the merge sequence, enable a GitHub branch rule/ruleset for `main` that at minimum:

1. requires pull requests rather than direct pushes;
2. requires successful Quality Gate checks before merge;
3. prevents accidental force-push/deletion of `main`;
4. does not grant a bypass merely to speed up this stack.

Do not treat this document as authorization to alter organization-wide policies. Configure the narrowest repository-level protection appropriate for ORBI LIVING.

## Canonical merge order
Do not merge the stack in reverse order and do not bulk-merge it.

Canonical order:

1. #27 — OC-PC2-41 · Operaciones, turnos, cobertura e incidencias PC2
2. #28 — OC-PC2-42 · Private operations auth foundation
3. #29 — OC-PC2-43 · Private operations schema and RLS draft
4. #30 — OC-PC2-44 · Controlled operations commands and domain events
5. #31 — OC-PC2-45 · Private session lifecycle and refresh rotation
6. #32 — OC-PC2-46 · Recovery readiness and logical backup gate
7. #33 — OC-PC2-47 · Private operations workspace
8. #34 — OC-PC2-48 · Concierge daily operations
9. #35 — OC-PC2-49 · Structured shift log and handoff
10. #36 — OC-PC2-50 · Operational rounds
11. **skip #37** — closed without merge; superseded duplicate
12. #38 — OC-PC2-51 · Operational continuity board
13. #39 — OC-PC2-52 · Server continuity snapshot
14. #40 — OC-PC2-53 · Continuity contract tests
15. #41 — OC-PC2-54 · Operations domain contracts
16. #42 — OC-PC2-55 · Anonymous security smoke
17. #43 — OC-PC2-56 · Private API cache hardening
18. #44 — OC-PC2-57 · P1 readiness matrix
19. #45 — OC-PC2-58 · Private boundary contract
20. #46 — OC-PC2-59 · CI action hardening
21. #47 — OC-PC2-60 · Hermetic build config
22. #48 — OC-PC2-61 · Session cookie contract
23. #49 — OC-PC2-62 · Hermetic auth lifecycle
24. #50 — OC-PC2-63 · Auth failure-mode contract
25. #51 — OC-PC2-64 · Runtime security headers contract
26. #52 — OC-PC2-65 · Hermetic operations conflict contract
27. #53 — OC-PC2-66 · Hermetic operations role HTTP contract
28. #54 — OC-PC2-67 · Dashboard privacy projection contract
29. #55 — OC-PC2-68 · Staging QA runner safety
30. #56 — OC-PC2-69 · Manual synthetic staging E2E workflow
31. #57 — OC-PC2-70 · Preview infrastructure isolation evidence
32. #58 — OC-PC2-71 · Node runtime parity certification

## Per-PR consolidation loop
For each canonical PR, starting at #27:

1. Obtain explicit merge authorization for the consolidation window.
2. Confirm the immediately previous canonical PR is already merged to `main`.
3. Retarget the current PR to `main` only after its predecessor is on `main`.
4. Inspect the resulting diff; it must contain only the intended incremental delta. Stop on unexpected deletions, duplicate migrations, legacy `community_members`, real data or private files.
5. Confirm the PR remains mergeable and all required Quality Gate jobs are GREEN on the retargeted head/merge candidate.
6. Merge only that PR.
7. Record the resulting canonical `main` SHA.
8. Continue to the next PR.

Never revive or merge #37.

Do not mark P1E complete merely because #32 is merged. Its backup + independent restore drill remains a separate hard gate.

## Post-consolidation validation Preview
After #58 is merged and the final `main` SHA is known:

1. Do **not** run authenticated QA against the production hostname.
2. Create a temporary QA/validation branch from the exact final `main` SHA, without code changes.
3. Let the existing Git integration produce a Vercel **Preview** for that branch.
4. Verify the Preview metadata points to the exact final `main` SHA and project `orbi-condo-pc2` / team `orbi4`.
5. Verify `/api/auth/session` returns `configured:true` and `authenticated:false` before credentials are used.
6. Use that exact Preview hostname as `target_url` for the manual staging E2E workflow.

The QA runner must continue to refuse `https://orbi-condo-pc2.vercel.app`.

## GitHub Actions secrets — values stay outside chat and Git
The current connector does not provide GitHub Actions secret administration. Configure these in the repository secret store, not in code, PR bodies, issues or chat.

Required for the first Administrator run:

- `ORBI_QA_ADMIN_EMAIL`
- `ORBI_QA_ADMIN_PASSWORD`

Required only after supported Auth confirmation for those synthetic accounts:

- `ORBI_QA_MAYORDOMO_EMAIL`
- `ORBI_QA_MAYORDOMO_PASSWORD`
- `ORBI_QA_CONCIERGE_EMAIL`
- `ORBI_QA_CONCIERGE_PASSWORD`

Optional when Vercel Deployment Protection blocks automation:

- `ORBI_QA_VERCEL_BYPASS`

Never configure or expose `ORBI_QA_ALLOW_PRODUCTION` in the workflow.

## First authenticated run — Administrator
Run `.github/workflows/staging-e2e.yml` manually from reviewed `main` with:

- `target_url`: exact validation Preview URL;
- `role`: `administrator`;
- `run_conflict`: `false` for the first pass.

Expected evidence includes:

1. anonymous configured preflight;
2. password login succeeds;
3. session resolves `pc2 / administrator`;
4. dashboard private read succeeds;
5. permitted shift-log / rounds / continuity reads succeed;
6. refresh rotates the session without role/community drift;
7. logout succeeds;
8. private APIs return to anonymous 403 after logout;
9. no secret, cookie or token value appears in logs.

If this first pass is GREEN, repeat Administrator with:

- `run_conflict`: `true`.

Expected concurrency evidence:

- exactly one mutation succeeds with HTTP 200;
- the stale concurrent mutation returns HTTP 409;
- the synthetic fixture is restored in the cleanup path;
- no `QA CLEANUP WARNING` remains unresolved.

## Mayordomía / Conserjería runs
Do not execute role E2E until each synthetic Auth account is confirmed through a supported Supabase Auth flow.

Do not patch `auth.users` directly to bypass email confirmation.

After confirmation:

- run Mayordomía with its role-specific GitHub secrets;
- run Conserjería with its role-specific GitHub secrets;
- record only role/community/PASS-FAIL evidence, never credentials;
- do not use `run_conflict=true` for Conserjería.

## Evidence to record
For each real staging run record:

- final canonical `main` SHA;
- QA validation branch;
- exact Vercel deployment ID and hostname;
- deployment Git SHA;
- workflow run ID;
- role + `pc2` only;
- fixture date;
- PASS/FAIL lines;
- whether `run_conflict=true` was used;
- cleanup result.

Never record email/password, JWTs, cookies, Supabase keys or Vercel bypass values.

## Stop conditions
Stop consolidation or E2E immediately if any of these appears:

- unexpected PR diff after retargeting;
- failing Quality Gate;
- production hostname selected as QA target;
- staging environment variables appear in Vercel Production scope;
- Auth role/community differs from expected;
- cleanup warning after the 409 fixture;
- real resident/staff/visitor/vehicle/contact data appears anywhere;
- direct manual writes to `auth.users` are proposed;
- P2 notification/escalation is proposed before procedure approval.

## Gates that remain after successful Administrator E2E
Even a fully GREEN Administrator E2E + HTTP 409 does not unblock production. Still required:

- supported Auth + E2E for Mayordomía and Conserjería;
- visual/responsive/accessibility QA;
- P1E logical backup + independent restore + repeated RLS/invariant smoke;
- validated PC2 operational procedure;
- private field inventory/retention/governance;
- production Supabase/independent secrets/region/monitoring/rollback decisions;
- production authentication controls such as MFA/password/rate-limit policy.

## Decision
The stack is technically prepared for controlled consolidation, but consolidation itself remains an explicit action and must not be inferred from CI success.

**NO AUTO-MERGE · NO REAL DATA · NO PRODUCTION QA TARGET · NO P2 BEFORE PROCEDURE APPROVAL**
