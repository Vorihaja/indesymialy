begin;

-- Legacy-client compatibility fix for Event Team.
--
-- Older clients send Team members as name + role only. The workflow already resolves the
-- person's profile from that legacy name/username, but the P1C recovery branch incorrectly
-- required profileId to have been present in the payload itself.
--
-- Use the resolved v_profile_id so an existing event/profile/role assignment is recovered
-- and its recipient decision state remains stable.
--
-- staff_assignments remains the sole Team decision authority.

create or replace function public.save_organizer_event_workflow(
  p_event_id uuid,
  p_payload jsonb,
  p_status text default 'draft'
) returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_event_id uuid := p_event_id;
  v_organization_id uuid;
  v_budget_id uuid;
  v_item jsonb;
  v_position integer;
  v_profile_id uuid;
  v_payload_profile_id uuid;
  v_discipline_id uuid;
  v_red_id uuid;
  v_blue_id uuid;
  v_mention text;
  v_event_status text;
  v_official_assignment_id uuid;
  v_kept_official_assignment_ids uuid[] := '{}';
  v_official_role text;
  v_staff_assignment public.staff_assignments%rowtype;
  v_staff_assignment_id uuid;
  v_kept_staff_assignment_ids uuid[] := '{}';
  v_staff_name text;
  v_staff_role text;
  v_staff_recipient_changed boolean;
  v_staff_role_changed boolean;
