-- ORBI LIVING P1H — structured shift log + handoff foundation.
-- SYNTHETIC STAGING ONLY. Do not apply to production until the production-readiness gate is closed.

begin;

create table if not exists public.shift_logs(
 id uuid primary key default gen_random_uuid(),
 community_id text not null references public.communities(id) on delete restrict,
 shift_assignment_id uuid not null,
 state text not null default 'open' check(state in ('open','closed')),
 opened_by uuid not null references auth.users(id),
 opened_at timestamptz not null default now(),
 closed_by uuid references auth.users(id),
 closed_at timestamptz,
 closure_code text check(closure_code is null or closure_code in ('normal','pending_followup','escalated')),
 access_control_status text check(access_control_status is null or access_control_status in ('normal','attention')),
 equipment_status text check(equipment_status is null or equipment_status in ('normal','attention')),
 open_incidents_reviewed boolean,
 pending_items_count integer check(pending_items_count is null or pending_items_count between 0 and 99),
 revision bigint not null default 1 check(revision>0),
 updated_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(community_id,shift_assignment_id),
 unique(community_id,id),
 foreign key(community_id,shift_assignment_id) references public.shift_assignments(community_id,id) on delete restrict,
 check(
  (
   state='open'
   and closed_by is null
   and closed_at is null
   and closure_code is null
   and access_control_status is null
   and equipment_status is null
   and open_incidents_reviewed is null
   and pending_items_count is null
  )
  or
  (
   state='closed'
   and closed_by is not null
   and closed_at is not null
   and closure_code is not null
   and access_control_status is not null
   and equipment_status is not null
   and open_incidents_reviewed is not null
   and pending_items_count is not null
  )
 )
);

create table if not exists public.shift_log_entries(
 id uuid primary key default gen_random_uuid(),
 shift_log_id uuid not null,
 community_id text not null references public.communities(id) on delete restrict,
 entry_code text not null check(entry_code in ('routine_check','visitor_flow','delivery_received','equipment_check','maintenance_notice','incident_followup','handoff_pending','other')),
 category text not null check(category in ('access','security','maintenance','utilities','resident_support','delivery','other')),
 severity text not null check(severity in ('info','attention','urgent')),
 incident_id uuid,
 case_reference text check(case_reference is null or (length(case_reference) between 1 and 80 and case_reference ~ '^[A-Za-z0-9._-]+$')),
 actor_user_id uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 foreign key(community_id,shift_log_id) references public.shift_logs(community_id,id) on delete restrict,
 foreign key(community_id,incident_id) references public.incidents(community_id,id) on delete restrict,
 check(incident_id is null or entry_code='incident_followup')
);

create index if not exists shift_logs_assignment_idx on public.shift_logs(community_id,shift_assignment_id,state);
create index if not exists shift_log_entries_log_idx on public.shift_log_entries(community_id,shift_log_id,created_at);
create index if not exists shift_log_entries_incident_idx on public.shift_log_entries(community_id,incident_id) where incident_id is not null;

create or replace function private.validate_shift_log_close()
returns trigger
language plpgsql
set search_path=public,private,auth
as $$
begin
 if old.state='closed' then
  raise exception 'closed shift log is immutable' using errcode='23514';
 end if;

 if new.community_id is distinct from old.community_id
    or new.shift_assignment_id is distinct from old.shift_assignment_id
    or new.opened_by is distinct from old.opened_by
    or new.opened_at is distinct from old.opened_at
    or new.created_at is distinct from old.created_at then
  raise exception 'shift log identity is immutable' using errcode='23514';
 end if;

 if not (old.state='open' and new.state='closed') then
  raise exception 'only open -> closed shift log transition is allowed' using errcode='23514';
 end if;

 if auth.uid() is null
    or new.closed_by is distinct from auth.uid()
    or new.updated_by is distinct from auth.uid() then
  raise exception 'shift log close must stamp authenticated actor' using errcode='42501';
 end if;

 return new;
end;
$$;

create or replace function private.validate_shift_log_entry()
returns trigger
language plpgsql
set search_path=public,private,auth
as $$
declare
 log_state text;
begin
 if auth.uid() is null or new.actor_user_id is distinct from auth.uid() then
  raise exception 'shift log entry must stamp authenticated actor' using errcode='42501';
 end if;

 select l.state into log_state
 from public.shift_logs l
 where l.id=new.shift_log_id and l.community_id=new.community_id;

 if log_state is distinct from 'open' then
  raise exception 'entries can only be added to an open shift log' using errcode='23514';
 end if;

 return new;
