-- ORBI LIVING P1I — concurrency guard for operational rounds.

begin;

create unique index if not exists operational_rounds_one_open_per_log_idx
 on public.operational_rounds(community_id,shift_log_id)
 where state='open';

commit;
