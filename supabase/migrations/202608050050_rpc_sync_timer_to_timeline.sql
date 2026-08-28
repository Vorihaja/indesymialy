-- STAB-003 Fight Live RPC blueprint. PREPARED ONLY.
-- Security: authenticated organizer, assigned official, admin or super_admin.
begin;

create function public.sync_timer_to_timeline(p_fight_id uuid)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  inserted_count integer := 0;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.fights f
    join public.events e on e.id = f.event_id
    join public.organizations o on o.id = e.organizer_id
    where f.id = p_fight_id
      and (
        o.owner_id = auth.uid()
        or exists (
          select 1 from public.organization_members om
          where om.organization_id = o.id and om.profile_id = auth.uid()
            and coalesce(om.status, 'active') = 'active'
        )
        or exists (
          select 1 from public.fight_official_assignments foa
          where foa.fight_id = f.id and foa.user_id = auth.uid()
            and coalesce(foa.status, 'assigned') in ('assigned','confirmed')
        )
        or exists (
          select 1 from public.profile_system_roles psr
          join public.system_roles sr on sr.id = psr.system_role_id
          where psr.profile_id = auth.uid() and sr.code in ('admin','super_admin')
        )
      )
  ) then
    raise exception using errcode = '42501', message = 'Fight timer access denied';
  end if;

  insert into public.fight_events_timeline (
    fight_id, round_id, event_type, description, event_time, recorded_by, created_at
  )
  select
    te.fight_id,
    te.round_id,
    te.event_type,
    te.reason,
    coalesce(te.started_at, te.ended_at, te.created_at),
    te.recorded_by,
    coalesce(te.created_at, now())
  from public.fight_timer_events te
  where te.fight_id = p_fight_id
    and not exists (
      select 1 from public.fight_events_timeline tl
      where tl.fight_id = te.fight_id
        and tl.round_id is not distinct from te.round_id
        and tl.event_type = te.event_type
        and tl.event_time is not distinct from coalesce(te.started_at, te.ended_at, te.created_at)
    );

  get diagnostics inserted_count = row_count;
  return inserted_count;
exception
  when foreign_key_violation then
    raise exception using errcode = '23503', message = 'Timer event references an invalid fight or round';
  when others then
    raise;
end;
$$;

comment on function public.sync_timer_to_timeline(uuid) is
  'Idempotently copies timer events to the public timeline for an authorized fight operator.';
revoke all on function public.sync_timer_to_timeline(uuid) from public;
grant execute on function public.sync_timer_to_timeline(uuid) to authenticated;

commit;

-- Rollback: drop function public.sync_timer_to_timeline(uuid);
