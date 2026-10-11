# ORBI LIVING — Vercel Preview Infrastructure Isolation

## Scope
Read-only infrastructure evidence for the current **SYNTHETIC STAGING ONLY** phase. This document does not approve production, create production secrets, change Vercel configuration or promote any deployment.

Evidence captured: **2026-10-10/11 · Chile**.

## Project binding
Verified Vercel project:

- project: `orbi-condo-pc2`;
- project ID: `prj_M8Su8hDIEyLgHWMyagPpQDJ6JoLQ`;
- team: `orbi4`;
- Git provider: GitHub;
- repository: `ingeniusvictor/orbi-condo-pc2`.

No alternate repository or Cursor Origin connection is used for this project.

## Synthetic backend variables
The variables used by ORBI LIVING private staging are:

- `SUPABASE_URL`;
- `SUPABASE_ANON_KEY`;
- `ORBI_COMMUNITY_ID`.

Vercel metadata was inspected with decryption disabled.

The active generalized copies are all scoped **only to `preview`**. Vercel reported `hiddenProductionEnvCount: 0`.

Therefore, at the time of this audit:

- staging Supabase URL is not assigned to the Production target;
- staging publishable/anon key is not assigned to the Production target;
- staging community `pc2` is not assigned to the Production target;
- no decrypted secret value was requested or recorded during the audit.

This closes only the production-readiness question “does a current staging URL/key remain in Vercel Production scope?” It does **not** create or approve production credentials.

## Legacy Preview-only branch variables
Older branch-scoped copies remain for historical P1 branches including:

- `oc-pc2-43-private-schema-rls`;
- `oc-pc2-44-controlled-operations-commands`;
- `oc-pc2-45-session-lifecycle`.

They are also Preview-only and do not create a Production exposure. They are configuration debt that may be removed later after the stacked work is consolidated. No cleanup mutation was performed during this audit.

## Deployment protection
Project metadata reports Vercel Authentication/SSO Protection enabled with deployment type `all_except_custom_domains`.

P1AB supports an optional Automation Bypass only for protected ORBI LIVING `.vercel.app` Preview hosts. The bypass secret is bootstrap-only and converted to a scoped `_vercel_jwt` cookie by the QA runner. This audit did not create, rotate or reveal any bypass secret.

## Existing Production deployment history
The Vercel project already contains historical Production deployments from the repository `main` branch, predating the current P1 private-operations stack.

That history does **not** mean P1F–P1AB has been promoted to production. The current private-operations work remains stacked/draft and Preview-only.

Do not use historical Production deployments as evidence for current P1 readiness, Auth, RLS or privacy gates.

## Runtime parity observation
Vercel project metadata currently reports `nodeVersion: 24.x`, while GitHub Quality Gate explicitly runs the application on Node 22.

Both environments currently build successfully, but exact runtime parity has not been formally established. This remains an infrastructure-readiness item before production approval.

No Node version setting was changed because the Vercel project setting affects future deployments beyond the current Preview audit.

## Custom environments
No Vercel custom environments are currently configured. The synthetic staging workflow therefore uses the standard `preview` environment rather than a separately named Vercel Staging environment.

This is acceptable for the current synthetic phase because target selection, environment variables and the QA workflow all explicitly prevent Production use. A dedicated custom environment can be evaluated later if plan/capability and operational needs justify it.

## Decision
Verified:

**STAGING VARIABLES PREVIEW-ONLY · NO CURRENT STAGING ENV IN PRODUCTION SCOPE · GIT LINK CORRECT · PRODUCTION STILL BLOCKED**

Still open:

- production Supabase project/plan approval;
- independent production secrets;
- Node runtime parity decision;
- production region/data-residency decision;
- monitoring/error handling;
- application/database rollback procedure;
- P1E independent restore;
- real PC2 operational procedure.
