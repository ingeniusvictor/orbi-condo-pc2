# ORBI LIVING — P1B Supabase staging validation

## Environment
Dedicated staging project created under the ORBI Ecosystem organization in Supabase. Region: `sa-east-1` (São Paulo), currently the closest specific Supabase region available for Chile. No real residents, workers, contacts, contracts or other PII were loaded.

Two non-personal community rows were created only for isolation tests:
- `pc2` — Parque Ciudadano II · STAGING
- `isolation-test` — Comunidad Ficticia · RLS

The Vercel preview branch `oc-pc2-43-private-schema-rls` is configured with branch-scoped staging variables only. No Supabase credentials are committed to GitHub.

## Migration status
The P1B operational schema was applied successfully to staging. Follow-up hardening migrations were then applied after live database validation exposed issues that a Next.js build could not detect.

### Security hardening discovered in staging
Supabase Security Advisor initially reported exposed `SECURITY DEFINER` helpers in the `public` schema. They were moved to a non-exposed `private` schema, direct execution was revoked from `anon`, and only the role-resolution helpers retain the minimum `authenticated` execute privilege required by RLS policies.

Database schema/RLS security findings were cleared. Supabase Auth reports the project-level warning that leaked-password protection is disabled. Supabase documents this protection as a **Pro-plan-and-above** feature, so the current Free staging project cannot use that control. Before real production credentials are provisioned, ORBI must either upgrade and enable it or formally adopt compensating password/MFA controls.

### Performance hardening discovered in staging
Initial advisor findings identified missing indexes for several foreign-key paths and row-by-row `auth.uid()` evaluation in three policies. A hardening migration added the relevant indexes and changed those checks to `(select auth.uid())`.

After that correction, the remaining performance notices are `unused_index` INFO findings, expected on a newly created staging database with almost no workload.

## Synthetic identity matrix
Synthetic Auth subjects were created only for RLS testing. They do not represent real people and use non-routable `.invalid` email identities.

Roles represented in `pc2`:
- `administrator`
- `mayordomo`
- `concierge`
- `committee`
- `resident`

A separate synthetic `administrator` belongs only to `isolation-test`.

These rows are for database authorization tests; full end-to-end password login through Supabase Auth is still a separate P1A validation item.

## RLS tests completed

### Baseline / unauthenticated
- `anon` cannot read `public.communities`: PostgreSQL returns `permission denied`.
- an authenticated subject without membership sees 0 communities.
- an authenticated subject without membership cannot insert into `staff_private`.

### Administrator (`pc2`)
- sees exactly the `pc2` community, not `isolation-test`;
- sees all five PC2 memberships required for administration;
- can create eligible synthetic staff;
- can create a shift assignment;
- can read audit rows for PC2 resources.

### Mayordomo (`pc2`)
- sees `pc2` only;
- sees only their own membership row;
- can see protected staff;
- can create eligible staff;
- can update an existing shift;
- authorized shift update increments `revision` from 1 to 2 and stamps `updated_by` with the acting subject;
- can update an incident and its `revision` increments from 1 to 2.

### Concierge (`pc2`)
- sees `pc2` only and their own membership;
- can read protected staff and current shift assignments;
- can report/create an incident;
- cannot create staff (`RLS policy violation`);
- cannot update shift assignments: matching update affects 0 rows;
- cannot manage an existing incident: matching update affects 0 rows.

### Committee (`pc2`)
- sees `pc2` and their own membership;
- can read the current shift assignment;
- cannot read `staff_private`;
- cannot read operational incidents under the current MVP policy;
- cannot update shift assignments: matching update affects 0 rows.

### Resident (`pc2`)
- sees the community shell and only their own membership;
- sees 0 shift assignments, 0 incidents and 0 private staff;
- cannot create an incident under the current operations-only P1B policy (`RLS policy violation`).

### Cross-community isolation
The `isolation-test` administrator:
- sees exactly one community: `isolation-test`;
- sees 0 PC2 staff, 0 PC2 shifts and 0 PC2 incidents;
- cannot create an `isolation-test` shift pointing at a PC2 staff record. The composite foreign key rejects the reference.

### Domain-event boundary
Direct `INSERT` into `shift_events` by an authenticated administrator is denied at the table-privilege layer. Event writes remain reserved for controlled P1C server/RPC commands rather than arbitrary client inserts.

## Revision and audit validation
A synthetic PC2 shift was created at revision 1 and then updated by the mayordomo to revision 2. Automatic audit contains two rows for that resource (`created` + `updated`).

A synthetic PC2 incident was created by the concierge at revision 1 and then updated by the mayordomo to revision 2. Automatic audit likewise contains two rows for that resource.

This verifies the current trigger path for server timestamps/revision increment/audit generation under authorized RLS mutations.

## Vercel integration check
The P1B preview deployment is now connected to this staging project with branch-scoped environment variables. `/api/auth/session` returns HTTP 200 with `configured:true`, `authenticated:false`, null role/community and an empty permission list when no session cookie is present. `Cache-Control: no-store` remains active.

## Still pending before P1B can be Ready
1. Test full Supabase Auth password/session flow through the P1A Next.js endpoints using properly provisioned synthetic Auth accounts.
2. Decide production password/MFA controls; leaked-password protection requires Pro or above.
3. Add controlled P1C commands that create `shift_events` and `incident_events`; keep direct client INSERT denied.
4. Test optimistic concurrency with stale `revision` values once P1C commands exist.
5. Document rollback and execute a restore/clone test appropriate to the Free-plan capabilities.
6. Resolve architecture overlap with PR #25 (`community_members` vs `memberships`).
7. Keep all data synthetic until the private backend gate is complete.

## Interpretation
P1B is now **applied and materially RLS-validated in staging**. The core role boundaries, tenant isolation, revision trigger and audit trigger have live evidence, and the P1A session endpoint is connected to the staging backend in preview. It is still not production-ready: full Auth login, controlled command APIs, concurrency and recovery testing remain open, and no real operational data is enabled.
