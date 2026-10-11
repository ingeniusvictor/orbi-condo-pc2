-- ORBI LIVING P1H — covering indexes for shift-log actor foreign keys.

begin;

create index if not exists shift_logs_opened_by_idx on public.shift_logs(opened_by);
create index if not exists shift_logs_closed_by_idx on public.shift_logs(closed_by) where closed_by is not null;
create index if not exists shift_logs_updated_by_idx on public.shift_logs(updated_by);
create index if not exists shift_log_entries_actor_idx on public.shift_log_entries(actor_user_id);

commit;
