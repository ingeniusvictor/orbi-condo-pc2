-- ORBI LIVING P1B — performance hardening validated in staging.
begin;

create index if not exists audit_events_actor_idx on public.audit_events(actor_user_id);
create index if not exists incident_events_actor_idx on public.incident_events(actor_user_id);
create index if not exists incident_events_community_incident_idx on public.incident_events(community_id,incident_id);
create index if not exists incidents_created_by_idx on public.incidents(created_by);
create index if not exists incidents_updated_by_idx on public.incidents(updated_by);
create index if not exists shift_assignments_community_assignee_idx on public.shift_assignments(community_id,assignee_staff_id);
create index if not exists shift_assignments_created_by_idx on public.shift_assignments(created_by);
create index if not exists shift_assignments_updated_by_idx on public.shift_assignments(updated_by);
create index if not exists shift_events_actor_idx on public.shift_events(actor_user_id);
create index if not exists shift_events_community_assignment_idx on public.shift_events(community_id,shift_assignment_id);
create index if not exists shift_events_community_from_assignee_idx on public.shift_events(community_id,from_assignee_staff_id);
create index if not exists shift_events_community_to_assignee_idx on public.shift_events(community_id,to_assignee_staff_id);

drop policy if exists memberships_self_or_admin_select on public.memberships;
create policy memberships_self_or_admin_select on public.memberships
 for select to authenticated
 using(user_id=(select auth.uid()) or private.has_operations_role(community_id,array['administrator']));

drop policy if exists shift_assignments_manage_insert on public.shift_assignments;
create policy shift_assignments_manage_insert on public.shift_assignments
 for insert to authenticated
 with check(private.has_operations_role(community_id,array['administrator','mayordomo']) and created_by=(select auth.uid()) and updated_by=(select auth.uid()));

drop policy if exists incidents_report_insert on public.incidents;
create policy incidents_report_insert on public.incidents
 for insert to authenticated
 with check(private.has_operations_role(community_id,array['administrator','mayordomo','concierge']) and created_by=(select auth.uid()) and updated_by=(select auth.uid()));

commit;
