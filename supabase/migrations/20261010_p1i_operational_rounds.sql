-- ORBI LIVING P1I — structured operational rounds.
-- SYNTHETIC STAGING ONLY. No production use until production-readiness gates close.

begin;

create table if not exists public.operational_rounds(
 id uuid primary key default gen_random_uuid(),
 community_id text not null references public.communities(id) on delete restrict,
 shift_log_id uuid not null,
 round_type text not null check(round_type in ('opening','routine','exception')),
 state text not null default 'open' check(state in ('open','completed')),
 started_by uuid not null references auth.users(id),
 started_at timestamptz not null default now(),
 completed_by uuid references auth.users(id),
 completed_at timestamptz,
 revision bigint not null default 1 check(revision>0),
 updated_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(community_id,id),
 foreign key(community_id,shift_log_id) references public.shift_logs(community_id,id) on delete restrict,
 check(
  (state='open' and completed_by is null and completed_at is null)
  or
  (state='completed' and completed_by is not null and completed_at is not null)
 )
);

create table if not exists public.operational_round_checks(
 id uuid primary key default gen_random_uuid(),
 community_id text not null references public.communities(id) on delete restrict,
 round_id uuid not null,
 checkpoint_code text not null check(checkpoint_code in ('access_control','common_areas','safety_equipment','utilities','perimeter','handoff_readiness','other')),
 result text not null check(result in ('ok','attention','not_applicable')),
 incident_id uuid,
 case_reference text check(case_reference is null or (length(case_reference) between 1 and 80 and case_reference ~ '^[A-Za-z0-9._-]+$')),
 actor_user_id uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique(round_id,checkpoint_code),
 foreign key(community_id,round_id) references public.operational_rounds(community_id,id) on delete restrict,
 foreign key(community_id,incident_id) references public.incidents(community_id,id) on delete restrict,
 check(result<>'attention' or incident_id is not null or case_reference is not null),
 check(incident_id is null or result='attention')
);

create index if not exists operational_rounds_shift_log_idx on public.operational_rounds(community_id,shift_log_id,started_at);
create index if not exists operational_rounds_started_by_idx on public.operational_rounds(started_by);
create index if not exists operational_rounds_completed_by_idx on public.operational_rounds(completed_by) where completed_by is not null;
create index if not exists operational_rounds_updated_by_idx on public.operational_rounds(updated_by);
create index if not exists operational_round_checks_round_idx on public.operational_round_checks(community_id,round_id,created_at);
create index if not exists operational_round_checks_actor_idx on public.operational_round_checks(actor_user_id);
create index if not exists operational_round_checks_incident_idx on public.operational_round_checks(community_id,incident_id) where incident_id is not null;

create or replace function private.validate_operational_round_insert()
returns trigger
language plpgsql
set search_path=public,private,auth
as $$
declare log_state text;
begin
 if auth.uid() is null or new.started_by is distinct from auth.uid() or new.updated_by is distinct from auth.uid() then
  raise exception 'round start must stamp authenticated actor' using errcode='42501';
 end if;
 select l.state into log_state from public.shift_logs l where l.id=new.shift_log_id and l.community_id=new.community_id;
 if log_state is distinct from 'open' then
  raise exception 'round requires an open shift log' using errcode='23514';
 end if;
 return new;
end;
$$;

create or replace function private.validate_operational_round_complete()
returns trigger
language plpgsql
set search_path=public,private,auth
as $$
declare check_count integer; log_state text;
begin
 if old.state='completed' then
  raise exception 'completed round is immutable' using errcode='23514';
 end if;
 if new.community_id is distinct from old.community_id
    or new.shift_log_id is distinct from old.shift_log_id
    or new.round_type is distinct from old.round_type
    or new.started_by is distinct from old.started_by
    or new.started_at is distinct from old.started_at
    or new.created_at is distinct from old.created_at then
  raise exception 'round identity is immutable' using errcode='23514';
 end if;
 if not (old.state='open' and new.state='completed') then
  raise exception 'only open -> completed round transition is allowed' using errcode='23514';
 end if;
 if auth.uid() is null or new.completed_by is distinct from auth.uid() or new.updated_by is distinct from auth.uid() then
  raise exception 'round completion must stamp authenticated actor' using errcode='42501';
 end if;
 select l.state into log_state from public.shift_logs l where l.id=new.shift_log_id and l.community_id=new.community_id;
 if log_state is distinct from 'open' then
  raise exception 'round can only complete while shift log is open' using errcode='23514';
 end if;
 select count(*) into check_count from public.operational_round_checks c where c.round_id=new.id and c.community_id=new.community_id;
 if check_count<1 then
  raise exception 'round requires at least one checkpoint' using errcode='23514';
 end if;
 return new;
end;
$$;

create or replace function private.validate_operational_round_check()
returns trigger
language plpgsql
set search_path=public,private,auth
as $$
declare round_state text; log_state text; parent_log uuid;
begin
 if auth.uid() is null or new.actor_user_id is distinct from auth.uid() then
  raise exception 'round check must stamp authenticated actor' using errcode='42501';
 end if;
 select r.state,r.shift_log_id into round_state,parent_log from public.operational_rounds r where r.id=new.round_id and r.community_id=new.community_id;
 if round_state is distinct from 'open' then
  raise exception 'checks can only be added to an open round' using errcode='23514';
 end if;
 select l.state into log_state from public.shift_logs l where l.id=parent_log and l.community_id=new.community_id;
 if log_state is distinct from 'open' then
  raise exception 'checks require an open shift log' using errcode='23514';
 end if;
 return new;
