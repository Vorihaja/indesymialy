-- Consolidated RLS policies deployed through the migration history.
-- Sources remain in supabase/policies for domain-level maintenance.

-- BEGIN 000_shared.sql
-- Apply after migrations. No unconditional policy is used.

create policy platform_reference_values_public_read
on public.platform_reference_values for select
to anon, authenticated
using (is_active = true);

create policy platform_reference_values_admin_write
on public.platform_reference_values for all
to authenticated
using (exists (
  select 1 from public.profile_system_roles psr
  join public.system_roles sr on sr.id = psr.system_role_id
  where psr.profile_id = auth.uid() and sr.code in ('admin','super_admin')
))
with check (exists (
  select 1 from public.profile_system_roles psr
  join public.system_roles sr on sr.id = psr.system_role_id
  where psr.profile_id = auth.uid() and sr.code in ('admin','super_admin')
));


-- END 000_shared.sql

-- BEGIN 010_identity.sql
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


-- END 010_identity.sql

-- BEGIN 020_communication.sql
-- Communication policies. Participant checks always use conversation_participants.

create policy conversation_preferences_owner_read on public.conversation_user_preferences for select to authenticated
using (profile_id=auth.uid() and exists (select 1 from public.conversation_participants cp where cp.conversation_id=conversation_id and cp.profile_id=auth.uid() and cp.left_at is null));
create policy conversation_preferences_owner_write on public.conversation_user_preferences for all to authenticated
using (profile_id=auth.uid())
with check (profile_id=auth.uid() and exists (select 1 from public.conversation_participants cp where cp.conversation_id=conversation_id and cp.profile_id=auth.uid() and cp.left_at is null));

create policy communication_blocks_owner on public.communication_blocks for all to authenticated
using (blocker_profile_id=auth.uid()) with check (blocker_profile_id=auth.uid());

create policy delivery_receipts_participant_read on public.message_delivery_receipts for select to authenticated
using (exists (select 1 from public.messages m join public.conversation_participants cp on cp.conversation_id=m.conversation_id where m.id=message_id and cp.profile_id=auth.uid() and cp.left_at is null));
create policy delivery_receipts_owner_write on public.message_delivery_receipts for insert to authenticated
with check (profile_id=auth.uid() and exists (select 1 from public.messages m join public.conversation_participants cp on cp.conversation_id=m.conversation_id where m.id=message_id and cp.profile_id=auth.uid() and cp.left_at is null));

create policy notification_preferences_owner on public.notification_preferences for all to authenticated
using (profile_id=auth.uid()) with check (profile_id=auth.uid());

create policy fight_proposal_history_participant_read on public.fight_proposal_history for select to authenticated
using (exists (select 1 from public.fight_proposals fp join public.messages m on m.id=fp.message_id join public.conversation_participants cp on cp.conversation_id=m.conversation_id where fp.id=fight_proposal_id and cp.profile_id=auth.uid() and cp.left_at is null));
create policy fight_proposal_history_actor_insert on public.fight_proposal_history for insert to authenticated
with check (changed_by=auth.uid() and exists (select 1 from public.fight_proposals fp join public.messages m on m.id=fp.message_id join public.conversation_participants cp on cp.conversation_id=m.conversation_id where fp.id=fight_proposal_id and cp.profile_id=auth.uid() and cp.left_at is null));

create policy sponsor_offer_history_participant_read on public.sponsor_offer_history for select to authenticated
using (exists (select 1 from public.sponsor_offers so join public.messages m on m.id=so.message_id join public.conversation_participants cp on cp.conversation_id=m.conversation_id where so.id=sponsor_offer_id and cp.profile_id=auth.uid() and cp.left_at is null));
create policy sponsor_offer_history_actor_insert on public.sponsor_offer_history for insert to authenticated
with check (changed_by=auth.uid() and exists (select 1 from public.sponsor_offers so join public.messages m on m.id=so.message_id join public.conversation_participants cp on cp.conversation_id=m.conversation_id where so.id=sponsor_offer_id and cp.profile_id=auth.uid() and cp.left_at is null));

-- END 020_communication.sql

-- BEGIN 030_marketplace.sql
-- Marketplace policies. Seller identity is organization membership because products.seller_id -> organizations.id.

