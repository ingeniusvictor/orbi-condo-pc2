# ORBI LIVING — Current working cut: Administrator only

## Decision
The active ORBI LIVING implementation and certification scope is **Administrator / Administración only** until an explicit future decision expands it.

This is a product-scope boundary, not a deletion of the underlying role model. Existing permission contracts may continue to describe Mayordomía, Conserjería, Committee and Resident for least-privilege design and regression testing, but those roles are **not active provisioning or live-E2E targets in the current cut**.

## Active scope
The only live synthetic staging identity currently authorized for browser/Auth/HTTP certification is Administrator.

Current Administrator evidence already includes:

- supported staging login → session → refresh → logout;
- exact Administrator permission-set verification;
- real deployed HTTP read paths;
- reversible concurrent conflict certification with HTTP `200/409` and fixture restoration;
- deployed write lifecycle covering shift log open/entry/close and operational round start/check/complete, including expected HTTP `409` invariants;
- browser UI QA on `/operaciones` at 390×844, 430×932, 768×1024, 1440×900 and 1920×1080;
- keyboard focus visibility, semantic control labels, touch-target and horizontal-overflow checks;
- logout returning the browser to the private login boundary.

## Explicitly deferred
Until the scope is deliberately reopened, do **not**:

- provision or confirm Mayordomía Auth accounts;
- provision or confirm Conserjería Auth accounts;
- create Committee or Resident live QA identities;
- configure GitHub Actions email/password secrets for those deferred roles;
- dispatch live staging E2E for those roles;
- treat deferred-role live-session evidence as a current blocking task for the Administrator cut.

`scripts/provision-staging-role-auth.ps1` remains repository tooling for a possible future phase. Its presence does not authorize its execution.

## Still blocked regardless of Administrator progress
The following boundaries remain unchanged:

- **SYNTHETIC STAGING ONLY**;
- no real resident/staff/contract/incident data;
- no Production Supabase;
- no Vercel Production promotion;
- no P2;
- P1E recovery remains frozen/pending until backup + independent restore is proven;
- production privacy, operational procedure and infrastructure decisions remain future gates.

## Evidence snapshot
Administrator live evidence on GitHub Actions:

- `Synthetic Staging E2E` run `38490618996` — clean Administrator flow: GREEN;
- `Synthetic Staging E2E` run `38490781620` — Administrator reversible conflict / HTTP 409: GREEN;
- `Synthetic Staging E2E` run `38495816498` — Administrator E2E + write lifecycle certification: GREEN; Mayordomía and Conserjería steps skipped;
- `Administrator UI QA` run `38497812117` — browser/responsive/accessibility gate: GREEN.

Canonical repository baseline at this decision: `main@d220925ab07b32f1731944d0b302640941818f1a`.

## Rule for future expansion
A role becomes an active live target only after an explicit scope change. Until then, role contracts may remain in code as defensive authorization specifications, but no additional live identities should be created merely because the supporting harness exists.
