-- ORBI LIVING P1J — operational follow-up / carryover queue.
-- SYNTHETIC STAGING ONLY.

begin;

create table if not exists public.operational_followups(
 id uuid primary key default gen_random_uuid(),
 community_id text not null references public.communities(id) on delete restrict,
 shift_log_id uuid not null,
 round_id uuid,
 incident_id uuid,
 action_code text not null check(action_code in ('verify_condition','coordinate_maintenance','monitor_incident','recheck_checkpoint','handoff_action','other')),
 category text not null check(category in ('access','security','maintenance','utilities','resident_support','delivery','other')),
 priority text not null check(priority in ('low','medium','high')),
 state text not null default 'open' check(state in ('open','acknowledged','resolved')),
 case_reference text check(case_reference is null or (length(case_reference) between 1 and 80 and case_reference ~ '^[A-Za-z0-9._-]+$')),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 acknowledged_by uuid references auth.users(id),
 acknowledged_at timestamptz,
 resolved_by uuid references auth.users(id),
 resolved_at timestamptz,
 resolution_code text check(resolution_code is null or resolution_code in ('completed','transferred','no_action_required')),
 revision bigint not null default 1 check(revision>0),
 updated_by uuid not null references auth.users(id),
 updated_at timestamptz not null default now(),
 unique(community_id,id),
 foreign key(community_id,shift_log_id) references public.shift_logs(community_id,id) on delete restrict,
 foreign key(community_id,round_id) references public.operational_rounds(community_id,id) on delete restrict,
 foreign key(community_id,incident_id) references public.incidents(community_id,id) on delete restrict,
 check(
  (state='open' and acknowledged_by is null and acknowledged_at is null and resolved_by is null and resolved_at is null and resolution_code is null)
  or
  (state='acknowledged' and acknowledged_by is not null and acknowledged_at is not null and resolved_by is null and resolved_at is null and resolution_code is null)
  or
  (state='resolved' and acknowledged_by is not null and acknowledged_at is not null and resolved_by is not null and resolved_at is not null and resolution_code is not null)
 )
);

create index if not exists operational_followups_log_idx on public.operational_followups(community_id,shift_log_id,state,created_at);
create index if not exists operational_followups_round_idx on public.operational_followups(community_id,round_id) where round_id is not null;
create index if not exists operational_followups_incident_idx on public.operational_followups(community_id,incident_id) where incident_id is not null;
create index if not exists operational_followups_created_by_idx on public.operational_followups(created_by);
create index if not exists operational_followups_ack_by_idx on public.operational_followups(acknowledged_by) where acknowledged_by is not null;
create index if not exists operational_followups_resolved_by_idx on public.operational_followups(resolved_by) where resolved_by is not null;
create index if not exists operational_followups_updated_by_idx on public.operational_followups(updated_by);

create or replace function private.validate_operational_followup_insert()
returns trigger
language plpgsql
set search_path=public,private,auth
as $$
declare log_state text; round_log uuid;
begin
 if auth.uid() is null or new.created_by is distinct from auth.uid() or new.updated_by is distinct from auth.uid() then
  raise exception 'follow-up creation must stamp authenticated actor' using errcode='42501';
 end if;
 select l.state into log_state from public.shift_logs l where l.id=new.shift_log_id and l.community_id=new.community_id;
 if log_state is distinct from 'open' then
  raise exception 'follow-up requires an open shift log' using errcode='23514';
 end if;
 if new.round_id is not null then
  select r.shift_log_id into round_log from public.operational_rounds r where r.id=new.round_id and r.community_id=new.community_id;
  if round_log is distinct from new.shift_log_id then
   raise exception 'linked round must belong to the same shift log' using errcode='23514';
  end if;
 end if;
 return new;
end;
$$;

