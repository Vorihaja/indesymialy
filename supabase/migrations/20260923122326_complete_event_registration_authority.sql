begin;

-- C4-FC2B: make registration review transactional, project validated
-- registrations into canonical event participants, and close participant RLS.

alter table public.event_registrations
  drop constraint if exists event_registrations_applicant_check;

alter table public.event_registrations
  add constraint event_registrations_applicant_check check (
    (applicant_type = 'fighter'
      and applicant_profile_id is not null
      and applicant_organization_id is null)
    or (applicant_type = 'club'
      and applicant_organization_id is not null
      and applicant_profile_id is null)
  );

alter table public.event_participants
  drop constraint if exists event_participants_subject_check;

alter table public.event_participants
  add constraint event_participants_subject_check
  check (num_nonnulls(profile_id, organization_id) = 1);

create unique index if not exists event_participants_profile_subject_key
  on public.event_participants(event_id, profile_id, participant_type)
  where profile_id is not null;

create unique index if not exists event_participants_organization_subject_key
  on public.event_participants(event_id, organization_id, participant_type)
  where organization_id is not null;

create or replace function public.enforce_event_registration_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.event_id is distinct from old.event_id
     or new.applicant_profile_id is distinct from old.applicant_profile_id
     or new.applicant_organization_id is distinct from old.applicant_organization_id
     or new.applicant_type is distinct from old.applicant_type
     or new.submitted_at is distinct from old.submitted_at then
    raise exception 'REGISTRATION_IDENTITY_IMMUTABLE' using errcode = '22023';
  end if;

  if new.status is distinct from old.status and not (
    (old.status = 'pending' and new.status in (
      'validated', 'refused', 'waiting_list', 'withdrawn'
    ))
    or (old.status = 'waiting_list' and new.status in (
      'validated', 'refused', 'withdrawn'
    ))
  ) then
    raise exception 'INVALID_REGISTRATION_TRANSITION: % -> %', old.status, new.status
      using errcode = '22023';
  end if;

  if new.status = 'validated' and new.eligibility_status <> 'eligible' then
    raise exception 'VALIDATION_REQUIRES_ELIGIBILITY' using errcode = '22023';
  end if;

  if new.status = 'refused'
     and nullif(btrim(coalesce(new.decision_reason, '')), '') is null then
    raise exception 'REFUSAL_REASON_REQUIRED' using errcode = '22023';
  end if;

  if new.status = 'waiting_list' and coalesce(new.waitlist_position, 0) <= 0 then
    raise exception 'WAITLIST_POSITION_REQUIRED' using errcode = '22023';
  end if;

  if new.status <> 'waiting_list' then
    new.waitlist_position := null;
  end if;

  if new.status = 'withdrawn' then
    new.decision_reason := null;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists event_registrations_enforce_transition
  on public.event_registrations;
create trigger event_registrations_enforce_transition
before update on public.event_registrations
for each row execute function public.enforce_event_registration_transition();

