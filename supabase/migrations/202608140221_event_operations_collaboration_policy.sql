begin;

drop policy if exists event_operation_records_manager_manage on public.event_operation_records;

create policy event_operation_records_manager_read
on public.event_operation_records for select to authenticated
using (public.can_manage_event(event_id));

create policy event_operation_records_manager_create
on public.event_operation_records for insert to authenticated
with check (public.can_manage_event(event_id) and created_by = auth.uid());

create policy event_operation_records_manager_update
on public.event_operation_records for update to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

create policy event_operation_records_manager_delete
on public.event_operation_records for delete to authenticated
using (public.can_manage_event(event_id));

commit;
