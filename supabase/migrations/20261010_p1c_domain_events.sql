-- ORBI LIVING P1C — controlled transition and domain-event foundation.
-- Intended for staging validation before any production use.

begin;

alter table public.shift_assignments
  drop constraint if exists shift_assignments_confirmed_requires_assignee;
alter table public.shift_assignments
  add constraint shift_assignments_confirmed_requires_assignee
  check(status not in ('confirmed','received') or assignee_staff_id is not null);

create or replace function private.validate_shift_transition()
returns trigger
language plpgsql
set search_path=public,private,auth
as $$
begin
 if old.status = new.status then
  return new;
 end if;

 if not (
  (old.status='planned' and new.status in ('vacant','received')) or
  (old.status='vacant' and new.status in ('requested','confirmed','planned')) or
  (old.status='requested' and new.status in ('confirmed','vacant')) or
  (old.status='confirmed' and new.status in ('received','vacant'))
 ) then
  raise exception 'invalid shift transition: % -> %',old.status,new.status using errcode='23514';
 end if;

 if new.status in ('confirmed','received') and new.assignee_staff_id is null then
  raise exception 'confirmed/received shift requires assignee' using errcode='23514';
 end if;
 return new;
end;
$$;

create or replace function private.record_shift_event()
returns trigger
language plpgsql
security definer
set search_path=public,private,auth
as $$
declare
 actor uuid;
 ev text;
begin
 actor:=coalesce(auth.uid(),new.updated_by,new.created_by);
 if tg_op='INSERT' then
  ev:='created';
 else
  if old.status is distinct from new.status then
   ev:=case new.status
    when 'vacant' then 'gap_reported'
    when 'requested' then 'replacement_requested'
    when 'confirmed' then 'replacement_confirmed'
    when 'received' then 'handoff_received'
    else 'corrected'
   end;
  elsif old.assignee_staff_id is distinct from new.assignee_staff_id then
   ev:='assignee_changed';
  else
   ev:='corrected';
  end if;
 end if;

 insert into public.shift_events(
  shift_assignment_id,community_id,event_type,
  from_status,to_status,from_assignee_staff_id,to_assignee_staff_id,
  actor_user_id,created_at
 ) values(
  new.id,new.community_id,ev,
  case when tg_op='INSERT' then null else old.status end,
  new.status,
  case when tg_op='INSERT' then null else old.assignee_staff_id end,
  new.assignee_staff_id,
  actor,now()
 );
 return new;
end;
$$;

create or replace function private.validate_incident_transition()
returns trigger
language plpgsql
set search_path=public,private,auth
as $$
begin
 if old.state = new.state then
  return new;
 end if;

 if not (
  (old.state='reported' and new.state in ('acknowledged','assigned','resolved')) or
  (old.state='acknowledged' and new.state in ('assigned','in_progress','resolved')) or
  (old.state='assigned' and new.state in ('in_progress','resolved','acknowledged')) or
  (old.state='in_progress' and new.state in ('resolved','assigned')) or
  (old.state='resolved' and new.state in ('closed','in_progress'))
 ) then
  raise exception 'invalid incident transition: % -> %',old.state,new.state using errcode='23514';
 end if;
 return new;
end;
$$;

create or replace function private.record_incident_event()
returns trigger
language plpgsql
security definer
set search_path=public,private,auth
as $$
declare
 actor uuid;
 ev text;
begin
 actor:=coalesce(auth.uid(),new.updated_by,new.created_by);
 if tg_op='INSERT' then
  ev:='created';
 elsif old.state is distinct from new.state then
  if old.state in ('resolved','closed') and new.state not in ('resolved','closed') then
   ev:='reopened';
  else
   ev:=case new.state
    when 'acknowledged' then 'acknowledged'
    when 'assigned' then 'assigned'
    when 'resolved' then 'resolved'
    when 'closed' then 'closed'
    else 'state_changed'
   end;
  end if;
 elsif old.priority is distinct from new.priority then
  ev:='priority_changed';
 elsif old.assigned_role is distinct from new.assigned_role then
  ev:='assigned';
 else
  return new;
 end if;

 insert into public.incident_events(
  incident_id,community_id,event_type,
  from_state,to_state,from_priority,to_priority,
  actor_user_id,created_at
 ) values(
  new.id,new.community_id,ev,
  case when tg_op='INSERT' then null else old.state end,
  new.state,
  case when tg_op='INSERT' then null else old.priority end,
  new.priority,
  actor,now()
 );
 return new;
end;
$$;

revoke all on function private.validate_shift_transition() from public,anon,authenticated;
revoke all on function private.record_shift_event() from public,anon,authenticated;
revoke all on function private.validate_incident_transition() from public,anon,authenticated;
revoke all on function private.record_incident_event() from public,anon,authenticated;

drop trigger if exists shift_assignments_validate_transition on public.shift_assignments;
create trigger shift_assignments_validate_transition
 before update on public.shift_assignments
 for each row execute function private.validate_shift_transition();

drop trigger if exists shift_assignments_domain_event on public.shift_assignments;
create trigger shift_assignments_domain_event
 after insert or update on public.shift_assignments
 for each row execute function private.record_shift_event();

drop trigger if exists incidents_validate_transition on public.incidents;
create trigger incidents_validate_transition
 before update on public.incidents
 for each row execute function private.validate_incident_transition();

drop trigger if exists incidents_domain_event on public.incidents;
create trigger incidents_domain_event
 after insert or update on public.incidents
 for each row execute function private.record_incident_event();

commit;
