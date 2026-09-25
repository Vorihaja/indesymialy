begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

alter table public.fight_events_timeline
  add column if not exists source_timer_event_id uuid
  references public.fight_timer_events(id) on delete cascade;

create unique index if not exists fight_events_timeline_timer_event_key
  on public.fight_events_timeline(source_timer_event_id)
  where source_timer_event_id is not null;

create unique index if not exists fight_timer_events_open_pause_key
  on public.fight_timer_events(round_id)
  where ended_at is null
    and event_type in ('pause','timeout','medical_timeout','technical_pause');

create unique index if not exists fight_decisions_fight_key
  on public.fight_decisions(fight_id);

create unique index if not exists fight_judge_cards_fight_judge_key
  on public.fight_judge_cards(fight_id, judge_id);

create unique index if not exists fight_announcements_result_key
  on public.fight_announcements(fight_id, announcement_type)
  where announcement_type = 'RESULT';

create or replace function public.ensure_fight_judge_card()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role = 'judge'
     and coalesce(new.status, 'assigned') in ('assigned','confirmed','completed') then
    insert into public.fight_judge_cards(fight_id, judge_id, card_status)
    values (new.fight_id, new.user_id, 'draft')
    on conflict (fight_id, judge_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists ensure_fight_judge_card on public.fight_official_assignments;
create trigger ensure_fight_judge_card
after insert or update of role, status, user_id, fight_id
on public.fight_official_assignments
for each row execute function public.ensure_fight_judge_card();

insert into public.fight_judge_cards(fight_id, judge_id, card_status)
select foa.fight_id, foa.user_id, 'draft'
from public.fight_official_assignments foa
where foa.role = 'judge'
  and coalesce(foa.status, 'assigned') in ('assigned','confirmed','completed')
on conflict (fight_id, judge_id) do nothing;

create or replace function private.fight_live_is_public(p_fight_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.fights f
    join public.events e on e.id = f.event_id
    where f.id = p_fight_id
      and e.visibility = 'public'
      and e.published_at is not null
      and e.archived_at is null
      and f.status in ('live','paused','recovery','completed','published')
  );
$$;

create or replace function private.can_manage_fight_live(p_fight_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and (
    public.is_platform_admin()
    or exists (
      select 1 from public.fights f
      where f.id = p_fight_id
        and public.can_manage_event(f.event_id)
    )
  );
$$;

create or replace function private.can_operate_fight_live(p_fight_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and (
    private.can_manage_fight_live(p_fight_id)
    or exists (
      select 1
      from public.fight_official_assignments foa
      where foa.fight_id = p_fight_id
        and foa.user_id = auth.uid()
        and foa.role in ('referee','timekeeper','doctor','supervisor')
        and coalesce(foa.status, 'assigned') in ('assigned','confirmed')
    )
  );
$$;

create or replace function private.can_control_fight_timer(p_fight_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and (
    private.can_manage_fight_live(p_fight_id)
    or exists (
      select 1
      from public.fight_official_assignments foa
      where foa.fight_id = p_fight_id
        and foa.user_id = auth.uid()
        and foa.role in ('referee','timekeeper')
        and coalesce(foa.status, 'assigned') in ('assigned','confirmed')
    )
  );
$$;

create or replace function private.can_judge_fight_live(p_fight_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.fight_official_assignments foa
    where foa.fight_id = p_fight_id
      and foa.user_id = auth.uid()
      and foa.role = 'judge'
      and coalesce(foa.status, 'assigned') in ('assigned','confirmed')
  );
$$;

create or replace function private.can_view_fight_live(p_fight_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.fight_live_is_public(p_fight_id)
    or (
      auth.uid() is not null
      and (
        private.can_manage_fight_live(p_fight_id)
        or exists (
          select 1
          from public.fight_official_assignments foa
          where foa.fight_id = p_fight_id
            and foa.user_id = auth.uid()
            and coalesce(foa.status, 'assigned') in ('assigned','confirmed','completed')
        )
        or exists (
          select 1
          from public.fights f
          left join public.fighters red on red.id = f.fighter_red_id
          left join public.fighters blue on blue.id = f.fighter_blue_id
          where f.id = p_fight_id
            and auth.uid() in (red.profile_id, blue.profile_id)
        )
      )
    );
$$;

revoke all on function private.fight_live_is_public(uuid) from public;
revoke all on function private.can_manage_fight_live(uuid) from public;
revoke all on function private.can_operate_fight_live(uuid) from public;
revoke all on function private.can_control_fight_timer(uuid) from public;
revoke all on function private.can_judge_fight_live(uuid) from public;
revoke all on function private.can_view_fight_live(uuid) from public;
grant execute on function private.fight_live_is_public(uuid) to anon, authenticated, service_role;
grant execute on function private.can_manage_fight_live(uuid) to authenticated, service_role;
grant execute on function private.can_operate_fight_live(uuid) to authenticated, service_role;
grant execute on function private.can_control_fight_timer(uuid) to authenticated, service_role;
grant execute on function private.can_judge_fight_live(uuid) to authenticated, service_role;
grant execute on function private.can_view_fight_live(uuid) to anon, authenticated, service_role;

-- Public clients receive only a safe bout projection. Authenticated
-- operational consumers retain direct CRUD behind scoped RLS policies.
alter table public.fights enable row level security;
revoke all privileges on table public.fights from anon, authenticated;
grant select (
  id, event_id, fight_order, fighter_red_id, fighter_blue_id,
  weight_category, scheduled_rounds, fight_type, status,
  created_at, archived_at, updated_at,
  discipline_id, weight_category_id
) on public.fights to anon;
grant select, insert, update, delete on table public.fights to authenticated;

drop policy if exists fights_public_published_read on public.fights;
drop policy if exists fights_public_safe_read on public.fights;
create policy fights_public_safe_read
on public.fights for select to anon
using (exists (
  select 1 from public.events e
  where e.id = fights.event_id
    and e.visibility = 'public'
    and e.published_at is not null
    and e.archived_at is null
));

drop policy if exists fights_organizer_manage on public.fights;
create policy fights_organizer_manage
on public.fights for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

create or replace function public.fight_public_projection(
  p_fight_id uuid default null,
  p_event_ids uuid[] default null
)
returns table(
  id uuid,
  event_id uuid,
  fight_order integer,
  fighter_red_id uuid,
  fighter_blue_id uuid,
  weight_category text,
  scheduled_rounds integer,
  fight_type text,
  status text,
  created_at timestamptz,
  archived_at timestamptz,
  updated_at timestamptz,
  discipline_id uuid,
  weight_category_id uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    f.id, f.event_id, f.fight_order,
    f.fighter_red_id, f.fighter_blue_id,
    f.weight_category, f.scheduled_rounds, f.fight_type, f.status,
    f.created_at, f.archived_at, f.updated_at,
    f.discipline_id, f.weight_category_id
  from public.fights f
  join public.events e on e.id = f.event_id
  where e.visibility = 'public'
    and e.published_at is not null
    and e.archived_at is null
    and (p_fight_id is null or f.id = p_fight_id)
    and (p_event_ids is null or f.event_id = any(p_event_ids))
  order by f.event_id, f.fight_order;
$$;

revoke all on function public.fight_public_projection(uuid, uuid[])
  from public, anon, authenticated;
grant execute on function public.fight_public_projection(uuid, uuid[])
  to anon, authenticated, service_role;

create or replace function public.fight_live_list_ids(p_scope text)
returns table(fight_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select f.id
  from public.fights f
  where case p_scope
    when 'public' then
      private.fight_live_is_public(f.id)
      and f.status in ('live','paused','recovery','completed','published')
    when 'organizer' then auth.uid() is not null
      and private.can_manage_fight_live(f.id)
    when 'official' then auth.uid() is not null
      and exists (
        select 1 from public.fight_official_assignments foa
        where foa.fight_id = f.id
          and foa.user_id = auth.uid()
          and foa.role <> 'judge'
          and coalesce(foa.status, 'assigned') in ('assigned','confirmed','completed')
      )
    when 'fighter' then auth.uid() is not null
      and exists (
        select 1
        from public.fighters fi
        where fi.id in (f.fighter_red_id, f.fighter_blue_id)
          and fi.profile_id = auth.uid()
      )
    else false
  end
  order by f.fight_order;
$$;

revoke all on function public.fight_live_list_ids(text) from public, anon, authenticated;
grant execute on function public.fight_live_list_ids(text) to authenticated, service_role;

drop policy if exists fights_assigned_official_read on public.fights;
create policy fights_assigned_official_read
on public.fights for select to authenticated
using (
  exists (
    select 1 from public.fight_official_assignments foa
    where foa.fight_id = fights.id
      and foa.user_id = auth.uid()
      and coalesce(foa.status, 'assigned') in ('assigned','confirmed','completed')
  )
);

drop policy if exists fights_participant_read on public.fights;
create policy fights_participant_read
on public.fights for select to authenticated
using (
  exists (
    select 1 from public.fighters fi
    where fi.id in (fights.fighter_red_id, fights.fighter_blue_id)
      and fi.profile_id = auth.uid()
  )
);

do $$
declare
  target text;
begin
  foreach target in array array[
    'fight_rounds','fight_events_timeline','fight_statistics'
  ] loop
    execute format('drop policy if exists %I on public.%I', target || '_public_read', target);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (private.fight_live_is_public(fight_id))',
      target || '_public_read', target
    );
    execute format('drop policy if exists %I on public.%I', target || '_authorized_read', target);
    execute format(
      'create policy %I on public.%I for select to authenticated using (private.can_view_fight_live(fight_id))',
      target || '_authorized_read', target
    );
  end loop;
end;
$$;

drop policy if exists fight_announcements_public_read on public.fight_announcements;
create policy fight_announcements_public_read
on public.fight_announcements for select to anon, authenticated
using (is_public and private.fight_live_is_public(fight_id));

drop policy if exists fight_announcements_authorized_read on public.fight_announcements;
create policy fight_announcements_authorized_read
on public.fight_announcements for select to authenticated
using (private.can_view_fight_live(fight_id));

do $$
declare
  target text;
begin
  foreach target in array array[
    'fight_timer_events','fight_live_actions','fight_penalties'
  ] loop
    execute format('drop policy if exists %I on public.%I', target || '_public_read', target);
    execute format('drop policy if exists %I on public.%I', target || '_authorized_read', target);
    execute format(
      'create policy %I on public.%I for select to authenticated using (private.can_view_fight_live(fight_id))',
      target || '_authorized_read', target
    );
  end loop;
end;
$$;

create or replace function public.fight_live_save_judge_score(
  p_fight_id uuid,
  p_judge_card_id uuid,
  p_round_number integer,
  p_red_score integer,
  p_blue_score integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_card public.fight_judge_cards%rowtype;
  v_rounds integer;
  v_fight_status text;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;
  select * into v_card from public.fight_judge_cards
    where id = p_judge_card_id for update;
  if not found then raise exception 'JUDGE_CARD_NOT_FOUND' using errcode = 'P0002'; end if;
  if v_card.fight_id <> p_fight_id
     or v_card.judge_id <> auth.uid()
     or not private.can_judge_fight_live(v_card.fight_id) then
    raise exception 'JUDGE_CARD_FORBIDDEN' using errcode = '42501';
  end if;
  if v_card.card_status <> 'draft' then
    raise exception 'JUDGE_CARD_LOCKED' using errcode = '22023';
  end if;
  select greatest(coalesce(f.scheduled_rounds, 1), 1), f.status
    into v_rounds, v_fight_status
    from public.fights f where f.id = v_card.fight_id;
  if v_fight_status not in ('live','paused','recovery','completed') then
    raise exception 'JUDGE_SCORING_NOT_AVAILABLE' using errcode = '22023';
  end if;
  if p_round_number < 1 or p_round_number > v_rounds
     or p_red_score not between 0 and 10
     or p_blue_score not between 0 and 10 then
    raise exception 'INVALID_JUDGE_SCORE' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.fight_rounds r
    where r.fight_id = v_card.fight_id
      and r.round_number = p_round_number
      and r.status = 'completed'
  ) then
    raise exception 'JUDGE_ROUND_NOT_COMPLETED' using errcode = '22023';
  end if;

  insert into public.fight_judge_round_scores(
    judge_card_id, round_number, red_score, blue_score
  ) values (p_judge_card_id, p_round_number, p_red_score, p_blue_score)
  on conflict (judge_card_id, round_number) do update set
    red_score = excluded.red_score,
    blue_score = excluded.blue_score;

  update public.fight_judge_cards jc
  set fighter_red_score = totals.red_total,
      fighter_blue_score = totals.blue_total,
      total_rounds = totals.round_count
  from (
    select coalesce(sum(red_score), 0)::integer red_total,
           coalesce(sum(blue_score), 0)::integer blue_total,
           count(*)::integer round_count
    from public.fight_judge_round_scores
    where judge_card_id = p_judge_card_id
  ) totals
  where jc.id = p_judge_card_id;
end;
$$;

create or replace function public.fight_live_submit_judge_card(p_judge_card_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_card public.fight_judge_cards%rowtype;
  v_expected_rounds integer;
  v_scored_rounds integer;
  v_fight_status text;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;
  select * into v_card from public.fight_judge_cards
    where id = p_judge_card_id for update;
  if not found then raise exception 'JUDGE_CARD_NOT_FOUND' using errcode = 'P0002'; end if;
  if v_card.judge_id <> auth.uid()
     or not private.can_judge_fight_live(v_card.fight_id) then
    raise exception 'JUDGE_CARD_FORBIDDEN' using errcode = '42501';
  end if;
  if v_card.card_status in ('submitted','validated') then return; end if;
  select f.status into v_fight_status
    from public.fights f where f.id = v_card.fight_id;
  if v_fight_status <> 'completed' then
    raise exception 'JUDGE_CARD_FIGHT_NOT_COMPLETED' using errcode = '22023';
  end if;
  select count(*) into v_expected_rounds
    from public.fight_rounds r
    where r.fight_id = v_card.fight_id and r.status = 'completed';
  if v_expected_rounds = 0 then
    raise exception 'JUDGE_CARD_NO_COMPLETED_ROUND' using errcode = '22023';
  end if;
  select count(*) into v_scored_rounds
    from public.fight_judge_round_scores
    where judge_card_id = p_judge_card_id;
  if v_scored_rounds <> v_expected_rounds then
    raise exception 'JUDGE_CARD_INCOMPLETE' using errcode = '22023';
  end if;
  update public.fight_judge_cards
  set card_status = 'submitted', submitted_at = now()
  where id = p_judge_card_id;
end;
$$;

create or replace function public.submit_judge_card(
  p_judge_card_id uuid,
  p_judge_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- p_judge_id is retained for compatibility and is deliberately ignored.
  perform public.fight_live_submit_judge_card(p_judge_card_id);
end;
$$;

create or replace function public.calculate_judge_decision(p_fight_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_red_wins integer;
  v_blue_wins integer;
  v_draws integer;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;
  if not (
    private.can_manage_fight_live(p_fight_id)
    or private.can_judge_fight_live(p_fight_id)
  ) then
    raise exception 'JUDGE_DECISION_FORBIDDEN' using errcode = '42501';
  end if;
  select
    count(*) filter (where totals.red_total > totals.blue_total),
    count(*) filter (where totals.blue_total > totals.red_total),
    count(*) filter (where totals.red_total = totals.blue_total)
  into v_red_wins, v_blue_wins, v_draws
  from (
    select jc.id,
           coalesce(sum(rs.red_score), 0) red_total,
           coalesce(sum(rs.blue_score), 0) blue_total
    from public.fight_judge_cards jc
    join public.fight_judge_round_scores rs on rs.judge_card_id = jc.id
    where jc.fight_id = p_fight_id and jc.card_status in ('submitted','validated')
    group by jc.id
  ) totals;
  return jsonb_build_object(
    'winner', case
      when v_red_wins > v_blue_wins then 'RED'
      when v_blue_wins > v_red_wins then 'BLUE'
      else 'DRAW'
    end,
    'decision', case
      when v_red_wins = v_blue_wins then 'DRAW'
      when least(v_red_wins, v_blue_wins) > 0 then 'SPLIT_DECISION'
      when v_draws > 0 then 'MAJORITY_DECISION'
      else 'UNANIMOUS_DECISION'
    end,
    'red_cards', v_red_wins,
    'blue_cards', v_blue_wins,
    'draw_cards', v_draws
  );
end;
$$;

create or replace function public.fight_live_decide(
  p_fight_id uuid,
  p_winner_id uuid,
  p_method text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fight public.fights%rowtype;
  v_method text;
  v_decision_type text;
  v_loser_id uuid;
  v_decision_id uuid;
  v_judge_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;
  if not private.can_manage_fight_live(p_fight_id) then
    raise exception 'FIGHT_DECISION_FORBIDDEN' using errcode = '42501';
  end if;
  select * into v_fight from public.fights where id = p_fight_id for update;
  if not found then raise exception 'FIGHT_NOT_FOUND' using errcode = 'P0002'; end if;
  if v_fight.status <> 'completed' then
    raise exception 'FIGHT_MUST_BE_COMPLETED' using errcode = '22023';
  end if;
  v_method := lower(replace(btrim(p_method), ' ', '_'));
  if v_method not in (
    'unanimous_decision','split_decision','majority_decision','ko','tko',
    'submission','disqualification','medical_stoppage','no_contest','draw'
  ) then
    raise exception 'INVALID_DECISION_METHOD' using errcode = '22023';
  end if;
  if v_method in ('draw','no_contest') and p_winner_id is not null then
    raise exception 'DECISION_MUST_NOT_HAVE_WINNER' using errcode = '22023';
  end if;
  if v_method not in ('draw','no_contest')
     and p_winner_id not in (v_fight.fighter_red_id, v_fight.fighter_blue_id) then
    raise exception 'INVALID_DECISION_WINNER' using errcode = '22023';
  end if;
  v_loser_id := case
    when p_winner_id = v_fight.fighter_red_id then v_fight.fighter_blue_id
    when p_winner_id = v_fight.fighter_blue_id then v_fight.fighter_red_id
    else null
  end;
  v_decision_type := upper(v_method);

  if v_method in ('unanimous_decision','split_decision','majority_decision') then
    if not exists (
      select 1
      from public.fight_official_assignments foa
      where foa.fight_id = p_fight_id
        and foa.role = 'judge'
        and coalesce(foa.status, 'assigned') in ('assigned','confirmed','completed')
    ) or exists (
      select 1
      from public.fight_official_assignments foa
      where foa.fight_id = p_fight_id
        and foa.role = 'judge'
        and coalesce(foa.status, 'assigned') in ('assigned','confirmed','completed')
        and not exists (
          select 1 from public.fight_judge_cards jc
          where jc.fight_id = p_fight_id
            and jc.judge_id = foa.user_id
            and jc.card_status in ('submitted','validated')
        )
    ) then
      raise exception 'JUDGE_CARDS_INCOMPLETE' using errcode = '22023';
    end if;
    v_judge_result := public.calculate_judge_decision(p_fight_id);
    if lower(v_judge_result->>'decision') <> v_method
       or case v_judge_result->>'winner'
            when 'RED' then v_fight.fighter_red_id
            when 'BLUE' then v_fight.fighter_blue_id
            else null
          end is distinct from p_winner_id then
      raise exception 'DECISION_DOES_NOT_MATCH_JUDGE_CARDS' using errcode = '22023';
    end if;
  end if;

  insert into public.fight_decisions(
    fight_id, winner_id, loser_id, decision_type,
    round_number, time_of_end, decided_by, approved_by, created_at
  ) values (
    p_fight_id, p_winner_id, v_loser_id, v_decision_type,
    v_fight.ending_round, v_fight.ending_time, auth.uid(), auth.uid(), now()
  )
  on conflict (fight_id) do update set
    winner_id = excluded.winner_id,
    loser_id = excluded.loser_id,
    decision_type = excluded.decision_type,
    round_number = excluded.round_number,
    time_of_end = excluded.time_of_end,
    decided_by = auth.uid(),
    approved_by = auth.uid(),
    created_at = now()
  returning id into v_decision_id;

  return v_decision_id;
end;
$$;

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

create or replace function public.update_fight_statistics(p_fight_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;
  if not private.can_operate_fight_live(p_fight_id) then
    raise exception 'FIGHT_STATISTICS_FORBIDDEN' using errcode = '42501';
  end if;
  return private.recalculate_fight_statistics(p_fight_id);
end;
$$;

create or replace function public.update_fighter_career_stats(p_fighter_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;
  if not (
    public.is_platform_admin()
    or exists (
      select 1 from public.fighters fi
      where fi.id = p_fighter_id and fi.profile_id = auth.uid()
    )
    or exists (
      select 1 from public.fights f
      where p_fighter_id in (f.fighter_red_id, f.fighter_blue_id)
        and private.can_manage_fight_live(f.id)
    )
  ) then
    raise exception 'FIGHTER_STATISTICS_FORBIDDEN' using errcode = '42501';
  end if;
  perform private.recalculate_fighter_career_stats(p_fighter_id);
end;
$$;

drop policy if exists fight_decisions_public_read on public.fight_decisions;
create policy fight_decisions_public_read
on public.fight_decisions for select to anon, authenticated
using (
  private.fight_live_is_public(fight_id)
  and exists (
    select 1 from public.fights f
    where f.id = fight_decisions.fight_id and f.status = 'published'
  )
);

drop policy if exists fight_decisions_operator_read on public.fight_decisions;
create policy fight_decisions_operator_read
on public.fight_decisions for select to authenticated
using (
  private.can_operate_fight_live(fight_id)
);

drop policy if exists fight_judge_cards_scoped_read on public.fight_judge_cards;
create policy fight_judge_cards_scoped_read
on public.fight_judge_cards for select to authenticated
using (
  judge_id = auth.uid()
  or (
    card_status in ('submitted','validated')
    and private.can_manage_fight_live(fight_id)
  )
);

drop policy if exists fight_judge_round_scores_scoped_read on public.fight_judge_round_scores;
create policy fight_judge_round_scores_scoped_read
on public.fight_judge_round_scores for select to authenticated
using (
  exists (
    select 1 from public.fight_judge_cards jc
    where jc.id = fight_judge_round_scores.judge_card_id
      and (
        jc.judge_id = auth.uid()
        or (
          jc.card_status in ('submitted','validated')
          and private.can_manage_fight_live(jc.fight_id)
        )
      )
  )
);

do $$
declare
  target text;
begin
  foreach target in array array[
    'fight_scores','fight_event_log','fight_incidents'
  ] loop
    execute format('drop policy if exists %I on public.%I', target || '_operator_read', target);
    execute format(
      'create policy %I on public.%I for select to authenticated using (private.can_operate_fight_live(fight_id))',
      target || '_operator_read', target
    );
  end loop;
end;
$$;

drop policy if exists fighter_career_stats_public_read on public.fighter_career_stats;
create policy fighter_career_stats_public_read
on public.fighter_career_stats for select to anon, authenticated
using (true);

do $$
declare
  target text;
begin
  foreach target in array array[
    'fight_action_categories','fight_methods','fight_action_types',
    'fight_action_values','fight_event_types','fight_event_actions','fight_results'
  ] loop
    execute format('drop policy if exists %I on public.%I', target || '_read', target);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      target || '_read', target
    );
  end loop;
end;
$$;

revoke all privileges on table
  public.fight_rounds,
  public.fight_timer_events,
  public.fight_events_timeline,
  public.fight_live_actions,
  public.fight_statistics,
  public.fighter_career_stats,
  public.fight_penalties,
  public.fight_announcements,
  public.fight_decisions,
  public.fight_action_categories,
  public.fight_methods,
  public.fight_action_types,
  public.fight_action_values,
  public.fight_event_types,
  public.fight_event_actions,
  public.fight_results
from anon, authenticated;

revoke all privileges on table
  public.fight_judge_cards,
  public.fight_judge_round_scores,
  public.fight_scores,
  public.fight_event_log,
  public.fight_incidents
from anon, authenticated;

grant select on table
  public.fight_rounds,
  public.fight_timer_events,
  public.fight_events_timeline,
  public.fight_live_actions,
  public.fight_statistics,
  public.fighter_career_stats,
  public.fight_scores,
  public.fight_penalties,
  public.fight_decisions,
  public.fight_judge_cards,
  public.fight_judge_round_scores,
  public.fight_event_log,
  public.fight_announcements,
  public.fight_incidents,
  public.fight_action_categories,
  public.fight_methods,
  public.fight_action_types,
  public.fight_action_values,
  public.fight_event_types,
  public.fight_event_actions,
  public.fight_results
to authenticated;

grant select on table
  public.fight_rounds,
  public.fight_statistics,
  public.fighter_career_stats,
  public.fight_action_categories,
  public.fight_methods,
  public.fight_action_types,
  public.fight_action_values,
  public.fight_event_types,
  public.fight_event_actions,
  public.fight_results
to anon;

grant select (
  id, fight_id, round_id, fighter_id, action_type_id,
  event_type, event_time, description, created_at
) on public.fight_events_timeline to anon;

grant select (
  id, fight_id, announcement_type, title, message,
  announced_at, is_public, created_at
) on public.fight_announcements to anon;

grant select (
  id, fight_id, winner_id, loser_id, decision_type,
  victory_method_id, round_number, time_of_end, description, created_at
) on public.fight_decisions to anon;

-- Legacy/internal Fight Live tables are not application mutation surfaces.
-- Keep zero-policy tables unreachable rather than adding permissive policies.
do $$
declare
  target text;
begin
  foreach target in array array[
    'fight_officials','fight_action_events','fight_judge_scores',
    'fight_method_details','fight_operation_modes','fight_recovery_logs',
    'fight_scorecards','fight_statuses','fight_sync_queue'
  ] loop
    if to_regclass('public.' || target) is not null then
      execute format(
        'revoke all privileges on table public.%I from anon, authenticated',
        target
      );
    end if;
  end loop;
end;
$$;

create or replace function private.recalculate_fight_statistics(p_fight_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fighter_id uuid;
  affected integer := 0;
begin
  for v_fighter_id in
    select f.fighter_red_id from public.fights f
    where f.id = p_fight_id and f.fighter_red_id is not null
    union
    select f.fighter_blue_id from public.fights f
    where f.id = p_fight_id and f.fighter_blue_id is not null
  loop
    insert into public.fight_statistics (
      fight_id,
      fighter_id,
      total_strikes,
      successful_strikes,
      takedowns_attempted,
      takedowns_successful,
      submissions_attempted,
      submission_successful,
      control_time_seconds,
      points_scored,
      penalties,
      updated_at
    ) values (
      p_fight_id,
      v_fighter_id,
      (select count(*) from public.fight_live_actions a
        where a.fight_id = p_fight_id and a.fighter_id = v_fighter_id
          and a.action_type in ('strike','knockdown')),
      (select count(*) from public.fight_live_actions a
        where a.fight_id = p_fight_id and a.fighter_id = v_fighter_id
          and a.action_type in ('strike','knockdown')),
      (select count(*) from public.fight_live_actions a
        where a.fight_id = p_fight_id and a.fighter_id = v_fighter_id
          and a.action_type = 'takedown'),
      (select count(*) from public.fight_live_actions a
        where a.fight_id = p_fight_id and a.fighter_id = v_fighter_id
          and a.action_type = 'takedown'),
      (select count(*) from public.fight_live_actions a
        where a.fight_id = p_fight_id and a.fighter_id = v_fighter_id
          and a.action_type = 'submission'),
      case when exists (
        select 1 from public.fights f
        where f.id = p_fight_id
          and f.winner_id = v_fighter_id
          and lower(replace(coalesce(f.method, ''), ' ', '_')) = 'submission'
      ) then 1 else 0 end,
      0,
      (
        coalesce((select sum(a.points_delta) from public.fight_live_actions a
          where a.fight_id = p_fight_id and a.fighter_id = v_fighter_id), 0)
        + coalesce((select sum(s.points) from public.fight_scores s
          where s.fight_id = p_fight_id and s.fighter_id = v_fighter_id), 0)
        - coalesce((select sum(p.points_deducted) from public.fight_penalties p
          where p.fight_id = p_fight_id and p.fighter_id = v_fighter_id
            and p.status = 'active'), 0)
      ),
      (select count(*) from public.fight_penalties p
        where p.fight_id = p_fight_id and p.fighter_id = v_fighter_id
          and p.status = 'active'),
      now()
    )
    on conflict (fight_id, fighter_id) do update set
      total_strikes = excluded.total_strikes,
      successful_strikes = excluded.successful_strikes,
      takedowns_attempted = excluded.takedowns_attempted,
      takedowns_successful = excluded.takedowns_successful,
      submissions_attempted = excluded.submissions_attempted,
      submission_successful = excluded.submission_successful,
      control_time_seconds = excluded.control_time_seconds,
      points_scored = excluded.points_scored,
      penalties = excluded.penalties,
      updated_at = excluded.updated_at;
    affected := affected + 1;
  end loop;
  return affected;
end;
$$;

create or replace function private.recalculate_fighter_career_stats(p_fighter_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  total_count integer;
  win_count integer;
  loss_count integer;
  draw_count integer;
  ko_count integer;
  submission_count integer;
  decision_count integer;
begin
  select
    count(*),
    count(*) filter (where f.winner_id = p_fighter_id),
    count(*) filter (
      where f.winner_id is not null
        and f.winner_id <> p_fighter_id
        and lower(replace(coalesce(f.method,''), ' ', '_')) not in ('draw','no_contest')
    ),
    count(*) filter (
      where f.winner_id is null
        and lower(replace(coalesce(f.method,''), ' ', '_')) = 'draw'
    ),
    count(*) filter (
      where f.winner_id = p_fighter_id
        and lower(replace(coalesce(f.method,''), ' ', '_')) in ('ko','tko')
    ),
    count(*) filter (
      where f.winner_id = p_fighter_id
        and lower(replace(coalesce(f.method,''), ' ', '_')) = 'submission'
    ),
    count(*) filter (
      where f.winner_id = p_fighter_id
        and lower(replace(coalesce(f.method,''), ' ', '_')) like '%decision%'
    )
  into total_count, win_count, loss_count, draw_count,
       ko_count, submission_count, decision_count
  from public.fights f
  where p_fighter_id in (f.fighter_red_id, f.fighter_blue_id)
    and f.status in ('completed','published')
    and (
      f.winner_id is not null
      or lower(replace(coalesce(f.method,''), ' ', '_')) in ('draw','no_contest')
    );

  insert into public.fighter_career_stats (
    fighter_id, total_fights, wins, losses, draws,
    wins_by_ko, wins_by_submission, wins_by_decision, updated_at
  ) values (
    p_fighter_id, total_count, win_count, loss_count, draw_count,
    ko_count, submission_count, decision_count, now()
  )
  on conflict (fighter_id) do update set
    total_fights = excluded.total_fights,
    wins = excluded.wins,
    losses = excluded.losses,
    draws = excluded.draws,
    wins_by_ko = excluded.wins_by_ko,
    wins_by_submission = excluded.wins_by_submission,
    wins_by_decision = excluded.wins_by_decision,
    updated_at = excluded.updated_at;
end;
$$;

revoke all on function private.recalculate_fight_statistics(uuid) from public, anon, authenticated;
revoke all on function private.recalculate_fighter_career_stats(uuid) from public, anon, authenticated;
grant execute on function private.recalculate_fight_statistics(uuid) to service_role;
grant execute on function private.recalculate_fighter_career_stats(uuid) to service_role;

drop trigger if exists trigger_update_fight_statistics on public.fight_scores;
drop trigger if exists trigger_calculate_fight_score on public.fight_scores;
drop trigger if exists trigger_update_fighter_career_stats on public.fight_decisions;

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

drop trigger if exists trigger_sync_timer_to_timeline on public.fight_timer_events;
create trigger trigger_sync_timer_to_timeline
after insert on public.fight_timer_events
for each row execute function public.sync_timer_to_timeline();

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

create or replace function public.fight_live_timer_action(
  p_fight_id uuid,
  p_action text,
  p_pause_type text default null,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fight public.fights%rowtype;
  v_round public.fight_rounds%rowtype;
  v_next_round public.fight_rounds%rowtype;
  v_pause_type text;
  v_total_rounds integer;
  v_index integer;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;
  if not private.can_control_fight_timer(p_fight_id) then
    raise exception 'FIGHT_TIMER_FORBIDDEN' using errcode = '42501';
  end if;

  select * into v_fight from public.fights where id = p_fight_id for update;
  if not found then
    raise exception 'FIGHT_NOT_FOUND' using errcode = 'P0002';
  end if;

  if p_action = 'start' then
    if v_fight.status = 'live' then return; end if;
    if v_fight.status not in ('scheduled','ready') then
      raise exception 'INVALID_TIMER_TRANSITION' using errcode = '22023';
    end if;
    v_total_rounds := greatest(coalesce(v_fight.scheduled_rounds, 3), 1);
    for v_index in 1..v_total_rounds loop
      insert into public.fight_rounds(fight_id, round_number, duration_seconds, status)
      values (p_fight_id, v_index, 300, case when v_index = 1 then 'active' else 'pending' end)
      on conflict (fight_id, round_number) do nothing;
    end loop;
    select * into v_round from public.fight_rounds
      where fight_id = p_fight_id and round_number = 1 for update;
    update public.fight_rounds set status = 'active', started_at = coalesce(started_at, now())
      where id = v_round.id;
    if not exists (
      select 1 from public.fight_timer_events
      where fight_id = p_fight_id and round_id = v_round.id and event_type = 'start'
    ) then
      insert into public.fight_timer_events(fight_id, round_id, event_type, recorded_by)
      values (p_fight_id, v_round.id, 'start', auth.uid());
    end if;
    update public.fights set status = 'live', updated_at = now() where id = p_fight_id;
    return;
  end if;

  select * into v_round
  from public.fight_rounds
  where fight_id = p_fight_id and status = 'active'
  order by round_number desc limit 1 for update;

  if p_action in ('pause','timeout','medical_timeout','technical_pause') then
    if v_fight.status <> 'live' or v_round.id is null then
      raise exception 'INVALID_TIMER_TRANSITION' using errcode = '22023';
    end if;
    v_pause_type := coalesce(p_pause_type, p_action);
    if v_pause_type not in ('pause','timeout','medical_timeout','technical_pause') then
      raise exception 'INVALID_PAUSE_TYPE' using errcode = '22023';
    end if;
    insert into public.fight_timer_events(
      fight_id, round_id, event_type, reason, started_at, recorded_by
    ) values (
      p_fight_id, v_round.id, v_pause_type,
      nullif(btrim(coalesce(p_reason, '')), ''), now(), auth.uid()
    );
    update public.fights set status = 'paused', updated_at = now() where id = p_fight_id;
    return;
  end if;

  if p_action = 'resume' then
    if v_fight.status <> 'paused' or v_round.id is null then
      raise exception 'INVALID_TIMER_TRANSITION' using errcode = '22023';
    end if;
    update public.fight_timer_events
    set ended_at = now(),
        duration_seconds = greatest(extract(epoch from (now() - started_at))::integer, 0)
    where round_id = v_round.id
      and event_type in ('pause','timeout','medical_timeout','technical_pause')
      and ended_at is null;
    if not found then
      raise exception 'OPEN_PAUSE_NOT_FOUND' using errcode = '22023';
    end if;
    insert into public.fight_timer_events(fight_id, round_id, event_type, started_at, recorded_by)
    values (p_fight_id, v_round.id, 'resume', now(), auth.uid());
    update public.fights set status = 'live', updated_at = now() where id = p_fight_id;
    return;
  end if;

  if p_action in ('end_round','end_fight') then
    if v_fight.status = 'completed' then return; end if;
    if (p_action = 'end_round' and v_fight.status not in ('live','paused'))
       or (p_action = 'end_fight' and v_fight.status not in ('live','paused','recovery')) then
      raise exception 'INVALID_TIMER_TRANSITION' using errcode = '22023';
    end if;
    if v_round.id is not null then
      update public.fight_timer_events
      set ended_at = now(),
          duration_seconds = greatest(extract(epoch from (now() - started_at))::integer, 0)
      where round_id = v_round.id
        and event_type in ('pause','timeout','medical_timeout','technical_pause')
        and ended_at is null;
      update public.fight_rounds set status = 'completed', ended_at = coalesce(ended_at, now())
        where id = v_round.id;
      if not exists (
        select 1 from public.fight_timer_events
        where round_id = v_round.id and event_type = 'end'
      ) then
        insert into public.fight_timer_events(fight_id, round_id, event_type, ended_at, recorded_by)
        values (p_fight_id, v_round.id, 'end', now(), auth.uid());
      end if;
    end if;
    update public.fights
    set status = case
      when p_action = 'end_fight' or coalesce(v_round.round_number, 0) >= coalesce(scheduled_rounds, 1)
        then 'completed'
      else 'recovery'
    end,
    updated_at = now()
    where id = p_fight_id;
    return;
  end if;

  if p_action = 'next_round' then
    if v_fight.status <> 'recovery' then
      raise exception 'INVALID_TIMER_TRANSITION' using errcode = '22023';
    end if;
    select * into v_next_round
    from public.fight_rounds
    where fight_id = p_fight_id and status = 'pending'
    order by round_number limit 1 for update;
    if v_next_round.id is null then
      raise exception 'NEXT_ROUND_NOT_FOUND' using errcode = '22023';
    end if;
    update public.fight_rounds set status = 'active', started_at = now()
      where id = v_next_round.id;
    insert into public.fight_timer_events(fight_id, round_id, event_type, started_at, recorded_by)
    values (p_fight_id, v_next_round.id, 'start', now(), auth.uid());
    update public.fights set status = 'live', updated_at = now() where id = p_fight_id;
    return;
  end if;

  raise exception 'UNKNOWN_TIMER_ACTION' using errcode = '22023';
end;
$$;

create or replace function public.get_round_remaining_time(p_round_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_round public.fight_rounds%rowtype;
  v_pause_seconds integer;
begin
  select r.* into v_round
  from public.fight_rounds r
  where r.id = p_round_id
    and private.can_view_fight_live(r.fight_id);
  if not found then
    -- Do not reveal whether a hidden round UUID exists.
    raise exception 'ROUND_NOT_FOUND_OR_FORBIDDEN' using errcode = '42501';
  end if;
  if v_round.started_at is null then return v_round.duration_seconds; end if;
  select coalesce(sum(
    case when te.ended_at is null
      then greatest(extract(epoch from (now() - te.started_at))::integer, 0)
      else coalesce(te.duration_seconds, greatest(extract(epoch from (te.ended_at - te.started_at))::integer, 0))
    end
  ), 0)
  into v_pause_seconds
  from public.fight_timer_events te
  where te.round_id = p_round_id
    and te.event_type in ('pause','timeout','medical_timeout','technical_pause');
  return greatest(
    v_round.duration_seconds
      - greatest(extract(epoch from (coalesce(v_round.ended_at, now()) - v_round.started_at))::integer, 0)
      + v_pause_seconds,
    0
  );
end;
$$;

create or replace function public.calculate_final_decision(
  p_fight_id uuid,
  p_approved_by uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fight public.fights%rowtype;
  v_result jsonb;
  v_winner_id uuid;
  v_method text;
  v_active_judges integer;
  v_submitted_cards integer;
begin
  -- p_approved_by is retained for compatibility and is deliberately ignored.
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;
  if not private.can_manage_fight_live(p_fight_id) then
    raise exception 'FINAL_DECISION_FORBIDDEN' using errcode = '42501';
  end if;
  select * into v_fight from public.fights where id = p_fight_id for update;
  if not found then raise exception 'FIGHT_NOT_FOUND' using errcode = 'P0002'; end if;
  if v_fight.status <> 'completed' then
    raise exception 'FIGHT_MUST_BE_COMPLETED' using errcode = '22023';
  end if;
  select count(*) into v_active_judges
    from public.fight_official_assignments
    where fight_id = p_fight_id and role = 'judge'
      and coalesce(status, 'assigned') in ('assigned','confirmed','completed');
  select count(*) into v_submitted_cards
    from public.fight_judge_cards
    where fight_id = p_fight_id and card_status in ('submitted','validated');
  if v_active_judges = 0 or v_submitted_cards <> v_active_judges then
    raise exception 'JUDGE_CARDS_INCOMPLETE' using errcode = '22023';
  end if;
  v_result := public.calculate_judge_decision(p_fight_id);
  v_winner_id := case v_result->>'winner'
    when 'RED' then v_fight.fighter_red_id
    when 'BLUE' then v_fight.fighter_blue_id
    else null
  end;
  v_method := lower(v_result->>'decision');
  perform public.fight_live_decide(p_fight_id, v_winner_id, v_method);
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

create or replace function public.publish_fight_result(
  p_fight_id uuid,
  p_user uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- p_user is retained for compatibility and is deliberately ignored.
  perform public.fight_live_publish_result(p_fight_id);
end;
$$;

create or replace function public.start_fight(
  p_fight_id uuid,
  p_round_count integer,
  p_round_duration integer,
  p_user uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.can_manage_fight_live(p_fight_id) then
    raise exception 'FIGHT_START_CONFIGURATION_FORBIDDEN' using errcode = '42501';
  end if;
  if p_round_count not between 1 and 15 or p_round_duration not between 30 and 900 then
    raise exception 'INVALID_FIGHT_TIMER_CONFIGURATION' using errcode = '22023';
  end if;
  update public.fights set scheduled_rounds = p_round_count where id = p_fight_id;
  perform public.fight_live_timer_action(p_fight_id, 'start', null, null);
  update public.fight_rounds set duration_seconds = p_round_duration
    where fight_id = p_fight_id;
end;
$$;

create or replace function public.pause_round_timer(
  p_round_id uuid,
  p_event_type text,
  p_reason text default null,
  p_user uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_fight_id uuid;
begin
  select fight_id into v_fight_id from public.fight_rounds where id = p_round_id;
  if v_fight_id is null then raise exception 'ROUND_NOT_FOUND' using errcode = 'P0002'; end if;
  perform public.fight_live_timer_action(v_fight_id, p_event_type, p_event_type, p_reason);
end;
$$;

create or replace function public.resume_round_timer(
  p_round_id uuid,
  p_user uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_fight_id uuid;
begin
  select fight_id into v_fight_id from public.fight_rounds where id = p_round_id;
  if v_fight_id is null then raise exception 'ROUND_NOT_FOUND' using errcode = 'P0002'; end if;
  perform public.fight_live_timer_action(v_fight_id, 'resume', null, null);
end;
$$;

create or replace function public.end_round_timer(
  p_round_id uuid,
  p_user uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_fight_id uuid;
begin
  select fight_id into v_fight_id from public.fight_rounds where id = p_round_id;
  if v_fight_id is null then raise exception 'ROUND_NOT_FOUND' using errcode = 'P0002'; end if;
  perform public.fight_live_timer_action(v_fight_id, 'end_round', null, null);
end;
$$;

drop trigger if exists trigger_process_fight_event on public.fight_event_log;

create or replace function public.register_fight_event(
  p_fight_id uuid,
  p_event_type text,
  p_event_code text,
  p_round_number integer default null,
  p_fighter_id uuid default null,
  p_recorded_by uuid default null,
  p_payload jsonb default '{}'::jsonb,
  p_source text default 'OFFICIAL'::text,
  p_operation_mode text default 'ONLINE'::text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fight public.fights%rowtype;
  v_sequence integer;
  v_event_id uuid;
begin
  -- p_recorded_by is retained for compatibility and is deliberately ignored.
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;
  if not private.can_operate_fight_live(p_fight_id) then
    raise exception 'FIGHT_EVENT_FORBIDDEN' using errcode = '42501';
  end if;
  select * into v_fight from public.fights where id = p_fight_id for update;
  if not found then raise exception 'FIGHT_NOT_FOUND' using errcode = 'P0002'; end if;
  if nullif(btrim(coalesce(p_event_type, '')), '') is null
     or nullif(btrim(coalesce(p_event_code, '')), '') is null then
    raise exception 'INVALID_FIGHT_EVENT' using errcode = '22023';
  end if;
  if p_fighter_id is not null
     and p_fighter_id not in (v_fight.fighter_red_id, v_fight.fighter_blue_id) then
    raise exception 'INVALID_FIGHT_EVENT_FIGHTER' using errcode = '22023';
  end if;
  if p_round_number is not null
     and (p_round_number < 1 or p_round_number > greatest(coalesce(v_fight.scheduled_rounds, 1), 1)) then
    raise exception 'INVALID_FIGHT_EVENT_ROUND' using errcode = '22023';
  end if;
  select coalesce(max(sequence_number), 0) + 1 into v_sequence
    from public.fight_event_log where fight_id = p_fight_id;
  insert into public.fight_event_log(
    fight_id, sequence_number, event_type, event_code, round_number,
    fighter_id, recorded_by, payload, source, operation_mode,
    is_validated, validated_by, processed
  ) values (
    p_fight_id, v_sequence, btrim(p_event_type), btrim(p_event_code), p_round_number,
    p_fighter_id, auth.uid(), coalesce(p_payload, '{}'::jsonb),
    coalesce(nullif(btrim(p_source), ''), 'OFFICIAL'),
    coalesce(nullif(btrim(p_operation_mode), ''), 'ONLINE'),
    true, auth.uid(), false
  ) returning id into v_event_id;
  return v_event_id;
end;
$$;

create or replace function public.record_official_action(
  p_fight_id uuid,
  p_round_id uuid,
  p_fighter_id uuid,
  p_action_type_id uuid,
  p_recorded_by uuid default null,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fight public.fights%rowtype;
  v_round public.fight_rounds%rowtype;
  v_score numeric;
  v_label text;
begin
  -- p_recorded_by is retained for compatibility and is deliberately ignored.
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;
  if not private.can_operate_fight_live(p_fight_id) then
    raise exception 'OFFICIAL_ACTION_FORBIDDEN' using errcode = '42501';
  end if;
  select * into v_fight from public.fights where id = p_fight_id for update;
  if not found then raise exception 'FIGHT_NOT_FOUND' using errcode = 'P0002'; end if;
  if v_fight.status not in ('live','paused','recovery') then
    raise exception 'OFFICIAL_ACTION_NOT_ALLOWED_FOR_STATUS' using errcode = '22023';
  end if;
  if p_fighter_id not in (v_fight.fighter_red_id, v_fight.fighter_blue_id) then
    raise exception 'OFFICIAL_ACTION_SCOPE_INVALID' using errcode = '22023';
  end if;
  select * into v_round
  from public.fight_rounds r
  where r.id = p_round_id and r.fight_id = p_fight_id
  for update;
  if not found then
    raise exception 'OFFICIAL_ACTION_SCOPE_INVALID' using errcode = '22023';
  end if;
  if (v_fight.status in ('live','paused') and v_round.status <> 'active')
     or (
       v_fight.status = 'recovery'
       and (
         v_round.status <> 'completed'
         or v_round.round_number <> (
           select max(r.round_number)
           from public.fight_rounds r
           where r.fight_id = p_fight_id and r.status = 'completed'
         )
       )
     ) then
    raise exception 'OFFICIAL_ACTION_ROUND_NOT_CURRENT' using errcode = '22023';
  end if;
  select fav.score, coalesce(fav.score_label, fat.name)
    into v_score, v_label
  from public.fight_action_types fat
  left join public.fight_action_values fav
    on fav.action_type_id = fat.id and fav.discipline_id = v_fight.discipline_id
  where fat.id = p_action_type_id and coalesce(fat.is_active, true)
  limit 1;
  if not found then raise exception 'ACTION_TYPE_NOT_FOUND' using errcode = 'P0002'; end if;

  insert into public.fight_scores(
    fight_id, round_id, fighter_id, action_type_id,
    points, score_label, recorded_by, notes
  ) values (
    p_fight_id, p_round_id, p_fighter_id, p_action_type_id,
    coalesce(v_score, 0), v_label, auth.uid(), p_notes
  );
  insert into public.fight_events_timeline(
    fight_id, round_id, fighter_id, action_type_id,
    event_type, description, recorded_by
  ) values (
    p_fight_id, p_round_id, p_fighter_id, p_action_type_id,
    'score', v_label, auth.uid()
  );
  perform private.recalculate_fight_statistics(p_fight_id);
end;
$$;

revoke all on function public.fight_live_timer_action(uuid, text, text, text)
  from public, anon, authenticated;
revoke all on function public.fight_live_record_action(uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.fight_live_save_judge_score(uuid, uuid, integer, integer, integer)
  from public, anon, authenticated;
revoke all on function public.fight_live_submit_judge_card(uuid)
  from public, anon, authenticated;
revoke all on function public.fight_live_decide(uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.fight_live_publish_result(uuid)
  from public, anon, authenticated;
revoke all on function public.sync_timer_to_timeline(uuid)
  from public, anon, authenticated;
revoke all on function public.update_fight_statistics(uuid)
  from public, anon, authenticated;
revoke all on function public.update_fighter_career_stats(uuid)
  from public, anon, authenticated;

grant execute on function public.fight_live_timer_action(uuid, text, text, text)
  to authenticated, service_role;
grant execute on function public.fight_live_record_action(uuid, text, text)
  to authenticated, service_role;
grant execute on function public.fight_live_save_judge_score(uuid, uuid, integer, integer, integer)
  to authenticated, service_role;
grant execute on function public.fight_live_submit_judge_card(uuid)
  to authenticated, service_role;
grant execute on function public.fight_live_decide(uuid, uuid, text)
  to authenticated, service_role;
grant execute on function public.fight_live_publish_result(uuid)
  to authenticated, service_role;
grant execute on function public.sync_timer_to_timeline(uuid)
  to authenticated, service_role;
grant execute on function public.update_fight_statistics(uuid)
  to authenticated, service_role;
grant execute on function public.update_fighter_career_stats(uuid)
  to authenticated, service_role;

revoke all on function public.get_round_remaining_time(uuid)
  from public, anon, authenticated;
grant execute on function public.get_round_remaining_time(uuid)
  to anon, authenticated, service_role;

revoke all on function public.start_fight(uuid, integer, integer, uuid)
  from public, anon, authenticated;
revoke all on function public.pause_round_timer(uuid, text, text, uuid)
  from public, anon, authenticated;
revoke all on function public.resume_round_timer(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.end_round_timer(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.register_fight_event(uuid, text, text, integer, uuid, uuid, jsonb, text, text)
  from public, anon, authenticated;
revoke all on function public.record_official_action(uuid, uuid, uuid, uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.submit_judge_card(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.calculate_judge_decision(uuid)
  from public, anon, authenticated;
revoke all on function public.calculate_final_decision(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.publish_fight_result(uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.start_fight(uuid, integer, integer, uuid)
  to authenticated, service_role;
grant execute on function public.pause_round_timer(uuid, text, text, uuid)
  to authenticated, service_role;
grant execute on function public.resume_round_timer(uuid, uuid)
  to authenticated, service_role;
grant execute on function public.end_round_timer(uuid, uuid)
  to authenticated, service_role;
grant execute on function public.register_fight_event(uuid, text, text, integer, uuid, uuid, jsonb, text, text)
  to authenticated, service_role;
grant execute on function public.record_official_action(uuid, uuid, uuid, uuid, uuid, text)
  to authenticated, service_role;
grant execute on function public.submit_judge_card(uuid, uuid)
  to authenticated, service_role;
grant execute on function public.calculate_judge_decision(uuid)
  to authenticated, service_role;
grant execute on function public.calculate_final_decision(uuid, uuid)
  to authenticated, service_role;
grant execute on function public.publish_fight_result(uuid, uuid)
  to authenticated, service_role;

revoke all on function public.sync_timer_to_timeline()
  from public, anon, authenticated;
revoke all on function public.ensure_fight_judge_card()
  from public, anon, authenticated;

do $$
declare
  function_name text;
begin
  foreach function_name in array array[
    'update_fight_statistics','update_fighter_career_stats',
    'calculate_fight_score','process_fight_event',
    'guard_official_assignment_update','validate_fight_official_assignment'
  ] loop
    if to_regprocedure('public.' || function_name || '()') is not null then
      execute format(
        'revoke all on function public.%I() from public, anon, authenticated',
        function_name
      );
    end if;
  end loop;
end;
$$;

do $$
declare
  target text;
begin
  foreach target in array array[
    'fights','fight_timer_events','fight_event_log','fight_scores',
    'fight_decisions','fight_live_actions','fight_statistics','fight_judge_cards'
  ] loop
    if not exists (
      select 1
      from pg_publication_rel pr
      join pg_publication p on p.oid = pr.prpubid
      join pg_class c on c.oid = pr.prrelid
      join pg_namespace n on n.oid = c.relnamespace
      where p.pubname = 'supabase_realtime'
        and n.nspname = 'public'
        and c.relname = target
    ) then
      execute format('alter publication supabase_realtime add table public.%I', target);
    end if;
  end loop;
end;
$$;

commit;
