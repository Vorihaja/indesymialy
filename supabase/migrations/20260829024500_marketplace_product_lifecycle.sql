-- ==========================================================
-- INDESY MIALY / INDESY BAZAR
-- BAZAR-B1-A6
--
-- PRODUCT LIFECYCLE ENGINE
--
-- Initial states:
--
--   draft
--   published
--
-- Allowed transitions:
--
--   draft     -> published
--   draft     -> archived
--
--   published -> inactive
--   published -> archived
--
--   inactive  -> published
--   inactive  -> archived
--
--   archived  -> terminal
--
-- Same-state updates are idempotently allowed.
--
-- published_at stores the FIRST publication timestamp.
--
-- Leaving published for inactive / archived automatically
-- removes the product from active carts.
--
-- Historical orders, transactions and payments are never
-- deleted or invalidated by product lifecycle changes.
-- ==========================================================

begin;


-- ==========================================================
-- 1. INITIAL STATUS GUARD
--
-- A product may be born only as draft or published.
--
-- inactive and archived are lifecycle states.
-- ==========================================================

create or replace function
    public.marketplace_guard_initial_product_status()

returns trigger

language plpgsql

security definer

set search_path = ''

as $$
begin

    if new.status not in (
        'draft',
        'published'
    ) then

        raise exception
            using
                errcode = '22023',
                message =
                    'Marketplace product must be created as draft or published';

    end if;


    if new.status = 'published' then

        new.published_at :=
            coalesce(
                new.published_at,
                now()
            );

    else

        new.published_at :=
            null;

    end if;


    return new;

end;
$$;


comment on function
    public.marketplace_guard_initial_product_status()

is
'BAZAR-B1-A6-LIFECYCLE: Marketplace products may be created only as draft or published.';


drop trigger if exists
    marketplace_products_initial_status_guard

on public.marketplace_products;


create trigger
    marketplace_products_initial_status_guard

before insert

on public.marketplace_products

for each row

execute function
    public.marketplace_guard_initial_product_status();


-- ==========================================================
-- 2. STATUS TRANSITION GUARD
--
-- This protects every SQL path, including:
--
-- marketplace_update_product(...)
-- marketplace_set_product_status(...)
-- future RPCs
-- direct updates allowed by service-side code
-- ==========================================================

create or replace function
    public.marketplace_guard_product_status_transition()

returns trigger

language plpgsql

security definer

set search_path = ''

as $$
begin

    -- ------------------------------------------------------
    -- SAME STATUS
    --
    -- Editing a product without changing lifecycle state is
    -- allowed.
    --
    -- Preserve original published_at.
    -- ------------------------------------------------------

    if new.status is not distinct from old.status then

        new.published_at :=
            old.published_at;

        return new;

    end if;


    -- ------------------------------------------------------
    -- VALID TRANSITIONS
    -- ------------------------------------------------------

    if (
        old.status = 'draft'
        and new.status in (
            'published',
            'archived'
        )
    ) then

        null;


    elsif (
        old.status = 'published'
        and new.status in (
            'inactive',
            'archived'
        )
    ) then

        null;


    elsif (
        old.status = 'inactive'
        and new.status in (
            'published',
            'archived'
        )
    ) then

        null;


    else

        raise exception
            using
                errcode = '22023',
                message =
                    'Marketplace product status transition is not allowed';

    end if;


    -- ------------------------------------------------------
    -- FIRST PUBLICATION TIMESTAMP
    -- ------------------------------------------------------

    if new.status = 'published' then

        new.published_at :=
            coalesce(
                old.published_at,
                new.published_at,
                now()
            );

    else

        -- Keep historical publication timestamp.
        new.published_at :=
            old.published_at;

    end if;


    return new;

end;
$$;


comment on function
    public.marketplace_guard_product_status_transition()

is
'BAZAR-B1-A6-LIFECYCLE: enforces draft/published/inactive/archived Marketplace product transitions and preserves first publication timestamp.';


drop trigger if exists
    marketplace_products_status_transition_guard

on public.marketplace_products;


create trigger
    marketplace_products_status_transition_guard

before update of status

on public.marketplace_products

for each row

execute function
    public.marketplace_guard_product_status_transition();


-- ==========================================================
-- 3. ACTIVE CART CLEANUP
--
-- When a product leaves commercial publication:
--
--   published -> inactive
--   published -> archived
--
-- remove it from active carts.
--
-- Orders / transactions are intentionally untouched.
-- ==========================================================

create or replace function
    public.marketplace_cleanup_product_active_carts()

returns trigger

language plpgsql

security definer

set search_path = ''

as $$
begin

    if (
        old.status = 'published'
        and new.status in (
            'inactive',
            'archived'
        )
    ) then

        delete from
            public.marketplace_cart_items cart_item

        using
            public.marketplace_carts cart

        where
            cart_item.product_id =
                new.product_id

            and cart_item.cart_id =
                cart.id

            and cart.status =
                'active';

    end if;


    return new;

end;
$$;


comment on function
    public.marketplace_cleanup_product_active_carts()

is
'BAZAR-B1-A6-LIFECYCLE: removes inactive or archived products from active carts while preserving historical orders and transactions.';


drop trigger if exists
    marketplace_products_active_cart_cleanup

on public.marketplace_products;


create trigger
    marketplace_products_active_cart_cleanup

after update of status

on public.marketplace_products

