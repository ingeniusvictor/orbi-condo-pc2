# ORBI LIVING — Production Readiness Gate

## Purpose
This checklist is the hard boundary between the current synthetic staging system and any future use of real condominium information. **No real resident, worker, phone, RUT, plate, contract or private incident narrative may be loaded until every mandatory gate is explicitly closed.**

Evidence snapshot: **2026-10-14 · Chile**. Canonical repository baseline before OC-PC2-82: `main@ca4f633bd1628d9147518a2daf11d2a98c404706`. The active implementation/certification cut is **Administrator / Administración only**; see `docs/ADMINISTRATOR-ONLY-CURRENT-CUT.md`.

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
- [x] `/operaciones` and `/conserjeria` render with `noindex` in the runtime security smoke.
- [x] Runtime security-header contract covers `nosniff`, Referrer-Policy, SAMEORIGIN, restrictive Permissions-Policy, no `X-Powered-By`, private `no-store` and no accidental CORS opt-in on private APIs.
- [x] Administrator browser responsive QA completed at 390×844, 430×932, 768×1024, 1440×900 and 1920×1080 in `Administrator UI QA` run `38497812117`.
- [x] Administrator keyboard/focus/accessibility browser pass recorded in run `38497812117`: keyboard login, visible focus, semantic labels, contained controls, no horizontal overflow and successful logout boundary.

## G2 · Authentication lifecycle
- [x] Server-side Auth boundary exists.
- [x] Session cookies are HttpOnly, SameSite=Strict and Secure in production.
- [x] Access + refresh token storage remains server-only.
- [x] Refresh rotation endpoint exists.
- [x] Logout clears local credentials and attempts Supabase local-session revocation.
- [x] Auth/PostgREST upstream calls are time-bounded.
- [x] Unconfigured runtime is proven fail-closed: session returns `configured:false`, private APIs deny anonymous access and no backend detail is exposed.
- [x] Auth/operations API responses are centrally hardened with `Cache-Control: private, no-store`, including early 403 write rejections.
- [x] Hermetic real-Next lifecycle proves login → session → refresh → logout, cookie rotation, revocation and return to anonymous without external network.
- [x] Hermetic failure-mode contract proves invalid access, disabled/future/expired/unknown memberships, missing/invalid refresh and revoked access all fail closed.
- [x] Staging QA runner requires an explicit target URL, blocks production by default, validates configured/anonymous preflight and verifies role/community do not drift after refresh.
- [x] Manual staging E2E workflow is contract-protected as `workflow_dispatch` only, main-only, read-only by default and target-allowlisted before role secrets are exposed.
- [x] Supported synthetic Administrator Auth account proves deployed login → session → refresh → logout in repeatable staging harness; run `38490618996` GREEN, repeated as part of run `38495816498` GREEN.
- [x] Login boundary preserves upstream Auth throttling semantics: `429` stays `429`, bounded numeric `Retry-After` may pass, upstream details/headers stay private, upstream `5xx` normalizes to `503`, and failed login paths issue no cookies. See `docs/ADMINISTRATOR-LOGIN-ABUSE-PROTECTION.md`.
- [x] Durable login-abuse strategy is defined: Vercel Firewall per-IP edge limiting for `POST /api/auth/login` + existing app validation + Supabase Auth protections; process-local/in-memory counters are explicitly rejected as insufficient.
- [ ] Publish and verify the durable Vercel Firewall login rate-limit rule only when project-level security changes are allowed to affect the intended Production boundary. It remains intentionally inactive during the current staging-only cut.
- [ ] Production MFA/password policy approved.
- [ ] Decide whether production upgrades Supabase to enable leaked-password protection, or document compensating controls.

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
- [x] Permission matrix is an executable CI contract: Resident has no operational permissions; Committee remains read/review; Conserjería cannot administer coverage/incidents/contracts.
- [x] Hermetic Route Handler contract proves the same role matrix at the real server HTTP authorization boundary before resource access.
- [x] Dashboard privacy projection contract proves Conserjería never queries/receives `staff_private`, Committee omits staff/activity streams and shift projections do not expose private assignee linkage.
- [x] Administrator staging session is live-certified against the canonical exact-permission contract.
- [ ] Live HTTP/UI repetition for deferred roles only if/when those roles are explicitly activated in a future cut.

