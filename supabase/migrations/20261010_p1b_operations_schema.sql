-- ORBI LIVING P1B — DRAFT ONLY.
-- Do NOT apply to production until a dedicated Supabase project, rollback plan,
-- backup policy and staging validation are available.

begin;

create extension if not exists pgcrypto;

create table if not exists public.communities(
 id text primary key,
 display_name text not null check(length(display_name) between 1 and 160),
 timezone text not null default 'America/Santiago',
 active boolean not null default true,
 created_at timestamptz not null default now()
);

create table if not exists public.memberships(
 user_id uuid not null references auth.users(id) on delete cascade,
 community_id text not null references public.communities(id) on delete cascade,
 operations_role text not null check(operations_role in ('administrator','committee','concierge','mayordomo','resident')),
 active_from timestamptz,
 active_until timestamptz,
 disabled_at timestamptz,
 created_at timestamptz not null default now(),
 primary key(user_id,community_id),
 check(active_until is null or active_from is null or active_until>=active_from)
);

create table if not exists public.staff_private(
 id uuid primary key default gen_random_uuid(),
 community_id text not null references public.communities(id) on delete cascade,
 display_name text not null check(length(display_name) between 1 and 160),
 staff_function text not null check(staff_function in ('concierge','cleaning','mayordomo','administrative')),
 coverage_eligible boolean not null default false,
 active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(community_id,id)
);

create table if not exists public.shift_assignments(
 id uuid primary key default gen_random_uuid(),
 community_id text not null references public.communities(id) on delete cascade,
 service_date date not null,
 slot_code text not null check(length(slot_code) between 1 and 80),
 starts_at timestamptz not null,
 ends_at timestamptz not null,
 assignee_staff_id uuid,
 status text not null check(status in ('planned','vacant','requested','confirmed','received')),
 revision bigint not null default 1 check(revision>0),
 created_by uuid not null references auth.users(id),
 updated_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(community_id,service_date,slot_code),
 unique(community_id,id),
 foreign key(community_id,assignee_staff_id) references public.staff_private(community_id,id),
 check(ends_at>starts_at)
);

create table if not exists public.shift_events(
 id bigint generated always as identity primary key,
 shift_assignment_id uuid not null,
 community_id text not null references public.communities(id) on delete restrict,
 event_type text not null check(event_type in ('created','gap_reported','replacement_requested','assignee_changed','replacement_confirmed','handoff_received','corrected')),
 from_status text check(from_status is null or from_status in ('planned','vacant','requested','confirmed','received')),
 to_status text check(to_status is null or to_status in ('planned','vacant','requested','confirmed','received')),
 from_assignee_staff_id uuid,
 to_assignee_staff_id uuid,
 reason_code text,
 note_private text check(note_private is null or length(note_private)<=1000),
 actor_user_id uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 foreign key(community_id,shift_assignment_id) references public.shift_assignments(community_id,id) on delete restrict,
 foreign key(community_id,from_assignee_staff_id) references public.staff_private(community_id,id),
 foreign key(community_id,to_assignee_staff_id) references public.staff_private(community_id,id)
);

create table if not exists public.incidents(
 id uuid primary key default gen_random_uuid(),
 community_id text not null references public.communities(id) on delete cascade,
 service_date date not null,
 area text not null check(area in ('access','common_area','water','electricity','elevator','security','medical','fire','other')),
 priority text not null check(priority in ('low','medium','high','critical')),
 state text not null check(state in ('reported','acknowledged','assigned','in_progress','resolved','closed')),
 assigned_role text check(assigned_role is null or assigned_role in ('administrator','committee','concierge','mayordomo')),
 private_case_reference text check(private_case_reference is null or length(private_case_reference)<=160),
 revision bigint not null default 1 check(revision>0),
 created_by uuid not null references auth.users(id),
 updated_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(community_id,id)
);

create table if not exists public.incident_events(
 id bigint generated always as identity primary key,
 incident_id uuid not null,
 community_id text not null references public.communities(id) on delete restrict,
 event_type text not null check(event_type in ('created','acknowledged','assigned','state_changed','priority_changed','escalated','resolved','reopened','closed')),
 from_state text check(from_state is null or from_state in ('reported','acknowledged','assigned','in_progress','resolved','closed')),
 to_state text check(to_state is null or to_state in ('reported','acknowledged','assigned','in_progress','resolved','closed')),
 from_priority text check(from_priority is null or from_priority in ('low','medium','high','critical')),
 to_priority text check(to_priority is null or to_priority in ('low','medium','high','critical')),
 actor_user_id uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 foreign key(community_id,incident_id) references public.incidents(community_id,id) on delete restrict
);

