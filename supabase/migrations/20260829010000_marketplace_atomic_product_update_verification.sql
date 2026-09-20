-- ==========================================================
-- INDESY MIALY / INDESY BAZAR
-- BAZAR-B1-A5-A5
--
-- ATOMIC PRODUCT UPDATE VERIFICATION
--
-- Proves:
--
-- 1. a complete update can modify all Marketplace layers;
-- 2. a forced rollback restores the exact previous state;
-- 3. an internal failure after multiple writes rolls back all
--    preceding writes;
-- 4. image replacement is atomic;
-- 5. no persistent verification product remains.
--
-- Test data is created inside a PL/pgSQL subtransaction and
-- intentionally rolled back before this migration commits.
-- ==========================================================

begin;


do $verification$
declare
    v_user_id uuid;

    v_organization_id uuid;

    v_product_id uuid;

    v_returned_product_id uuid;

    v_marker text :=
        '__BAZAR_A5_' ||
        txid_current()::text ||
        '__';

    v_initial_title text;

    v_initial_description text;

    v_initial_image_1 text;

    v_initial_image_2 text;

    v_updated_title text;

    v_updated_description text;

    v_updated_image_1 text;

    v_updated_image_2 text;

    v_updated_image_3 text;

    v_failure_title text;

    v_failure_description text;

    v_failure_image text;

    v_error_message text;

    v_count bigint;
