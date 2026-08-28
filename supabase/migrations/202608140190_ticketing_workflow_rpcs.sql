begin;

alter table public.ticket_sales
  drop constraint if exists ticket_sales_ticket_type_id_fkey;
alter table public.ticket_sales
  add constraint ticket_sales_ticket_type_id_fkey
  foreign key (ticket_type_id) references public.ticket_types(id) on delete restrict;

create or replace function public.record_event_ticket_sale(
  p_ticket_type_id uuid,
  p_buyer_name text,
  p_buyer_email text,
  p_buyer_phone text,
  p_quantity integer,
  p_payment_status text default 'paid'
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_type public.ticket_types%rowtype;
  v_sale_id uuid;
  v_committed integer;
  v_unit_price numeric;
begin
  if p_quantity <= 0 then raise exception 'La quantité doit être positive.'; end if;
  if p_payment_status not in ('pending','paid','completed','succeeded') then
    raise exception 'Statut de paiement invalide.';
  end if;

  select * into v_type from public.ticket_types where id = p_ticket_type_id for update;
  if not found or v_type.event_id is null then raise exception 'Type de billet introuvable.'; end if;
  if not public.can_manage_event(v_type.event_id) then raise exception 'Accès refusé.'; end if;
  if v_type.status not in ('active','published') then raise exception 'Ce type de billet n’est pas en vente.'; end if;
  if v_type.sales_start is not null and now() < v_type.sales_start then raise exception 'Les ventes ne sont pas encore ouvertes.'; end if;
  if v_type.sales_end is not null and now() > v_type.sales_end then raise exception 'Les ventes sont clôturées.'; end if;
  if p_quantity > v_type.max_per_order then raise exception 'La quantité dépasse le maximum par commande.'; end if;

  select coalesce(sum(quantity), 0)::integer into v_committed
  from public.ticket_sales
  where ticket_type_id = p_ticket_type_id
    and coalesce(payment_status, 'pending') not in ('failed','cancelled','refunded');
  if v_committed + p_quantity > v_type.total_quantity then raise exception 'Quota de billets insuffisant.'; end if;

  v_unit_price := v_type.price;
  insert into public.ticket_sales(event_id, ticket_type_id, buyer_name, buyer_email, buyer_phone, quantity, total_amount, payment_status, sold_by, sold_at)
  values (v_type.event_id, v_type.id, nullif(btrim(p_buyer_name), ''), nullif(btrim(p_buyer_email), ''), nullif(btrim(p_buyer_phone), ''), p_quantity, v_unit_price * p_quantity, p_payment_status, auth.uid(), now())
  returning id into v_sale_id;

  insert into public.tickets(event_id, buyer_name, ticket_type, price, purchased_at)
  select v_type.event_id, coalesce(nullif(btrim(p_buyer_name), ''), 'Acheteur'), v_type.name, v_unit_price, now()
  from generate_series(1, p_quantity);

  update public.ticket_types
  set sold_quantity = (
    select coalesce(sum(quantity), 0)::integer from public.ticket_sales
    where ticket_type_id = p_ticket_type_id
      and coalesce(payment_status, 'pending') in ('paid','completed','succeeded')
  )
  where id = p_ticket_type_id;

  return v_sale_id;
end;
$$;

create or replace function public.record_event_ticket_access(
  p_ticket_id uuid,
  p_zone text default null,
  p_result text default 'accepted',
  p_manual boolean default false
) returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_event_id uuid;
  v_result text := p_result;
begin
  if p_result not in ('accepted','used','refused','duplicate','exit') then raise exception 'Résultat de contrôle invalide.'; end if;
  select event_id into v_event_id from public.tickets where id = p_ticket_id;
  if v_event_id is null then raise exception 'Billet introuvable.'; end if;
  if not public.can_manage_event(v_event_id) and not public.is_event_staff(v_event_id) then raise exception 'Accès refusé.'; end if;

  if p_result in ('accepted','used') and exists (
    select 1 from public.event_access_logs
    where ticket_id = p_ticket_id and result in ('accepted','used')
  ) then
    v_result := 'duplicate';
  end if;

  insert into public.event_access_logs(event_id, ticket_id, result, operator_profile_id, zone, manual)
  values (v_event_id, p_ticket_id, v_result, auth.uid(), nullif(btrim(p_zone), ''), p_manual);
  return v_result;
end;
$$;

create or replace function public.review_event_ticket_refund(
  p_refund_id uuid,
  p_status text,
  p_processed_amount numeric default null,
  p_external_reference text default null
) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_refund public.ticket_refunds%rowtype;
  v_sale public.ticket_sales%rowtype;
begin
  if p_status not in ('approved','rejected','processed','failed') then raise exception 'Statut de remboursement invalide.'; end if;
  select * into v_refund from public.ticket_refunds where id = p_refund_id for update;
  if not found then raise exception 'Demande de remboursement introuvable.'; end if;
  select * into v_sale from public.ticket_sales where id = v_refund.ticket_sale_id;
  if not found or not public.can_manage_event(v_sale.event_id) then raise exception 'Accès refusé.'; end if;
  if v_refund.status = 'processed' then raise exception 'Ce remboursement est déjà traité.'; end if;
  if p_status = 'processed' and coalesce(p_processed_amount, v_refund.amount) > v_refund.amount then
    raise exception 'Le montant traité dépasse le montant demandé.';
  end if;

  update public.ticket_refunds set
    status = p_status,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    processed_by = case when p_status = 'processed' then auth.uid() else processed_by end,
    processed_at = case when p_status = 'processed' then now() else processed_at end,
    processed_amount = case when p_status = 'processed' then coalesce(p_processed_amount, amount) else processed_amount end,
    external_reference = coalesce(nullif(btrim(p_external_reference), ''), external_reference)
  where id = p_refund_id;

  if p_status = 'processed' and coalesce(p_processed_amount, v_refund.amount) >= coalesce(v_sale.total_amount, 0) then
    update public.ticket_sales set payment_status = 'refunded' where id = v_sale.id;
    update public.ticket_types set sold_quantity = greatest(coalesce(sold_quantity, 0) - coalesce(v_sale.quantity, 0), 0)
    where id = v_sale.ticket_type_id;
  end if;
end;
$$;

grant execute on function public.record_event_ticket_sale(uuid,text,text,text,integer,text) to authenticated;
grant execute on function public.record_event_ticket_access(uuid,text,text,boolean) to authenticated;
grant execute on function public.review_event_ticket_refund(uuid,text,numeric,text) to authenticated;

commit;
