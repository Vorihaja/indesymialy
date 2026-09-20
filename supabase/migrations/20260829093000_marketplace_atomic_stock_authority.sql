-- ============================================================
-- INDESY BAZAR
-- BAZAR-B1-A7-A2B
--
-- ATOMIC STOCK AUTHORITY
--
-- Source of truth:
--   marketplace_inventory.available
--   marketplace_inventory.reserved
--
-- Compatibility mirror:
--   products.stock = marketplace_inventory.available
--
-- Manual adjustment:
--   marketplace_adjust_stock(...)
--
-- Positive delta -> in
-- Negative delta -> out
--
-- reserved is NEVER changed by manual adjustment.
-- ============================================================

begin;


-- ============================================================
-- 1. PRODUCTS.STOCK COMPATIBILITY MIRROR
--
-- Every INSERT or available UPDATE on marketplace_inventory
-- synchronizes products.stock.
--
-- This also repairs checkout's previous stale mirror behavior.
-- ============================================================

create or replace function
public.marketplace_sync_product_stock_mirror()
returns trigger

language plpgsql
security definer
set search_path = ''

as $function$

begin

    update
        public.products p

    set
        stock =
            new.available

    where
        p.id =
            new.product_id

      and
        p.stock
        is distinct from
        new.available;


    return new;

end;

$function$;


revoke all
on function
public.marketplace_sync_product_stock_mirror()
from public, anon, authenticated;


drop trigger if exists
marketplace_inventory_sync_product_stock_mirror
on public.marketplace_inventory;


create trigger
marketplace_inventory_sync_product_stock_mirror

after insert
or update of available

on public.marketplace_inventory

for each row

execute function
public.marketplace_sync_product_stock_mirror();


-- ============================================================
-- 2. ONE-TIME MIRROR RECONCILIATION
--
-- Inventory wins.
--
-- This intentionally does NOT create a stock movement because
-- no operational inventory quantity changes here.
-- Only the compatibility mirror is repaired.
-- ============================================================

update
    public.products p

set
    stock =
        i.available

from
    public.marketplace_inventory i

where
    p.id =
        i.product_id

  and
    p.stock
    is distinct from
    i.available;


-- ============================================================
-- 3. ATOMIC MANUAL STOCK ADJUSTMENT
-- ============================================================

create or replace function
public.marketplace_adjust_stock(
    p_product_id uuid,
    p_seller_organization_id uuid,
    p_delta integer,
    p_reason text
)
returns integer

language plpgsql
security definer
set search_path = ''

as $function$

declare

    v_user_id uuid :=
        auth.uid();

    v_product_seller_id uuid;

    v_available integer;
    v_reserved integer;

    v_new_available_bigint bigint;
    v_new_available integer;

    v_movement_type text;
    v_movement_quantity integer;

