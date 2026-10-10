-- ORBI LIVING P1B — follow-up found by live staging RLS test.
begin;

create or replace function private.has_operations_role(p_community_id text,p_roles text[])
returns boolean
language sql
stable
set search_path=private,public
as $$
 select coalesce(private.active_operations_role(p_community_id)=any(p_roles),false)
$$;

revoke all on function private.has_operations_role(text,text[]) from public,anon,authenticated;
grant execute on function private.has_operations_role(text,text[]) to authenticated;

commit;
