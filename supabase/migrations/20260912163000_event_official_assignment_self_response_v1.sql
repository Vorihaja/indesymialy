begin;

drop policy if exists event_official_assignments_self_respond
on public.event_official_assignments;

create policy event_official_assignments_self_respond
on public.event_official_assignments
for update
to authenticated
using (
  profile_id = auth.uid()
)
with check (
  profile_id = auth.uid()
  and status in ('confirmed', 'declined')
);

commit;