create or replace function public.guard_registration_applicant_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.can_manage_event(old.event_id) then
    if new.status = 'pending' then
      new.reviewed_by := null;
      new.reviewed_at := null;
    else
      new.reviewed_by := auth.uid();
      new.reviewed_at := now();
    end if;
    return new;
  end if;

  if old.status = 'pending'
     and public.is_registration_applicant(old.id)
     and new.event_id is not distinct from old.event_id
     and new.competition_category_id is not distinct from old.competition_category_id
     and new.applicant_profile_id is not distinct from old.applicant_profile_id
     and new.applicant_organization_id is not distinct from old.applicant_organization_id
     and new.applicant_type is not distinct from old.applicant_type
     and new.payment_status is not distinct from old.payment_status
     and new.eligibility_status is not distinct from old.eligibility_status
     and new.reviewed_by is not distinct from old.reviewed_by
     and new.reviewed_at is not distinct from old.reviewed_at
     and new.decision_reason is not distinct from old.decision_reason
     and new.waitlist_position is not distinct from old.waitlist_position
     and new.status in ('pending', 'withdrawn') then
    return new;
  end if;

  if old.status = 'waiting_list'
     and new.status = 'withdrawn'
     and public.is_registration_applicant(old.id)
     and new.event_id is not distinct from old.event_id
     and new.competition_category_id is not distinct from old.competition_category_id
     and new.applicant_profile_id is not distinct from old.applicant_profile_id
     and new.applicant_organization_id is not distinct from old.applicant_organization_id
     and new.applicant_type is not distinct from old.applicant_type
     and new.weight_kg is not distinct from old.weight_kg
     and new.license_number is not distinct from old.license_number
     and new.medical_certificate_path is not distinct from old.medical_certificate_path
     and new.document_paths is not distinct from old.document_paths
     and new.payment_status is not distinct from old.payment_status
     and new.eligibility_status is not distinct from old.eligibility_status
     and new.reviewed_by is not distinct from old.reviewed_by
     and new.reviewed_at is not distinct from old.reviewed_at then
    return new;
  end if;

  raise exception 'APPLICANT_UPDATE_FORBIDDEN' using errcode = '42501';
end;
$$;

create or replace function public.record_event_registration_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.event_registration_history(
      registration_id,
      from_status,
      to_status,
      changed_by,
      reason
    ) values (
      new.id,
      old.status,
      new.status,
      auth.uid(),
      nullif(btrim(new.decision_reason), '')
    );
  end if;
  return new;
end;
$$;

drop trigger if exists event_registrations_record_history
  on public.event_registrations;
create trigger event_registrations_record_history
after update on public.event_registrations
for each row execute function public.record_event_registration_history();

create or replace function public.sync_validated_event_registration_participant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'validated' and old.status is distinct from new.status then
    if new.applicant_profile_id is not null then
      insert into public.event_participants(
        event_id, profile_id, participant_type, status, public_visible
      ) values (
        new.event_id,
        new.applicant_profile_id,
        new.applicant_type,
        'confirmed',
        false
      )
      on conflict (event_id, profile_id, participant_type)
        where profile_id is not null
      do update set status = 'confirmed';
    else
      insert into public.event_participants(
        event_id, organization_id, participant_type, status, public_visible
      ) values (
        new.event_id,
        new.applicant_organization_id,
        new.applicant_type,
        'confirmed',
        false
      )
      on conflict (event_id, organization_id, participant_type)
        where organization_id is not null
      do update set status = 'confirmed';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists event_registrations_sync_participant
  on public.event_registrations;
create trigger event_registrations_sync_participant
after update on public.event_registrations
for each row execute function public.sync_validated_event_registration_participant();

insert into public.event_participants(
  event_id, profile_id, participant_type, status, public_visible
)
select event_id, applicant_profile_id, applicant_type, 'confirmed', false
from public.event_registrations
where status = 'validated' and applicant_profile_id is not null
on conflict (event_id, profile_id, participant_type)
  where profile_id is not null
do update set status = 'confirmed';

insert into public.event_participants(
  event_id, organization_id, participant_type, status, public_visible
)
select event_id, applicant_organization_id, applicant_type, 'confirmed', false
from public.event_registrations
where status = 'validated' and applicant_organization_id is not null
on conflict (event_id, organization_id, participant_type)
  where organization_id is not null
do update set status = 'confirmed';

