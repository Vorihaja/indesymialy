-- ERP-ORG-003 organizer RLS blueprint. Apply after migrations 100-200. PREPARED ONLY.
begin;

alter table public.events enable row level security;
alter table public.event_checklists enable row level security;
alter table public.event_sponsors enable row level security;
alter table public.staff_assignments enable row level security;
alter table public.fight_card enable row level security;
alter table public.fights enable row level security;
alter table public.fight_official_assignments enable row level security;
alter table public.ticket_types enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_sales enable row level security;

create policy events_public_published_read
on public.events for select to anon, authenticated
using (visibility = 'public' and published_at is not null and archived_at is null);

create policy events_organizer_read
on public.events for select to authenticated
using (public.can_manage_event(id));

create policy events_organizer_insert
on public.events for insert to authenticated
with check (organizer_id is not null and public.can_manage_organization(organizer_id));

create policy events_organizer_update
on public.events for update to authenticated
using (public.can_manage_event(id))
with check (organizer_id is not null and public.can_manage_organization(organizer_id));

create policy events_organizer_delete
on public.events for delete to authenticated
using (public.can_manage_event(id));

create policy event_lifecycle_history_organizer_read
on public.event_lifecycle_history for select to authenticated
using (public.can_manage_event(event_id));

create policy event_lifecycle_history_organizer_insert
on public.event_lifecycle_history for insert to authenticated
with check (public.can_manage_event(event_id) and changed_by = auth.uid());

create policy event_checklists_organizer_manage
on public.event_checklists for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

create policy event_checklists_assignee_read
on public.event_checklists for select to authenticated
using (assigned_to = auth.uid());

create policy event_registrations_applicant_update
on public.event_registrations for update to authenticated
using (public.is_registration_applicant(id))
with check (public.is_registration_applicant(id) and status in ('pending','withdrawn'));

create policy weigh_ins_organizer_manage
on public.weigh_ins for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

create policy weigh_ins_fighter_read
on public.weigh_ins for select to authenticated
using (exists (select 1 from public.fighters f where f.id = fighter_id and f.profile_id = auth.uid()));

create policy weigh_in_history_organizer_read
on public.weigh_in_history for select to authenticated
using (exists (select 1 from public.weigh_ins wi where wi.id = weigh_in_id and public.can_manage_event(wi.event_id)));

create policy weigh_in_history_organizer_insert
on public.weigh_in_history for insert to authenticated
with check (changed_by = auth.uid() and exists (
  select 1 from public.weigh_ins wi where wi.id = weigh_in_id and public.can_manage_event(wi.event_id)
));

create policy weigh_in_history_fighter_read
on public.weigh_in_history for select to authenticated
using (exists (
  select 1 from public.weigh_ins wi
  join public.fighters f on f.id = wi.fighter_id
  where wi.id = weigh_in_id and f.profile_id = auth.uid()
));

create policy fight_replacements_organizer_manage
on public.fight_replacements for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id) and replaced_by = auth.uid());

create policy fights_public_published_read
on public.fights for select to anon, authenticated
using (exists (
  select 1 from public.events e
  where e.id = event_id and e.visibility = 'public' and e.published_at is not null and e.archived_at is null
));

create policy fight_card_public_published_read
on public.fight_card for select to anon, authenticated
using (exists (
  select 1 from public.events e
  where e.id = event_id and e.visibility = 'public' and e.published_at is not null and e.archived_at is null
));

create policy fights_organizer_manage
on public.fights for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

create policy fight_card_organizer_manage
on public.fight_card for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

create policy staff_assignments_organizer_manage
on public.staff_assignments for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

create policy staff_assignments_self_read
on public.staff_assignments for select to authenticated
using (profile_id = auth.uid());

create policy staff_assignments_self_confirm
on public.staff_assignments for update to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid() and status in ('confirmed','declined'));

create policy staff_checkins_organizer_manage
on public.staff_checkins for all to authenticated
using (exists (
  select 1 from public.staff_assignments sa where sa.id = staff_assignment_id and public.can_manage_event(sa.event_id)
))
with check (exists (
  select 1 from public.staff_assignments sa where sa.id = staff_assignment_id and public.can_manage_event(sa.event_id)
));

create policy staff_checkins_self_read
on public.staff_checkins for select to authenticated
using (exists (select 1 from public.staff_assignments sa where sa.id = staff_assignment_id and sa.profile_id = auth.uid()));

create policy staff_checkins_self_insert
on public.staff_checkins for insert to authenticated
with check (
  recorded_by = auth.uid()
  and action in ('check_in','check_out')
  and exists (select 1 from public.staff_assignments sa where sa.id = staff_assignment_id and sa.profile_id = auth.uid())
);

create policy staff_payments_organizer_manage
on public.staff_payments for all to authenticated
using (exists (
  select 1 from public.staff_assignments sa where sa.id = staff_assignment_id and public.can_manage_event(sa.event_id)
))
with check (exists (
  select 1 from public.staff_assignments sa where sa.id = staff_assignment_id and public.can_manage_event(sa.event_id)
));

