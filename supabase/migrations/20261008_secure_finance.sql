-- Run only after provisioning a dedicated Supabase project.
-- All tables have RLS. The browser must never receive service_role credentials.
create table if not exists public.community_members(
 community_id text not null,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check(role in ('administrator','committee','resident')),
 primary key(community_id,user_id)
);
create table if not exists public.finance_drafts(
 id uuid primary key default gen_random_uuid(),
 community_id text not null default 'pc2' check(community_id='pc2'),
 period text not null check(period ~ '^\\d{4}-(0[1-9]|1[0-2])$'),
 description text not null check(length(description) between 1 and 160),
 amount_clp bigint not null,
 reason text not null check(length(reason) between 1 and 500),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.finance_audit(
 id bigint generated always as identity primary key,
 draft_id uuid not null,
 community_id text not null,
 actor_id uuid not null,
 action text not null,
 old_data jsonb,
 new_data jsonb,
 changed_at timestamptz not null default now()
);
alter table public.community_members enable row level security;
alter table public.finance_drafts enable row level security;
alter table public.finance_audit enable row level security;
revoke all on public.community_members from anon;
revoke all on public.finance_drafts from anon;
revoke all on public.finance_audit from anon;
grant select on public.community_members to authenticated;
grant select,insert on public.finance_drafts to authenticated;
grant select on public.finance_audit to authenticated;
create policy "member reads own role" on public.community_members for select to authenticated using(user_id=auth.uid());
create policy "admin reads drafts" on public.finance_drafts for select to authenticated using(exists(select 1 from public.community_members m where m.user_id=auth.uid() and m.community_id=finance_drafts.community_id and m.role='administrator'));
create policy "admin creates drafts" on public.finance_drafts for insert to authenticated with check(created_by=auth.uid() and exists(select 1 from public.community_members m where m.user_id=auth.uid() and m.community_id=finance_drafts.community_id and m.role='administrator'));
create policy "admin reads audit" on public.finance_audit for select to authenticated using(exists(select 1 from public.community_members m where m.user_id=auth.uid() and m.community_id=finance_audit.community_id and m.role='administrator'));
create or replace function public.audit_finance_draft() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.finance_audit(draft_id,community_id,actor_id,action,old_data,new_data)
 values(new.id,new.community_id,auth.uid(),'insert',null,to_jsonb(new));
 return new;
end;$$;
drop trigger if exists finance_draft_audit_insert on public.finance_drafts;
create trigger finance_draft_audit_insert after insert on public.finance_drafts for each row execute function public.audit_finance_draft();
-- Provision initial administrator through a trusted backend/admin SQL console, not a public endpoint.
-- Never expose this SQL console or a service_role key to the frontend.
