-- ==========================================================
-- INDESY MIALY / INDESY BAZAR
-- BAZAR-B1-A6
--
-- PRODUCT SELLABILITY DATABASE GUARDS
--
-- Rule:
--
-- A new or modified commercial commitment may reference
-- only a Marketplace product whose status is "published".
--
-- Protected boundaries:
--
--   marketplace_cart_items
--   marketplace_order_lines
--
-- Historical marketplace_orders / marketplace_transactions
-- are NOT coupled to the product's current publication status.
--
-- This is intentional:
-- archiving a product after an order exists must never break
-- payment, delivery, refund or historical accounting.
-- ==========================================================

begin;


-- ==========================================================
-- SHARED TRIGGER GUARD
-- ==========================================================

create or replace function public.marketplace_guard_sellable_product()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_status text;

    v_listing_type text;
begin

    -- ------------------------------------------------------
    -- PRODUCT REFERENCE
    -- ------------------------------------------------------

    if new.product_id is null then

        raise exception
            using
                errcode = '23502',
                message =
                    'Marketplace product id is required';

    end if;


    -- ------------------------------------------------------
    -- MARKETPLACE EXTENSION + CURRENT STATUS
    -- ------------------------------------------------------

    select
        marketplace_product.status,
        marketplace_product.listing_type

    into
        v_status,
        v_listing_type

    from public.marketplace_products marketplace_product

    where
        marketplace_product.product_id =
            new.product_id;


    if not found then

        raise exception
            using
                errcode = '23503',
                message =
                    'Marketplace product extension not found';

    end if;


    -- ------------------------------------------------------
    -- COMMERCIAL AVAILABILITY
    -- ------------------------------------------------------

    if v_status <> 'published' then

        raise exception
            using
                errcode = 'P0001',
                message =
                    'Marketplace product is not available for commerce';

    end if;


    -- ------------------------------------------------------
    -- SALE / RENTAL MODE CONSISTENCY
    --
    -- listing_type:
    --   sale
    --   used
    --   rental
    --
    -- commercial mode:
    --   sale
    --   rental
    -- ------------------------------------------------------

    if new.mode = 'rental'
       and v_listing_type <> 'rental'
    then

        raise exception
            using
                errcode = '22023',
                message =
                    'This Marketplace product is not available for rental';

    end if;


    if new.mode = 'sale'
       and v_listing_type not in (
           'sale',
           'used'
       )
    then

        raise exception
            using
                errcode = '22023',
                message =
                    'This Marketplace product is not available for sale';

    end if;


    return new;

end;
$$;


comment on function public.marketplace_guard_sellable_product()
is
'BAZAR-B1-A6-SELLABILITY-GUARD: rejects cart items and order lines for non-published products and enforces sale/rental listing compatibility.';


-- ==========================================================
-- CART BOUNDARY
--
-- Covers:
--
-- INSERT
-- UPSERT -> INSERT branch
-- UPSERT -> UPDATE branch
-- direct UPDATE
--
-- Deletion remains allowed so stale items can always
-- be removed from a cart.
-- ==========================================================

drop trigger if exists
    marketplace_cart_items_sellability_guard
on public.marketplace_cart_items;


create trigger
    marketplace_cart_items_sellability_guard

before insert or update

on public.marketplace_cart_items

for each row

execute function
    public.marketplace_guard_sellable_product();


-- ==========================================================
-- ORDER-LINE BOUNDARY
--
-- marketplace_checkout already filters published products.
--
-- This additional trigger prevents an authenticated client
-- or future code path from bypassing checkout and inserting
-- a non-published product into a new commercial order line.
-- ==========================================================

drop trigger if exists
    marketplace_order_lines_sellability_guard
on public.marketplace_order_lines;


create trigger
    marketplace_order_lines_sellability_guard

before insert or update

on public.marketplace_order_lines

for each row

execute function
    public.marketplace_guard_sellable_product();


-- ==========================================================
-- DIRECT EXECUTION
--
-- This function exists for triggers only.
-- ==========================================================

revoke all
on function public.marketplace_guard_sellable_product()
from public;


revoke all
on function public.marketplace_guard_sellable_product()
from anon;


revoke all
on function public.marketplace_guard_sellable_product()
from authenticated;


commit;