-- Identity policies. Apply after 202608050010_identity.sql.

create policy role_requests_owner_read on public.role_requests for select to authenticated
using (profile_id = auth.uid());
create policy role_requests_owner_create on public.role_requests for insert to authenticated
with check (profile_id = auth.uid() and status = 'pending' and decided_by is null);
create policy role_requests_owner_withdraw on public.role_requests for update to authenticated
using (profile_id = auth.uid() and status = 'pending')
with check (profile_id = auth.uid() and status = 'withdrawn');
create policy role_requests_admin_manage on public.role_requests for all to authenticated
using (exists (select 1 from public.profile_system_roles psr join public.system_roles sr on sr.id=psr.system_role_id where psr.profile_id=auth.uid() and sr.code in ('admin','super_admin')))
with check (exists (select 1 from public.profile_system_roles psr join public.system_roles sr on sr.id=psr.system_role_id where psr.profile_id=auth.uid() and sr.code in ('admin','super_admin')));

create policy role_request_documents_owner_read on public.role_request_documents for select to authenticated
using (exists (select 1 from public.role_requests rr where rr.id=role_request_id and rr.profile_id=auth.uid()));
create policy role_request_documents_owner_insert on public.role_request_documents for insert to authenticated
with check (uploaded_by=auth.uid() and exists (select 1 from public.role_requests rr where rr.id=role_request_id and rr.profile_id=auth.uid() and rr.status='pending'));
create policy role_request_documents_owner_delete on public.role_request_documents for delete to authenticated
using (uploaded_by=auth.uid() and exists (select 1 from public.role_requests rr where rr.id=role_request_id and rr.status='pending'));
create policy role_request_documents_admin_read on public.role_request_documents for select to authenticated
using (exists (select 1 from public.profile_system_roles psr join public.system_roles sr on sr.id=psr.system_role_id where psr.profile_id=auth.uid() and sr.code in ('admin','super_admin')));

create policy role_request_history_owner_read on public.role_request_history for select to authenticated
using (exists (select 1 from public.role_requests rr where rr.id=role_request_id and rr.profile_id=auth.uid()));
create policy role_request_history_admin_manage on public.role_request_history for all to authenticated
using (exists (select 1 from public.profile_system_roles psr join public.system_roles sr on sr.id=psr.system_role_id where psr.profile_id=auth.uid() and sr.code in ('admin','super_admin')))
with check (changed_by=auth.uid() and exists (select 1 from public.profile_system_roles psr join public.system_roles sr on sr.id=psr.system_role_id where psr.profile_id=auth.uid() and sr.code in ('admin','super_admin')));

create policy onboarding_progress_owner on public.onboarding_progress for all to authenticated
using (profile_id=auth.uid()) with check (profile_id=auth.uid());
create policy account_preferences_owner on public.account_preferences for all to authenticated
using (profile_id=auth.uid()) with check (profile_id=auth.uid());
create policy active_organizations_owner on public.active_organizations for all to authenticated
using (profile_id=auth.uid()) with check (profile_id=auth.uid());

create policy organization_invitations_invitee_read on public.organization_invitations for select to authenticated
using (invited_profile_id=auth.uid());
create policy organization_invitations_invitee_update on public.organization_invitations for update to authenticated
using (invited_profile_id=auth.uid() and status='pending')
with check (invited_profile_id=auth.uid() and status in ('accepted','declined'));
create policy organization_invitations_manager on public.organization_invitations for all to authenticated
using (exists (select 1 from public.organizations o where o.id=organization_id and o.owner_id=auth.uid()) or exists (select 1 from public.organization_members om where om.organization_id=organization_id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager') and coalesce(om.status,'active')='active'))
with check (invited_by=auth.uid() and (exists (select 1 from public.organizations o where o.id=organization_id and o.owner_id=auth.uid()) or exists (select 1 from public.organization_members om where om.organization_id=organization_id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager') and coalesce(om.status,'active')='active')));

create policy organization_internal_roles_member_read on public.organization_internal_roles for select to authenticated
using (exists (select 1 from public.organizations o where o.id=organization_id and o.owner_id=auth.uid()) or exists (select 1 from public.organization_members om where om.organization_id=organization_id and om.profile_id=auth.uid() and coalesce(om.status,'active')='active'));
create policy organization_internal_roles_manager_write on public.organization_internal_roles for all to authenticated
using (exists (select 1 from public.organizations o where o.id=organization_id and o.owner_id=auth.uid()) or exists (select 1 from public.organization_members om where om.organization_id=organization_id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager') and coalesce(om.status,'active')='active'))
with check (created_by=auth.uid() and (exists (select 1 from public.organizations o where o.id=organization_id and o.owner_id=auth.uid()) or exists (select 1 from public.organization_members om where om.organization_id=organization_id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager') and coalesce(om.status,'active')='active')));

create policy organization_role_assignments_member_read on public.organization_internal_role_assignments for select to authenticated
using (profile_id=auth.uid() or exists (select 1 from public.organizations o where o.id=organization_id and o.owner_id=auth.uid()) or exists (select 1 from public.organization_members om where om.organization_id=organization_id and om.profile_id=auth.uid() and coalesce(om.status,'active')='active'));
create policy organization_role_assignments_manager_write on public.organization_internal_role_assignments for all to authenticated
using (exists (select 1 from public.organizations o where o.id=organization_id and o.owner_id=auth.uid()) or exists (select 1 from public.organization_members om where om.organization_id=organization_id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager') and coalesce(om.status,'active')='active'))
with check (assigned_by=auth.uid() and (exists (select 1 from public.organizations o where o.id=organization_id and o.owner_id=auth.uid()) or exists (select 1 from public.organization_members om where om.organization_id=organization_id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager') and coalesce(om.status,'active')='active')));
