-- ERP-ORG-003 authorization and aggregate functions. PREPARED ONLY.
begin;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profile_system_roles psr
    join public.system_roles sr on sr.id = psr.system_role_id
    where psr.profile_id = auth.uid()
      and sr.code in ('admin','super_admin')
  );
$$;

create or replace function public.can_manage_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_platform_admin() or exists (
    select 1
    from public.events e
    join public.organizations o on o.id = e.organizer_id
    where e.id = p_event_id
      and (
        o.owner_id = auth.uid()
        or exists (
          select 1 from public.organization_members om
          where om.organization_id = o.id
            and om.profile_id = auth.uid()
            and om.role in ('owner','admin','manager','organizer')
            and coalesce(om.status,'active') = 'active'
        )
      )
  );
$$;

create or replace function public.can_manage_organization(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_platform_admin() or exists (
    select 1 from public.organizations o
    where o.id = p_organization_id
      and (
        o.owner_id = auth.uid()
        or exists (
          select 1 from public.organization_members om
          where om.organization_id = o.id
            and om.profile_id = auth.uid()
            and om.role in ('owner','admin','manager','organizer')
            and coalesce(om.status,'active') = 'active'
        )
      )
  );
$$;

create or replace function public.is_event_staff(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff_assignments sa
    where sa.event_id = p_event_id
      and sa.profile_id = auth.uid()
      and coalesce(sa.status,'pending') in ('confirmed','active')
  );
$$;

create or replace function public.is_event_official(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.fight_official_assignments foa
    join public.fights f on f.id = foa.fight_id
    where f.event_id = p_event_id
      and foa.user_id = auth.uid()
      and coalesce(foa.status,'pending') in ('confirmed','assigned')
  );
$$;

create or replace function public.is_registration_applicant(p_registration_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.event_registrations er
    where er.id = p_registration_id
      and (
        er.applicant_profile_id = auth.uid()
        or exists (select 1 from public.organizations o where o.id = er.applicant_organization_id and o.owner_id = auth.uid())
        or exists (
          select 1 from public.organization_members om
          where om.organization_id = er.applicant_organization_id
            and om.profile_id = auth.uid()
            and om.role in ('owner','admin','manager')
            and coalesce(om.status,'active') = 'active'
        )
      )
  );
$$;

create or replace function public.is_sponsor_user(p_sponsor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.sponsors s
    join public.organizations o on o.id = s.organization_id
    where s.id = p_sponsor_id
      and (
        o.owner_id = auth.uid()
        or exists (
          select 1 from public.organization_members om
          where om.organization_id = o.id
            and om.profile_id = auth.uid()
            and coalesce(om.status,'active') = 'active'
        )
      )
  );
$$;

create or replace function public.guard_staff_assignment_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.can_manage_event(old.event_id) then return new; end if;
  if old.profile_id = auth.uid()
    and new.profile_id is not distinct from old.profile_id
    and new.event_id is not distinct from old.event_id
    and new.staff_name is not distinct from old.staff_name
    and new.phone is not distinct from old.phone
    and new.role is not distinct from old.role
    and new.assigned_at is not distinct from old.assigned_at
    and new.zone is not distinct from old.zone
    and new.starts_at is not distinct from old.starts_at
    and new.ends_at is not distinct from old.ends_at
    and new.compensation_amount is not distinct from old.compensation_amount
    and new.currency_code is not distinct from old.currency_code
    and new.status in ('confirmed','declined')
  then return new; end if;
  raise exception using errcode = '42501', message = 'Staff update is limited to confirmation and availability';
end;
$$;

create trigger staff_assignments_guard_update
before update on public.staff_assignments
for each row execute function public.guard_staff_assignment_update();

create or replace function public.guard_official_assignment_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare v_event_id uuid;
begin
  select f.event_id into v_event_id from public.fights f where f.id = old.fight_id;
  if public.can_manage_event(v_event_id) then return new; end if;
  if old.user_id = auth.uid()
    and new.user_id is not distinct from old.user_id
    and new.fight_id is not distinct from old.fight_id
    and new.assigned_by is not distinct from old.assigned_by
    and new.assigned_at is not distinct from old.assigned_at
    and new.position is not distinct from old.position
    and new.role is not distinct from old.role
    and new.status in ('confirmed','declined')
  then return new; end if;
  raise exception using errcode = '42501', message = 'Official update is limited to confirmation';
end;
$$;

create trigger fight_official_assignments_guard_update
before update on public.fight_official_assignments
for each row execute function public.guard_official_assignment_update();

create or replace function public.guard_registration_applicant_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.can_manage_event(old.event_id) then return new; end if;
  if public.is_registration_applicant(old.id)
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
    and new.status in ('pending','withdrawn')
  then return new; end if;
  raise exception using errcode = '42501', message = 'Applicant update is limited to its own pending registration';
end;
$$;

create trigger event_registrations_guard_applicant_update
before update on public.event_registrations
for each row execute function public.guard_registration_applicant_update();

create or replace function public.organizer_event_ticket_metrics(p_event_id uuid)
returns table(total_capacity bigint, sold_quantity bigint, gross_revenue numeric, fill_rate numeric)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.can_manage_event(p_event_id) then
    raise exception using errcode = '42501', message = 'Event access denied';
  end if;

  return query
  with capacity as (
    select coalesce(sum(tt.total_quantity),0)::bigint as value
    from public.ticket_types tt where tt.event_id = p_event_id
  ), sales as (
    select coalesce(sum(ts.quantity),0)::bigint as quantity,
           coalesce(sum(ts.total_amount),0)::numeric as revenue
    from public.ticket_sales ts
    where ts.event_id = p_event_id and coalesce(ts.payment_status,'pending') in ('paid','completed')
  )
  select capacity.value, sales.quantity, sales.revenue,
    case when capacity.value = 0 then 0::numeric
         else round((sales.quantity::numeric / capacity.value::numeric) * 100, 2) end
  from capacity cross join sales;
end;
$$;

create or replace function public.organizer_event_financial_summary(p_event_id uuid)
returns table(forecast_revenue numeric, forecast_expense numeric, committed_amount numeric, paid_revenue numeric, paid_expense numeric, net_result numeric)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.can_manage_event(p_event_id) then
    raise exception using errcode = '42501', message = 'Event access denied';
  end if;

  return query
  with budget as (
    select
      coalesce(sum(ebl.forecast_amount) filter (where ebl.line_type = 'revenue'),0)::numeric as fr,
      coalesce(sum(ebl.forecast_amount) filter (where ebl.line_type = 'expense'),0)::numeric as fe,
      coalesce(sum(ebl.committed_amount),0)::numeric as committed
    from public.event_budget_lines ebl
    join public.event_budgets eb on eb.id = ebl.event_budget_id
    where eb.event_id = p_event_id and eb.status <> 'archived'
  ), ledger as (
    select
      coalesce(sum(et.amount) filter (where et.transaction_type = 'revenue' and et.status = 'paid'),0)::numeric as revenue,
      coalesce(sum(et.amount) filter (where et.transaction_type = 'expense' and et.status = 'paid'),0)::numeric as expense
    from public.event_transactions et where et.event_id = p_event_id
  )
  select budget.fr, budget.fe, budget.committed, ledger.revenue, ledger.expense, ledger.revenue - ledger.expense
  from budget cross join ledger;
end;
$$;

create or replace function public.ticket_type_available_quantity(p_ticket_type_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select greatest(
    coalesce(tt.total_quantity,0) - coalesce(tt.sold_quantity,0) - coalesce((
      select sum(tr.quantity)::integer
      from public.ticket_reservations tr
      where tr.ticket_type_id = tt.id
        and tr.status = 'held'
        and tr.expires_at > now()
    ),0),
    0
  )::integer
  from public.ticket_types tt where tt.id = p_ticket_type_id;
$$;

revoke all on function public.is_platform_admin() from public;
revoke all on function public.can_manage_event(uuid) from public;
revoke all on function public.can_manage_organization(uuid) from public;
revoke all on function public.is_event_staff(uuid) from public;
revoke all on function public.is_event_official(uuid) from public;
revoke all on function public.is_registration_applicant(uuid) from public;
revoke all on function public.is_sponsor_user(uuid) from public;
revoke all on function public.guard_staff_assignment_update() from public;
revoke all on function public.guard_official_assignment_update() from public;
revoke all on function public.guard_registration_applicant_update() from public;
revoke all on function public.organizer_event_ticket_metrics(uuid) from public;
revoke all on function public.organizer_event_financial_summary(uuid) from public;
revoke all on function public.ticket_type_available_quantity(uuid) from public;

grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.can_manage_event(uuid) to authenticated;
grant execute on function public.can_manage_organization(uuid) to authenticated;
grant execute on function public.is_event_staff(uuid) to authenticated;
grant execute on function public.is_event_official(uuid) to authenticated;
grant execute on function public.is_registration_applicant(uuid) to authenticated;
grant execute on function public.is_sponsor_user(uuid) to authenticated;
grant execute on function public.organizer_event_ticket_metrics(uuid) to authenticated;
grant execute on function public.organizer_event_financial_summary(uuid) to authenticated;
grant execute on function public.ticket_type_available_quantity(uuid) to anon, authenticated;

comment on function public.ticket_type_available_quantity(uuid) is 'Availability only; does not reserve or sell a ticket.';

commit;

-- Rollback (manual): drop the three guard triggers first, then revoke grants and
-- drop the aggregate, authorization and trigger functions with their exact signatures.
