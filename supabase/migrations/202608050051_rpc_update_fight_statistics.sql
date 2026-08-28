-- STAB-003 Fight statistics RPC blueprint. PREPARED ONLY.
begin;

create function public.update_fight_statistics(p_fight_id uuid)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_fighter_id uuid;
  affected integer := 0;
  row_count_value integer;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  if not exists (
    select 1 from public.fights f
    left join public.events e on e.id = f.event_id
    left join public.organizations o on o.id = e.organizer_id
    where f.id = p_fight_id and (
      o.owner_id = auth.uid()
      or exists (select 1 from public.organization_members om where om.organization_id = o.id and om.profile_id = auth.uid() and coalesce(om.status,'active') = 'active')
      or exists (select 1 from public.fight_official_assignments foa where foa.fight_id = f.id and foa.user_id = auth.uid() and coalesce(foa.status,'assigned') in ('assigned','confirmed'))
      or exists (
        select 1 from public.profile_system_roles psr
        join public.system_roles sr on sr.id = psr.system_role_id
        where psr.profile_id = auth.uid() and sr.code in ('admin','super_admin')
      )
    )
  ) then
    raise exception using errcode = '42501', message = 'Fight statistics access denied';
  end if;

  for v_fighter_id in
    select fighter_red_id from public.fights where id = p_fight_id and fighter_red_id is not null
    union
    select fighter_blue_id from public.fights where id = p_fight_id and fighter_blue_id is not null
  loop
    update public.fight_statistics fs set
      total_strikes = (select count(*) from public.fight_live_actions a where a.fight_id = p_fight_id and a.fighter_id = v_fighter_id and a.action_type = 'strike'),
      successful_strikes = (select count(*) from public.fight_live_actions a where a.fight_id = p_fight_id and a.fighter_id = v_fighter_id and a.action_type in ('strike','knockdown')),
      takedowns_attempted = (select count(*) from public.fight_live_actions a where a.fight_id = p_fight_id and a.fighter_id = v_fighter_id and a.action_type = 'takedown'),
      takedowns_successful = (select count(*) from public.fight_live_actions a where a.fight_id = p_fight_id and a.fighter_id = v_fighter_id and a.action_type = 'takedown'),
      submissions_attempted = (select count(*) from public.fight_live_actions a where a.fight_id = p_fight_id and a.fighter_id = v_fighter_id and a.action_type = 'submission'),
      submission_successful = (select count(*) from public.fight_live_actions a where a.fight_id = p_fight_id and a.fighter_id = v_fighter_id and a.action_type = 'submission' and coalesce(a.points_delta,0) > 0),
      penalties = (select count(*) from public.fight_penalties p where p.fight_id = p_fight_id and p.fighter_id = v_fighter_id),
      points_scored = (select coalesce(sum(s.points),0) from public.fight_scores s where s.fight_id = p_fight_id and s.fighter_id = v_fighter_id),
      updated_at = now()
    where fs.fight_id = p_fight_id and fs.fighter_id = v_fighter_id;

    get diagnostics row_count_value = row_count;
    if row_count_value = 0 then
      insert into public.fight_statistics (
        fight_id, fighter_id, total_strikes, successful_strikes,
        takedowns_attempted, takedowns_successful, submissions_attempted,
        submission_successful, penalties, points_scored, updated_at
      ) values (
        p_fight_id, v_fighter_id,
        (select count(*) from public.fight_live_actions a where a.fight_id = p_fight_id and a.fighter_id = v_fighter_id and a.action_type = 'strike'),
        (select count(*) from public.fight_live_actions a where a.fight_id = p_fight_id and a.fighter_id = v_fighter_id and a.action_type in ('strike','knockdown')),
        (select count(*) from public.fight_live_actions a where a.fight_id = p_fight_id and a.fighter_id = v_fighter_id and a.action_type = 'takedown'),
        (select count(*) from public.fight_live_actions a where a.fight_id = p_fight_id and a.fighter_id = v_fighter_id and a.action_type = 'takedown'),
        (select count(*) from public.fight_live_actions a where a.fight_id = p_fight_id and a.fighter_id = v_fighter_id and a.action_type = 'submission'),
        (select count(*) from public.fight_live_actions a where a.fight_id = p_fight_id and a.fighter_id = v_fighter_id and a.action_type = 'submission' and coalesce(a.points_delta,0) > 0),
        (select count(*) from public.fight_penalties p where p.fight_id = p_fight_id and p.fighter_id = v_fighter_id),
        (select coalesce(sum(s.points),0) from public.fight_scores s where s.fight_id = p_fight_id and s.fighter_id = v_fighter_id),
        now()
      );
    end if;
    affected := affected + 1;
  end loop;

  return affected;
end;
$$;

comment on function public.update_fight_statistics(uuid) is
  'Recalculates per-fighter statistics for one fight from persisted actions, penalties and scores.';
revoke all on function public.update_fight_statistics(uuid) from public;
grant execute on function public.update_fight_statistics(uuid) to authenticated;

commit;

-- Rollback: drop function public.update_fight_statistics(uuid);
