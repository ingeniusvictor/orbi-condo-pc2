# ORBI LIVING — Production Readiness Gate

## Purpose
This checklist is the hard boundary between the current synthetic staging system and any future use of real condominium information. **No real resident, worker, phone, RUT, plate, contract or private incident narrative may be loaded until every mandatory gate is explicitly closed.**

Evidence snapshot: **2026-10-10 · Chile**. Current stack reaches **P1AA (#55 candidate)**, remains draft/stacked and **SYNTHETIC STAGING ONLY**.

## G0 · Product scope
- [x] ORBI LIVING operational scope documented: shifts, coverage, handoff, incidents, escalation and administrative traceability.
- [x] Payroll, overtime and automatic labour-law conclusions remain outside the MVP.
- [x] DS19 rental policing/investigation remains outside product scope.
- [x] ComunidadFeliz coexistence documented; no unverified API/integration assumed.
- [x] P2 notifications/escalation explicitly blocked until the real procedure is validated with administration.

## G1 · Public/frontend safety
- [x] Public demos use synthetic/generic identities only.
- [x] No contracts, RUTs, phones, plates or resident data committed to GitHub.
- [x] Build/typecheck gates are active.
- [x] `/operaciones` and `/conserjeria` render with `noindex` in the runtime security smoke.
- [x] Runtime security-header contract covers `nosniff`, Referrer-Policy, SAMEORIGIN, restrictive Permissions-Policy, no `X-Powered-By`, private `no-store` and no accidental CORS opt-in on private APIs.
- [ ] Manual responsive visual QA completed at 390×844, 430×932, 768×1024, 1440×900 and 1920×1080.
- [ ] Keyboard/focus/accessibility visual pass recorded.

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
- [ ] Supported synthetic Auth account proves login → session → refresh → logout against the deployed staging backend in the repeatable harness.
- [ ] Synthetic Mayordomía account confirmed through a supported Auth flow and role UI tested.
- [ ] Synthetic Conserjería account confirmed through a supported Auth flow and role UI tested.
- [ ] Durable app-level login abuse/rate-limit strategy approved.
- [ ] Production MFA/password policy approved.
- [ ] Decide whether production upgrades Supabase to enable leaked-password protection, or document compensating controls.

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
- [ ] Repeat the role matrix through real HTTP/UI sessions for confirmed synthetic Mayordomía and Conserjería accounts.

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
- [ ] HTTP 409 conflict mapping proven against the deployed staging backend with a real supported synthetic Auth session (`ORBI_QA_409=1`).
- [ ] Authenticated HTTP E2E proves shift-log open/entry/close and round start/check/complete through the deployed app.

## G5 · Privacy / data governance
- [x] Public/private data boundary documented.
- [x] Real PII blocked from staging during security development.
- [x] Current private operational surfaces use structured fields and synthetic references; no new narrative-free-form PII channel was introduced.
- [x] Client/server boundary contract prevents client modules from directly importing Supabase/server-only access or tracking private environment material.
- [x] Continuity and dashboard projections have executable minimization contracts.
- [ ] Private field inventory approved: exact fields, purpose, retention and roles for access.
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

**Rule:** P1E is not complete merely because later P1 features are GREEN. Backup + independent restore remains a hard blocker for real data.

## G7 · Operational procedure
- [ ] Exact Sunday/holiday night coverage schedule formally validated; do not convert an inferred block into fact until confirmed.
- [ ] Who may activate a replacement formally confirmed.
- [ ] Replacement acceptance/confirmation channel confirmed.
- [ ] Shift handoff verification procedure confirmed.
- [ ] Emergency escalation contacts/channel and after-hours path confirmed.
- [ ] Authorized replacement-pool rule confirmed by administration.
- [ ] Mayordomía/administration validate the practical meaning of bitácora, rounds and continuity statuses before pilot.

## G8 · Production infrastructure
- [ ] Production Supabase project/plan explicitly approved; staging project must not silently become production.
- [ ] Production secrets created independently from staging.
- [ ] Vercel production variables reviewed; no staging URL/key remains in production scope.
- [ ] Production region/data residency decision documented.
- [ ] Monitoring/error handling strategy enabled.
- [ ] Rollback procedure for application and database changes approved.

## Current evidence chain
The current private-operation sequence is:

`#33 P1F Private Workspace → #34 P1G Conserjería → #35 P1H Shift Log/Handoff → #36 P1I Rounds → #38 P1J Continuity Board → #39 P1K Server Snapshot → #40 P1L Continuity Contracts → #41 P1M Operations Contracts → #42 P1N Anonymous Runtime Smoke → #43 P1O Private API Cache Hardening → #44 P1P Readiness Matrix → #45 P1Q Private Boundary → #46 P1R CI Hardening → #47 P1S Build Clean → #48 P1T Cookie Contract → #49 P1U Hermetic Auth → #50 P1V Auth Failure Modes → #51 P1W Runtime Headers → #52 P1X Conflict Contract → #53 P1Y Role HTTP Contract → #54 P1Z Dashboard Privacy → P1AA Staging QA Runner Safety`

All remain stacked/draft unless explicitly changed. Do not merge out of order.

## Staging E2E handoff
Use `docs/STAGING-E2E-RUNBOOK.md` before any live Auth/HTTP QA. The exact deployment URL must be explicit; credentials remain outside Git; production remains refused by default.

The next meaningful closures are external evidence, not additional assumptions:
- supported synthetic Administrator staging run;
- supported Auth confirmation + staging runs for Mayordomía and Conserjería;
- deployed HTTP 409 evidence;
- browser/visual/accessibility QA;
- independent P1E restore;
- validated PC2 operating procedure.

## Decision rule
Production with real data is **BLOCKED** while any mandatory unchecked item above remains open.

Current state: **SYNTHETIC STAGING ONLY · PRODUCTION BLOCKED · P1E RESTORE NOT PROVEN**.

When a gate is closed, record evidence in the relevant PR/document. Do not mark an item complete from assumption, code review alone, or a build succeeding when the gate specifically requires live/visual/restore testing.