create or replace function private.validate_operational_followup_transition()
returns trigger
language plpgsql
set search_path=public,private,auth
as $$
begin
 if old.state='resolved' then
  raise exception 'resolved follow-up is immutable' using errcode='23514';
 end if;
 if new.community_id is distinct from old.community_id
    or new.shift_log_id is distinct from old.shift_log_id
    or new.round_id is distinct from old.round_id
    or new.incident_id is distinct from old.incident_id
    or new.action_code is distinct from old.action_code
    or new.category is distinct from old.category
    or new.priority is distinct from old.priority
    or new.case_reference is distinct from old.case_reference
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at then
  raise exception 'follow-up identity is immutable' using errcode='23514';
 end if;
 if auth.uid() is null or new.updated_by is distinct from auth.uid() then
  raise exception 'follow-up transition must stamp authenticated actor' using errcode='42501';
 end if;
 if old.state='open' and new.state='acknowledged' then
  if new.acknowledged_by is distinct from auth.uid() or new.acknowledged_at is null or new.resolved_by is not null or new.resolved_at is not null or new.resolution_code is not null then
   raise exception 'invalid acknowledge transition' using errcode='23514';
  end if;
 elsif old.state='acknowledged' and new.state='resolved' then
  if new.acknowledged_by is distinct from old.acknowledged_by or new.acknowledged_at is distinct from old.acknowledged_at or new.resolved_by is distinct from auth.uid() or new.resolved_at is null or new.resolution_code is null then
   raise exception 'invalid resolve transition' using errcode='23514';
  end if;
 else
  raise exception 'invalid follow-up transition' using errcode='23514';
 end if;
 return new;
end;
$$;

create or replace function private.validate_shift_log_followup_count()
returns trigger
language plpgsql
set search_path=public,private,auth
as $$
declare unresolved_count integer;
begin
 if old.state='open' and new.state='closed' then
  select count(*) into unresolved_count from public.operational_followups f where f.community_id=new.community_id and f.shift_log_id=new.id and f.state in ('open','acknowledged');
  if new.pending_items_count is distinct from unresolved_count then
   raise exception 'pending_items_count must equal unresolved operational follow-ups' using errcode='23514';
  end if;
 end if;
 return new;
end;
$$;

create or replace function private.audit_operational_followup()
returns trigger
language plpgsql
security definer
set search_path=public,private,auth
as $$
declare actor uuid; action_name text;
begin
 actor:=coalesce(auth.uid(),new.updated_by,new.created_by);
 action_name:=case when tg_op='INSERT' then 'operational_followup.created' when new.state='acknowledged' then 'operational_followup.acknowledged' else 'operational_followup.resolved' end;
 insert into public.audit_events(community_id,actor_user_id,action,resource_type,resource_id,result,metadata)
 values(new.community_id,actor,action_name,'operational_followup',new.id::text,'ok',jsonb_build_object('shift_log_id',new.shift_log_id,'round_linked',new.round_id is not null,'incident_linked',new.incident_id is not null,'action_code',new.action_code,'category',new.category,'priority',new.priority,'state',new.state,'resolution_code',new.resolution_code,'revision',new.revision));
 return new;
end;
$$;

revoke all on function private.validate_operational_followup_insert() from public,anon,authenticated;
revoke all on function private.validate_operational_followup_transition() from public,anon,authenticated;
revoke all on function private.validate_shift_log_followup_count() from public,anon,authenticated;
revoke all on function private.audit_operational_followup() from public,anon,authenticated;

alter table public.operational_followups enable row level security;
revoke all on public.operational_followups from anon;
revoke all on public.operational_followups from authenticated;
grant select,insert,update on public.operational_followups to authenticated;

create policy operational_followups_select on public.operational_followups for select to authenticated using(private.has_operations_role(community_id,array['administrator','mayordomo','concierge']));
create policy operational_followups_insert on public.operational_followups for insert to authenticated with check(private.has_operations_role(community_id,array['administrator','mayordomo','concierge']) and created_by=(select auth.uid()) and updated_by=(select auth.uid()) and state='open');
create policy operational_followups_update on public.operational_followups for update to authenticated using(private.has_operations_role(community_id,array['administrator','mayordomo','concierge'])) with check(private.has_operations_role(community_id,array['administrator','mayordomo','concierge']) and updated_by=(select auth.uid()) and state in ('acknowledged','resolved'));

drop trigger if exists operational_followups_validate_insert on public.operational_followups;
create trigger operational_followups_validate_insert before insert on public.operational_followups for each row execute function private.validate_operational_followup_insert();
drop trigger if exists operational_followups_validate_transition on public.operational_followups;
create trigger operational_followups_validate_transition before update on public.operational_followups for each row execute function private.validate_operational_followup_transition();
drop trigger if exists operational_followups_revision on public.operational_followups;
create trigger operational_followups_revision before update on public.operational_followups for each row execute function private.bump_operational_revision();
drop trigger if exists operational_followups_audit on public.operational_followups;
create trigger operational_followups_audit after insert or update on public.operational_followups for each row execute function private.audit_operational_followup();
drop trigger if exists shift_logs_validate_followup_count on public.shift_logs;
create trigger shift_logs_validate_followup_count before update on public.shift_logs for each row execute function private.validate_shift_log_followup_count();

-- No DELETE grant. Resolved follow-ups remain immutable evidence.

commit;
