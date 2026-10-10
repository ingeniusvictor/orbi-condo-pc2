-- ORBI LIVING P1B — security hardening validated in staging.
begin;

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
grant usage on schema private to authenticated;

alter function public.active_operations_role(text) set schema private;
alter function public.has_operations_role(text,text[]) set schema private;
alter function public.bump_operational_revision() set schema private;
alter function public.audit_shift_assignment() set schema private;
alter function public.audit_incident() set schema private;

revoke all on function private.active_operations_role(text) from public,anon,authenticated;
revoke all on function private.has_operations_role(text,text[]) from public,anon,authenticated;
revoke all on function private.bump_operational_revision() from public,anon,authenticated;
revoke all on function private.audit_shift_assignment() from public,anon,authenticated;
revoke all on function private.audit_incident() from public,anon,authenticated;

grant execute on function private.active_operations_role(text) to authenticated;
grant execute on function private.has_operations_role(text,text[]) to authenticated;

commit;