create or replace function public.review_event_registration(
  p_registration_id uuid,
  p_status text,
  p_eligibility_status text,
  p_reason text default null,
  p_waitlist_position integer default null,
  p_payment_status text default null
)
returns public.event_registrations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_registration public.event_registrations%rowtype;
begin
  if v_actor is null then
    raise exception 'UNAUTHENTICATED' using errcode = '42501';
  end if;

  select * into v_registration
  from public.event_registrations
  where id = p_registration_id
  for update;

  if not found then
    raise exception 'REGISTRATION_NOT_FOUND' using errcode = 'P0002';
  end if;

  if not public.can_manage_event(v_registration.event_id) then
    raise exception 'EVENT_MANAGEMENT_FORBIDDEN' using errcode = '42501';
  end if;

  if p_status not in ('pending', 'validated', 'refused', 'waiting_list')
     or (p_status = 'pending' and v_registration.status <> 'pending') then
    raise exception 'INVALID_REGISTRATION_DECISION' using errcode = '22023';
  end if;

  if p_eligibility_status not in (
    'pending', 'eligible', 'ineligible', 'waiver_required'
  ) then
    raise exception 'INVALID_ELIGIBILITY_STATUS' using errcode = '22023';
  end if;

  if p_payment_status is not null and p_payment_status not in (
    'not_required', 'prepared', 'pending', 'paid', 'refunded'
  ) then
    raise exception 'INVALID_PAYMENT_STATUS' using errcode = '22023';
  end if;

  update public.event_registrations
  set status = p_status,
      eligibility_status = p_eligibility_status,
      payment_status = coalesce(p_payment_status, payment_status),
      decision_reason = nullif(btrim(coalesce(p_reason, '')), ''),
      waitlist_position = case
        when p_status = 'waiting_list' then p_waitlist_position
        else null
      end,
      reviewed_by = case when p_status = 'pending' then null else v_actor end,
      reviewed_at = case when p_status = 'pending' then null else now() end,
      updated_at = now()
  where id = p_registration_id
  returning * into v_registration;

  return v_registration;
end;
$$;

create or replace function public.is_event_registration_applicant(
  p_event_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.event_registrations er
    where er.event_id = p_event_id
      and (
        er.applicant_profile_id = auth.uid()
        or exists (
          select 1 from public.organizations o
          where o.id = er.applicant_organization_id
            and o.owner_id = auth.uid()
        )
        or exists (
          select 1 from public.organization_members om
          where om.organization_id = er.applicant_organization_id
            and om.profile_id = auth.uid()
            and om.role in ('owner', 'admin', 'manager')
            and coalesce(om.status, 'active') = 'active'
        )
      )
  );
$$;

drop policy if exists event_participants_public_read
  on public.event_participants;
drop policy if exists event_participants_self_read
  on public.event_participants;
drop policy if exists event_participants_organizer_manage
  on public.event_participants;

create policy event_participants_public_read
on public.event_participants for select to anon, authenticated
using (
  public_visible
  and exists (
    select 1 from public.events e
    where e.id = event_participants.event_id
      and e.visibility = 'public'
      and e.published_at is not null
      and e.archived_at is null
  )
);

create policy event_participants_self_read
on public.event_participants for select to authenticated
using (
  event_participants.profile_id = auth.uid()
  or exists (
    select 1 from public.organizations o
    where o.id = event_participants.organization_id
      and o.owner_id = auth.uid()
  )
  or exists (
    select 1 from public.organization_members om
    where om.organization_id = event_participants.organization_id
      and om.profile_id = auth.uid()
      and coalesce(om.status, 'active') = 'active'
  )
);

create policy event_participants_organizer_manage
on public.event_participants for all to authenticated
using (public.can_manage_event(event_participants.event_id))
with check (public.can_manage_event(event_participants.event_id));

drop policy if exists events_registration_applicant_read on public.events;
create policy events_registration_applicant_read
on public.events for select to authenticated
using (
  public.is_event_registration_applicant(events.id)
);

revoke all on function public.review_event_registration(
  uuid, text, text, text, integer, text
) from public, anon;
grant execute on function public.review_event_registration(
  uuid, text, text, text, integer, text
) to authenticated, service_role;

revoke all on function public.is_event_registration_applicant(uuid)
  from public, anon;
grant execute on function public.is_event_registration_applicant(uuid)
  to authenticated, service_role;

revoke all on function public.enforce_event_registration_transition()
  from public, anon, authenticated;
revoke all on function public.record_event_registration_history()
  from public, anon, authenticated;
revoke all on function public.sync_validated_event_registration_participant()
  from public, anon, authenticated;
revoke all on function public.guard_registration_applicant_update()
  from public, anon;

commit;
