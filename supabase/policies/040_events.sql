-- Event policies. Ownership follows events.organizer_id -> organizations.id.

create policy competitions_public_read on public.competitions for select to anon, authenticated
using (status='published' and exists (select 1 from public.events e where e.id=event_id and e.status='published'));
create policy competitions_organizer_manage on public.competitions for all to authenticated
using (exists (select 1 from public.events e join public.organizations o on o.id=e.organizer_id where e.id=event_id and (o.owner_id=auth.uid() or exists (select 1 from public.organization_members om where om.organization_id=o.id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','organizer') and coalesce(om.status,'active')='active'))))
with check (exists (select 1 from public.events e join public.organizations o on o.id=e.organizer_id where e.id=event_id and (o.owner_id=auth.uid() or exists (select 1 from public.organization_members om where om.organization_id=o.id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','organizer') and coalesce(om.status,'active')='active'))));

create policy competition_categories_public_read on public.competition_categories for select to anon, authenticated
using (exists (select 1 from public.competitions c join public.events e on e.id=c.event_id where c.id=competition_id and c.status='published' and e.status='published'));
create policy competition_categories_organizer_manage on public.competition_categories for all to authenticated
using (exists (select 1 from public.competitions c join public.events e on e.id=c.event_id join public.organizations o on o.id=e.organizer_id where c.id=competition_id and (o.owner_id=auth.uid() or exists (select 1 from public.organization_members om where om.organization_id=o.id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','organizer') and coalesce(om.status,'active')='active'))))
with check (exists (select 1 from public.competitions c join public.events e on e.id=c.event_id join public.organizations o on o.id=e.organizer_id where c.id=competition_id and (o.owner_id=auth.uid() or exists (select 1 from public.organization_members om where om.organization_id=o.id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','organizer') and coalesce(om.status,'active')='active'))));

create policy event_registrations_applicant_read on public.event_registrations for select to authenticated
using (applicant_profile_id=auth.uid() or exists (select 1 from public.organizations o where o.id=applicant_organization_id and o.owner_id=auth.uid()) or exists (select 1 from public.organization_members om where om.organization_id=applicant_organization_id and om.profile_id=auth.uid() and coalesce(om.status,'active')='active'));
create policy event_registrations_applicant_create on public.event_registrations for insert to authenticated
with check ((applicant_profile_id=auth.uid() or exists (select 1 from public.organizations o where o.id=applicant_organization_id and o.owner_id=auth.uid()) or exists (select 1 from public.organization_members om where om.organization_id=applicant_organization_id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager') and coalesce(om.status,'active')='active')) and status='pending');
create policy event_registrations_organizer_manage on public.event_registrations for all to authenticated
using (exists (select 1 from public.events e join public.organizations o on o.id=e.organizer_id where e.id=event_id and (o.owner_id=auth.uid() or exists (select 1 from public.organization_members om where om.organization_id=o.id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','organizer') and coalesce(om.status,'active')='active'))))
with check (exists (select 1 from public.events e join public.organizations o on o.id=e.organizer_id where e.id=event_id and (o.owner_id=auth.uid() or exists (select 1 from public.organization_members om where om.organization_id=o.id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','organizer') and coalesce(om.status,'active')='active'))));

create policy registration_history_parties_read on public.event_registration_history for select to authenticated
using (exists (select 1 from public.event_registrations r left join public.events e on e.id=r.event_id left join public.organizations organizer on organizer.id=e.organizer_id where r.id=registration_id and (r.applicant_profile_id=auth.uid() or organizer.owner_id=auth.uid() or exists (select 1 from public.organization_members om where om.organization_id in (r.applicant_organization_id,e.organizer_id) and om.profile_id=auth.uid() and coalesce(om.status,'active')='active'))));
create policy registration_history_actor_insert on public.event_registration_history for insert to authenticated
with check (changed_by=auth.uid() and exists (select 1 from public.event_registrations r left join public.events e on e.id=r.event_id left join public.organizations organizer on organizer.id=e.organizer_id where r.id=registration_id and (r.applicant_profile_id=auth.uid() or organizer.owner_id=auth.uid() or exists (select 1 from public.organization_members om where om.organization_id in (r.applicant_organization_id,e.organizer_id) and om.profile_id=auth.uid() and coalesce(om.status,'active')='active'))));

create policy event_participants_public_read on public.event_participants for select to anon, authenticated
using (public_visible and exists (select 1 from public.events e where e.id=event_participants.event_id and e.visibility='public' and e.published_at is not null and e.archived_at is null));
create policy event_participants_self_read on public.event_participants for select to authenticated
using (event_participants.profile_id=auth.uid() or exists (select 1 from public.organizations o where o.id=event_participants.organization_id and o.owner_id=auth.uid()) or exists (select 1 from public.organization_members om where om.organization_id=event_participants.organization_id and om.profile_id=auth.uid() and coalesce(om.status,'active')='active'));
create policy event_participants_organizer_manage on public.event_participants for all to authenticated
using (exists (select 1 from public.events e join public.organizations o on o.id=e.organizer_id where e.id=event_id and (o.owner_id=auth.uid() or exists (select 1 from public.organization_members om where om.organization_id=o.id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','organizer') and coalesce(om.status,'active')='active'))))
with check (exists (select 1 from public.events e join public.organizations o on o.id=e.organizer_id where e.id=event_id and (o.owner_id=auth.uid() or exists (select 1 from public.organization_members om where om.organization_id=o.id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','organizer') and coalesce(om.status,'active')='active'))));

create policy schedule_public_read on public.event_schedule_items for select to anon, authenticated
using (public_visible and exists (select 1 from public.events e where e.id=event_id and e.status='published'));
create policy schedule_organizer_manage on public.event_schedule_items for all to authenticated
using (exists (select 1 from public.events e join public.organizations o on o.id=e.organizer_id where e.id=event_id and (o.owner_id=auth.uid() or exists (select 1 from public.organization_members om where om.organization_id=o.id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','organizer') and coalesce(om.status,'active')='active'))))
with check (exists (select 1 from public.events e join public.organizations o on o.id=e.organizer_id where e.id=event_id and (o.owner_id=auth.uid() or exists (select 1 from public.organization_members om where om.organization_id=o.id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','organizer') and coalesce(om.status,'active')='active'))));

create policy access_logs_organizer_staff on public.event_access_logs for all to authenticated
using (exists (select 1 from public.events e join public.organizations o on o.id=e.organizer_id where e.id=event_id and (o.owner_id=auth.uid() or exists (select 1 from public.organization_members om where om.organization_id=o.id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','organizer') and coalesce(om.status,'active')='active') or exists (select 1 from public.event_participants ep where ep.event_id=e.id and ep.profile_id=auth.uid() and ep.participant_type='staff' and ep.status in ('confirmed','checked_in')))))
with check (operator_profile_id=auth.uid() and exists (select 1 from public.events e join public.organizations o on o.id=e.organizer_id where e.id=event_id and (o.owner_id=auth.uid() or exists (select 1 from public.organization_members om where om.organization_id=o.id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','organizer') and coalesce(om.status,'active')='active') or exists (select 1 from public.event_participants ep where ep.event_id=e.id and ep.profile_id=auth.uid() and ep.participant_type='staff' and ep.status in ('confirmed','checked_in')))));

create policy event_reports_organizer_manage on public.event_reports for all to authenticated
using (exists (select 1 from public.events e join public.organizations o on o.id=e.organizer_id where e.id=event_id and (o.owner_id=auth.uid() or exists (select 1 from public.organization_members om where om.organization_id=o.id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','organizer') and coalesce(om.status,'active')='active'))))
with check (created_by=auth.uid() and exists (select 1 from public.events e join public.organizations o on o.id=e.organizer_id where e.id=event_id and (o.owner_id=auth.uid() or exists (select 1 from public.organization_members om where om.organization_id=o.id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','organizer') and coalesce(om.status,'active')='active'))));
create policy report_exports_organizer_manage on public.event_report_exports for all to authenticated
using (exists (select 1 from public.event_reports r join public.events e on e.id=r.event_id join public.organizations o on o.id=e.organizer_id where r.id=report_id and (o.owner_id=auth.uid() or exists (select 1 from public.organization_members om where om.organization_id=o.id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','organizer') and coalesce(om.status,'active')='active'))))
with check (generated_by=auth.uid() and exists (select 1 from public.event_reports r join public.events e on e.id=r.event_id join public.organizations o on o.id=e.organizer_id where r.id=report_id and (o.owner_id=auth.uid() or exists (select 1 from public.organization_members om where om.organization_id=o.id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','organizer') and coalesce(om.status,'active')='active'))));

create policy sponsor_deliverables_event_parties on public.event_sponsor_deliverables for all to authenticated
using (exists (select 1 from public.event_sponsors es join public.events e on e.id=es.event_id join public.organizations o on o.id=e.organizer_id where es.id=event_sponsor_id and (o.owner_id=auth.uid() or exists (select 1 from public.organization_members om where om.organization_id=o.id and om.profile_id=auth.uid() and coalesce(om.status,'active')='active'))))
with check (exists (select 1 from public.event_sponsors es join public.events e on e.id=es.event_id join public.organizations o on o.id=e.organizer_id where es.id=event_sponsor_id and (o.owner_id=auth.uid() or exists (select 1 from public.organization_members om where om.organization_id=o.id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','organizer') and coalesce(om.status,'active')='active'))));

create policy checklist_comments_event_members on public.event_checklist_comments for select to authenticated
using (exists (select 1 from public.event_checklists ec join public.events e on e.id=ec.event_id join public.organizations o on o.id=e.organizer_id where ec.id=checklist_id and (o.owner_id=auth.uid() or exists (select 1 from public.organization_members om where om.organization_id=o.id and om.profile_id=auth.uid() and coalesce(om.status,'active')='active'))));
create policy checklist_comments_author_insert on public.event_checklist_comments for insert to authenticated
with check (author_profile_id=auth.uid() and exists (select 1 from public.event_checklists ec join public.events e on e.id=ec.event_id join public.organizations o on o.id=e.organizer_id where ec.id=checklist_id and (o.owner_id=auth.uid() or exists (select 1 from public.organization_members om where om.organization_id=o.id and om.profile_id=auth.uid() and coalesce(om.status,'active')='active'))));
create policy checklist_comments_author_delete on public.event_checklist_comments for update to authenticated
using (author_profile_id=auth.uid()) with check (author_profile_id=auth.uid() and deleted_at is not null);

create policy ticket_reservations_customer_read on public.ticket_reservations for select to authenticated
using (customer_profile_id=auth.uid());
create policy ticket_reservations_customer_create on public.ticket_reservations for insert to authenticated
with check (customer_profile_id=auth.uid() and status='held');
create policy ticket_reservations_organizer_manage on public.ticket_reservations for all to authenticated
using (exists (select 1 from public.ticket_types tt join public.events e on e.id=tt.event_id join public.organizations o on o.id=e.organizer_id where tt.id=ticket_type_id and (o.owner_id=auth.uid() or exists (select 1 from public.organization_members om where om.organization_id=o.id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','organizer') and coalesce(om.status,'active')='active'))))
with check (exists (select 1 from public.ticket_types tt join public.events e on e.id=tt.event_id join public.organizations o on o.id=e.organizer_id where tt.id=ticket_type_id and (o.owner_id=auth.uid() or exists (select 1 from public.organization_members om where om.organization_id=o.id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','organizer') and coalesce(om.status,'active')='active'))));

create policy ticket_refunds_requester_read on public.ticket_refunds for select to authenticated
using (requested_by=auth.uid());
create policy ticket_refunds_requester_create on public.ticket_refunds for insert to authenticated
with check (requested_by=auth.uid() and status='requested');
create policy ticket_refunds_admin_manage on public.ticket_refunds for all to authenticated
using (exists (select 1 from public.profile_system_roles psr join public.system_roles sr on sr.id=psr.system_role_id where psr.profile_id=auth.uid() and sr.code in ('admin','super_admin')))
with check (exists (select 1 from public.profile_system_roles psr join public.system_roles sr on sr.id=psr.system_role_id where psr.profile_id=auth.uid() and sr.code in ('admin','super_admin')));