create table if not exists public.audit_events(
 id bigint generated always as identity primary key,
 community_id text not null references public.communities(id) on delete restrict,
 actor_user_id uuid not null references auth.users(id),
 action text not null check(length(action) between 1 and 120),
 resource_type text not null check(length(resource_type) between 1 and 80),
 resource_id text not null check(length(resource_id) between 1 and 160),
 result text not null default 'ok' check(result in ('ok','denied')),
 correlation_key text check(correlation_key is null or length(correlation_key)<=160),
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);

create index if not exists memberships_community_idx on public.memberships(community_id,user_id);
create index if not exists staff_private_community_idx on public.staff_private(community_id,active,coverage_eligible);
create index if not exists shift_assignments_service_idx on public.shift_assignments(community_id,service_date,starts_at);
create index if not exists shift_events_assignment_idx on public.shift_events(shift_assignment_id,created_at);
create index if not exists incidents_service_idx on public.incidents(community_id,service_date,state,priority);
create index if not exists incident_events_incident_idx on public.incident_events(incident_id,created_at);
create index if not exists audit_events_resource_idx on public.audit_events(community_id,resource_type,resource_id,created_at);

create or replace function public.active_operations_role(p_community_id text)
returns text
language sql
stable
security definer
set search_path=public,auth
as $$
 select m.operations_role
 from public.memberships m
 where m.user_id=auth.uid()
   and m.community_id=p_community_id
   and m.disabled_at is null
   and (m.active_from is null or m.active_from<=now())
   and (m.active_until is null or m.active_until>=now())
 limit 1
$$;

revoke all on function public.active_operations_role(text) from public;
grant execute on function public.active_operations_role(text) to authenticated;

create or replace function public.has_operations_role(p_community_id text,p_roles text[])
returns boolean
language sql
stable
set search_path=public
as $$
 select coalesce(public.active_operations_role(p_community_id)=any(p_roles),false)
$$;

revoke all on function public.has_operations_role(text,text[]) from public;
grant execute on function public.has_operations_role(text,text[]) to authenticated;

create or replace function public.bump_operational_revision()
returns trigger
language plpgsql
set search_path=public,auth
as $$
begin
 new.revision:=old.revision+1;
 new.updated_at:=now();
 if auth.uid() is not null then new.updated_by:=auth.uid(); end if;
 return new;
end;
$$;

create or replace function public.audit_shift_assignment()
returns trigger
language plpgsql
security definer
set search_path=public,auth
as $$
declare actor uuid;
begin
 actor:=coalesce(auth.uid(),new.updated_by,new.created_by);
 insert into public.audit_events(community_id,actor_user_id,action,resource_type,resource_id,result,metadata)
 values(
  new.community_id,
  actor,
  case when tg_op='INSERT' then 'shift_assignment.created' else 'shift_assignment.updated' end,
  'shift_assignment',
  new.id::text,
  'ok',
  jsonb_build_object('status',new.status,'revision',new.revision,'assignee_changed',case when tg_op='UPDATE' then old.assignee_staff_id is distinct from new.assignee_staff_id else new.assignee_staff_id is not null end)
 );
 return new;
end;
$$;

create or replace function public.audit_incident()
returns trigger
language plpgsql
security definer
set search_path=public,auth
as $$
declare actor uuid;
begin
 actor:=coalesce(auth.uid(),new.updated_by,new.created_by);
 insert into public.audit_events(community_id,actor_user_id,action,resource_type,resource_id,result,metadata)
 values(
  new.community_id,
  actor,
  case when tg_op='INSERT' then 'incident.created' else 'incident.updated' end,
  'incident',
  new.id::text,
  'ok',
  jsonb_build_object('state',new.state,'priority',new.priority,'revision',new.revision)
 );
 return new;
end;
$$;

revoke all on function public.bump_operational_revision() from public;
revoke all on function public.audit_shift_assignment() from public;
revoke all on function public.audit_incident() from public;