## G4 · Controlled writes and operational continuity
- [x] Server commands exist for shift management, gap reporting, handoff, incident report and incident management.
- [x] Shift transitions validated in PostgreSQL and frozen as an executable CI contract.
- [x] Incident transitions validated in PostgreSQL and frozen as an executable CI contract.
- [x] Conserjería cannot redefine shift structure.
- [x] Confirmed/received shifts require assignee.
- [x] Shift/incident events append automatically with actor.
- [x] Revision increments and stale-revision zero-row behavior tested at database layer.
- [x] `/operaciones` and `/conserjeria` are wired to controlled server endpoints; browser code does not write directly to private operational tables.
- [x] Structured shift logs/handoffs exist with RLS, append-only entries, optimistic revision and closed-log immutability.
- [x] Operational rounds/checkpoints exist with RLS, append-only evidence and a database barrier preventing shift-log closure while a round remains open.
- [x] Continuity Board correlates coverage, open incidents, shift logs and rounds without creating a second persisted state.
- [x] Continuity derivation moved server-side and minimizes its payload; source resource IDs are not emitted in the snapshot.
- [x] Continuity semantics are an executable CI contract: open round is the only technical close blocker; critical incidents/vacancies remain continuity signals rather than fabricated closure blocks.
- [x] Runtime anonymous smoke proves representative private writes stop at Origin/Auth barrier before validation/persistence.
- [x] Hermetic HTTP conflict contract proves stale revision before PATCH, invalid transition, zero-row compare-and-swap race → 409 and valid scoped update.
- [x] Staging QA runner wraps the optional concurrent 200/409 fixture in best-effort `finally` restoration and surfaces cleanup warnings.
- [x] HTTP 409 conflict mapping proven against deployed staging with the supported Administrator synthetic Auth session; run `38490781620` GREEN with synthetic fixture restored to `planned`.
- [x] Authenticated deployed Administrator HTTP E2E proves shift-log open/entry/close and round start/check/complete. Run `38495816498` GREEN also proves open-round close blocking, empty-round rejection, duplicate checkpoint rejection, completed-round immutability and final append-only evidence.

## G5 · Privacy / data governance
- [x] Public/private data boundary documented.
- [x] Real PII blocked from staging during security development.
- [x] Current private operational surfaces use structured fields and synthetic references; no new narrative-free-form PII channel was introduced.
- [x] Client/server boundary contract prevents client modules from directly importing Supabase/server-only access or tracking private environment material.
- [x] Continuity and dashboard projections have executable minimization contracts.
- [x] Technical field-level inventory reconciled against the current staging schema without reading row contents; every current private operational table/field is recorded in `docs/ADMINISTRATOR-PRIVATE-DATA-INVENTORY.md`.
- [x] CI contract protects key Administrator minimization rules: assignee UUID stays server-side in shift projection, private incident reference is not returned, historical `note_private` is not queried by the dashboard, and shift-log/round evidence remains structured.
- [x] Historical `shift_events.note_private` is explicitly classified as prohibited for real data until a future deprecation/constrained-vocabulary/governed-narrative decision is approved.
- [ ] Private field inventory **approved for real-data use**: exact business purpose, retention and authorized access must still be signed off. Technical inventory alone does not close this gate.
- [ ] Procedure approved for staff/contact data correction and deactivation.
- [ ] Audit access and retention approved.
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

**Rule:** P1E is not complete merely because later P1 features are GREEN. Backup + independent restore remains a hard blocker for real data. Current project direction keeps this gate frozen/pending until explicitly reopened.

