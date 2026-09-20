-- ==========================================================
-- INDESY MIALY / INDESY BAZAR
-- BAZAR-B1-A4-A4
--
-- ATOMIC PRODUCT CREATE VERIFICATION
--
-- This migration performs transactional assertions only.
--
-- It verifies:
-- 1. an authorized seller can create the 4 product layers;
-- 2. all 4 layers exist during a successful transaction;
-- 3. a forced exception rolls all 4 layers back;
-- 4. an exception raised inside marketplace_create_product()
--    after prior INSERTs leaves no partial product;
-- 5. child tables retain FK protection toward products.
--
-- ZERO persistent Marketplace test rows are intentionally kept.
-- ==========================================================

begin;


do $verification$
declare
    v_user_id uuid;

    v_organization_id uuid;

    v_success_product_id uuid;

    v_success_marker text :=
        '__BAZAR_A4_SUCCESS_' ||
        txid_current()::text ||
        '__';

    v_failure_marker text :=
        '__BAZAR_A4_FAILURE_' ||
        txid_current()::text ||
        '__';

    v_error_message text;

    v_count bigint;
begin

    -- ------------------------------------------------------
    -- FIND ONE REAL AUTHORIZED SELLER CONTEXT
    -- ------------------------------------------------------

    select
        candidate.user_id,
        candidate.organization_id
    into
        v_user_id,
        v_organization_id
    from (
        select
            o.owner_id as user_id,
            o.id as organization_id,
            0 as priority
        from public.organizations o
        where
            o.owner_id is not null

            and coalesce(
                o.status,
                'active'
            ) not in (
                'suspended',
                'deleted'
            )

        union all

        select
            om.profile_id as user_id,
            om.organization_id,
            1 as priority
        from public.organization_members om
        join public.organizations o
            on o.id = om.organization_id
        where
            om.profile_id is not null

            and om.role in (
                'owner',
                'admin',
                'manager',
                'seller'
            )

            and coalesce(
                om.status,
                'active'
            ) = 'active'

            and coalesce(
                o.status,
                'active'
            ) not in (
                'suspended',
                'deleted'
            )
    ) candidate
    order by
        candidate.priority,
        candidate.organization_id
    limit 1;


    if (
        v_user_id is null
        or v_organization_id is null
    ) then

        raise exception
            using
                errcode = 'P0001',
                message =
                    'BAZAR A4: no authorized seller organization available for verification';

    end if;


    -- ------------------------------------------------------
    -- SIMULATE THE AUTHENTICATED USER CLAIM
    --
    -- auth.uid() reads request.jwt.claim.sub.
    -- This setting is LOCAL to this migration transaction.
    -- ------------------------------------------------------

    perform set_config(
        'request.jwt.claim.sub',
        v_user_id::text,
        true
    );


    if auth.uid() is distinct from v_user_id then

        raise exception
            using
                errcode = 'P0001',
                message =
                    'BAZAR A4: auth.uid() simulation failed';

    end if;


    -- ------------------------------------------------------
    -- VERIFY CHILD TABLE FK PROTECTION
    -- ------------------------------------------------------

    if not exists (
        select 1
        from pg_constraint constraint_info
        where
            constraint_info.contype = 'f'

            and constraint_info.conrelid =
                'public.marketplace_products'::regclass

            and constraint_info.confrelid =
                'public.products'::regclass
    ) then

        raise exception
            using
                errcode = 'P0001',
                message =
                    'BAZAR A4: marketplace_products FK to products is missing';

    end if;


    if not exists (
        select 1
        from pg_constraint constraint_info
        where
            constraint_info.contype = 'f'

            and constraint_info.conrelid =
                'public.marketplace_inventory'::regclass

            and constraint_info.confrelid =
                'public.products'::regclass
    ) then

        raise exception
            using
                errcode = 'P0001',
                message =
                    'BAZAR A4: marketplace_inventory FK to products is missing';

    end if;


    if not exists (
        select 1
        from pg_constraint constraint_info
        where
            constraint_info.contype = 'f'

            and constraint_info.conrelid =
                'public.marketplace_product_images'::regclass

            and constraint_info.confrelid =
                'public.products'::regclass
    ) then

        raise exception
            using
                errcode = 'P0001',
                message =
                    'BAZAR A4: marketplace_product_images FK to products is missing';

    end if;


    -- ======================================================
    -- TEST 1
    --
    -- SUCCESS PATH
    --
    -- We create a completely valid product.
    -- We verify all 4 layers.
    --
    -- Then we FORCE an exception.
    --
    -- The PL/pgSQL exception block creates a subtransaction.
    -- Therefore every product row must disappear.
    -- ======================================================

    begin

        v_success_product_id :=
            public.marketplace_create_product(
                p_seller_organization_id =>
                    v_organization_id,

                p_title =>
                    v_success_marker,

                p_description =>
                    v_success_marker,

                p_listing_type =>
                    'sale',

                p_category =>
                    null,

                p_sale_price =>
                    15000,

                p_rental_price_per_day =>
                    null,

                p_deposit_amount =>
                    null,

                p_stock =>
                    2,

                p_condition =>
                    'new',

                p_location =>
                    'BAZAR A4 verification',

                p_status =>
                    'draft',

                p_images =>
                    array[
                        v_success_marker ||
                        '/image-1.webp',

                        v_success_marker ||
                        '/image-2.webp'
                    ]
            );


        if v_success_product_id is null then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A4: successful RPC returned no product id';

        end if;


        -- canonical product

        select count(*)
        into v_count
        from public.products
        where id = v_success_product_id;

        if v_count <> 1 then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A4: canonical product was not created';

        end if;


        -- Marketplace extension

        select count(*)
        into v_count
        from public.marketplace_products
        where product_id = v_success_product_id;

        if v_count <> 1 then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A4: Marketplace extension was not created';

        end if;


        -- inventory

        select count(*)
        into v_count
        from public.marketplace_inventory
        where product_id = v_success_product_id;

        if v_count <> 1 then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A4: inventory was not created';

        end if;


        -- images

        select count(*)
        into v_count
        from public.marketplace_product_images
        where product_id = v_success_product_id;

        if v_count <> 2 then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A4: expected two product images';

        end if;


        -- exactly one primary image

        select count(*)
        into v_count
        from public.marketplace_product_images
        where
            product_id = v_success_product_id
            and is_primary = true;

        if v_count <> 1 then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A4: primary image invariant failed';

        end if;


        -- --------------------------------------------------
        -- INTENTIONAL ROLLBACK
        -- --------------------------------------------------

        raise exception
            using
                errcode = 'P0001',
                message =
                    'BAZAR_A4_SUCCESS_FORCE_ROLLBACK';


    exception
        when others then

            v_error_message :=
                sqlerrm;


            if (
                v_error_message <>
                'BAZAR_A4_SUCCESS_FORCE_ROLLBACK'
            ) then

                raise;

            end if;

    end;


    -- ------------------------------------------------------
    -- VERIFY SUCCESS TEST LEFT ZERO ROWS
    -- ------------------------------------------------------

    if exists (
        select 1
        from public.products
        where id = v_success_product_id
    ) then

        raise exception
            using
                errcode = 'P0001',
                message =
                    'BAZAR A4: product survived forced rollback';

    end if;


    if exists (
        select 1
        from public.marketplace_products
        where product_id = v_success_product_id
    ) then

        raise exception
            using
                errcode = 'P0001',
                message =
                    'BAZAR A4: extension survived forced rollback';

    end if;


    if exists (
        select 1
        from public.marketplace_inventory
        where product_id = v_success_product_id
    ) then

        raise exception
            using
                errcode = 'P0001',
                message =
                    'BAZAR A4: inventory survived forced rollback';

    end if;


    if exists (
        select 1
        from public.marketplace_product_images
        where product_id = v_success_product_id
    ) then

        raise exception
            using
                errcode = 'P0001',
                message =
                    'BAZAR A4: images survived forced rollback';

    end if;


    -- ======================================================
    -- TEST 2
    --
    -- FAILURE INSIDE marketplace_create_product()
    --
    -- The first image path is valid.
    -- The second image path is intentionally empty.
    --
    -- At this point the function has already attempted:
    --
    -- products
    -- marketplace_products
    -- marketplace_inventory
    -- first image
    --
    -- The empty second image triggers an exception.
    --
    -- PostgreSQL must rollback the COMPLETE function call.
    -- ======================================================

    begin

        perform public.marketplace_create_product(
            p_seller_organization_id =>
                v_organization_id,

            p_title =>
                v_failure_marker,

            p_description =>
                v_failure_marker,

            p_listing_type =>
                'sale',

            p_category =>
                null,

            p_sale_price =>
                25000,

            p_rental_price_per_day =>
                null,

            p_deposit_amount =>
                null,

            p_stock =>
                3,

            p_condition =>
                'new',

            p_location =>
                'BAZAR A4 failure verification',

            p_status =>
                'draft',

            p_images =>
                array[
                    v_failure_marker ||
                    '/image-before-error.webp',

                    ''
                ]
        );


        raise exception
            using
                errcode = 'P0001',
                message =
                    'BAZAR_A4_EXPECTED_RPC_FAILURE_DID_NOT_OCCUR';


    exception
        when others then

            v_error_message :=
                sqlerrm;


            if (
                v_error_message =
                'BAZAR_A4_EXPECTED_RPC_FAILURE_DID_NOT_OCCUR'
            ) then

                raise;

            end if;


            if (
                v_error_message <>
                'Marketplace image path cannot be empty'
            ) then

                raise exception
                    using
                        errcode = 'P0001',
                        message =
                            'BAZAR A4: unexpected RPC failure: ' ||
                            v_error_message;

            end if;

    end;


    -- ------------------------------------------------------
    -- VERIFY FAILED RPC LEFT ZERO TRACE
    -- ------------------------------------------------------

    if exists (
        select 1
        from public.products
        where name = v_failure_marker
    ) then

        raise exception
            using
                errcode = 'P0001',
                message =
                    'BAZAR A4: failed RPC left a canonical product';

    end if;


    if exists (
        select 1
        from public.marketplace_products
        where description = v_failure_marker
    ) then

        raise exception
            using
                errcode = 'P0001',
                message =
                    'BAZAR A4: failed RPC left a Marketplace extension';

    end if;


    if exists (
        select 1
        from public.marketplace_product_images
        where storage_path like
            v_failure_marker || '%'
    ) then

        raise exception
            using
                errcode = 'P0001',
                message =
                    'BAZAR A4: failed RPC left a product image';

    end if;


    -- ------------------------------------------------------
    -- VERIFY NO ORPHAN PRODUCT CHILDREN
    -- ------------------------------------------------------

    if exists (
        select 1
        from public.marketplace_inventory inventory
        left join public.products product
            on product.id = inventory.product_id
        where product.id is null
    ) then

        raise exception
            using
                errcode = 'P0001',
                message =
                    'BAZAR A4: orphan Marketplace inventory detected';

    end if;


    if exists (
        select 1
        from public.marketplace_products extension
        left join public.products product
            on product.id = extension.product_id
        where product.id is null
    ) then

        raise exception
            using
                errcode = 'P0001',
                message =
                    'BAZAR A4: orphan Marketplace extension detected';

    end if;


    if exists (
        select 1
        from public.marketplace_product_images image
        left join public.products product
            on product.id = image.product_id
        where product.id is null
    ) then

        raise exception
            using
                errcode = 'P0001',
                message =
                    'BAZAR A4: orphan Marketplace image detected';

    end if;


    -- ------------------------------------------------------
    -- SUCCESS
    -- ------------------------------------------------------

    raise notice
        'BAZAR-B1-A4-A4-ATOMICITY-VERIFIED user=% organization=%',
        v_user_id,
        v_organization_id;

end;
$verification$;


comment on function public.marketplace_create_product(
    uuid,
    text,
    text,
    text,
    text,
    numeric,
    numeric,
    numeric,
    integer,
    text,
    text,
    text,
    text[]
)
is
'BAZAR-B1-A4-A4-ATOMICITY-VERIFIED: atomic product creation verified with successful rollback and controlled internal failure rollback.';


commit;