begin

    -- --------------------------------------------------------
    -- AUTHENTICATION
    -- --------------------------------------------------------

    if v_user_id is null then

        raise exception
            using
                errcode = '28000',
                message =
                    'Authentication required';

    end if;


    -- --------------------------------------------------------
    -- ARGUMENTS
    -- --------------------------------------------------------

    if p_product_id is null then

        raise exception
            using
                errcode = '22023',
                message =
                    'Product id is required';

    end if;


    if p_seller_organization_id is null then

        raise exception
            using
                errcode = '22023',
                message =
                    'Seller organization id is required';

    end if;


    if (
        p_delta is null
        or p_delta = 0
    ) then

        raise exception
            using
                errcode = '22023',
                message =
                    'Stock delta must be non-zero';

    end if;


    if nullif(
        btrim(
            coalesce(
                p_reason,
                ''
            )
        ),
        ''
    ) is null then

        raise exception
            using
                errcode = '22023',
                message =
                    'Stock adjustment reason is required';

    end if;


    -- --------------------------------------------------------
    -- PRODUCT LOCK
    --
    -- Lock order intentionally matches Marketplace checkout:
    -- product first, inventory second.
    -- --------------------------------------------------------

    select
        p.seller_id

    into
        v_product_seller_id

    from
        public.products p

    where
        p.id =
            p_product_id

    for update;


    if not found then

        raise exception
            using
                errcode = '22023',
                message =
                    'Marketplace product not found';

    end if;


    -- --------------------------------------------------------
    -- SELLER ORGANIZATION MATCH
    -- --------------------------------------------------------

    if (
        v_product_seller_id is null
        or
        v_product_seller_id
            is distinct from
        p_seller_organization_id
    ) then

        raise exception
            using
                errcode = '42501',
                message =
                    'Seller organization does not own this product';

    end if;


    -- --------------------------------------------------------
    -- SELLER AUTHORIZATION
    --
    -- Owner OR active member:
    -- owner / admin / manager / seller
    -- --------------------------------------------------------

    if not (

        exists (

            select
                1

            from
                public.organizations o

            where
                o.id =
                    p_seller_organization_id

              and
                o.owner_id =
                    v_user_id

        )

        or

        exists (

            select
                1

            from
                public.organization_members om

            where
                om.organization_id =
                    p_seller_organization_id

              and
                om.profile_id =
                    v_user_id

              and
                om.role in (
                    'owner',
                    'admin',
                    'manager',
                    'seller'
                )

              and
                coalesce(
                    om.status,
                    'active'
                ) =
                'active'

        )

    ) then

        raise exception
            using
                errcode = '42501',
                message =
                    'Seller is not authorized to adjust this product stock';

    end if;


    -- --------------------------------------------------------
    -- INVENTORY LOCK
    --
    -- marketplace_inventory is the source of truth.
    -- --------------------------------------------------------

    select
        i.available,
        i.reserved

    into
        v_available,
        v_reserved

    from
        public.marketplace_inventory i

    where
        i.product_id =
            p_product_id

    for update;


    if not found then

        raise exception
            using
                errcode = '22023',
                message =
                    'Marketplace inventory row not found';

    end if;


    -- --------------------------------------------------------
    -- CALCULATE NEW AVAILABLE
    --
    -- bigint calculation avoids integer overflow during check.
    -- --------------------------------------------------------

    v_new_available_bigint :=
        v_available::bigint
        +
        p_delta::bigint;


    if v_new_available_bigint < 0 then

        raise exception
            using
                errcode = '22023',
                message =
                    'Stock adjustment would make available inventory negative';

    end if;


    if v_new_available_bigint > 2147483647 then

        raise exception
            using
                errcode = '22003',
                message =
                    'Stock adjustment exceeds integer capacity';

    end if;


    v_new_available :=
        v_new_available_bigint::integer;


    -- --------------------------------------------------------
    -- RESERVED STOCK IS IMMUTABLE HERE
    --
    -- Manual seller adjustments only modify AVAILABLE.
    --
    -- Checkout/order lifecycle owns RESERVED.
    -- --------------------------------------------------------

    update
        public.marketplace_inventory

    set
        available =
            v_new_available,

        updated_at =
            now()

    where
        product_id =
            p_product_id;


    -- products.stock is synchronized by trigger.


    -- --------------------------------------------------------
    -- LEDGER
    --
    -- Quantity is always positive because the existing schema
    -- requires quantity > 0.
    --
    -- Direction is represented by movement_type.
    -- --------------------------------------------------------

    if p_delta > 0 then

        v_movement_type :=
            'in';

    else

        v_movement_type :=
            'out';

    end if;


    v_movement_quantity :=
        abs(
            p_delta::bigint
        )::integer;


    insert into
        public.marketplace_stock_movements (
            product_id,
            movement_type,
            quantity,
            reason,
            order_id,
            created_by
        )

    values (
        p_product_id,
        v_movement_type,
        v_movement_quantity,
        btrim(
            p_reason
        ),
        null,
        v_user_id
    );


    return
        v_new_available;

end;

$function$;


-- ============================================================
-- 4. RPC PRIVILEGES
-- ============================================================

revoke all
on function
public.marketplace_adjust_stock(
    uuid,
    uuid,
    integer,
    text
)
from public;


revoke all
on function
public.marketplace_adjust_stock(
    uuid,
    uuid,
    integer,
    text
)
from anon;


revoke all
on function
public.marketplace_adjust_stock(
    uuid,
    uuid,
    integer,
    text
)
from authenticated;


grant execute
on function
public.marketplace_adjust_stock(
    uuid,
    uuid,
    integer,
    text
)
to authenticated;


-- ============================================================
-- 5. DIRECT INVENTORY MUTATION HARDENING
--
-- Application users can still SELECT according to RLS.
--
-- Mutations must flow through SECURITY DEFINER DB workflows:
-- - marketplace_create_product
-- - marketplace_update_product
-- - marketplace_checkout
-- - marketplace_adjust_stock
-- - future order stock workflows
-- ============================================================

revoke
    insert,
    update,
    delete

on table
    public.marketplace_inventory

from
    public,
    anon,
    authenticated;


-- Stock movement history is append-only from controlled DB
-- workflows. Application users may read according to RLS but
-- cannot manufacture or rewrite ledger entries directly.

revoke
    insert,
    update,
    delete

on table
    public.marketplace_stock_movements

from
    public,
    anon,
    authenticated;


-- ============================================================
-- 6. DOCUMENTATION
-- ============================================================

comment on function
public.marketplace_adjust_stock(
    uuid,
    uuid,
    integer,
    text
)

is
'BAZAR-B1-A7-ATOMIC-STOCK-AUTHORITY: atomically adjusts marketplace_inventory.available, preserves reserved inventory, journals an in/out movement, and synchronizes products.stock as a compatibility mirror after seller authorization.';


comment on function
public.marketplace_sync_product_stock_mirror()

is
'BAZAR-B1-A7-STOCK-MIRROR: marketplace_inventory.available is authoritative; products.stock is synchronized automatically as a compatibility mirror.';


commit;