end;
$$;

create or replace function private.prevent_shift_log_close_with_open_rounds()
returns trigger
language plpgsql
set search_path=public,private,auth
as $$
begin
 if old.state='open' and new.state='closed' and exists(
  select 1 from public.operational_rounds r where r.community_id=new.community_id and r.shift_log_id=new.id and r.state='open'
 ) then
  raise exception 'complete open operational rounds before closing shift log' using errcode='23514';
 end if;
 return new;
end;
$$;

create or replace function private.audit_operational_round()
returns trigger
language plpgsql
security definer
set search_path=public,private,auth
as $$
declare actor uuid; action_name text;
begin
 actor:=coalesce(auth.uid(),new.updated_by,new.started_by);
 action_name:=case when tg_op='INSERT' then 'operational_round.started' else 'operational_round.completed' end;
 insert into public.audit_events(community_id,actor_user_id,action,resource_type,resource_id,result,metadata)
 values(new.community_id,actor,action_name,'operational_round',new.id::text,'ok',jsonb_build_object('shift_log_id',new.shift_log_id,'round_type',new.round_type,'state',new.state,'revision',new.revision));
 return new;
end;
$$;

create or replace function private.audit_operational_round_check()
returns trigger
language plpgsql
security definer
set search_path=public,private,auth
as $$
begin
 insert into public.audit_events(community_id,actor_user_id,action,resource_type,resource_id,result,metadata)
 values(new.community_id,new.actor_user_id,'operational_round.check_recorded','operational_round_check',new.id::text,'ok',jsonb_build_object('round_id',new.round_id,'checkpoint_code',new.checkpoint_code,'result',new.result,'incident_linked',new.incident_id is not null));
 return new;
end;
$$;

revoke all on function private.validate_operational_round_insert() from public,anon,authenticated;
revoke all on function private.validate_operational_round_complete() from public,anon,authenticated;
revoke all on function private.validate_operational_round_check() from public,anon,authenticated;
revoke all on function private.prevent_shift_log_close_with_open_rounds() from public,anon,authenticated;
revoke all on function private.audit_operational_round() from public,anon,authenticated;
revoke all on function private.audit_operational_round_check() from public,anon,authenticated;

alter table public.operational_rounds enable row level security;
alter table public.operational_round_checks enable row level security;
revoke all on public.operational_rounds,public.operational_round_checks from anon;
revoke all on public.operational_rounds,public.operational_round_checks from authenticated;
grant select,insert,update on public.operational_rounds to authenticated;
grant select,insert on public.operational_round_checks to authenticated;

create policy operational_rounds_select on public.operational_rounds for select to authenticated using(private.has_operations_role(community_id,array['administrator','mayordomo','concierge']));
create policy operational_rounds_insert on public.operational_rounds for insert to authenticated with check(private.has_operations_role(community_id,array['administrator','mayordomo','concierge']) and started_by=(select auth.uid()) and updated_by=(select auth.uid()) and state='open');
create policy operational_rounds_complete on public.operational_rounds for update to authenticated using(private.has_operations_role(community_id,array['administrator','mayordomo','concierge'])) with check(private.has_operations_role(community_id,array['administrator','mayordomo','concierge']) and completed_by=(select auth.uid()) and updated_by=(select auth.uid()) and state='completed');
create policy operational_round_checks_select on public.operational_round_checks for select to authenticated using(private.has_operations_role(community_id,array['administrator','mayordomo','concierge']));
create policy operational_round_checks_insert on public.operational_round_checks for insert to authenticated with check(private.has_operations_role(community_id,array['administrator','mayordomo','concierge']) and actor_user_id=(select auth.uid()));

drop trigger if exists operational_rounds_validate_insert on public.operational_rounds;
create trigger operational_rounds_validate_insert before insert on public.operational_rounds for each row execute function private.validate_operational_round_insert();
drop trigger if exists operational_rounds_validate_complete on public.operational_rounds;
create trigger operational_rounds_validate_complete before update on public.operational_rounds for each row execute function private.validate_operational_round_complete();
drop trigger if exists operational_rounds_revision on public.operational_rounds;
create trigger operational_rounds_revision before update on public.operational_rounds for each row execute function private.bump_operational_revision();
drop trigger if exists operational_rounds_audit on public.operational_rounds;
create trigger operational_rounds_audit after insert or update on public.operational_rounds for each row execute function private.audit_operational_round();
drop trigger if exists operational_round_checks_validate on public.operational_round_checks;
create trigger operational_round_checks_validate before insert on public.operational_round_checks for each row execute function private.validate_operational_round_check();
drop trigger if exists operational_round_checks_audit on public.operational_round_checks;
create trigger operational_round_checks_audit after insert on public.operational_round_checks for each row execute function private.audit_operational_round_check();
drop trigger if exists shift_logs_prevent_close_with_open_rounds on public.shift_logs;
create trigger shift_logs_prevent_close_with_open_rounds before update on public.shift_logs for each row execute function private.prevent_shift_log_close_with_open_rounds();

-- No DELETE grants. Checks are append-only and completed rounds are immutable.

commit;
