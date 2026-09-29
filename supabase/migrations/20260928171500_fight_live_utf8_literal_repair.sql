begin;

-- R5L: repair UTF-8 literals corrupted during the historical deployment of
-- 20260925082825_complete_fight_live_authority.sql.

create or replace function public.fight_live_record_action(
  p_fight_id uuid,
  p_action_type text,
  p_corner text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fight public.fights%rowtype;
  v_round public.fight_rounds%rowtype;
  v_fighter_id uuid;
  v_action_id uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;
  if not private.can_operate_fight_live(p_fight_id) then
    raise exception 'FIGHT_LIVE_OPERATION_FORBIDDEN' using errcode = '42501';
  end if;
  if p_action_type not in (
    'strike','takedown','knockdown','submission','warning','penalty',
    'incident','interruption','medical_stoppage',
    'disqualification','retirement'
  ) then
    raise exception 'INVALID_FIGHT_ACTION' using errcode = '22023';
  end if;

  select * into v_fight from public.fights where id = p_fight_id for update;
  if not found then raise exception 'FIGHT_NOT_FOUND' using errcode = 'P0002'; end if;
  if v_fight.status not in ('live','paused','recovery') then
    raise exception 'FIGHT_ACTION_NOT_ALLOWED_FOR_STATUS' using errcode = '22023';
  end if;
  if p_action_type in ('strike','takedown','knockdown','submission')
     and v_fight.status <> 'live' then
    raise exception 'COMBAT_ACTION_REQUIRES_LIVE_TIMER' using errcode = '22023';
  end if;
  select * into v_round from public.fight_rounds
    where fight_id = p_fight_id
    order by round_number desc limit 1;

  v_fighter_id := case p_corner
    when 'red' then v_fight.fighter_red_id
    when 'blue' then v_fight.fighter_blue_id
    else null
  end;
  if p_action_type in (
    'strike','takedown','knockdown','submission','warning','penalty',
    'disqualification','retirement'
  ) and v_fighter_id is null then
    raise exception 'FIGHT_ACTION_REQUIRES_CORNER' using errcode = '22023';
  end if;

  insert into public.fight_live_actions(
    fight_id, fighter_id, action_type, round_number,
    action_time, points_delta, recorded_by, recorded_at
  ) values (
    p_fight_id,
    v_fighter_id,
    p_action_type,
    coalesce(v_round.round_number, 1),
    coalesce((v_round.duration_seconds - public.get_round_remaining_time(v_round.id))::text, '0'),
    case when p_action_type = 'knockdown' then 1 else 0 end,
    auth.uid(),
    now()
  ) returning id into v_action_id;

  if p_action_type in ('warning','penalty','disqualification') then
    insert into public.fight_penalties(
      fight_id, round_id, fighter_id, penalty_type,
      points_deducted, issued_by, status
    ) values (
      p_fight_id,
      v_round.id,
      v_fighter_id,
      case p_action_type
        when 'warning' then 'WARNING'
        when 'disqualification' then 'DISQUALIFICATION'
        else 'POINT_DEDUCTION'
      end,
      case when p_action_type = 'penalty' then 1 else 0 end,
      auth.uid(),
      'active'
    );
  end if;

  if p_action_type = 'incident' then
    insert into public.fight_incidents(
      fight_id, incident_type, severity, description
    ) values (p_fight_id, 'OTHER', 'MEDIUM', 'Incident signalé en direct');
  end if;

  insert into public.fight_events_timeline(
    fight_id, round_id, fighter_id, event_type,
    event_time, description, recorded_by
  ) values (
    p_fight_id,
    v_round.id,
    v_fighter_id,
    case
      when p_action_type in ('warning','penalty','disqualification') then 'penalty'
      when p_action_type = 'medical_stoppage' then 'medical'
      else 'action'
    end,
    coalesce((v_round.duration_seconds - public.get_round_remaining_time(v_round.id))::text, '0'),
    replace(p_action_type, '_', ' '),
    auth.uid()
  );

  perform private.recalculate_fight_statistics(p_fight_id);
  return v_action_id;
end;
$$;

create or replace function public.sync_timer_to_timeline()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_description text;
  v_timeline_type text := 'system';
begin
  v_description := case new.event_type
    when 'start' then 'Début du round'
    when 'pause' then 'Pause du combat'
    when 'timeout' then 'Timeout arbitral'
    when 'medical_timeout' then 'Temps médical'
    when 'technical_pause' then 'Pause technique'
    when 'resume' then 'Reprise du combat'
    when 'end' then 'Fin du round'
    else 'Événement chrono'
  end;
  if new.event_type = 'medical_timeout' then
    v_timeline_type := 'medical';
  end if;

  insert into public.fight_events_timeline (
    fight_id, round_id, event_type, event_time, description,
    recorded_by, created_at, source_timer_event_id
  ) values (
    new.fight_id,
    new.round_id,
    v_timeline_type,
    coalesce(new.started_at, new.ended_at, new.created_at)::text,
    coalesce(nullif(btrim(new.reason), ''), v_description),
    new.recorded_by,
    coalesce(new.created_at, now()),
    new.id
  )
  on conflict (source_timer_event_id) do nothing;
  return new;
end;
$$;

create or replace function public.sync_timer_to_timeline(p_fight_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count integer;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;
  if not private.can_operate_fight_live(p_fight_id) then
    raise exception 'FIGHT_LIVE_OPERATION_FORBIDDEN' using errcode = '42501';
  end if;

  -- Recovery/backfill authority: adopt one equivalent legacy timeline row
  -- before inserting anything. New runtime events are always synced by trigger.
  with legacy_matches as (
    select te.id as timer_event_id, (
      select tl.id
      from public.fight_events_timeline tl
      where tl.source_timer_event_id is null
        and tl.fight_id = te.fight_id
        and tl.round_id is not distinct from te.round_id
        and tl.event_time is not distinct from
          coalesce(te.started_at, te.ended_at, te.created_at)::text
        and tl.event_type = case
          when te.event_type = 'medical_timeout' then 'medical'
          else 'system'
        end
      order by tl.created_at, tl.id
      limit 1
    ) as timeline_id
    from public.fight_timer_events te
    where te.fight_id = p_fight_id
      and not exists (
        select 1 from public.fight_events_timeline linked
        where linked.source_timer_event_id = te.id
      )
  )
  update public.fight_events_timeline tl
  set source_timer_event_id = matches.timer_event_id
  from legacy_matches matches
  where tl.id = matches.timeline_id
    and matches.timeline_id is not null;

  insert into public.fight_events_timeline (
    fight_id, round_id, event_type, event_time, description,
    recorded_by, created_at, source_timer_event_id
  )
  select
    te.fight_id,
    te.round_id,
    case when te.event_type = 'medical_timeout' then 'medical' else 'system' end,
    coalesce(te.started_at, te.ended_at, te.created_at)::text,
    coalesce(nullif(btrim(te.reason), ''), case te.event_type
      when 'start' then 'Début du round'
      when 'pause' then 'Pause du combat'
      when 'timeout' then 'Timeout arbitral'
      when 'medical_timeout' then 'Temps médical'
      when 'technical_pause' then 'Pause technique'
      when 'resume' then 'Reprise du combat'
      when 'end' then 'Fin du round'
      else 'Événement chrono'
    end),
    te.recorded_by,
    coalesce(te.created_at, now()),
    te.id
  from public.fight_timer_events te
  where te.fight_id = p_fight_id
  on conflict (source_timer_event_id) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.fight_live_publish_result(p_fight_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fight public.fights%rowtype;
  v_decision public.fight_decisions%rowtype;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;
  if not private.can_manage_fight_live(p_fight_id) then
    raise exception 'FIGHT_RESULT_PUBLICATION_FORBIDDEN' using errcode = '42501';
  end if;
  select * into v_fight from public.fights where id = p_fight_id for update;
  if not found then raise exception 'FIGHT_NOT_FOUND' using errcode = 'P0002'; end if;
  select * into v_decision from public.fight_decisions where fight_id = p_fight_id;
  if not found then
    raise exception 'FIGHT_DECISION_REQUIRED' using errcode = '22023';
  end if;
  if v_fight.status = 'published' then return; end if;
  if v_fight.status <> 'completed' then
    raise exception 'FIGHT_MUST_BE_COMPLETED' using errcode = '22023';
  end if;

  update public.fights
  set winner_id = v_decision.winner_id,
      method = lower(v_decision.decision_type),
      status = 'published',
      updated_at = now()
  where id = p_fight_id;

  perform private.recalculate_fight_statistics(p_fight_id);
  if v_fight.fighter_red_id is not null then
    perform private.recalculate_fighter_career_stats(v_fight.fighter_red_id);
  end if;
  if v_fight.fighter_blue_id is not null then
    perform private.recalculate_fighter_career_stats(v_fight.fighter_blue_id);
  end if;

  insert into public.fight_announcements(
    fight_id, announcement_type, title, message, announced_by, is_public
  ) values (
    p_fight_id,
    'RESULT',
    'Résultat officiel du combat',
    case when v_decision.winner_id is null
      then 'Combat terminé sans vainqueur'
      else 'Victoire officielle enregistrée'
    end,
    auth.uid(),
    true
  )
  on conflict (fight_id, announcement_type)
    where announcement_type = 'RESULT'
  do update set
    message = excluded.message,
    announced_by = auth.uid(),
    announced_at = now(),
    is_public = true;
  if not exists (
    select 1 from public.fight_events_timeline
    where fight_id = p_fight_id
      and event_type = 'decision'
      and description = 'Résultat officiel publié'
  ) then
    insert into public.fight_events_timeline(
      fight_id, event_type, description, recorded_by
    ) values (
      p_fight_id, 'decision', 'Résultat officiel publié', auth.uid()
    );
  end if;
end;
$$;

commit;
