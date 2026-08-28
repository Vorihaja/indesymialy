-- STAB-003 Fighter career statistics RPC blueprint. PREPARED ONLY.
begin;

create function public.update_fighter_career_stats(p_fighter_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
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
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  if not exists (
    select 1 from public.fighters fi
    where fi.id = p_fighter_id and (
      fi.profile_id = auth.uid()
      or exists (
        select 1 from public.profile_system_roles psr
        join public.system_roles sr on sr.id = psr.system_role_id
        where psr.profile_id = auth.uid() and sr.code in ('admin','super_admin')
      )
    )
  ) then
    raise exception using errcode = '42501', message = 'Fighter statistics access denied';
  end if;

  select
    count(*),
    count(*) filter (where f.winner_id = p_fighter_id),
    count(*) filter (where f.winner_id is not null and f.winner_id <> p_fighter_id),
    count(*) filter (where f.winner_id is null and lower(coalesce(f.method,'')) in ('draw','no contest','no_contest')),
    count(*) filter (where f.winner_id = p_fighter_id and lower(coalesce(f.method,'')) in ('ko','tko')),
    count(*) filter (where f.winner_id = p_fighter_id and lower(coalesce(f.method,'')) = 'submission'),
    count(*) filter (where f.winner_id = p_fighter_id and lower(coalesce(f.method,'')) like '%decision%')
  into total_count, win_count, loss_count, draw_count, ko_count, submission_count, decision_count
  from public.fights f
  where (f.fighter_red_id = p_fighter_id or f.fighter_blue_id = p_fighter_id)
    and coalesce(f.status, '') in ('completed','published');

  update public.fighter_career_stats set
    total_fights = total_count,
    wins = win_count,
    losses = loss_count,
    draws = draw_count,
    wins_by_ko = ko_count,
    wins_by_submission = submission_count,
    wins_by_decision = decision_count,
    updated_at = now()
  where fighter_id = p_fighter_id;

  if not found then
    insert into public.fighter_career_stats (
      fighter_id, total_fights, wins, losses, draws,
      wins_by_ko, wins_by_submission, wins_by_decision, updated_at
    ) values (
      p_fighter_id, total_count, win_count, loss_count, draw_count,
      ko_count, submission_count, decision_count, now()
    );
  end if;
end;
$$;

comment on function public.update_fighter_career_stats(uuid) is
  'Idempotently recalculates one fighter career summary from completed or published fights.';
revoke all on function public.update_fighter_career_stats(uuid) from public;
grant execute on function public.update_fighter_career_stats(uuid) to authenticated;

commit;

-- Rollback: drop function public.update_fighter_career_stats(uuid);