begin

    -- ------------------------------------------------------
    -- TEST MARKERS
    -- ------------------------------------------------------

    v_initial_title :=
        v_marker ||
        'INITIAL';

    v_initial_description :=
        v_marker ||
        'INITIAL_DESCRIPTION';

    v_initial_image_1 :=
        v_marker ||
        'initial/image-1.webp';

    v_initial_image_2 :=
        v_marker ||
        'initial/image-2.webp';


    v_updated_title :=
        v_marker ||
        'UPDATED';

    v_updated_description :=
        v_marker ||
        'UPDATED_DESCRIPTION';

    v_updated_image_1 :=
        v_marker ||
        'updated/image-1.webp';

    v_updated_image_2 :=
        v_marker ||
        'updated/image-2.webp';

    v_updated_image_3 :=
        v_marker ||
        'updated/image-3.webp';


    v_failure_title :=
        v_marker ||
        'FAILURE';

    v_failure_description :=
        v_marker ||
        'FAILURE_DESCRIPTION';

    v_failure_image :=
        v_marker ||
        'failure/image-before-error.webp';


    -- ------------------------------------------------------
    -- FIND A REAL AUTHORIZED SELLER CONTEXT
    -- ------------------------------------------------------

    select
        candidate.user_id,
        candidate.organization_id
    into
        v_user_id,
        v_organization_id
    from (
        select
            organization.owner_id
                as user_id,

            organization.id
                as organization_id,

            0
                as priority

        from public.organizations organization

        where
            organization.owner_id
                is not null

            and coalesce(
                organization.status,
                'active'
            ) not in (
                'suspended',
                'deleted'
            )


        union all


        select
            membership.profile_id
                as user_id,

            membership.organization_id,

            1
                as priority

        from public.organization_members membership

        join public.organizations organization
            on organization.id =
                membership.organization_id

        where
            membership.profile_id
                is not null

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

            and coalesce(
                organization.status,
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
                    'BAZAR A5: no authorized seller available';

    end if;


    -- ------------------------------------------------------
    -- AUTH CONTEXT
    -- ------------------------------------------------------

    perform set_config(
        'request.jwt.claim.sub',
        v_user_id::text,
        true
    );


    if auth.uid()
        is distinct from
        v_user_id
    then

        raise exception
            using
                errcode = 'P0001',
                message =
                    'BAZAR A5: auth.uid() simulation failed';

    end if;


    -- ======================================================
    -- OUTER TEST SUBTRANSACTION
    --
    -- EVERYTHING created below will intentionally be rolled
    -- back before the migration commits.
    -- ======================================================

    begin

        -- ==================================================
        -- CREATE TEMPORARY REFERENCE PRODUCT
        -- ==================================================

        v_product_id :=
            public.marketplace_create_product(
                p_seller_organization_id =>
                    v_organization_id,

                p_title =>
                    v_initial_title,

                p_description =>
                    v_initial_description,

                p_listing_type =>
                    'sale',

                p_category =>
                    null,

                p_sale_price =>
                    10000,

                p_rental_price_per_day =>
                    null,

                p_deposit_amount =>
                    null,

                p_stock =>
                    5,

                p_condition =>
                    'good',

                p_location =>
                    'BAZAR A5 initial location',

                p_status =>
                    'draft',

                p_images =>
                    array[
                        v_initial_image_1,
                        v_initial_image_2
                    ]
            );


        if v_product_id is null then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A5: reference product creation failed';

        end if;


        -- ==================================================
        -- VERIFY INITIAL STATE
        -- ==================================================

        if not exists (
            select 1
            from public.products product
            where
                product.id =
                    v_product_id

                and product.name =
                    v_initial_title

                and product.price =
                    10000

                and product.stock =
                    5

                and product.seller_id =
                    v_organization_id
        ) then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A5: invalid initial canonical product';

        end if;


        if not exists (
            select 1
            from public.marketplace_products extension
            where
                extension.product_id =
                    v_product_id

                and extension.description =
                    v_initial_description

                and extension.listing_type =
                    'sale'

                and extension.condition =
                    'good'

                and extension.location =
                    'BAZAR A5 initial location'

                and extension.status =
                    'draft'
        ) then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A5: invalid initial Marketplace extension';

        end if;


        if not exists (
            select 1
            from public.marketplace_inventory inventory
            where
                inventory.product_id =
                    v_product_id

                and inventory.available =
                    5

                and inventory.reserved =
                    0
        ) then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A5: invalid initial inventory';

        end if;


        select count(*)
        into v_count
        from public.marketplace_product_images image
        where
            image.product_id =
                v_product_id;


        if v_count <> 2 then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A5: expected two initial images';

        end if;


        -- ==================================================
        -- TEST 1
        --
        -- SUCCESSFUL COMPLETE UPDATE
        -- THEN FORCE ROLLBACK
        -- ==================================================

        begin

            v_returned_product_id :=
                public.marketplace_update_product(
                    p_product_id =>
                        v_product_id,

                    p_seller_organization_id =>
                        v_organization_id,

                    p_title =>
                        v_updated_title,

                    p_description =>
                        v_updated_description,

                    p_listing_type =>
                        'sale',

                    p_category =>
                        null,

                    p_sale_price =>
                        20000,

                    p_rental_price_per_day =>
                        null,

                    p_deposit_amount =>
                        3000,

                    p_stock =>
                        9,

                    p_condition =>
                        'excellent',

                    p_location =>
                        'BAZAR A5 updated location',

                    p_status =>
                        'draft',

                    p_images =>
                        array[
                            v_updated_image_1,
                            v_updated_image_2,
                            v_updated_image_3
                        ]
                );


            if (
                v_returned_product_id
                is distinct from
                v_product_id
            ) then

                raise exception
                    using
                        errcode = 'P0001',
                        message =
                            'BAZAR A5: update returned wrong product id';

            end if;


            -- ----------------------------------------------
            -- canonical product updated
            -- ----------------------------------------------

            if not exists (
                select 1
                from public.products product
                where
                    product.id =
                        v_product_id

                    and product.name =
                        v_updated_title

                    and product.price =
                        20000

                    and product.stock =
                        9
            ) then

                raise exception
                    using
                        errcode = 'P0001',
                        message =
                            'BAZAR A5: canonical product update failed';

            end if;


            -- ----------------------------------------------
            -- Marketplace extension updated
            -- ----------------------------------------------

            if not exists (
                select 1
                from public.marketplace_products extension
                where
                    extension.product_id =
                        v_product_id

                    and extension.description =
                        v_updated_description

                    and extension.listing_type =
                        'sale'

                    and extension.deposit_amount =
                        3000

                    and extension.condition =
                        'excellent'

                    and extension.location =
                        'BAZAR A5 updated location'

                    and extension.status =
                        'draft'
            ) then

                raise exception
                    using
                        errcode = 'P0001',
                        message =
                            'BAZAR A5: Marketplace extension update failed';

            end if;


            -- ----------------------------------------------
            -- inventory updated
            -- ----------------------------------------------

            if not exists (
                select 1
                from public.marketplace_inventory inventory
                where
                    inventory.product_id =
                        v_product_id

                    and inventory.available =
                        9

                    and inventory.reserved =
                        0
            ) then

                raise exception
                    using
                        errcode = 'P0001',
                        message =
                            'BAZAR A5: inventory update failed';

            end if;


            -- ----------------------------------------------
            -- images replaced
            -- ----------------------------------------------

            select count(*)
            into v_count
            from public.marketplace_product_images image
            where
                image.product_id =
                    v_product_id;


            if v_count <> 3 then

                raise exception
                    using
                        errcode = 'P0001',
                        message =
                            'BAZAR A5: expected three updated images';

            end if;


            select count(*)
            into v_count
            from public.marketplace_product_images image
            where
                image.product_id =
                    v_product_id

                and image.storage_path in (
                    v_initial_image_1,
                    v_initial_image_2
                );


            if v_count <> 0 then

                raise exception
                    using
                        errcode = 'P0001',
                        message =
                            'BAZAR A5: old images survived successful update';

            end if;


            select count(*)
            into v_count
            from public.marketplace_product_images image
            where
                image.product_id =
                    v_product_id

                and image.is_primary =
                    true;


            if v_count <> 1 then

                raise exception
                    using
                        errcode = 'P0001',
                        message =
                            'BAZAR A5: updated primary image invariant failed';

            end if;


            -- ----------------------------------------------
            -- FORCE ROLLBACK OF ENTIRE SUCCESSFUL UPDATE
            -- ----------------------------------------------

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR_A5_SUCCESS_UPDATE_FORCE_ROLLBACK';


        exception
            when others then

                v_error_message :=
                    sqlerrm;


                if (
                    v_error_message <>
                    'BAZAR_A5_SUCCESS_UPDATE_FORCE_ROLLBACK'
                ) then

                    raise;

                end if;

        end;


        -- ==================================================
        -- VERIFY COMPLETE RESTORATION AFTER TEST 1
        -- ==================================================

        if not exists (
            select 1
            from public.products product
            where
                product.id =
                    v_product_id

                and product.name =
                    v_initial_title

                and product.price =
                    10000

                and product.stock =
                    5
        ) then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A5: canonical product was not restored';

        end if;


        if not exists (
            select 1
            from public.marketplace_products extension
            where
                extension.product_id =
                    v_product_id

                and extension.description =
                    v_initial_description

                and extension.listing_type =
                    'sale'

                and extension.deposit_amount
                    is null

                and extension.condition =
                    'good'

                and extension.location =
                    'BAZAR A5 initial location'

                and extension.status =
                    'draft'
        ) then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A5: Marketplace extension was not restored';

        end if;


        if not exists (
            select 1
            from public.marketplace_inventory inventory
            where
                inventory.product_id =
                    v_product_id

                and inventory.available =
                    5

                and inventory.reserved =
                    0
        ) then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A5: inventory was not restored';

        end if;


        select count(*)
        into v_count
        from public.marketplace_product_images image
        where
            image.product_id =
                v_product_id

            and image.storage_path in (
                v_initial_image_1,
                v_initial_image_2
            );


        if v_count <> 2 then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A5: original images were not restored';

        end if;


        select count(*)
        into v_count
        from public.marketplace_product_images image
        where
            image.product_id =
                v_product_id

            and image.storage_path in (
                v_updated_image_1,
                v_updated_image_2,
                v_updated_image_3
            );


        if v_count <> 0 then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A5: updated images survived forced rollback';

        end if;


        -- ==================================================
        -- TEST 2
        --
        -- FAILURE INSIDE marketplace_update_product()
        --
        -- Before image failure the function already performs:
        --
        -- UPDATE products
        -- UPDATE marketplace_products
        -- UPDATE marketplace_inventory
        -- DELETE old images
        -- INSERT first replacement image
        --
        -- Second image is empty -> exception.
        --
        -- ALL previous writes must rollback.
        -- ==================================================

        begin

            perform public.marketplace_update_product(
                p_product_id =>
                    v_product_id,

                p_seller_organization_id =>
                    v_organization_id,

                p_title =>
                    v_failure_title,

                p_description =>
                    v_failure_description,

                p_listing_type =>
                    'sale',

                p_category =>
                    null,

                p_sale_price =>
                    30000,

                p_rental_price_per_day =>
                    null,

                p_deposit_amount =>
                    4000,

                p_stock =>
                    11,

                p_condition =>
                    'used',

                p_location =>
                    'BAZAR A5 failure location',

                p_status =>
                    'draft',

                p_images =>
                    array[
                        v_failure_image,
                        ''
                    ]
            );


            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR_A5_EXPECTED_UPDATE_FAILURE_DID_NOT_OCCUR';


        exception
            when others then

                v_error_message :=
                    sqlerrm;


                if (
                    v_error_message =
                    'BAZAR_A5_EXPECTED_UPDATE_FAILURE_DID_NOT_OCCUR'
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
                                'BAZAR A5: unexpected update RPC failure: ' ||
                                v_error_message;

                end if;

        end;


        -- ==================================================
        -- VERIFY TEST 2 ROLLED BACK EVERYTHING
        -- ==================================================

        if not exists (
            select 1
            from public.products product
            where
                product.id =
                    v_product_id

                and product.name =
                    v_initial_title

                and product.price =
                    10000

                and product.stock =
                    5
        ) then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A5: failed update changed canonical product';

        end if;


        if not exists (
            select 1
            from public.marketplace_products extension
            where
                extension.product_id =
                    v_product_id

                and extension.description =
                    v_initial_description

                and extension.deposit_amount
                    is null

                and extension.condition =
                    'good'

                and extension.location =
                    'BAZAR A5 initial location'
        ) then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A5: failed update changed Marketplace extension';

        end if;


        if not exists (
            select 1
            from public.marketplace_inventory inventory
            where
                inventory.product_id =
                    v_product_id

                and inventory.available =
                    5

                and inventory.reserved =
                    0
        ) then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A5: failed update changed inventory';

        end if;


        select count(*)
        into v_count
        from public.marketplace_product_images image
        where
            image.product_id =
                v_product_id

            and image.storage_path in (
                v_initial_image_1,
                v_initial_image_2
            );


        if v_count <> 2 then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A5: failed update destroyed original images';

        end if;


        if exists (
            select 1
            from public.marketplace_product_images image
            where
                image.product_id =
                    v_product_id

                and image.storage_path =
                    v_failure_image
        ) then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A5: failed update left replacement image';

        end if;


        if exists (
            select 1
            from public.products product
            where
                product.id =
                    v_product_id

                and product.name =
                    v_failure_title
        ) then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A5: failed title survived rollback';

        end if;


        -- ==================================================
        -- EVERYTHING PASSED
        --
        -- NOW ROLLBACK THE TEMPORARY REFERENCE PRODUCT TOO.
        -- ==================================================

        raise exception
            using
                errcode = 'P0001',
                message =
                    'BAZAR_A5_VERIFICATION_TEST_DATA_CLEANUP';


    exception
        when others then

            v_error_message :=
                sqlerrm;


            if (
                v_error_message <>
                'BAZAR_A5_VERIFICATION_TEST_DATA_CLEANUP'
            ) then

                raise;

            end if;

    end;


    -- ======================================================
    -- VERIFY ZERO TEST DATA REMAINS
    -- ======================================================

    if exists (
        select 1
        from public.products product
        where
            product.name like
                v_marker || '%'
    ) then

        raise exception
            using
                errcode = 'P0001',
                message =
                    'BAZAR A5: verification product survived cleanup';

    end if;


    if exists (
        select 1
        from public.marketplace_products extension
        where
            extension.description like
                v_marker || '%'
    ) then

        raise exception
            using
                errcode = 'P0001',
                message =
                    'BAZAR A5: verification extension survived cleanup';

    end if;


    if exists (
        select 1
        from public.marketplace_product_images image
        where
            image.storage_path like
                v_marker || '%'
    ) then

        raise exception
            using
                errcode = 'P0001',
                message =
                    'BAZAR A5: verification image survived cleanup';

    end if;


    if (
        v_product_id is not null
        and exists (
            select 1
            from public.marketplace_inventory inventory
            where
                inventory.product_id =
                    v_product_id
        )
    ) then

        raise exception
            using
                errcode = 'P0001',
                message =
                    'BAZAR A5: verification inventory survived cleanup';

    end if;


    -- ======================================================
    -- SUCCESS
    -- ======================================================

    raise notice
        'BAZAR-B1-A5-A5-ATOMIC-UPDATE-VERIFIED user=% organization=%',
        v_user_id,
        v_organization_id;

end;
$verification$;


comment on function public.marketplace_update_product(
    uuid,
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
'BAZAR-B1-A5-A5-ATOMIC-UPDATE-VERIFIED: complete Marketplace product update, stock synchronization and image replacement verified with PostgreSQL rollback tests.';


commit;