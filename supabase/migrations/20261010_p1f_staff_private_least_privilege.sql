-- ORBI LIVING P1F — least-privilege hardening for private coverage staff.
-- Synthetic staging only. The private workspace exposes coverage candidates only
-- to roles that can manage the schedule, so RLS must enforce the same boundary.

drop policy if exists staff_private_operational_select on public.staff_private;

create policy staff_private_operational_select
on public.staff_private
for select
to authenticated
using (
  private.has_operations_role(
    community_id,
    array['administrator'::text, 'mayordomo'::text]
  )
);
