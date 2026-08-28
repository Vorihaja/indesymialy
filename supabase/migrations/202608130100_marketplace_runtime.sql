-- Production marketplace runtime: atomic multi-seller checkout and guarded state transitions.
begin;

create table if not exists public.marketplace_order_groups (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete restrict,
  cart_id uuid not null references public.marketplace_carts(id) on delete restrict,
  idempotency_key text not null,
  currency char(3) not null default 'MGA',
  total numeric(14,2) not null default 0 check (total >= 0),
  created_at timestamptz not null default now(),
  unique(customer_id, idempotency_key)
);

alter table public.marketplace_orders
  add column if not exists group_id uuid references public.marketplace_order_groups(id) on delete restrict;
create index if not exists marketplace_orders_group_idx on public.marketplace_orders(group_id);

alter table public.marketplace_payments
  add column if not exists idempotency_key text;
create unique index if not exists marketplace_payments_idempotency_idx
  on public.marketplace_payments(idempotency_key) where idempotency_key is not null;

create or replace function public.marketplace_checkout(
  p_cart_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_fulfillment_method text,
  p_delivery_address text,
  p_payment_method text,
  p_idempotency_key text
) returns table(order_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid := auth.uid();
  v_group_id uuid;
  v_seller_id uuid;
  v_order_id uuid;
  v_subtotal numeric(14,2);
  v_fees numeric(14,2);
  v_total numeric(14,2);
  v_transaction_id uuid;
  v_line record;
  v_stock integer;
begin
  if v_customer_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if nullif(trim(p_idempotency_key), '') is null then raise exception 'Idempotency key required'; end if;
  if p_fulfillment_method not in ('delivery','pickup') then raise exception 'Invalid fulfillment method'; end if;
  if p_payment_method not in ('cash','mobile_money','card','bank_transfer') then raise exception 'Invalid payment method'; end if;
  if p_fulfillment_method = 'delivery' and nullif(trim(p_delivery_address), '') is null then raise exception 'Delivery address required'; end if;

  select id into v_group_id from public.marketplace_order_groups
  where customer_id = v_customer_id and idempotency_key = p_idempotency_key;
  if v_group_id is not null then
    return query select id from public.marketplace_orders where group_id = v_group_id order by created_at;
    return;
  end if;

  perform 1 from public.marketplace_carts
  where id = p_cart_id and customer_id = v_customer_id and status = 'active' for update;
  if not found then raise exception 'Active cart not found'; end if;
  if not exists(select 1 from public.marketplace_cart_items where cart_id = p_cart_id) then raise exception 'Cart is empty'; end if;

  insert into public.marketplace_order_groups(customer_id, cart_id, idempotency_key)
  values(v_customer_id, p_cart_id, p_idempotency_key) returning id into v_group_id;

  for v_seller_id in
    select distinct p.seller_id from public.marketplace_cart_items ci
    join public.products p on p.id = ci.product_id
    join public.marketplace_products mp on mp.product_id = p.id
    where ci.cart_id = p_cart_id and p.seller_id is not null and mp.status = 'published'
  loop
    select coalesce(sum(
      case when ci.mode = 'rental'
        then mp.rental_price_per_day * (ci.rental_end - ci.rental_start + 1) * ci.quantity
        else p.price * ci.quantity end
    ), 0) into v_subtotal
    from public.marketplace_cart_items ci
    join public.products p on p.id = ci.product_id
    join public.marketplace_products mp on mp.product_id = p.id
    where ci.cart_id = p_cart_id and p.seller_id = v_seller_id and mp.status = 'published';

    v_fees := case when p_fulfillment_method = 'delivery' then round(v_subtotal * 0.05, 2) else 0 end;
    v_total := v_subtotal + v_fees;

    insert into public.marketplace_orders(
      group_id, customer_id, seller_organization_id, customer_name, customer_email,
      customer_phone, fulfillment_method, delivery_address, subtotal, fees, total,
      status, payment_status
    ) values (
      v_group_id, v_customer_id, v_seller_id, trim(p_customer_name), lower(trim(p_customer_email)),
      trim(p_customer_phone), p_fulfillment_method, nullif(trim(p_delivery_address), ''),
      v_subtotal, v_fees, v_total, 'pending', 'pending'
    ) returning id into v_order_id;

    for v_line in
      select ci.*, p.name, p.price, mp.rental_price_per_day, mp.deposit_amount
      from public.marketplace_cart_items ci
      join public.products p on p.id = ci.product_id
      join public.marketplace_products mp on mp.product_id = p.id
      where ci.cart_id = p_cart_id and p.seller_id = v_seller_id and mp.status = 'published'
      for update of p, mp
    loop
      update public.marketplace_inventory
      set available = available - v_line.quantity,
          reserved = reserved + v_line.quantity,
          updated_at = now()
      where product_id = v_line.product_id and available >= v_line.quantity
      returning available into v_stock;
      if not found then raise exception 'Insufficient stock for product %', v_line.product_id; end if;

      insert into public.marketplace_order_lines(
        order_id, product_id, product_title, quantity, unit_price, mode,
        rental_start, rental_end, line_total
      ) values (
        v_order_id, v_line.product_id, v_line.name, v_line.quantity,
        case when v_line.mode = 'rental'
          then v_line.rental_price_per_day * (v_line.rental_end - v_line.rental_start + 1)
          else v_line.price end,
        v_line.mode, v_line.rental_start, v_line.rental_end,
        case when v_line.mode = 'rental'
          then v_line.rental_price_per_day * (v_line.rental_end - v_line.rental_start + 1) * v_line.quantity
          else v_line.price * v_line.quantity end
      );

      insert into public.marketplace_stock_movements(product_id, movement_type, quantity, reason, order_id, created_by)
      values(v_line.product_id, 'reserve', v_line.quantity, 'checkout', v_order_id, v_customer_id);
    end loop;

    insert into public.marketplace_order_status_history(order_id, from_status, to_status, changed_by, note)
    values(v_order_id, null, 'pending', v_customer_id, 'Commande créée par checkout atomique');
    insert into public.marketplace_deliveries(order_id, method, address)
    values(v_order_id, p_fulfillment_method, nullif(trim(p_delivery_address), ''));
    insert into public.marketplace_transactions(order_id, customer_id, seller_organization_id, transaction_type, amount, status)
    values(v_order_id, v_customer_id, v_seller_id, 'charge', v_total, 'pending') returning id into v_transaction_id;
    insert into public.marketplace_payments(transaction_id, method, status, idempotency_key)
    values(v_transaction_id, p_payment_method, 'pending', p_idempotency_key || ':' || v_seller_id::text);
    order_id := v_order_id;
    return next;
  end loop;

  if not exists(select 1 from public.marketplace_orders where group_id = v_group_id) then
    raise exception 'Cart contains no purchasable products';
  end if;
  update public.marketplace_order_groups set total = (
    select coalesce(sum(o.total), 0) from public.marketplace_orders o where o.group_id = v_group_id
  ) where id = v_group_id;
  update public.marketplace_carts set status = 'converted', updated_at = now() where id = p_cart_id;
end;
$$;

alter table public.marketplace_order_groups enable row level security;
create policy marketplace_order_groups_owner_read on public.marketplace_order_groups for select to authenticated
using (customer_id = auth.uid());
revoke all on function public.marketplace_checkout(uuid,text,text,text,text,text,text,text) from public;
grant execute on function public.marketplace_checkout(uuid,text,text,text,text,text,text,text) to authenticated;

commit;
