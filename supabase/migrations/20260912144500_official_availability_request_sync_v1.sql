begin;

create or replace function public.sync_official_availability_request()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_previous_assignment_id uuid;
  v_request_already_active boolean;
begin
  if new.profile_id is null then
    return new;
  end if;

  if tg_op = 'UPDATE'
    and new.event_id = old.event_id
    and new.profile_id = old.profile_id then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    v_previous_assignment_id := old.id;
  end if;

  select exists (
    select 1
    from public.event_official_assignments existing
    where existing.event_id = new.event_id
      and existing.profile_id = new.profile_id
      and (
        v_previous_assignment_id is null
        or existing.id <> v_previous_assignment_id
      )
  ) into v_request_already_active;

  if v_request_already_active then
    insert into public.official_availability (
      event_id,
      official_profile_id,
      availability_status,
      responded_at
    ) values (
      new.event_id,
      new.profile_id,
      'pending',
      null
    )
    on conflict (event_id, official_profile_id) do nothing;
  else
    insert into public.official_availability (
      event_id,
      official_profile_id,
      availability_status,
      available_from,
      available_until,
      responded_at,
      notes,
      updated_at
    ) values (
      new.event_id,
      new.profile_id,
      'pending',
      null,
      null,
      null,
      null,
      now()
    )
    on conflict (event_id, official_profile_id) do update
    set availability_status = 'pending',
        available_from = null,
        available_until = null,
        responded_at = null,
        notes = null,
        updated_at = now();
  end if;

  return new;
end;
$$;

revoke all on function public.sync_official_availability_request()
from public, anon, authenticated;

drop trigger if exists event_official_assignments_sync_availability_request
on public.event_official_assignments;

create trigger event_official_assignments_sync_availability_request
before insert or update of event_id, profile_id
on public.event_official_assignments
for each row
execute function public.sync_official_availability_request();

insert into public.official_availability (
  event_id,
  official_profile_id,
  availability_status,
  responded_at
)
select distinct
  assignment.event_id,
  assignment.profile_id,
  'pending',
  null::timestamptz
from public.event_official_assignments assignment
where assignment.profile_id is not null
on conflict (event_id, official_profile_id) do nothing;

commit;