end;
$$;

create or replace function private.audit_shift_log()
returns trigger
language plpgsql
security definer
set search_path=public,private,auth
as $$
declare
 actor uuid;
 action_name text;
begin
 actor:=coalesce(auth.uid(),new.updated_by,new.opened_by);
 action_name:=case when tg_op='INSERT' then 'shift_log.opened' else 'shift_log.closed' end;
 insert into public.audit_events(community_id,actor_user_id,action,resource_type,resource_id,result,metadata)
 values(
  new.community_id,
  actor,
  action_name,
  'shift_log',
  new.id::text,
  'ok',
  jsonb_build_object(
   'shift_assignment_id',new.shift_assignment_id,
   'state',new.state,
   'revision',new.revision,
   'closure_code',new.closure_code,
   'pending_items_count',new.pending_items_count
  )
 );
 return new;
end;
$$;

create or replace function private.audit_shift_log_entry()
returns trigger
language plpgsql
security definer
set search_path=public,private,auth
as $$
begin
 insert into public.audit_events(community_id,actor_user_id,action,resource_type,resource_id,result,metadata)
 values(
  new.community_id,
  new.actor_user_id,
  'shift_log.entry_created',
  'shift_log_entry',
  new.id::text,
  'ok',
  jsonb_build_object(
   'shift_log_id',new.shift_log_id,
   'entry_code',new.entry_code,
   'category',new.category,
   'severity',new.severity,
   'incident_linked',new.incident_id is not null
  )
 );
 return new;
end;
$$;

revoke all on function private.validate_shift_log_close() from public,anon,authenticated;
revoke all on function private.validate_shift_log_entry() from public,anon,authenticated;
revoke all on function private.audit_shift_log() from public,anon,authenticated;
revoke all on function private.audit_shift_log_entry() from public,anon,authenticated;

alter table public.shift_logs enable row level security;
alter table public.shift_log_entries enable row level security;

revoke all on public.shift_logs,public.shift_log_entries from anon;
revoke all on public.shift_logs,public.shift_log_entries from authenticated;
grant select,insert,update on public.shift_logs to authenticated;
grant select,insert on public.shift_log_entries to authenticated;

create policy shift_logs_operational_select on public.shift_logs
 for select to authenticated
 using(private.has_operations_role(community_id,array['administrator','mayordomo','concierge']));

create policy shift_logs_operational_insert on public.shift_logs
 for insert to authenticated
 with check(
  private.has_operations_role(community_id,array['administrator','mayordomo','concierge'])
  and opened_by=(select auth.uid())
  and updated_by=(select auth.uid())
  and state='open'
 );

create policy shift_logs_operational_close on public.shift_logs
 for update to authenticated
 using(private.has_operations_role(community_id,array['administrator','mayordomo','concierge']))
 with check(
  private.has_operations_role(community_id,array['administrator','mayordomo','concierge'])
  and updated_by=(select auth.uid())
  and closed_by=(select auth.uid())
  and state='closed'
 );

create policy shift_log_entries_operational_select on public.shift_log_entries
 for select to authenticated
 using(private.has_operations_role(community_id,array['administrator','mayordomo','concierge']));

create policy shift_log_entries_operational_insert on public.shift_log_entries
 for insert to authenticated
 with check(
  private.has_operations_role(community_id,array['administrator','mayordomo','concierge'])
  and actor_user_id=(select auth.uid())
 );

drop trigger if exists shift_logs_validate_close on public.shift_logs;
create trigger shift_logs_validate_close
 before update on public.shift_logs
 for each row execute function private.validate_shift_log_close();

drop trigger if exists shift_logs_revision on public.shift_logs;
create trigger shift_logs_revision
 before update on public.shift_logs
 for each row execute function private.bump_operational_revision();

drop trigger if exists shift_logs_audit on public.shift_logs;
create trigger shift_logs_audit
 after insert or update on public.shift_logs
 for each row execute function private.audit_shift_log();

drop trigger if exists shift_log_entries_validate on public.shift_log_entries;
create trigger shift_log_entries_validate
 before insert on public.shift_log_entries
 for each row execute function private.validate_shift_log_entry();

drop trigger if exists shift_log_entries_audit on public.shift_log_entries;
create trigger shift_log_entries_audit
 after insert on public.shift_log_entries
 for each row execute function private.audit_shift_log_entry();

-- No DELETE grants are issued. Closed logs and all log entries are append-only evidence.
-- The schema intentionally avoids free-text narratives in this phase.

commit;
