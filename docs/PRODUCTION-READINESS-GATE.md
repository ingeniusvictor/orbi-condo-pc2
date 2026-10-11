# ORBI LIVING — Production Readiness Gate

## Purpose
This checklist is the hard boundary between the current synthetic staging system and any future use of real condominium information. **No real resident, worker, phone, RUT, plate, contract or private incident narrative may be loaded until every mandatory gate is explicitly closed.**

Evidence snapshot: **2026-10-10 · Chile**. Current stack reaches P1O (#43), remains draft/stacked and **SYNTHETIC STAGING ONLY**.

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
- [ ] Supported synthetic Auth account proves login → session → refresh → logout end-to-end in the repeatable harness.
- [ ] Invalid/stale refresh behavior proven end-to-end.
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
- [x] Permission matrix is now an executable CI contract: Resident has no operational permissions; Committee remains read/review; Conserjería cannot administer coverage/incidents/contracts.
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
- [ ] HTTP 409 conflict mapping proven end-to-end with a real synthetic Auth session (`ORBI_QA_409=1`).
- [ ] Authenticated HTTP E2E proves shift-log open/entry/close and round start/check/complete through the deployed app.

## G5 · Privacy / data governance
- [x] Public/private data boundary documented.
- [x] Real PII blocked from staging during security development.
- [x] Current P1G–P1O surfaces use structured operational fields and synthetic references; no new narrative-free-form PII channel was introduced.
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

`#33 P1F Private Workspace → #34 P1G Conserjería → #35 P1H Shift Log/Handoff → #36 P1I Rounds → #38 P1J Continuity Board → #39 P1K Server Snapshot → #40 P1L Continuity Contracts → #41 P1M Operations Contracts → #42 P1N Anonymous Runtime Smoke → #43 P1O Private API Cache Hardening`

All remain stacked/draft unless explicitly changed. Do not merge out of order.

## Decision rule
Production with real data is **BLOCKED** while any mandatory unchecked item above remains open.

Current state: **SYNTHETIC STAGING ONLY · PRODUCTION BLOCKED · P1E RESTORE NOT PROVEN**.

When a gate is closed, record evidence in the relevant PR/document. Do not mark an item complete from assumption, code review alone, or a build succeeding when the gate specifically requires live/visual/restore testing.
