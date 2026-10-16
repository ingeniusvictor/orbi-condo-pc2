# ORBI LIVING — Production Readiness Gate

## Purpose

This checklist is the hard boundary between the current synthetic staging system and any future use of real condominium information. **No real resident, worker, phone, RUT, plate, contract or private incident narrative may be loaded until every mandatory gate for the selected production scope is explicitly closed.**

Evidence snapshot: **2026-10-16 · Chile**. Canonical baseline immediately before OC-PC2-104: `main@087745e3d314c984530b207c49deedd2e5b0394e` (PR #89). The active implementation/certification cut is **Administrator / Administración only**; see `docs/ADMINISTRATOR-ONLY-CURRENT-CUT.md` and `docs/ADMINISTRATOR-READINESS-HANDOFF.md`.

Existing role contracts for Mayordomía, Conserjería, Committee and Resident remain useful as least-privilege regression specifications, but live provisioning and live E2E for those roles are deferred until an explicit future scope change.

## G0 · Product scope

- [x] ORBI LIVING operational scope documented: shifts, coverage, handoff, incidents, escalation and administrative traceability.
- [x] Payroll, overtime and automatic labour-law conclusions remain outside the MVP.
- [x] DS19 rental policing/investigation remains outside product scope.
- [x] ComunidadFeliz coexistence documented; no unverified API/integration assumed.
- [x] P2 notifications/escalation explicitly blocked until the real procedure is validated with administration.
- [x] Current live-certification scope explicitly pinned to Administrator only; no additional live role identities are required or authorized in this cut.

## G1 · Public/frontend safety

- [x] Public demos use synthetic/generic identities only.
- [x] No contracts, RUTs, phones, plates or resident data committed to GitHub.
- [x] Build/typecheck gates are active.
- [x] `/operaciones` and deferred private surfaces render with `noindex`/private boundaries in runtime security tests.
- [x] Runtime security headers cover `nosniff`, Referrer-Policy, SAMEORIGIN, restrictive Permissions-Policy, no `X-Powered-By`, private `no-store` and no accidental CORS opt-in on private APIs.
- [x] Structural CSP is active and Preview-certified: `base-uri 'self'; form-action 'self'; frame-ancestors 'self'; object-src 'none'` without unsafe `script-src/style-src` assumptions that could break Next.js.
- [x] Administrator browser responsive QA completed at 390×844, 430×932, 768×1024, 1440×900 and 1920×1080 in `Administrator UI QA` run `38497812117`.
- [x] Administrator keyboard/focus/accessibility browser pass recorded in run `38497812117`.
- [x] Private workspace has a controlled React/Next error boundary that does not expose exception messages, stacks or payloads.
- [x] API failures can surface an opaque ORBI request reference to the UI without exposing private headers/data.
- [x] The initial `/operaciones` HTML mounts only the private-session validation state; workspace/login content is not prerendered behind an ambiguous session gate.

## G2 · Authentication lifecycle

- [x] Server-side Auth boundary exists.
- [x] Session cookies are HttpOnly, SameSite=Strict and Secure in production runtime.
- [x] Cookie path scope is minimized: access/session under `/api`; refresh under `/api/auth`.
- [x] Access + refresh token storage remains server-only.
- [x] Refresh rotation endpoint exists.
- [x] Logout clears local credentials and attempts Supabase local-session revocation.
- [x] Auth/PostgREST upstream calls are time-bounded.
- [x] Unconfigured runtime is proven fail-closed.
- [x] Auth/operations API responses are centrally hardened with `Cache-Control: private, no-store`.
- [x] Hermetic real-Next lifecycle proves login → session → refresh → logout, cookie rotation, revocation and return to anonymous without external network.
- [x] Hermetic failure-mode contract proves invalid access, disabled/future/expired/unknown memberships, missing/invalid refresh and revoked access all fail closed.
- [x] Supported synthetic Administrator Auth account proves deployed login → session → refresh → logout; run `38490618996` GREEN, repeated in run `38495816498`.
- [x] Login boundary preserves upstream throttling semantics: `429` remains `429`, bounded numeric `Retry-After` may pass, upstream details remain private, upstream `5xx` normalizes to service unavailability and failed login paths issue no cookies.
- [x] Refresh boundary distinguishes temporary upstream failure from invalid credentials: `429`/`5xx`/invalid temporary responses do not destroy local cookies; a definitively rejected refresh token does.
- [x] Client session recovery distinguishes definitive anonymous state from temporary/ambiguous service failure and stays fail-closed without mounting private content.
- [x] Durable login-abuse strategy is defined: Vercel Firewall per-IP edge limiting for `POST /api/auth/login` + app validation + Supabase Auth protections. Process-local counters are rejected as insufficient.
- [ ] Publish and verify the durable Vercel Firewall login rate-limit rule only when project-level security changes are allowed to affect the intended Production boundary.
- [ ] Production MFA/password policy approved.
- [ ] Decide whether Production enables leaked-password protection or document approved compensating controls.

### Deferred role activation

These are **future expansion gates**, not active blockers for the current Administrator-only cut:

- [ ] If Mayordomía is later activated, provision/confirm its synthetic Auth identity through a supported flow and certify its UI/session boundary.
- [ ] If Conserjería is later activated, provision/confirm its synthetic Auth identity through a supported flow and certify its UI/session boundary.
- [ ] Committee/Resident live identities remain unprovisioned unless a future product cut explicitly requires them.

## G3 · Authorization / tenant isolation

- [x] RLS enabled on operational/private tables.
- [x] `anon` denied.
- [x] Administrator, mayordomo, concierge, committee and resident role boundaries tested with synthetic identities at the database layer.
- [x] Cross-community isolation tested.
- [x] Cross-community staff references rejected by composite FK.
- [x] Direct event-table INSERT remains denied.
- [x] `staff_private` SELECT tightened to Administrator/Mayordomía; Conserjería receives no private staff catalog.
- [x] Old `community_members` architecture superseded; canonical model is `memberships`.
- [x] Permission matrix is an executable CI contract.
- [x] Hermetic Route Handler contract proves the same role matrix at the real server HTTP authorization boundary before resource access.
- [x] Every current `/api/operations` route is contract-protected so identity + required permission resolve and fail closed before the first operational data access.
- [x] Dashboard privacy projection contract prevents deferred roles from receiving private staff/activity fields outside their contract.
- [x] Administrator staging session is live-certified against the canonical exact-permission contract.
- [ ] Live HTTP/UI repetition for deferred roles only if/when those roles are explicitly activated in a future cut.

## G4 · Controlled writes and operational continuity

- [x] Server commands exist for shift management, gap reporting, handoff, incident report and incident management.
- [x] Shift and incident transitions are executable CI contracts.
- [x] Conserjería cannot redefine shift structure.
- [x] Confirmed/received shifts require assignee.
- [x] Shift/incident events append automatically with actor.
- [x] Revision increments and stale-revision zero-row behavior are tested.
- [x] Browser code does not write directly to private operational tables.
- [x] Structured shift logs/handoffs exist with RLS, append-only entries, optimistic revision and closed-log immutability.
- [x] Operational rounds/checkpoints exist with RLS, append-only evidence and a database barrier preventing shift-log closure while a round remains open.
- [x] Continuity Board derives coverage/incidents/logs/rounds without creating a second persisted state.
- [x] Continuity derivation is server-side and payload-minimized.
- [x] Runtime anonymous smoke proves representative private writes stop at Origin/Auth barrier before validation/persistence.
- [x] All mutating private routes are covered by an exact-origin/CSRF contract; missing or foreign Origin is rejected before Supabase.
- [x] Private request envelope rejects oversized bodies and inappropriate content types centrally before Auth/business logic/data access.
- [x] HTTP conflict contract proves stale revision, invalid transition and compare-and-swap races map safely to `409`.
- [x] Deployed Administrator HTTP E2E proves controlled shift-log and round lifecycle; run `38495816498` GREEN.
- [x] UI warns on ambiguous mutation outcomes so a user does not blindly repeat a write after network/`5xx` uncertainty.
- [x] Incident creation has durable idempotency in staging using an opaque client request UUID and uniqueness over community + creator + request key; replay returns the existing result instead of creating a second incident.

## G5 · Privacy / data governance

- [x] Public/private data boundary documented.
- [x] Real PII blocked from staging during security development.
- [x] Current private operational surfaces use structured fields and synthetic references; no new narrative-free-form PII channel was introduced.
- [x] Client/server boundary contract prevents client modules from importing server-only/private access material.
- [x] Continuity and dashboard projections have executable minimization contracts.
- [x] Technical field-level inventory reconciled against the current staging schema without reading row contents; see `docs/ADMINISTRATOR-PRIVATE-DATA-INVENTORY.md`.
- [x] CI protects Administrator minimization rules, including server-only assignee linkage and omission of private incident references from browser responses.
- [x] Historical `shift_events.note_private` is explicitly prohibited for real data until a future deprecation/constrained-vocabulary/governed-narrative decision is approved.
- [x] Technical correction/deactivation/audit handling draft exists without inventing legal/business approval or retention periods.
- [ ] Private field inventory **approved for real-data use**: exact business purpose, retention and authorized access must still be signed off.
- [ ] Procedure approved for staff/contact data correction and deactivation.
- [ ] Audit access and retention approved.
- [ ] Export policy approved.
- [ ] Private document storage approach approved; no private files exposed via public routes or repo.
- [ ] Production privacy notice / internal handling procedure reviewed for Chilean operation before resident data is enabled.

## G6 · Backup / recovery — P1E remains frozen/pending

- [x] Free-plan backup limitations documented.
- [x] Logical backup helper exists.
- [x] Backup SHA-256 verifier exists.
- [x] Backup artifacts excluded from public Git.
- [ ] First logical staging backup generated and hashes verified.
- [ ] Backup copied to approved encrypted off-site storage.
- [ ] Independent restore target created.
- [ ] Restore completed and row/invariant checks passed.
- [ ] RLS/role isolation smoke tests repeated on restored target.
- [ ] Recovery time and failure notes recorded privately.
- [ ] Backup cadence and responsible person approved.

**Rule:** P1E is not complete merely because later technical gates are GREEN. Backup + independent restore remains a hard blocker for real data. Current project direction keeps this gate frozen/pending until explicitly reopened.

## G7 · Operational procedure — awaiting Administration

The simple Administration questionnaire is `docs/ADMINISTRATOR-OPERATIONS-QUESTIONNAIRE.md`. The technical handoff is `docs/ADMINISTRATOR-READINESS-HANDOFF.md`.

- [ ] Exact Sunday/holiday night coverage schedule formally validated.
- [ ] Who may activate a replacement formally confirmed.
- [ ] Replacement acceptance/confirmation channel confirmed.
- [ ] Shift handoff verification procedure confirmed.
- [ ] Emergency escalation contacts/channel and after-hours path confirmed.
- [ ] Authorized replacement-pool rule confirmed by administration.
- [ ] Administration validates the practical meaning of bitácora, rounds and continuity statuses before pilot.

No live Mayordomía/Conserjería identity is required to conduct this validation. Pending answers do **not** authorize ORBI to invent rules.

## G8 · Production infrastructure

### Technical evidence already closed in staging/Preview

- [x] Vercel environment scopes reviewed read-only: staging `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `ORBI_COMMUNITY_ID` are Preview-only; no hidden Production env variables were used as staging evidence.
- [x] Vercel Git binding verified: project `orbi-condo-pc2` / team `orbi4` points to `ingeniusvictor/orbi-condo-pc2`.
- [x] Node 22 full contract + Node 24 Vercel-runtime parity remain mandatory Quality gates.
- [x] Automatic Production deployment from current `main` is disabled by release control; certified merges continue to show zero new Vercel deployments for their canonical main SHAs.
- [x] Preview observability/error-handling strategy is implemented with request correlation, privacy-safe unhandled-error logging and safe UI references. See `docs/ADMINISTRATOR-OBSERVABILITY.md`.
- [x] Read-only application release-recovery rehearsal identifies a known-good Preview by immutable deployment ID + Git SHA and separates app rollback from database recovery. See `docs/RELEASE-RECOVERY-RUNBOOK-DRAFT.md`.
- [x] Technical region/data-residency recommendation exists, recording current staging separation and future candidates without making a legal/contractual claim. See `docs/REGION-DATA-RESIDENCY-RECOMMENDATION.md`.
- [x] Framework security baseline upgraded to Next.js `16.4.1`; React/ReactDOM remain exact at `19.2.8`.
- [x] Direct runtime/dev dependencies are exact-pinned; critical Motion transitives are override-pinned.
- [x] A committed `package-lock.json` (`lockfileVersion: 3`) freezes the reviewed dependency tree and both Quality runners install with `npm ci` using lockfile-based cache keys.

### Still pending before Production

- [ ] Production Supabase project/plan explicitly approved; staging must not silently become Production.
- [ ] Production secrets created independently from staging.
- [ ] Production region/data-residency **decision** approved after revalidating provider availability and legal/contractual requirements; the current recommendation is not approval.
- [ ] Production monitoring ownership, alerting/escalation, log retention and SLO/threshold policy approved and enabled; current Preview observability is not Production monitoring approval.
- [ ] Production application rollback procedure approved for the intended environment after compatibility/release criteria are defined.
- [ ] Database recovery remains tied to G6/P1E and cannot be marked approved by the application release-recovery rehearsal.
- [ ] Durable Vercel Firewall login rate-limit rule activated and verified when the Production security boundary is intentionally opened.

Historical Vercel Production deployments from older `main` commits exist, but they predate the current private-operations stack and are **not** evidence that the current private stack has been promoted or approved for Production.

## Current Administrator evidence chain

The Administrator-only private-operation foundation is now consolidated through PR #89. Major evidence includes:

- run `38490618996` — clean Administrator Auth/HTTP GREEN;
- run `38490781620` — reversible concurrent HTTP `200/409` GREEN;
- PR #62 — exact staging role permission contract;
- PR #63 / run `38495816498` — Administrator write lifecycle GREEN;
- PR #64 / run `38497812117` — Administrator browser UI QA GREEN;
- PR #67 — Administrator-only readiness consolidation;
- PR #68 — login throttle/upstream semantics and durable edge strategy definition;
- PR #69 — exact technical private-data inventory/minimization contract;
- PR #70 — technical data-handling procedures draft;
- PR #71/#72 — Administration validation pack + simplified operations questionnaire;
- PR #73 — privacy-safe Administrator observability and request correlation;
- PR #74 — release-recovery rehearsal/runbook without Production or P1E mutation;
- PR #75 — region/data-residency technical recommendation without Production mutation;
- PR #76/#77 — safe workspace error boundary + API request references in UI;
- PR #78/#79 — ambiguous mutation protection + durable incident idempotency in staging;
- PR #80 — cookie path hardening;
- PR #81/#82 — global Origin/CSRF guard + authorization-before-data-access contracts;
- PR #83/#84 — private request envelope + structural CSP;
- PR #85 — temporary refresh failure semantics;
- PR #86 — Next.js security baseline `16.4.1`;
- PR #87 — exact direct dependency pins + compatible Motion transitives;
- PR #88 — fail-closed private session recovery UI;
- PR #89 — reproducible `package-lock.json` + `npm ci` in Node 22/24 Quality gates.

Mayordomía and Conserjería provisioning/live certification remain explicitly deferred. No successful live role activation for those roles is claimed.

## Current next closures — Administrator-only cut

### Waiting on Administration / governance

- G7 real operating procedure responses;
- G5 business purpose, authorized access, retention, correction/deactivation, audit/export/document handling approval.

### Waiting on an explicit future Production decision

- Production Supabase project/plan/secrets;
- Production MFA/password/leaked-password policy;
- final region/residency approval;
- Production monitoring ownership/retention/alerts/SLO;
- Production application rollback approval;
- Vercel Firewall login rate-limit activation.

### Explicitly frozen

- G6/P1E backup + independent restore;
- P2;
- live activation of Mayordomía, Conserjería, Committee and Resident.

Do **not** treat provisioning deferred roles, creating Production, applying real data, or reopening P1E as the current next step without explicit user approval.

## Decision rule

Production with real data is **BLOCKED** while any mandatory unchecked item for the selected Production scope remains open.

Current state: **ADMINISTRATOR ONLY · SYNTHETIC STAGING ONLY · PRODUCTION BLOCKED · P1E FROZEN / RESTORE NOT PROVEN · P2 BLOCKED**.

When a gate is closed, record evidence in the relevant PR/document. Do not mark an item complete from assumption, code review alone, a build succeeding when the gate requires live/visual/restore testing, or an Administration decision that has not actually been received.