create policy staff_payments_self_read
on public.staff_payments for select to authenticated
using (exists (select 1 from public.staff_assignments sa where sa.id = staff_assignment_id and sa.profile_id = auth.uid()));

create policy official_availability_organizer_manage
on public.official_availability for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

create policy official_availability_self_manage
on public.official_availability for all to authenticated
using (official_profile_id = auth.uid())
with check (official_profile_id = auth.uid());

create policy fight_official_assignments_organizer_manage
on public.fight_official_assignments for all to authenticated
using (exists (select 1 from public.fights f where f.id = fight_id and public.can_manage_event(f.event_id)))
with check (exists (select 1 from public.fights f where f.id = fight_id and public.can_manage_event(f.event_id)));

create policy fight_official_assignments_self_read
on public.fight_official_assignments for select to authenticated
using (user_id = auth.uid());

create policy fight_official_assignments_self_confirm
on public.fight_official_assignments for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid() and status in ('confirmed','declined'));

create policy official_payments_organizer_manage
on public.official_payments for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

create policy official_payments_self_read
on public.official_payments for select to authenticated
using (official_profile_id = auth.uid());

create policy event_budgets_organizer_manage
on public.event_budgets for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

create policy event_budget_lines_organizer_manage
on public.event_budget_lines for all to authenticated
using (exists (select 1 from public.event_budgets eb where eb.id = event_budget_id and public.can_manage_event(eb.event_id)))
with check (exists (select 1 from public.event_budgets eb where eb.id = event_budget_id and public.can_manage_event(eb.event_id)));

create policy event_transactions_organizer_manage
on public.event_transactions for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

create policy sponsor_pipeline_organizer_manage
on public.sponsor_pipeline for all to authenticated
using (public.can_manage_organization(organization_id) and (event_id is null or public.can_manage_event(event_id)))
with check (public.can_manage_organization(organization_id) and (event_id is null or public.can_manage_event(event_id)));

create policy event_sponsors_organizer_manage
on public.event_sponsors for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

create policy event_sponsors_sponsor_read
on public.event_sponsors for select to authenticated
using (public.is_sponsor_user(sponsor_id));

create policy sponsor_deliverables_sponsor_read
on public.event_sponsor_deliverables for select to authenticated
using (exists (
  select 1 from public.event_sponsors es
  where es.id = event_sponsor_id and public.is_sponsor_user(es.sponsor_id)
));

drop policy if exists schedule_public_read on public.event_schedule_items;
create policy schedule_public_read
on public.event_schedule_items for select to anon, authenticated
using (public_visible and exists (
  select 1 from public.events e
  where e.id = event_id and e.visibility = 'public' and e.published_at is not null and e.archived_at is null
));

create policy ticket_types_public_published_read
on public.ticket_types for select to anon, authenticated
using (exists (
  select 1 from public.events e
  left join public.event_access_settings eas on eas.event_id = e.id
  where e.id = event_id and e.visibility = 'public' and e.published_at is not null
    and e.archived_at is null and coalesce(eas.ticket_sales_enabled,false)
));

create policy ticket_types_organizer_manage
on public.ticket_types for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

create policy tickets_owner_read
on public.tickets for select to authenticated
using (exists (
  select 1 from public.ticket_sales ts
  where ts.event_id = event_id and ts.buyer_email = (select p.email from public.profiles p where p.id = auth.uid())
));

create policy tickets_organizer_manage
on public.tickets for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

create policy ticket_sales_organizer_manage
on public.ticket_sales for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

create policy access_logs_assigned_staff_insert
on public.event_access_logs for insert to authenticated
with check (operator_profile_id = auth.uid() and public.is_event_staff(event_id));

create policy access_logs_assigned_staff_read
on public.event_access_logs for select to authenticated
using (operator_profile_id = auth.uid() and public.is_event_staff(event_id));

create policy ticket_refunds_organizer_manage
on public.ticket_refunds for all to authenticated
using (exists (
  select 1 from public.ticket_sales ts where ts.id = ticket_sale_id and public.can_manage_event(ts.event_id)
))
with check (exists (
  select 1 from public.ticket_sales ts where ts.id = ticket_sale_id and public.can_manage_event(ts.event_id)
));

create policy organizer_preferences_self_manage
on public.organizer_preferences for all to authenticated
using (profile_id = auth.uid() and public.can_manage_organization(organization_id))
with check (profile_id = auth.uid() and public.can_manage_organization(organization_id));

create policy event_access_settings_public_read
on public.event_access_settings for select to anon, authenticated
using (exists (
  select 1 from public.events e
  where e.id = event_id and e.visibility = 'public' and e.published_at is not null and e.archived_at is null
));

create policy event_access_settings_organizer_manage
on public.event_access_settings for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id) and updated_by = auth.uid());

create policy event_internal_role_grants_organizer_manage
on public.event_internal_role_grants for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id) and granted_by = auth.uid());

create policy event_internal_role_grants_grantee_read
on public.event_internal_role_grants for select to authenticated
using (profile_id = auth.uid());

commit;

-- Rollback (manual): drop every policy above by name. Do not disable RLS while
-- protected data remains. Restore the STAB-003 schedule_public_read policy last.
