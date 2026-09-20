-- ==========================================================
-- INDESY MIALY / INDESY BAZAR
-- BAZAR-B1-A6
--
-- PRODUCT SELLABILITY GUARDS VERIFICATION
--
-- Real PostgreSQL verification of:
--
--   published acceptance
--   draft rejection
--   inactive rejection
--   archived rejection
--   sale/rental mode compatibility
--   stale-cart protection after archival
--   deletion of stale cart items
--   direct order-line bypass protection
--
-- All verification rows are created inside a PL/pgSQL
-- subtransaction and intentionally rolled back.
-- ==========================================================

begin;


do $verification$
declare
    v_user_id uuid;

    v_organization_id uuid;

    v_cart_id uuid;

    v_cart_item_id uuid;

    v_published_sale_id uuid;

    v_draft_id uuid;

    v_inactive_id uuid;

    v_archived_id uuid;

    v_published_rental_id uuid;

    v_marker text :=
        '__BAZAR_A6_' ||
        txid_current()::text ||
        '__';

    v_error_message text;

    v_count integer;
begin

    -- ======================================================
    -- AUTHORIZED SELLER
    -- ======================================================

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
                    'BAZAR A6: no authorized seller available';

    end if;


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
                    'BAZAR A6: auth simulation failed';

    end if;


    -- ======================================================
    -- TEST SUBTRANSACTION
    -- ======================================================

    begin

        -- ==================================================
        -- ACTIVE CART
        --
        -- Reuse existing cart when available.
        -- If none exists, create one.
        -- Entire subtransaction is rolled back eventually.
        -- ==================================================

        select cart.id
        into v_cart_id
        from public.marketplace_carts cart
        where
            cart.customer_id =
                v_user_id

            and cart.status =
                'active'

        order by
            cart.created_at desc

        limit 1;


        if v_cart_id is null then

            insert into public.marketplace_carts(
                customer_id,
                status
            )
            values (
                v_user_id,
                'active'
            )
            returning id
            into v_cart_id;

        end if;


        -- ==================================================
        -- CREATE TEST PRODUCTS
        -- ==================================================

        v_published_sale_id :=
            public.marketplace_create_product(
                p_seller_organization_id =>
                    v_organization_id,

                p_title =>
                    v_marker || 'PUBLISHED_SALE',

                p_description =>
                    v_marker || 'PUBLISHED_SALE_DESCRIPTION',

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
                    10,

                p_condition =>
                    'good',

                p_location =>
                    'BAZAR A6 verification',

                p_status =>
                    'published',

                p_images =>
                    array[]::text[]
            );


        v_draft_id :=
            public.marketplace_create_product(
                p_seller_organization_id =>
                    v_organization_id,

                p_title =>
                    v_marker || 'DRAFT',

                p_description =>
                    v_marker || 'DRAFT_DESCRIPTION',

                p_listing_type =>
                    'sale',

                p_category =>
                    null,

                p_sale_price =>
                    11000,

                p_rental_price_per_day =>
                    null,

                p_deposit_amount =>
                    null,

                p_stock =>
                    10,

                p_condition =>
                    'good',

                p_location =>
                    'BAZAR A6 verification',

                p_status =>
                    'draft',

                p_images =>
                    array[]::text[]
            );


        v_inactive_id :=
            public.marketplace_create_product(
                p_seller_organization_id =>
                    v_organization_id,

                p_title =>
                    v_marker || 'INACTIVE',

                p_description =>
                    v_marker || 'INACTIVE_DESCRIPTION',

                p_listing_type =>
                    'sale',

                p_category =>
                    null,

                p_sale_price =>
                    12000,

                p_rental_price_per_day =>
                    null,

                p_deposit_amount =>
                    null,

                p_stock =>
                    10,

                p_condition =>
                    'good',

                p_location =>
                    'BAZAR A6 verification',

                p_status =>
                    'inactive',

                p_images =>
                    array[]::text[]
            );


        v_archived_id :=
            public.marketplace_create_product(
                p_seller_organization_id =>
                    v_organization_id,

                p_title =>
                    v_marker || 'ARCHIVED',

                p_description =>
                    v_marker || 'ARCHIVED_DESCRIPTION',

                p_listing_type =>
                    'sale',

                p_category =>
                    null,

                p_sale_price =>
                    13000,

                p_rental_price_per_day =>
                    null,

                p_deposit_amount =>
                    null,

                p_stock =>
                    10,

                p_condition =>
                    'good',

                p_location =>
                    'BAZAR A6 verification',

                p_status =>
                    'archived',

                p_images =>
                    array[]::text[]
            );


        v_published_rental_id :=
            public.marketplace_create_product(
                p_seller_organization_id =>
                    v_organization_id,

                p_title =>
                    v_marker || 'PUBLISHED_RENTAL',

                p_description =>
                    v_marker || 'PUBLISHED_RENTAL_DESCRIPTION',

                p_listing_type =>
                    'rental',

                p_category =>
                    null,

                p_sale_price =>
                    null,

                p_rental_price_per_day =>
                    2500,

                p_deposit_amount =>
                    5000,

                p_stock =>
                    5,

                p_condition =>
                    'excellent',

                p_location =>
                    'BAZAR A6 verification',

                p_status =>
                    'published',

                p_images =>
                    array[]::text[]
            );


        -- ==================================================
        -- TEST 1
        -- PUBLISHED SALE -> CART ACCEPTED
        -- ==================================================

        insert into public.marketplace_cart_items(
            cart_id,
            product_id,
            quantity,
            mode
        )
        values (
            v_cart_id,
            v_published_sale_id,
            1,
            'sale'
        )
        returning id
        into v_cart_item_id;


        if v_cart_item_id is null then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A6: published product was not accepted';

        end if;


        -- ==================================================
        -- TEST 2
        -- DRAFT -> CART REJECTED
        -- ==================================================

        begin

            insert into public.marketplace_cart_items(
                cart_id,
                product_id,
                quantity,
                mode
            )
            values (
                v_cart_id,
                v_draft_id,
                1,
                'sale'
            );


            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR_A6_DRAFT_WAS_ACCEPTED';

        exception
            when others then

                v_error_message :=
                    sqlerrm;


                if v_error_message =
                    'BAZAR_A6_DRAFT_WAS_ACCEPTED'
                then
                    raise;
                end if;


                if v_error_message <>
                    'Marketplace product is not available for commerce'
                then

                    raise exception
                        using
                            errcode = 'P0001',
                            message =
                                'BAZAR A6: unexpected draft error: ' ||
                                v_error_message;

                end if;

        end;


        -- ==================================================
        -- TEST 3
        -- INACTIVE -> CART REJECTED
        -- ==================================================

        begin

            insert into public.marketplace_cart_items(
                cart_id,
                product_id,
                quantity,
                mode
            )
            values (
                v_cart_id,
                v_inactive_id,
                1,
                'sale'
            );


            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR_A6_INACTIVE_WAS_ACCEPTED';

        exception
            when others then

                v_error_message :=
                    sqlerrm;


                if v_error_message =
                    'BAZAR_A6_INACTIVE_WAS_ACCEPTED'
                then
                    raise;
                end if;


                if v_error_message <>
                    'Marketplace product is not available for commerce'
                then

                    raise exception
                        using
                            errcode = 'P0001',
                            message =
                                'BAZAR A6: unexpected inactive error: ' ||
                                v_error_message;

                end if;

        end;


        -- ==================================================
        -- TEST 4
        -- ARCHIVED -> CART REJECTED
        -- ==================================================

        begin

            insert into public.marketplace_cart_items(
                cart_id,
                product_id,
                quantity,
                mode
            )
            values (
                v_cart_id,
                v_archived_id,
                1,
                'sale'
            );


            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR_A6_ARCHIVED_WAS_ACCEPTED';

        exception
            when others then

                v_error_message :=
                    sqlerrm;


                if v_error_message =
                    'BAZAR_A6_ARCHIVED_WAS_ACCEPTED'
                then
                    raise;
                end if;


                if v_error_message <>
                    'Marketplace product is not available for commerce'
                then

                    raise exception
                        using
                            errcode = 'P0001',
                            message =
                                'BAZAR A6: unexpected archived error: ' ||
                                v_error_message;

                end if;

        end;


        -- ==================================================
        -- TEST 5
        -- SALE PRODUCT USED AS RENTAL -> REJECTED
        -- ==================================================

        begin

            insert into public.marketplace_cart_items(
                cart_id,
                product_id,
                quantity,
                mode,
                rental_start,
                rental_end
            )
            values (
                v_cart_id,
                v_published_sale_id,
                1,
                'rental',
                current_date,
                current_date + 1
            );


            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR_A6_SALE_AS_RENTAL_WAS_ACCEPTED';

        exception
            when others then

                v_error_message :=
                    sqlerrm;


                if v_error_message =
                    'BAZAR_A6_SALE_AS_RENTAL_WAS_ACCEPTED'
                then
                    raise;
                end if;


                if v_error_message <>
                    'This Marketplace product is not available for rental'
                then

                    raise exception
                        using
                            errcode = 'P0001',
                            message =
                                'BAZAR A6: unexpected sale/rental error: ' ||
                                v_error_message;

                end if;

        end;


        -- ==================================================
        -- TEST 6
        -- RENTAL PRODUCT USED AS SALE -> REJECTED
        -- ==================================================

        begin

            insert into public.marketplace_cart_items(
                cart_id,
                product_id,
                quantity,
                mode
            )
            values (
                v_cart_id,
                v_published_rental_id,
                1,
                'sale'
            );


            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR_A6_RENTAL_AS_SALE_WAS_ACCEPTED';

        exception
            when others then

                v_error_message :=
                    sqlerrm;


                if v_error_message =
                    'BAZAR_A6_RENTAL_AS_SALE_WAS_ACCEPTED'
                then
                    raise;
                end if;


                if v_error_message <>
                    'This Marketplace product is not available for sale'
                then

                    raise exception
                        using
                            errcode = 'P0001',
                            message =
                                'BAZAR A6: unexpected rental/sale error: ' ||
                                v_error_message;

                end if;

        end;


        -- ==================================================
        -- TEST 7
        --
        -- PRODUCT WAS PUBLISHED AND ALREADY IN CART.
        -- ARCHIVE IT.
        --
        -- The stale cart row may still physically exist,
        -- but it can no longer be commercially modified.
        -- ==================================================

        perform public.marketplace_update_product(
            p_product_id =>
                v_published_sale_id,

            p_seller_organization_id =>
                v_organization_id,

            p_title =>
                v_marker || 'PUBLISHED_SALE',

            p_description =>
                v_marker || 'PUBLISHED_SALE_DESCRIPTION',

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
                10,

            p_condition =>
                'good',

            p_location =>
                'BAZAR A6 verification',

            p_status =>
                'archived',

            p_images =>
                array[]::text[]
        );


        begin

            update public.marketplace_cart_items

            set
                quantity =
                    2

            where
                id =
                    v_cart_item_id;


            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR_A6_STALE_CART_UPDATE_WAS_ACCEPTED';

        exception
            when others then

                v_error_message :=
                    sqlerrm;


                if v_error_message =
                    'BAZAR_A6_STALE_CART_UPDATE_WAS_ACCEPTED'
                then
                    raise;
                end if;


                if v_error_message <>
                    'Marketplace product is not available for commerce'
                then

                    raise exception
                        using
                            errcode = 'P0001',
                            message =
                                'BAZAR A6: unexpected stale cart error: ' ||
                                v_error_message;

                end if;

        end;


        -- --------------------------------------------------
        -- Deletion must remain possible.
        -- --------------------------------------------------

        delete from public.marketplace_cart_items

        where
            id =
                v_cart_item_id;


        get diagnostics
            v_count =
                row_count;


        if v_count <> 1 then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A6: stale cart item could not be removed';

        end if;


        -- ==================================================
        -- TEST 8
        --
        -- DIRECT ORDER-LINE BYPASS
        --
        -- Product is archived.
        --
        -- The trigger must reject BEFORE the fake order_id
        -- reaches the foreign-key validation.
        -- ==================================================

        begin

            insert into public.marketplace_order_lines(
                order_id,
                product_id,
                product_title,
                quantity,
                unit_price,
                mode,
                line_total
            )
            values (
                gen_random_uuid(),
                v_archived_id,
                v_marker || 'ARCHIVED',
                1,
                13000,
                'sale',
                13000
            );


            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR_A6_ARCHIVED_ORDER_LINE_WAS_ACCEPTED';

        exception
            when others then

                v_error_message :=
                    sqlerrm;


                if v_error_message =
                    'BAZAR_A6_ARCHIVED_ORDER_LINE_WAS_ACCEPTED'
                then
                    raise;
                end if;


                if v_error_message <>
                    'Marketplace product is not available for commerce'
                then

                    raise exception
                        using
                            errcode = 'P0001',
                            message =
                                'BAZAR A6: unexpected order-line status error: ' ||
                                v_error_message;

                end if;

        end;


        -- ==================================================
        -- TEST 9
        --
        -- DIRECT ORDER-LINE WITH WRONG COMMERCIAL MODE
        --
        -- Rental listing cannot become sale order line.
        -- ==================================================

        begin

            insert into public.marketplace_order_lines(
                order_id,
                product_id,
                product_title,
                quantity,
                unit_price,
                mode,
                line_total
            )
            values (
                gen_random_uuid(),
                v_published_rental_id,
                v_marker || 'PUBLISHED_RENTAL',
                1,
                2500,
                'sale',
                2500
            );


            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR_A6_RENTAL_ORDER_LINE_AS_SALE_WAS_ACCEPTED';

        exception
            when others then

                v_error_message :=
                    sqlerrm;


                if v_error_message =
                    'BAZAR_A6_RENTAL_ORDER_LINE_AS_SALE_WAS_ACCEPTED'
                then
                    raise;
                end if;


                if v_error_message <>
                    'This Marketplace product is not available for sale'
                then

                    raise exception
                        using
                            errcode = 'P0001',
                            message =
                                'BAZAR A6: unexpected order-line mode error: ' ||
                                v_error_message;

                end if;

        end;


        -- ==================================================
        -- ALL TESTS PASSED.
        --
        -- Roll back every verification row.
        -- ==================================================

        raise exception
            using
                errcode = 'P0001',
                message =
                    'BAZAR_A6_VERIFICATION_TEST_DATA_CLEANUP';


    exception
        when others then

            v_error_message :=
                sqlerrm;


            if v_error_message <>
                'BAZAR_A6_VERIFICATION_TEST_DATA_CLEANUP'
            then
                raise;
            end if;

    end;


    -- ======================================================
    -- ZERO TEST DATA MUST REMAIN
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
                    'BAZAR A6: verification product survived cleanup';

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
                    'BAZAR A6: verification image survived cleanup';

    end if;


    raise notice
        'BAZAR-B1-A6-SELLABILITY-GUARDS-VERIFIED user=% organization=%',
        v_user_id,
        v_organization_id;

end;
$verification$;


comment on function public.marketplace_guard_sellable_product()
is
'BAZAR-B1-A6-SELLABILITY-GUARDS-VERIFIED: PostgreSQL verified published-only cart/order-line commerce, sale/rental compatibility, stale-cart rejection and safe cart deletion.';


commit;