create policy marketplace_categories_public_read on public.marketplace_categories for select to anon, authenticated
using (is_active=true);
create policy marketplace_categories_admin_write on public.marketplace_categories for all to authenticated
using (exists (select 1 from public.profile_system_roles psr join public.system_roles sr on sr.id=psr.system_role_id where psr.profile_id=auth.uid() and sr.code in ('admin','super_admin')))
with check (exists (select 1 from public.profile_system_roles psr join public.system_roles sr on sr.id=psr.system_role_id where psr.profile_id=auth.uid() and sr.code in ('admin','super_admin')));

create policy marketplace_products_public_read on public.marketplace_products for select to anon, authenticated
using (status='published');
create policy marketplace_products_seller_manage on public.marketplace_products for all to authenticated
using (exists (select 1 from public.products p join public.organization_members om on om.organization_id=p.seller_id where p.id=product_id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','seller') and coalesce(om.status,'active')='active') or exists (select 1 from public.products p join public.organizations o on o.id=p.seller_id where p.id=product_id and o.owner_id=auth.uid()))
with check (exists (select 1 from public.products p join public.organization_members om on om.organization_id=p.seller_id where p.id=product_id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','seller') and coalesce(om.status,'active')='active') or exists (select 1 from public.products p join public.organizations o on o.id=p.seller_id where p.id=product_id and o.owner_id=auth.uid()));

create policy marketplace_images_public_read on public.marketplace_product_images for select to anon, authenticated
using (exists (select 1 from public.marketplace_products mp where mp.product_id=product_id and mp.status='published'));
create policy marketplace_images_seller_manage on public.marketplace_product_images for all to authenticated
using (exists (select 1 from public.products p left join public.organizations o on o.id=p.seller_id left join public.organization_members om on om.organization_id=p.seller_id and om.profile_id=auth.uid() where p.id=product_id and (o.owner_id=auth.uid() or (om.profile_id=auth.uid() and om.role in ('owner','admin','manager','seller') and coalesce(om.status,'active')='active'))))
with check (exists (select 1 from public.products p left join public.organizations o on o.id=p.seller_id left join public.organization_members om on om.organization_id=p.seller_id and om.profile_id=auth.uid() where p.id=product_id and (o.owner_id=auth.uid() or (om.profile_id=auth.uid() and om.role in ('owner','admin','manager','seller') and coalesce(om.status,'active')='active'))));

create policy marketplace_favorites_owner on public.marketplace_favorites for all to authenticated
using (profile_id=auth.uid()) with check (profile_id=auth.uid());
create policy marketplace_carts_owner on public.marketplace_carts for all to authenticated
using (customer_id=auth.uid()) with check (customer_id=auth.uid());
create policy marketplace_cart_items_owner on public.marketplace_cart_items for all to authenticated
using (exists (select 1 from public.marketplace_carts c where c.id=cart_id and c.customer_id=auth.uid()))
with check (exists (select 1 from public.marketplace_carts c where c.id=cart_id and c.customer_id=auth.uid() and c.status='active'));

create policy marketplace_orders_customer_read on public.marketplace_orders for select to authenticated
using (customer_id=auth.uid());
create policy marketplace_orders_customer_create on public.marketplace_orders for insert to authenticated
with check (customer_id=auth.uid() and status in ('draft','pending'));
create policy marketplace_orders_seller_read on public.marketplace_orders for select to authenticated
using (exists (select 1 from public.organizations o where o.id=seller_organization_id and o.owner_id=auth.uid()) or exists (select 1 from public.organization_members om where om.organization_id=seller_organization_id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','seller') and coalesce(om.status,'active')='active'));
create policy marketplace_orders_seller_update on public.marketplace_orders for update to authenticated
using (exists (select 1 from public.organizations o where o.id=seller_organization_id and o.owner_id=auth.uid()) or exists (select 1 from public.organization_members om where om.organization_id=seller_organization_id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','seller') and coalesce(om.status,'active')='active'))
with check (exists (select 1 from public.organizations o where o.id=seller_organization_id and o.owner_id=auth.uid()) or exists (select 1 from public.organization_members om where om.organization_id=seller_organization_id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','seller') and coalesce(om.status,'active')='active'));

create policy marketplace_order_lines_parties_read on public.marketplace_order_lines for select to authenticated
using (exists (select 1 from public.marketplace_orders o where o.id=order_id and (o.customer_id=auth.uid() or exists (select 1 from public.organizations org where org.id=o.seller_organization_id and org.owner_id=auth.uid()) or exists (select 1 from public.organization_members om where om.organization_id=o.seller_organization_id and om.profile_id=auth.uid() and coalesce(om.status,'active')='active'))));
create policy marketplace_order_lines_customer_insert on public.marketplace_order_lines for insert to authenticated
with check (exists (select 1 from public.marketplace_orders o where o.id=order_id and o.customer_id=auth.uid() and o.status='draft'));

create policy marketplace_order_history_parties_read on public.marketplace_order_status_history for select to authenticated
using (exists (select 1 from public.marketplace_orders o where o.id=order_id and (o.customer_id=auth.uid() or exists (select 1 from public.organizations org where org.id=o.seller_organization_id and org.owner_id=auth.uid()) or exists (select 1 from public.organization_members om where om.organization_id=o.seller_organization_id and om.profile_id=auth.uid() and coalesce(om.status,'active')='active'))));
create policy marketplace_order_history_actor_insert on public.marketplace_order_status_history for insert to authenticated
with check (changed_by=auth.uid() and exists (select 1 from public.marketplace_orders o where o.id=order_id and (o.customer_id=auth.uid() or exists (select 1 from public.organizations org where org.id=o.seller_organization_id and org.owner_id=auth.uid()) or exists (select 1 from public.organization_members om where om.organization_id=o.seller_organization_id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','seller') and coalesce(om.status,'active')='active'))));

create policy marketplace_rentals_parties_read on public.marketplace_rentals for select to authenticated
using (exists (select 1 from public.marketplace_order_lines ol join public.marketplace_orders o on o.id=ol.order_id where ol.id=order_line_id and (o.customer_id=auth.uid() or exists (select 1 from public.organization_members om where om.organization_id=o.seller_organization_id and om.profile_id=auth.uid() and coalesce(om.status,'active')='active') or exists (select 1 from public.organizations org where org.id=o.seller_organization_id and org.owner_id=auth.uid()))));
create policy marketplace_rentals_seller_manage on public.marketplace_rentals for all to authenticated
using (exists (select 1 from public.marketplace_order_lines ol join public.marketplace_orders o on o.id=ol.order_id where ol.id=order_line_id and (exists (select 1 from public.organizations org where org.id=o.seller_organization_id and org.owner_id=auth.uid()) or exists (select 1 from public.organization_members om where om.organization_id=o.seller_organization_id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','seller') and coalesce(om.status,'active')='active'))))
with check (exists (select 1 from public.marketplace_order_lines ol join public.marketplace_orders o on o.id=ol.order_id where ol.id=order_line_id and (exists (select 1 from public.organizations org where org.id=o.seller_organization_id and org.owner_id=auth.uid()) or exists (select 1 from public.organization_members om where om.organization_id=o.seller_organization_id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','seller') and coalesce(om.status,'active')='active'))));

create policy marketplace_inventory_public_read on public.marketplace_inventory for select to anon, authenticated
using (exists (select 1 from public.marketplace_products mp where mp.product_id=product_id and mp.status='published'));
create policy marketplace_inventory_seller_manage on public.marketplace_inventory for all to authenticated
using (exists (select 1 from public.products p left join public.organizations o on o.id=p.seller_id left join public.organization_members om on om.organization_id=p.seller_id and om.profile_id=auth.uid() where p.id=product_id and (o.owner_id=auth.uid() or (om.profile_id=auth.uid() and om.role in ('owner','admin','manager','seller') and coalesce(om.status,'active')='active'))))
with check (exists (select 1 from public.products p left join public.organizations o on o.id=p.seller_id left join public.organization_members om on om.organization_id=p.seller_id and om.profile_id=auth.uid() where p.id=product_id and (o.owner_id=auth.uid() or (om.profile_id=auth.uid() and om.role in ('owner','admin','manager','seller') and coalesce(om.status,'active')='active'))));

create policy marketplace_movements_seller_read on public.marketplace_stock_movements for select to authenticated
using (exists (select 1 from public.products p left join public.organizations o on o.id=p.seller_id left join public.organization_members om on om.organization_id=p.seller_id and om.profile_id=auth.uid() where p.id=product_id and (o.owner_id=auth.uid() or om.profile_id=auth.uid())));
create policy marketplace_movements_seller_insert on public.marketplace_stock_movements for insert to authenticated
with check (created_by=auth.uid() and exists (select 1 from public.products p left join public.organizations o on o.id=p.seller_id left join public.organization_members om on om.organization_id=p.seller_id and om.profile_id=auth.uid() where p.id=product_id and (o.owner_id=auth.uid() or (om.profile_id=auth.uid() and om.role in ('owner','admin','manager','seller') and coalesce(om.status,'active')='active'))));

create policy marketplace_deliveries_parties_read on public.marketplace_deliveries for select to authenticated
using (exists (select 1 from public.marketplace_orders o where o.id=order_id and (o.customer_id=auth.uid() or exists (select 1 from public.organizations org where org.id=o.seller_organization_id and org.owner_id=auth.uid()) or exists (select 1 from public.organization_members om where om.organization_id=o.seller_organization_id and om.profile_id=auth.uid() and coalesce(om.status,'active')='active'))));
create policy marketplace_deliveries_seller_manage on public.marketplace_deliveries for all to authenticated
using (exists (select 1 from public.marketplace_orders o where o.id=order_id and (exists (select 1 from public.organizations org where org.id=o.seller_organization_id and org.owner_id=auth.uid()) or exists (select 1 from public.organization_members om where om.organization_id=o.seller_organization_id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','seller') and coalesce(om.status,'active')='active'))))
with check (exists (select 1 from public.marketplace_orders o where o.id=order_id and (exists (select 1 from public.organizations org where org.id=o.seller_organization_id and org.owner_id=auth.uid()) or exists (select 1 from public.organization_members om where om.organization_id=o.seller_organization_id and om.profile_id=auth.uid() and om.role in ('owner','admin','manager','seller') and coalesce(om.status,'active')='active'))));

create policy marketplace_transactions_parties_read on public.marketplace_transactions for select to authenticated
using (customer_id=auth.uid() or exists (select 1 from public.organizations o where o.id=seller_organization_id and o.owner_id=auth.uid()) or exists (select 1 from public.organization_members om where om.organization_id=seller_organization_id and om.profile_id=auth.uid() and coalesce(om.status,'active')='active'));
create policy marketplace_transactions_customer_create on public.marketplace_transactions for insert to authenticated
with check (customer_id=auth.uid() and exists (select 1 from public.marketplace_orders o where o.id=order_id and o.customer_id=auth.uid()));

create policy marketplace_payments_parties_read on public.marketplace_payments for select to authenticated
using (exists (select 1 from public.marketplace_transactions t where t.id=transaction_id and (t.customer_id=auth.uid() or exists (select 1 from public.organizations o where o.id=t.seller_organization_id and o.owner_id=auth.uid()) or exists (select 1 from public.organization_members om where om.organization_id=t.seller_organization_id and om.profile_id=auth.uid() and coalesce(om.status,'active')='active'))));
create policy marketplace_payments_customer_create on public.marketplace_payments for insert to authenticated
with check (exists (select 1 from public.marketplace_transactions t where t.id=transaction_id and t.customer_id=auth.uid()));

-- END 030_marketplace.sql

-- BEGIN 040_events.sql
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
using (public_visible and exists (select 1 from public.events e where e.id=event_id and e.status='published'));
create policy event_participants_self_read on public.event_participants for select to authenticated
using (profile_id=auth.uid() or exists (select 1 from public.organization_members om where om.organization_id=organization_id and om.profile_id=auth.uid() and coalesce(om.status,'active')='active'));
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


-- END 040_events.sql

-- BEGIN 050_fight_live.sql
-- No new fight_* table is introduced by STAB-003.
-- RPC execution is restricted here as an additional deployment check.
revoke all on function public.sync_timer_to_timeline(uuid) from public, anon;
revoke all on function public.update_fight_statistics(uuid) from public, anon;
revoke all on function public.update_fighter_career_stats(uuid) from public, anon;
grant execute on function public.sync_timer_to_timeline(uuid) to authenticated;
grant execute on function public.update_fight_statistics(uuid) to authenticated;
grant execute on function public.update_fighter_career_stats(uuid) to authenticated;

-- Existing Fight Live table policies must be audited on the target branch before deployment.
-- This blueprint deliberately does not drop or replace remote policies.

-- END 050_fight_live.sql

-- BEGIN 060_organizer_operations.sql
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

-- END 060_organizer_operations.sql
