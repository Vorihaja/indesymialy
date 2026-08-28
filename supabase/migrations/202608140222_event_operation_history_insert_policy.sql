begin;

create policy event_operation_history_manager_create
on public.event_operation_history for insert to authenticated
with check (
  changed_by = auth.uid()
  and exists (
    select 1 from public.event_operation_records operation
    where operation.id = operation_id
      and public.can_manage_event(operation.event_id)
  )
);

commit;
