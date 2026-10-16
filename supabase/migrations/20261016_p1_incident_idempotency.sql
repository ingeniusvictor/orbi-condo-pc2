-- ORBI LIVING P1 — durable incident-create idempotency for synthetic staging.
-- Additive and backward-compatible: historical rows may keep a NULL request id.
-- Production remains blocked.

begin;

alter table public.incidents
 add column if not exists client_request_id uuid;

create unique index if not exists incidents_creator_request_unique
 on public.incidents(community_id,created_by,client_request_id)
 where client_request_id is not null;

comment on column public.incidents.client_request_id is
 'Opaque client-generated UUID used only to make incident creation idempotent; not resident/staff data and not exposed by the dashboard.';

commit;