for each row

execute function
    public.marketplace_cleanup_product_active_carts();


-- ==========================================================
-- 4. SELLER LIFECYCLE RPC
-- ==========================================================

create or replace function
    public.marketplace_set_product_status(
        p_product_id uuid,
        p_seller_organization_id uuid,
        p_target_status text
    )

returns uuid

language plpgsql

security definer

set search_path = ''

as $$
declare
    v_user_id uuid :=
        auth.uid();

    v_product_seller_id uuid;

    v_current_status text;

    v_authorized boolean :=
        false;
begin

    -- ------------------------------------------------------
    -- AUTHENTICATION
    -- ------------------------------------------------------

    if v_user_id is null then

        raise exception
            using
                errcode = '42501',
                message =
                    'Authentication required';

    end if;


    if p_product_id is null then

        raise exception
            using
                errcode = '22023',
                message =
                    'Marketplace product id is required';

    end if;


    if p_seller_organization_id is null then

        raise exception
            using
                errcode = '22023',
                message =
                    'Marketplace seller organization is required';

    end if;


    if p_target_status is null
       or p_target_status not in (
           'published',
           'inactive',
           'archived'
       )
    then

        raise exception
            using
                errcode = '22023',
                message =
                    'Unsupported Marketplace lifecycle target status';

    end if;


    -- ------------------------------------------------------
    -- LOCK CANONICAL PRODUCT
    -- ------------------------------------------------------

    select
        product.seller_id

    into
        v_product_seller_id

    from public.products product

    where
        product.id =
            p_product_id

    for update;


    if not found then

        raise exception
            using
                errcode = 'P0002',
                message =
                    'Marketplace product not found';

    end if;


    if v_product_seller_id
        is distinct from
        p_seller_organization_id
    then

        raise exception
            using
                errcode = '42501',
                message =
                    'Marketplace product does not belong to this seller organization';

    end if;


    -- ------------------------------------------------------
    -- SELLER ORGANIZATION MUST BE ENABLED
    -- ------------------------------------------------------

    if not exists (
        select 1

        from public.organizations organization

        where
            organization.id =
                p_seller_organization_id

            and coalesce(
                organization.status,
                'active'
            ) not in (
                'suspended',
                'deleted'
            )
    ) then

        raise exception
            using
                errcode = '42501',
                message =
                    'Marketplace seller organization is unavailable';

    end if;


    -- ------------------------------------------------------
    -- SELLER AUTHORIZATION
    -- ------------------------------------------------------

    if exists (
        select 1

        from public.organizations organization

        where
            organization.id =
                p_seller_organization_id

            and organization.owner_id =
                v_user_id
    ) then

        v_authorized :=
            true;

    end if;


    if not v_authorized
       and exists (
           select 1

           from public.organization_members membership

           where
               membership.organization_id =
                   p_seller_organization_id

               and membership.profile_id =
                   v_user_id

               and membership.role in (
                   'owner',
                   'admin',
                   'manager',
                   'seller'
               )

               and coalesce(
                   membership.status,
                   'active'
               ) =
                   'active'
       )
    then

        v_authorized :=
            true;

    end if;


    if not v_authorized then

        raise exception
            using
                errcode = '42501',
                message =
                    'Marketplace seller is not authorized for this organization';

    end if;


    -- ------------------------------------------------------
    -- LOCK MARKETPLACE EXTENSION
    -- ------------------------------------------------------

    select
        marketplace_product.status

    into
        v_current_status

    from public.marketplace_products marketplace_product

    where
        marketplace_product.product_id =
            p_product_id

    for update;


    if not found then

        raise exception
            using
                errcode = 'P0002',
                message =
                    'Marketplace product extension not found';

    end if;


    -- ------------------------------------------------------
    -- IDEMPOTENCY
    -- ------------------------------------------------------

    if v_current_status =
        p_target_status
    then

        return p_product_id;

    end if;


    -- ------------------------------------------------------
    -- UPDATE
    --
    -- The transition trigger above remains the final
    -- authority.
    -- ------------------------------------------------------

    update public.marketplace_products

    set
        status =
            p_target_status,

        updated_at =
            now()

    where
        product_id =
            p_product_id;


    return p_product_id;

end;
$$;


comment on function
    public.marketplace_set_product_status(
        uuid,
        uuid,
        text
    )

is
'BAZAR-B1-A6-LIFECYCLE: authenticated seller lifecycle command for publish, deactivate, reactivate and archive transitions.';


-- ==========================================================
-- 5. EXECUTION PERMISSIONS
-- ==========================================================

revoke all
on function
    public.marketplace_set_product_status(
        uuid,
        uuid,
        text
    )
from public;


revoke all
on function
    public.marketplace_set_product_status(
        uuid,
        uuid,
        text
    )
from anon;


revoke all
on function
    public.marketplace_set_product_status(
        uuid,
        uuid,
        text
    )
from authenticated;


grant execute
on function
    public.marketplace_set_product_status(
        uuid,
        uuid,
        text
    )
to authenticated;


-- Trigger functions are trigger-only.

revoke all
on function
    public.marketplace_guard_initial_product_status()
from public, anon, authenticated;


revoke all
on function
    public.marketplace_guard_product_status_transition()
from public, anon, authenticated;


revoke all
on function
    public.marketplace_cleanup_product_active_carts()
from public, anon, authenticated;


commit;