## G7 · Operational procedure
- [ ] Exact Sunday/holiday night coverage schedule formally validated; do not convert an inferred block into fact until confirmed.
- [ ] Who may activate a replacement formally confirmed.
- [ ] Replacement acceptance/confirmation channel confirmed.
- [ ] Shift handoff verification procedure confirmed.
- [ ] Emergency escalation contacts/channel and after-hours path confirmed.
- [ ] Authorized replacement-pool rule confirmed by administration.
- [ ] Administration validates the practical meaning of bitácora, rounds and continuity statuses before pilot.

No live Mayordomía/Conserjería identity is required to conduct this current administrative procedure-validation work.

## G8 · Production infrastructure
- [ ] Production Supabase project/plan explicitly approved; staging project must not silently become production.
- [ ] Production secrets created independently from staging.
- [x] Vercel environment scopes reviewed read-only: current staging `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `ORBI_COMMUNITY_ID` are Preview-only and Vercel reports no hidden Production env variables. See `docs/VERCEL-PREVIEW-ISOLATION.md`.
- [x] Vercel Git binding verified: project `orbi-condo-pc2` / team `orbi4` points to `ingeniusvictor/orbi-condo-pc2`.
- [x] Node 22 full contract + Node 24 Vercel-runtime parity continue GREEN through current main Quality Gates.
- [x] Automatic Production deployment from current `main` is disabled by repository release control; merges after that control show zero new Vercel deployments for their canonical main SHAs unless a deliberate Preview exists for the feature head.
- [ ] Production region/data residency decision documented.
- [ ] Monitoring/error handling strategy enabled.
- [ ] Rollback procedure for application and database changes approved.

Historical Vercel Production deployments from older `main` commits exist, but they predate the current P1 private-operations stack and are **not** evidence that the current private stack has been promoted or approved for production.

## Current Administrator evidence chain
The original private-operation foundation through P1AD was consolidated to `main`, then the Administrator live-certification sequence closed the previously external gates:

- Administrator clean staging Auth/HTTP: Actions run `38490618996` — GREEN;
- Administrator reversible HTTP 409: Actions run `38490781620` — GREEN;
- PR #62 `OC-PC2-75 · Exact staging role permission contract` merged; exact permission drift now fails closed;
- PR #63 `OC-PC2-76 · Administrator write lifecycle E2E` merged; Actions run `38495816498` — GREEN;
- PR #64 `OC-PC2-77 · Administrator browser UI QA` merged; Actions run `38497812117` — GREEN;
- PR #65/#66 added future-role provisioning tooling and corrected new Supabase secret-key transport. The tooling is dormant under the current Administrator-only cut and does not create identities by itself;
- PR #67 `OC-PC2-80 · Administrator-only readiness consolidation` made the current scope boundary canonical;
- PR #68 `OC-PC2-81 · Administrator login throttle semantics` added executable upstream-throttling semantics and defined the durable edge strategy without activating project-level Production traffic controls;
- OC-PC2-82 adds the exact technical private-data inventory and an executable minimization contract without approving or loading real data.

Mayordomía and Conserjería steps were explicitly skipped in the Administrator write-lifecycle run. No successful provisioning or live role certification for those deferred roles is claimed.

## Current next closures — Administrator-only cut
The meaningful remaining work is now:

- formal business-purpose/retention/access approval for the technical private-data inventory;
- staff/access correction and deactivation procedure;
- audit access/retention procedure;
- durable Vercel Firewall login rate-limit activation when the Production security boundary is intentionally opened;
- administration validation of the real PC2 operating procedure;
- P1E independent restore when that frozen gate is explicitly reopened;
- production region/monitoring/rollback and authentication-policy decisions before any production enablement.

Do **not** treat provisioning Mayordomía/Conserjería as the current next step. See `docs/ADMINISTRATOR-ONLY-CURRENT-CUT.md`.

## Decision rule
Production with real data is **BLOCKED** while any mandatory unchecked item for the selected production scope remains open.

Current state: **ADMINISTRATOR ONLY · SYNTHETIC STAGING ONLY · PRODUCTION BLOCKED · P1E RESTORE NOT PROVEN**.

When a gate is closed, record evidence in the relevant PR/document. Do not mark an item complete from assumption, code review alone, or a build succeeding when the gate specifically requires live/visual/restore testing.
