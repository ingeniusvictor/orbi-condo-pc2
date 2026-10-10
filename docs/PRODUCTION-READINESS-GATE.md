# ORBI LIVING — Production Readiness Gate

## Purpose
This checklist is the hard boundary between the current synthetic staging system and any future use of real condominium information. **No real resident, worker, phone, RUT, plate, contract or private incident narrative may be loaded until every mandatory gate is explicitly closed.**

## G0 · Product scope
- [x] ORBI LIVING operational scope documented: shifts, coverage, handoff, incidents, escalation and administrative traceability.
- [x] Payroll, overtime and automatic labour-law conclusions remain outside the MVP.
- [x] DS19 rental policing/investigation remains outside product scope.
- [x] ComunidadFeliz coexistence documented; no unverified API/integration assumed.

## G1 · Public frontend safety
- [x] Public demos use synthetic/generic identities only.
- [x] No contracts, RUTs, phones, plates or resident data committed to GitHub.
- [x] Build/typecheck gates are active.
- [ ] Manual responsive visual QA completed at 390×844, 430×932, 768×1024, 1440×900 and 1920×1080.
- [ ] Keyboard/focus/accessibility visual pass recorded.

## G2 · Authentication lifecycle
- [x] Server-side Auth boundary exists.
- [x] Session cookies are HttpOnly, SameSite=Strict and Secure in production.
- [x] Access + refresh token storage remains server-only.
- [x] Refresh rotation endpoint exists.
- [x] Logout clears local credentials and attempts Supabase local-session revocation.
- [x] Auth/PostgREST upstream calls are time-bounded.
- [ ] Supported synthetic Auth password account proves login → session → refresh → logout end-to-end.
- [ ] Invalid/stale refresh behavior proven end-to-end.
- [ ] Durable app-level login abuse/rate-limit strategy approved.
- [ ] Production MFA/password policy approved.
- [ ] Decide whether production upgrades Supabase to enable leaked-password protection (currently Pro+), or document compensating controls.

## G3 · Authorization / tenant isolation
- [x] RLS enabled on operational/private tables.
- [x] `anon` denied.
- [x] Administrator, mayordomo, concierge, committee and resident role boundaries tested with synthetic identities.
- [x] Cross-community isolation tested.
- [x] Cross-community staff references rejected by composite FK.
- [x] Direct event-table INSERT remains denied.
- [x] Old `community_members` architecture superseded; canonical model is `memberships`.

## G4 · Controlled writes
- [x] Server commands exist for shift management, gap reporting, handoff, incident report and incident management.
- [x] Shift transitions validated in PostgreSQL.
- [x] Incident transitions validated in PostgreSQL.
- [x] Concierge cannot redefine shift structure.
- [x] Confirmed/received shifts require assignee.
- [x] Shift/incident events append automatically with actor.
- [x] Revision increments and stale-revision zero-row behavior tested at database layer.
- [ ] HTTP 409 conflict mapping proven end-to-end with real synthetic Auth session.
- [ ] Real UI wired to controlled endpoints; no browser direct writes to private operational tables.

## G5 · Privacy / data governance
- [x] Public/private data boundary documented.
- [x] Real PII blocked from staging during security development.
- [ ] Private field inventory approved: exact fields, purpose, retention and roles for access.
- [ ] Procedure approved for staff/contact data correction and deactivation.
- [ ] Audit access and retention approved.
- [ ] Private document storage approach approved; no private files exposed via public routes or repo.
- [ ] Production privacy notice / internal handling procedure reviewed for Chilean operation before resident data is enabled.

## G6 · Backup / recovery
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

## G7 · Operational procedure
- [ ] Exact Sunday/holiday night coverage schedule formally validated; do not convert the inferred 20:00–08:00 block into fact until confirmed.
- [ ] Who may activate a replacement formally confirmed.
- [ ] Replacement acceptance/confirmation channel confirmed.
- [ ] Shift handoff verification procedure confirmed.
- [ ] Emergency escalation contacts/channel and after-hours path confirmed.
- [ ] Authorized replacement-pool rule confirmed by administration.

## G8 · Production infrastructure
- [ ] Production Supabase project/plan explicitly approved; staging project must not silently become production.
- [ ] Production secrets created independently from staging.
- [ ] Vercel production variables reviewed; no staging URL/key remains in production scope.
- [ ] Production region/data residency decision documented.
- [ ] Monitoring/error handling strategy enabled.
- [ ] Rollback procedure for application and database changes approved.

## Decision rule
Production with real data is **BLOCKED** while any mandatory unchecked item above remains open.

Current state: **SYNTHETIC STAGING ONLY**.

When a gate is closed, record evidence in the relevant PR/document. Do not mark an item complete from assumption, code review alone, or a build succeeding when the gate specifically requires live/visual/restore testing.
