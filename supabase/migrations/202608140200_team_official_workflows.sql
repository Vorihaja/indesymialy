begin;

create table if not exists public.event_accreditations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  staff_assignment_id uuid references public.staff_assignments(id) on delete set null,
  official_assignment_id uuid references public.event_official_assignments(id) on delete set null,
  holder_name text not null,
  badge_code text not null unique,
  accreditation_type text not null default 'staff',
  access_zones text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','issued','active','suspended','revoked','expired')),
  valid_from timestamptz,
  valid_until timestamptz,
  issued_by uuid not null references public.profiles(id) on delete restrict,
  issued_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_accreditations_dates_check check (valid_until is null or valid_from is null or valid_until > valid_from),
  constraint event_accreditations_holder_check check (length(btrim(holder_name)) between 2 and 200)
);
create index if not exists event_accreditations_event_status_idx on public.event_accreditations(event_id, status);
create index if not exists event_accreditations_profile_idx on public.event_accreditations(profile_id, event_id);
alter table public.event_accreditations enable row level security;

create policy event_accreditations_manager_manage
on public.event_accreditations for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id) and issued_by = auth.uid());

create policy event_accreditations_holder_read
on public.event_accreditations for select to authenticated
using (profile_id = auth.uid());

create unique index if not exists fight_official_assignments_unique_role
on public.fight_official_assignments(fight_id, user_id, role);

create or replace function public.assign_event_official_to_fight(
  p_fight_id uuid,
  p_user_id uuid,
  p_role text,
  p_position integer default null
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_event_id uuid;
  v_assignment_id uuid;
  v_availability text;
begin
  select event_id into v_event_id from public.fights where id = p_fight_id;
  if v_event_id is null then raise exception 'Combat introuvable.'; end if;
  if not public.can_manage_event(v_event_id) then raise exception 'Accès refusé.'; end if;
  if p_role not in ('referee','judge','timekeeper','doctor','supervisor') then raise exception 'Fonction officielle invalide.'; end if;

  select availability_status into v_availability
  from public.official_availability
  where event_id = v_event_id and official_profile_id = p_user_id
  order by updated_at desc limit 1;
  if v_availability in ('unavailable','declined') then raise exception 'Cet officiel est indisponible.'; end if;

  insert into public.fight_official_assignments(fight_id, user_id, role, position, status, assigned_by, assigned_at)
  values (p_fight_id, p_user_id, p_role, p_position, 'assigned', auth.uid(), now())
  on conflict (fight_id, user_id, role) do update
  set position = excluded.position, status = 'assigned', assigned_by = auth.uid(), assigned_at = now()
  returning id into v_assignment_id;

  return v_assignment_id;
end;
$$;

grant execute on function public.assign_event_official_to_fight(uuid,uuid,text,integer) to authenticated;

commit;