begin
  v_event_status := case when p_status in ('draft','published','completed','cancelled','archived') then p_status else 'draft' end;
  if v_user_id is null then raise exception 'Authentication required'; end if;

  if v_event_id is null then
    select o.id into v_organization_id
    from public.organizations o
    left join public.active_organizations ao
      on ao.organization_id = o.id and ao.profile_id = v_user_id
    where o.type = 'organizer'
      and coalesce(o.status, 'active') = 'active'
      and (
        o.owner_id = v_user_id or exists (
          select 1 from public.organization_members om
          where om.organization_id = o.id and om.profile_id = v_user_id
            and coalesce(om.status, 'active') = 'active'
        )
      )
    order by (ao.organization_id is not null) desc, (o.owner_id = v_user_id) desc, o.updated_at desc
    limit 1;
    if v_organization_id is null then raise exception 'No organization associated with this account'; end if;
    insert into public.events(title, event_type, starts_at, venue, status, visibility, organizer_id, readiness_percent)
    values (
      nullif(trim(p_payload #>> '{event,name}'), ''),
      nullif(trim(p_payload #>> '{event,type}'), ''),
      nullif(p_payload #>> '{event,date}', '')::timestamptz,
      nullif(trim(p_payload #>> '{event,location}'), ''),
      v_event_status, 'private', v_organization_id,
      greatest(0, least(100, coalesce((p_payload->>'readiness')::integer, 0)))
    ) returning id into v_event_id;
  else
    if not public.can_manage_event(v_event_id) then raise exception 'Event access denied'; end if;
    update public.events set
      title = nullif(trim(p_payload #>> '{event,name}'), ''),
      event_type = nullif(trim(p_payload #>> '{event,type}'), ''),
      starts_at = nullif(p_payload #>> '{event,date}', '')::timestamptz,
      venue = nullif(trim(p_payload #>> '{event,location}'), ''),
      status = v_event_status,
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

  for v_item in select value from jsonb_array_elements(coalesce(p_payload->'officials', '[]'::jsonb)) loop
    if nullif(trim(coalesce(v_item->>'name','')), '') is null
      and nullif(trim(coalesce(v_item->>'profileId','')), '') is null then
      continue;
    end if;

    v_profile_id := nullif(trim(coalesce(v_item->>'profileId','')), '')::uuid;
    v_official_assignment_id := nullif(trim(coalesce(v_item->>'assignmentId','')), '')::uuid;
    v_official_role := case lower(trim(coalesce(v_item->>'role','')))
      when 'arbitre' then 'referee'
      when 'arbitre central' then 'referee'
      when 'referee' then 'referee'
      when 'juge' then 'judge'
      when 'judge' then 'judge'
      when 'chronométreur' then 'timekeeper'
      when 'chronometreur' then 'timekeeper'
      when 'chronomètre' then 'timekeeper'
      when 'chronometre' then 'timekeeper'
      when 'timekeeper' then 'timekeeper'
      when 'médecin' then 'doctor'
      when 'medecin' then 'doctor'
      when 'doctor' then 'doctor'
      when 'superviseur' then 'supervisor'
      when 'supervisor' then 'supervisor'
      when 'annonceur' then 'announcer'
      when 'announcer' then 'announcer'
      else null
    end;

    if v_profile_id is null and not (
      coalesce((v_item->>'legacyMention')::boolean, false)
      and v_official_assignment_id is not null
    ) then
      raise exception 'Sélectionnez un compte Officiel Indesy dans les suggestions.';
    end if;

    if v_official_role is null and v_profile_id is null and exists (
      select 1
      from public.event_official_assignments existing
      where existing.id = v_official_assignment_id
        and existing.event_id = v_event_id
        and existing.profile_id is null
        and existing.role = v_item->>'role'
    ) then
      v_official_role := v_item->>'role';
    end if;

    if v_official_role is null then
      raise exception 'Fonction officielle invalide.';
    end if;

    if v_profile_id is not null and not exists (
      select 1
      from public.profile_roles pr
      join public.roles r on r.id = pr.role_id
      where pr.profile_id = v_profile_id
        and r.slug = 'official'
    ) then
      raise exception 'Le profil sélectionné ne possède pas le rôle Officiel.';
    end if;

    if v_official_assignment_id is not null then
      update public.event_official_assignments
      set
        profile_id = v_profile_id,
        mention = case
          when v_profile_id is null then coalesce(
            nullif(v_item->>'legacyMentionValue',''),
            nullif(v_item->>'name','')
          )
          else null
        end,
        role = v_official_role
      where id = v_official_assignment_id
        and event_id = v_event_id
      returning id into v_official_assignment_id;

      if v_official_assignment_id is null then
        raise exception 'Affectation officielle introuvable.';
      end if;
    else
      insert into public.event_official_assignments(event_id, profile_id, mention, role, status)
      values (v_event_id, v_profile_id, null, v_official_role, 'invited')
      returning id into v_official_assignment_id;
    end if;

    v_kept_official_assignment_ids := array_append(
      v_kept_official_assignment_ids,
      v_official_assignment_id
    );
  end loop;

  delete from public.event_official_assignments
  where event_id = v_event_id
    and not (id = any(v_kept_official_assignment_ids));

  for v_item in select value from jsonb_array_elements(coalesce(p_payload->'team', '[]'::jsonb)) loop
    v_staff_name := nullif(trim(coalesce(v_item->>'name','')), '');
    if v_staff_name is null then continue; end if;

    v_staff_role := coalesce(nullif(trim(v_item->>'role'), ''), 'Équipe');
    v_staff_assignment_id := nullif(trim(coalesce(v_item->>'assignmentId','')), '')::uuid;
    v_payload_profile_id := nullif(trim(coalesce(v_item->>'profileId','')), '')::uuid;
    v_profile_id := v_payload_profile_id;

    if v_profile_id is null then
      v_mention := regexp_replace(v_staff_name, '^@', '');
      select p.id into v_profile_id
      from public.profiles p
      where lower(p.username) = lower(v_mention)
      limit 1;
    end if;

    if v_staff_assignment_id is not null then
      if v_staff_assignment_id = any(v_kept_staff_assignment_ids) then
        raise exception 'Affectation équipe dupliquée dans la requête.';
      end if;

      select assignment.* into v_staff_assignment
      from public.staff_assignments assignment
      where assignment.id = v_staff_assignment_id
      for update;

      if not found then
        raise exception 'Affectation équipe introuvable.';
      end if;
      if v_staff_assignment.event_id <> v_event_id then
        raise exception 'Affectation équipe liée à un autre événement.';
      end if;
    elsif v_profile_id is not null then
      select assignment.* into v_staff_assignment
      from public.staff_assignments assignment
      where assignment.event_id = v_event_id
        and assignment.profile_id = v_profile_id
        and assignment.role = v_staff_role
        and not (assignment.id = any(v_kept_staff_assignment_ids))
      order by assignment.assigned_at, assignment.id
      limit 1
      for update;

      if found then
        v_staff_assignment_id := v_staff_assignment.id;
      end if;
    end if;

    if v_staff_assignment_id is null then
      insert into public.staff_assignments(
        event_id,
        profile_id,
        staff_name,
        role,
        status,
        availability_status
      ) values (
        v_event_id,
        v_profile_id,
        v_staff_name,
        v_staff_role,
        'invited',
        'unknown'
      )
      returning id into v_staff_assignment_id;
    else
      v_staff_recipient_changed :=
        v_staff_assignment.profile_id is distinct from v_profile_id
        or (
          v_staff_assignment.profile_id is null
          and v_profile_id is null
          and trim(v_staff_assignment.staff_name) is distinct from v_staff_name
        );
      v_staff_role_changed := v_staff_assignment.role is distinct from v_staff_role;

      update public.staff_assignments
      set
        profile_id = v_profile_id,
        staff_name = v_staff_name,
        role = v_staff_role,
        status = case
          when v_staff_recipient_changed or v_staff_role_changed then 'invited'
          else status
        end,
        confirmed_at = case
          when v_staff_recipient_changed or v_staff_role_changed then null
          else confirmed_at
        end,
        availability_status = case
          when v_staff_recipient_changed or v_staff_role_changed then 'unknown'
          else availability_status
        end
      where id = v_staff_assignment_id;
    end if;

    v_kept_staff_assignment_ids := array_append(
      v_kept_staff_assignment_ids,
      v_staff_assignment_id
    );
  end loop;

  delete from public.staff_assignments
  where event_id = v_event_id
    and not (id = any(v_kept_staff_assignment_ids));

  select id into v_budget_id from public.event_budgets where event_id = v_event_id order by version desc limit 1;
  if v_budget_id is null then
    insert into public.event_budgets(event_id, name, status, created_by, currency_code)
    values (v_event_id, 'Budget principal', 'draft', v_user_id, 'MGA') returning id into v_budget_id;
  end if;
  delete from public.event_budget_lines where event_budget_id = v_budget_id;
  insert into public.event_budget_lines(event_budget_id, line_type, category_code, label, forecast_amount, position)
  values (v_budget_id, 'revenue', 'budget', 'Budget prévisionnel', coalesce(nullif(p_payload->>'budget','')::numeric,0), 0);
  v_position := 0;
  for v_item in select value from jsonb_array_elements(coalesce(p_payload->'expenses', '[]'::jsonb)) loop
    if nullif(trim(coalesce(v_item->>'label','')), '') is null and nullif(v_item->>'amount','') is null then continue; end if;
    v_position := v_position + 1;
    insert into public.event_budget_lines(event_budget_id, line_type, category_code, label, forecast_amount, position)
    values (v_budget_id, 'expense', 'expense', coalesce(nullif(v_item->>'label',''),'Dépense'), coalesce(nullif(v_item->>'amount','')::numeric,0), v_position);
  end loop;

  delete from public.ticket_types where event_id = v_event_id and coalesce(sold_quantity,0) = 0;
  for v_item in select value from jsonb_array_elements(coalesce(p_payload->'tickets', '[]'::jsonb)) loop
    if nullif(trim(coalesce(v_item->>'name','')), '') is null and nullif(trim(coalesce(v_item->>'code','')), '') is null then continue; end if;
    insert into public.ticket_types(event_id, name, code, category, zone, price, currency_code, total_quantity, max_per_order, sales_start, sales_end, channels, conditions, status)
    values (v_event_id, coalesce(nullif(v_item->>'name',''),'Billet'), nullif(v_item->>'code',''), coalesce(nullif(v_item->>'category',''),'Standard'), nullif(v_item->>'zone',''), coalesce(nullif(v_item->>'price','')::numeric,0), case when v_item->>'currency' = 'Ar' then 'MGA' else coalesce(nullif(v_item->>'currency',''),'MGA') end, greatest(0,coalesce(nullif(v_item->>'quota','')::integer,0)), greatest(1,coalesce(nullif(v_item->>'maxPerOrder','')::integer,6)), nullif(v_item->>'salesStart','')::timestamptz, nullif(v_item->>'salesEnd','')::timestamptz, coalesce(array(select jsonb_array_elements_text(coalesce(v_item->'channels','[]'::jsonb))), '{}'), nullif(v_item->>'conditions',''), case lower(coalesce(nullif(v_item->>'status',''),'draft')) when 'publié' then 'published' when 'published' then 'published' when 'actif' then 'active' when 'active' then 'active' else 'draft' end);
  end loop;

  delete from public.event_invitations
  where event_id = v_event_id
    and (
      status = 'pending'
      or (invitation_type = 'team' and status = 'sent')
    );
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

  return v_event_id;
end;
$function$;

revoke all on function public.save_organizer_event_workflow(uuid, jsonb, text)
from public, anon;

grant execute on function public.save_organizer_event_workflow(uuid, jsonb, text)
to authenticated;

comment on function public.save_organizer_event_workflow(uuid, jsonb, text) is
'Organizer event workflow with stable Team assignment identity and legacy name-based recipient recovery.';

commit;