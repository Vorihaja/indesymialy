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
