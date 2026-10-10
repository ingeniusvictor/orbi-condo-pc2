# ORBI LIVING — P1B Supabase staging validation

## Environment
Dedicated staging project created under the ORBI Ecosystem organization in Supabase. No real residents, workers, contacts, contracts or other PII were loaded.

Two non-personal community rows were created only for isolation tests:
- `pc2` — Parque Ciudadano II · STAGING
- `isolation-test` — Comunidad Ficticia · RLS

## Migration status
The P1B operational schema was applied successfully to staging. Follow-up hardening migrations were then applied after live database validation exposed issues that a Next.js build could not detect.

### Security hardening discovered in staging
Supabase Security Advisor initially reported exposed `SECURITY DEFINER` helpers in the `public` schema. They were moved to a non-exposed `private` schema, direct execution was revoked from `anon`, and only the role-resolution helpers retain the minimum `authenticated` execute privilege required by RLS policies.

After the correction, **Supabase Security Advisor returned zero security lints**.

### RLS negative tests completed
- `anon` direct read of `public.communities` is rejected with `permission denied`.
- An `authenticated` JWT subject with no membership sees **0 communities**, even though two test community rows exist.
- An authenticated subject with no membership cannot insert into `staff_private`; PostgreSQL rejects the write with an RLS policy violation.

During the write-denial test, staging exposed a broken schema-qualified reference after moving the role helper into `private`. A follow-up migration corrected `private.has_operations_role()` to call `private.active_operations_role()`. The denial test was repeated and then failed for the intended reason: RLS rejection.

## Performance advisor
Initial advisor findings identified missing indexes for several foreign-key paths and row-by-row `auth.uid()` evaluation in three policies. A hardening migration added the relevant indexes and changed those checks to `(select auth.uid())`.

After that correction, the only performance notices are `unused_index` INFO findings. This is expected on a newly created staging database with essentially no workload and is not evidence that the indexes should be removed.

## Still pending before P1B can be Ready
1. Create synthetic Supabase Auth users for `administrator`, `mayordomo`, `concierge`, `committee` and `resident`.
2. Assign memberships and execute the positive/negative permission matrix for each role.
3. Verify isolation with users belonging to two different fictitious communities.
4. Exercise revision increments and automatic audit rows through authorized mutations.
5. Verify composite FKs reject cross-community event references.
6. Test rollback and database restore procedure.
7. Resolve architecture overlap with PR #25 (`community_members` vs `memberships`).

## Interpretation
P1B is now **database-applied and partially RLS-validated in staging**, but it is not production-ready. No production database exists and no real operational data has been enabled.
