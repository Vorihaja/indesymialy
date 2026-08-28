-- Complete organizer event workflow persisted atomically from the ERP wizard.

alter table public.events
  add column if not exists event_type text,
  add column if not exists readiness_percent smallint not null default 0
    check (readiness_percent between 0 and 100);

alter table public.ticket_types
  add column if not exists code text,
  add column if not exists category text not null default 'Standard',
  add column if not exists zone text,
  add column if not exists currency_code text not null default 'MGA',
  add column if not exists max_per_order integer not null default 6 check (max_per_order > 0),
  add column if not exists sales_start timestamptz,
  add column if not exists sales_end timestamptz,
  add column if not exists channels text[] not null default '{}',
  add column if not exists conditions text,
  add column if not exists status text not null default 'draft';

create unique index if not exists ticket_types_event_code_uidx
  on public.ticket_types(event_id, code) where code is not null;

create table if not exists public.event_fight_cards (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  position integer not null,
  segment text not null,
  discipline_id uuid references public.disciplines(id),
  fighter_red_id uuid references public.fighters(id),
  fighter_blue_id uuid references public.fighters(id),
  fighter_red_mention text,
  fighter_blue_mention text,
  status text not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_id, position)
);

create table if not exists public.event_official_assignments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid references public.profiles(id),
  mention text,
  role text not null,
  status text not null default 'invited',
  created_at timestamptz not null default now()
);

create table if not exists public.event_invitations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  invitee_profile_id uuid references public.profiles(id),
  mention text not null,
  invitation_type text not null,
  role text not null,
  status text not null default 'pending',
  sent_by uuid not null references public.profiles(id),
  sent_at timestamptz not null default now(),
  responded_at timestamptz,
  unique(event_id, mention, invitation_type, role)
);

alter table public.event_fight_cards enable row level security;
alter table public.event_official_assignments enable row level security;
alter table public.event_invitations enable row level security;

create policy event_fight_cards_public_read on public.event_fight_cards
for select to anon, authenticated using (
  exists (select 1 from public.events e where e.id = event_id and e.status in ('published','active','live','completed'))
  or public.can_manage_event(event_id)
);
create policy event_fight_cards_organizer_manage on public.event_fight_cards
for all to authenticated using (public.can_manage_event(event_id)) with check (public.can_manage_event(event_id));

create policy event_official_assignments_parties on public.event_official_assignments
for select to authenticated using (public.can_manage_event(event_id) or profile_id = auth.uid());
create policy event_official_assignments_organizer_manage on public.event_official_assignments
for all to authenticated using (public.can_manage_event(event_id)) with check (public.can_manage_event(event_id));

create policy event_invitations_parties on public.event_invitations
for select to authenticated using (public.can_manage_event(event_id) or invitee_profile_id = auth.uid());
create policy event_invitations_organizer_manage on public.event_invitations
for all to authenticated using (public.can_manage_event(event_id)) with check (public.can_manage_event(event_id));