drop trigger if exists shift_assignments_revision on public.shift_assignments;
create trigger shift_assignments_revision before update on public.shift_assignments for each row execute function public.bump_operational_revision();
drop trigger if exists shift_assignments_audit on public.shift_assignments;
create trigger shift_assignments_audit after insert or update on public.shift_assignments for each row execute function public.audit_shift_assignment();

drop trigger if exists incidents_revision on public.incidents;
create trigger incidents_revision before update on public.incidents for each row execute function public.bump_operational_revision();
drop trigger if exists incidents_audit on public.incidents;
create trigger incidents_audit after insert or update on public.incidents for each row execute function public.audit_incident();

alter table public.communities enable row level security;
alter table public.memberships enable row level security;
alter table public.staff_private enable row level security;
alter table public.shift_assignments enable row level security;
alter table public.shift_events enable row level security;
alter table public.incidents enable row level security;
alter table public.incident_events enable row level security;
alter table public.audit_events enable row level security;

revoke all on public.communities,public.memberships,public.staff_private,public.shift_assignments,public.shift_events,public.incidents,public.incident_events,public.audit_events from anon;
revoke all on public.communities,public.memberships,public.staff_private,public.shift_assignments,public.shift_events,public.incidents,public.incident_events,public.audit_events from authenticated;

grant select on public.communities to authenticated;
grant select on public.memberships to authenticated;
grant select,insert,update on public.staff_private to authenticated;
grant select,insert,update on public.shift_assignments to authenticated;
grant select on public.shift_events to authenticated;
grant select,insert,update on public.incidents to authenticated;
grant select on public.incident_events to authenticated;
grant select on public.audit_events to authenticated;

create policy communities_member_select on public.communities
 for select to authenticated
 using(public.active_operations_role(id) is not null);

create policy memberships_self_or_admin_select on public.memberships
 for select to authenticated
 using(user_id=auth.uid() or public.has_operations_role(community_id,array['administrator']));

create policy staff_private_operational_select on public.staff_private
 for select to authenticated
 using(public.has_operations_role(community_id,array['administrator','mayordomo','concierge']));
create policy staff_private_manage_insert on public.staff_private
 for insert to authenticated
 with check(public.has_operations_role(community_id,array['administrator','mayordomo']));
create policy staff_private_manage_update on public.staff_private
 for update to authenticated
 using(public.has_operations_role(community_id,array['administrator','mayordomo']))
 with check(public.has_operations_role(community_id,array['administrator','mayordomo']));

create policy shift_assignments_operational_select on public.shift_assignments
 for select to authenticated
 using(public.has_operations_role(community_id,array['administrator','mayordomo','concierge','committee']));
create policy shift_assignments_manage_insert on public.shift_assignments
 for insert to authenticated
 with check(public.has_operations_role(community_id,array['administrator','mayordomo']) and created_by=auth.uid() and updated_by=auth.uid());
create policy shift_assignments_manage_update on public.shift_assignments
 for update to authenticated
 using(public.has_operations_role(community_id,array['administrator','mayordomo']))
 with check(public.has_operations_role(community_id,array['administrator','mayordomo']));

create policy shift_events_operational_select on public.shift_events
 for select to authenticated
 using(public.has_operations_role(community_id,array['administrator','mayordomo','concierge']));

create policy incidents_operational_select on public.incidents
 for select to authenticated
 using(public.has_operations_role(community_id,array['administrator','mayordomo','concierge']));
create policy incidents_report_insert on public.incidents
 for insert to authenticated
 with check(public.has_operations_role(community_id,array['administrator','mayordomo','concierge']) and created_by=auth.uid() and updated_by=auth.uid());
create policy incidents_manage_update on public.incidents
 for update to authenticated
 using(public.has_operations_role(community_id,array['administrator','mayordomo']))
 with check(public.has_operations_role(community_id,array['administrator','mayordomo']));

create policy incident_events_operational_select on public.incident_events
 for select to authenticated
 using(public.has_operations_role(community_id,array['administrator','mayordomo','concierge']));

create policy audit_events_admin_select on public.audit_events
 for select to authenticated
 using(public.has_operations_role(community_id,array['administrator']));

-- No DELETE grants are issued for operational or audit/history tables.
-- Domain event INSERTs are intentionally withheld until P1C adds controlled RPC/server commands.
-- Composite FKs keep event/community references from crossing tenant boundaries.
-- The committee role may read current shift assignments but not private staff/event/audit rows.

commit;
