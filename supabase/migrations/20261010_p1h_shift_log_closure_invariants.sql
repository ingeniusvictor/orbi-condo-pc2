-- ORBI LIVING P1H — database-level handoff semantics.
-- Keeps closure meaning aligned with the server command contract.

begin;

alter table public.shift_logs
 drop constraint if exists shift_logs_handoff_semantics;

alter table public.shift_logs
 add constraint shift_logs_handoff_semantics
 check(
  state<>'closed'
  or (
   open_incidents_reviewed is true
   and (
    (
     closure_code='normal'
     and pending_items_count=0
     and access_control_status='normal'
     and equipment_status='normal'
    )
    or (
     closure_code='pending_followup'
     and pending_items_count>0
    )
    or (
     closure_code='escalated'
     and (
      pending_items_count>0
      or access_control_status='attention'
      or equipment_status='attention'
     )
    )
   )
  )
 );

commit;