create or replace function public.save_organizer_event_workflow(
  p_event_id uuid,
  p_payload jsonb,
  p_status text default 'draft'
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_event_id uuid := p_event_id;
  v_organization_id uuid;
  v_budget_id uuid;
  v_item jsonb;
  v_position integer;
  v_profile_id uuid;
  v_discipline_id uuid;
  v_red_id uuid;
  v_blue_id uuid;
  v_mention text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  if v_event_id is null then
    select o.id into v_organization_id
    from public.organizations o
    where o.owner_id = v_user_id or exists (
      select 1 from public.organization_members om
      where om.organization_id = o.id and om.profile_id = v_user_id and coalesce(om.status, 'active') = 'active'
    ) order by (o.owner_id = v_user_id) desc limit 1;
    if v_organization_id is null then raise exception 'No organization associated with this account'; end if;
    insert into public.events(title, event_type, starts_at, venue, status, visibility, organizer_id, readiness_percent)
    values (
      nullif(trim(p_payload #>> '{event,name}'), ''),
      nullif(trim(p_payload #>> '{event,type}'), ''),
      nullif(p_payload #>> '{event,date}', '')::timestamptz,
      nullif(trim(p_payload #>> '{event,location}'), ''),
      p_status, 'private', v_organization_id,
      greatest(0, least(100, coalesce((p_payload->>'readiness')::integer, 0)))
    ) returning id into v_event_id;
  else
    if not public.can_manage_event(v_event_id) then raise exception 'Event access denied'; end if;
    update public.events set
      title = nullif(trim(p_payload #>> '{event,name}'), ''),
      event_type = nullif(trim(p_payload #>> '{event,type}'), ''),
      starts_at = nullif(p_payload #>> '{event,date}', '')::timestamptz,
      venue = nullif(trim(p_payload #>> '{event,location}'), ''),
      status = p_status,
      readiness_percent = greatest(0, least(100, coalesce((p_payload->>'readiness')::integer, 0))),
      updated_at = now()
    where id = v_event_id;
  end if;

  delete from public.event_fight_cards where event_id = v_event_id;
  v_position := 0;
  for v_item in select value from jsonb_array_elements(coalesce(p_payload->'fightCards', '[]'::jsonb)) loop
    v_position := v_position + 1;
    select d.id into v_discipline_id from public.disciplines d where lower(d.name) = lower(v_item->>'discipline') or lower(d.slug) = lower(v_item->>'discipline') limit 1;
    v_mention := regexp_replace(coalesce(v_item->>'red',''), '^@', '');
    select f.id into v_red_id from public.fighters f join public.profiles p on p.id = f.profile_id where lower(p.username) = lower(v_mention) limit 1;
    v_mention := regexp_replace(coalesce(v_item->>'blue',''), '^@', '');
    select f.id into v_blue_id from public.fighters f join public.profiles p on p.id = f.profile_id where lower(p.username) = lower(v_mention) limit 1;
    insert into public.event_fight_cards(event_id, position, segment, discipline_id, fighter_red_id, fighter_blue_id, fighter_red_mention, fighter_blue_mention)
    values (v_event_id, v_position, coalesce(nullif(v_item->>'segment',''),'Carte principale'), v_discipline_id, v_red_id, v_blue_id, nullif(v_item->>'red',''), nullif(v_item->>'blue',''));
  end loop;

  delete from public.event_official_assignments where event_id = v_event_id;
  for v_item in select value from jsonb_array_elements(coalesce(p_payload->'officials', '[]'::jsonb)) loop
    v_mention := regexp_replace(coalesce(v_item->>'name',''), '^@', '');
    select p.id into v_profile_id from public.profiles p where lower(p.username) = lower(v_mention) limit 1;
    insert into public.event_official_assignments(event_id, profile_id, mention, role)
    values (v_event_id, v_profile_id, nullif(v_item->>'name',''), coalesce(nullif(v_item->>'role',''),'Officiel'));
  end loop;

  delete from public.staff_assignments where event_id = v_event_id;
  for v_item in select value from jsonb_array_elements(coalesce(p_payload->'team', '[]'::jsonb)) loop
    v_mention := regexp_replace(coalesce(v_item->>'name',''), '^@', '');
    select p.id into v_profile_id from public.profiles p where lower(p.username) = lower(v_mention) limit 1;
    insert into public.staff_assignments(event_id, profile_id, staff_name, role, status, availability_status)
    values (v_event_id, v_profile_id, coalesce(nullif(v_item->>'name',''),'À confirmer'), coalesce(nullif(v_item->>'role',''),'Équipe'), 'invited', 'pending');
  end loop;

  select id into v_budget_id from public.event_budgets where event_id = v_event_id order by version desc limit 1;
  if v_budget_id is null then
    insert into public.event_budgets(event_id, name, status, created_by, currency_code)
    values (v_event_id, 'Budget principal', 'draft', v_user_id, 'MGA') returning id into v_budget_id;
  end if;
  delete from public.event_budget_lines where event_budget_id = v_budget_id;
  insert into public.event_budget_lines(event_budget_id, line_type, category_code, label, forecast_amount, position)
  values (v_budget_id, 'income', 'budget', 'Budget prévisionnel', coalesce(nullif(p_payload->>'budget','')::numeric,0), 0);
  v_position := 0;
  for v_item in select value from jsonb_array_elements(coalesce(p_payload->'expenses', '[]'::jsonb)) loop
    v_position := v_position + 1;
    insert into public.event_budget_lines(event_budget_id, line_type, category_code, label, forecast_amount, position)
    values (v_budget_id, 'expense', 'expense', coalesce(nullif(v_item->>'label',''),'Dépense'), coalesce(nullif(v_item->>'amount','')::numeric,0), v_position);
  end loop;

  delete from public.ticket_types where event_id = v_event_id and coalesce(sold_quantity,0) = 0;
  for v_item in select value from jsonb_array_elements(coalesce(p_payload->'tickets', '[]'::jsonb)) loop
    insert into public.ticket_types(event_id, name, code, category, zone, price, currency_code, total_quantity, max_per_order, sales_start, sales_end, channels, conditions, status)
    values (v_event_id, coalesce(nullif(v_item->>'name',''),'Billet'), nullif(v_item->>'code',''), coalesce(nullif(v_item->>'category',''),'Standard'), nullif(v_item->>'zone',''), coalesce(nullif(v_item->>'price','')::numeric,0), case when v_item->>'currency' = 'Ar' then 'MGA' else coalesce(nullif(v_item->>'currency',''),'MGA') end, greatest(0,coalesce(nullif(v_item->>'quota','')::integer,0)), greatest(1,coalesce(nullif(v_item->>'maxPerOrder','')::integer,6)), nullif(v_item->>'salesStart','')::timestamptz, nullif(v_item->>'salesEnd','')::timestamptz, coalesce(array(select jsonb_array_elements_text(coalesce(v_item->'channels','[]'::jsonb))), '{}'), nullif(v_item->>'conditions',''), lower(coalesce(nullif(v_item->>'status',''),'draft')));
  end loop;

  delete from public.event_invitations where event_id = v_event_id and status = 'pending';
  for v_item in
    select value || jsonb_build_object('_type','fighter','_role','Combattant') from jsonb_array_elements(coalesce(p_payload->'fightCards','[]'::jsonb))
  loop
    foreach v_mention in array array[v_item->>'red', v_item->>'blue'] loop
      if coalesce(v_mention,'') like '@%' then
        select p.id into v_profile_id from public.profiles p where lower(p.username) = lower(regexp_replace(v_mention,'^@','')) limit 1;
        insert into public.event_invitations(event_id, invitee_profile_id, mention, invitation_type, role, sent_by)
        values (v_event_id, v_profile_id, v_mention, 'fighter', 'Combattant', v_user_id) on conflict do nothing;
      end if;
    end loop;
  end loop;
  for v_item in
    select value || jsonb_build_object('_type','official') from jsonb_array_elements(coalesce(p_payload->'officials','[]'::jsonb))
    union all
    select value || jsonb_build_object('_type','team') from jsonb_array_elements(coalesce(p_payload->'team','[]'::jsonb))
  loop
    v_mention := v_item->>'name';
    if coalesce(v_mention,'') like '@%' then
      select p.id into v_profile_id from public.profiles p where lower(p.username) = lower(regexp_replace(v_mention,'^@','')) limit 1;
      insert into public.event_invitations(event_id, invitee_profile_id, mention, invitation_type, role, sent_by)
      values (v_event_id, v_profile_id, v_mention, v_item->>'_type', coalesce(v_item->>'role','Participant'), v_user_id) on conflict do nothing;
    end if;
  end loop;

  return v_event_id;
end;
$$;

revoke all on function public.save_organizer_event_workflow(uuid,jsonb,text) from public, anon;
grant execute on function public.save_organizer_event_workflow(uuid,jsonb,text) to authenticated;
