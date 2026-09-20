-- ==========================================================
-- INDESY MIALY / INDESY BAZAR
-- BAZAR-B1-A6-A4-A4
--
-- PRODUCT LIFECYCLE REAL VERIFICATION
--
-- Proves in PostgreSQL:
--
--   create draft              OK
--   create published          OK
--   create inactive           REJECT
--   create archived           REJECT
--
--   draft -> published        OK
--   draft -> archived         OK
--   published -> inactive     OK
--   published -> archived     OK
--   inactive -> published     OK
--   inactive -> archived      OK
--
--   draft -> inactive         REJECT
--   published -> draft        REJECT
--   archived -> published     REJECT
--
--   archived terminal state
--   idempotency
--   first published_at preservation
--   active cart automatic cleanup
--   update RPC cannot bypass lifecycle
--   failed update RPC rolls back all writes
--   seller ownership protection
--   seller authorization protection
--
-- Every test row is rolled back before commit.
-- ==========================================================

begin;


do $verification$
declare
    v_user_id uuid;

    v_organization_id uuid;

    v_cart_id uuid;

    v_draft_publish_id uuid;

    v_draft_archive_id uuid;

    v_lifecycle_id uuid;

    v_published_archive_id uuid;

    v_update_guard_id uuid;

    v_returned_product_id uuid;

    v_fake_user_id uuid;

    v_marker text :=
        '__BAZAR_A6_LIFECYCLE_' ||
        txid_current()::text ||
        '__';

    v_error_message text;

    v_status text;

    v_title text;

    v_price numeric;

    v_stock integer;

    v_published_at timestamptz;

    v_publication_sentinel timestamptz :=
        '2001-01-01 00:00:00+00'::timestamptz;

    v_count integer;
begin

    -- ======================================================
    -- AUTHORIZED REAL SELLER CONTEXT
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
                    'BAZAR A6 lifecycle: no authorized seller available';

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
                    'BAZAR A6 lifecycle: auth simulation failed';

    end if;


    -- ======================================================
    -- ALL TEST DATA IS CREATED IN THIS SUBTRANSACTION
    -- ======================================================

    begin

        -- ==================================================
        -- TEST 1
        -- INITIAL INACTIVE MUST FAIL
        -- ==================================================

        begin

            perform public.marketplace_create_product(
                p_seller_organization_id =>
                    v_organization_id,

                p_title =>
                    v_marker || 'INVALID_INITIAL_INACTIVE',

                p_description =>
                    v_marker || 'INVALID_INITIAL_INACTIVE',

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
                    'Lifecycle verification',

                p_status =>
                    'inactive',

                p_images =>
                    array[]::text[]
            );


            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR_A6_INITIAL_INACTIVE_WAS_ACCEPTED';


        exception
            when others then

                v_error_message :=
                    sqlerrm;


                if v_error_message =
                    'BAZAR_A6_INITIAL_INACTIVE_WAS_ACCEPTED'
                then
                    raise;
                end if;


                if v_error_message <>
                    'Marketplace product must be created as draft or published'
                then

                    raise exception
                        using
                            errcode = 'P0001',
                            message =
                                'BAZAR A6 lifecycle: unexpected initial inactive error: ' ||
                                v_error_message;

                end if;

        end;


        -- ==================================================
        -- TEST 2
        -- INITIAL ARCHIVED MUST FAIL
        -- ==================================================

        begin

            perform public.marketplace_create_product(
                p_seller_organization_id =>
                    v_organization_id,

                p_title =>
                    v_marker || 'INVALID_INITIAL_ARCHIVED',

                p_description =>
                    v_marker || 'INVALID_INITIAL_ARCHIVED',

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
                    'Lifecycle verification',

                p_status =>
                    'archived',

                p_images =>
                    array[]::text[]
            );


            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR_A6_INITIAL_ARCHIVED_WAS_ACCEPTED';


        exception
            when others then

                v_error_message :=
                    sqlerrm;


                if v_error_message =
                    'BAZAR_A6_INITIAL_ARCHIVED_WAS_ACCEPTED'
                then
                    raise;
                end if;


                if v_error_message <>
                    'Marketplace product must be created as draft or published'
                then

                    raise exception
                        using
                            errcode = 'P0001',
                            message =
                                'BAZAR A6 lifecycle: unexpected initial archived error: ' ||
                                v_error_message;

                end if;

        end;


        -- ==================================================
        -- CREATE REFERENCE PRODUCTS
        -- ==================================================

        v_draft_publish_id :=
            public.marketplace_create_product(
                p_seller_organization_id =>
                    v_organization_id,

                p_title =>
                    v_marker || 'DRAFT_TO_PUBLISHED',

                p_description =>
                    v_marker || 'DRAFT_TO_PUBLISHED',

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
                    5,

                p_condition =>
                    'good',

                p_location =>
                    'Lifecycle verification',

                p_status =>
                    'draft',

                p_images =>
                    array[]::text[]
            );


        v_draft_archive_id :=
            public.marketplace_create_product(
                p_seller_organization_id =>
                    v_organization_id,

                p_title =>
                    v_marker || 'DRAFT_TO_ARCHIVED',

                p_description =>
                    v_marker || 'DRAFT_TO_ARCHIVED',

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
                    5,

                p_condition =>
                    'good',

                p_location =>
                    'Lifecycle verification',

                p_status =>
                    'draft',

                p_images =>
                    array[]::text[]
            );


        v_lifecycle_id :=
            public.marketplace_create_product(
                p_seller_organization_id =>
                    v_organization_id,

                p_title =>
                    v_marker || 'LIFECYCLE',

                p_description =>
                    v_marker || 'LIFECYCLE',

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
                    'Lifecycle verification',

                p_status =>
                    'published',

                p_images =>
                    array[]::text[]
            );


        v_published_archive_id :=
            public.marketplace_create_product(
                p_seller_organization_id =>
                    v_organization_id,

                p_title =>
                    v_marker || 'PUBLISHED_TO_ARCHIVED',

                p_description =>
                    v_marker || 'PUBLISHED_TO_ARCHIVED',

                p_listing_type =>
                    'sale',

                p_category =>
                    null,

                p_sale_price =>
                    14000,

                p_rental_price_per_day =>
                    null,

                p_deposit_amount =>
                    null,

                p_stock =>
                    8,

                p_condition =>
                    'good',

                p_location =>
                    'Lifecycle verification',

                p_status =>
                    'published',

                p_images =>
                    array[]::text[]
            );


        v_update_guard_id :=
            public.marketplace_create_product(
                p_seller_organization_id =>
                    v_organization_id,

                p_title =>
                    v_marker || 'UPDATE_GUARD_ORIGINAL',

                p_description =>
                    v_marker || 'UPDATE_GUARD_ORIGINAL',

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
                    7,

                p_condition =>
                    'good',

                p_location =>
                    'Lifecycle verification',

                p_status =>
                    'published',

                p_images =>
                    array[]::text[]
            );


        if (
            v_draft_publish_id is null
            or v_draft_archive_id is null
            or v_lifecycle_id is null
            or v_published_archive_id is null
            or v_update_guard_id is null
        ) then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A6 lifecycle: reference product creation failed';

        end if;


        -- ==================================================
        -- TEST 3
        -- DRAFT -> INACTIVE MUST FAIL
        -- ==================================================

        begin

            perform public.marketplace_set_product_status(
                p_product_id =>
                    v_draft_publish_id,

                p_seller_organization_id =>
                    v_organization_id,

                p_target_status =>
                    'inactive'
            );


            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR_A6_DRAFT_TO_INACTIVE_WAS_ACCEPTED';


        exception
            when others then

                v_error_message :=
                    sqlerrm;


                if v_error_message =
                    'BAZAR_A6_DRAFT_TO_INACTIVE_WAS_ACCEPTED'
                then
                    raise;
                end if;


                if v_error_message <>
                    'Marketplace product status transition is not allowed'
                then

                    raise exception
                        using
                            errcode = 'P0001',
                            message =
                                'BAZAR A6 lifecycle: unexpected draft->inactive error: ' ||
                                v_error_message;

                end if;

        end;


        select status
        into v_status
        from public.marketplace_products
        where product_id =
            v_draft_publish_id;


        if v_status <> 'draft' then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A6 lifecycle: failed draft transition changed status';

        end if;


        -- ==================================================
        -- TEST 4
        -- DRAFT -> PUBLISHED
        -- ==================================================

        v_returned_product_id :=
            public.marketplace_set_product_status(
                p_product_id =>
                    v_draft_publish_id,

                p_seller_organization_id =>
                    v_organization_id,

                p_target_status =>
                    'published'
            );


        if v_returned_product_id
            is distinct from
            v_draft_publish_id
        then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A6 lifecycle: draft publication returned wrong id';

        end if;


        select
            status,
            published_at

        into
            v_status,
            v_published_at

        from public.marketplace_products

        where
            product_id =
                v_draft_publish_id;


        if (
            v_status <> 'published'
            or v_published_at is null
        ) then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A6 lifecycle: draft publication failed';

        end if;


        -- ==================================================
        -- TEST 5
        -- IDEMPOTENT PUBLISHED -> PUBLISHED
        -- ==================================================

        v_returned_product_id :=
            public.marketplace_set_product_status(
                p_product_id =>
                    v_draft_publish_id,

                p_seller_organization_id =>
                    v_organization_id,

                p_target_status =>
                    'published'
            );


        if v_returned_product_id
            is distinct from
            v_draft_publish_id
        then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A6 lifecycle: idempotent status returned wrong id';

        end if;


        -- ==================================================
        -- TEST 6
        -- DRAFT -> ARCHIVED
        -- ==================================================

        perform public.marketplace_set_product_status(
            p_product_id =>
                v_draft_archive_id,

            p_seller_organization_id =>
                v_organization_id,

            p_target_status =>
                'archived'
        );


        select status
        into v_status
        from public.marketplace_products
        where product_id =
            v_draft_archive_id;


        if v_status <> 'archived' then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A6 lifecycle: draft archive failed';

        end if;


        -- ==================================================
        -- TEST 7
        -- ARCHIVED -> PUBLISHED MUST FAIL
        -- ==================================================

        begin

            perform public.marketplace_set_product_status(
                p_product_id =>
                    v_draft_archive_id,

                p_seller_organization_id =>
                    v_organization_id,

                p_target_status =>
                    'published'
            );


            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR_A6_ARCHIVED_REACTIVATION_WAS_ACCEPTED';


        exception
            when others then

                v_error_message :=
                    sqlerrm;


                if v_error_message =
                    'BAZAR_A6_ARCHIVED_REACTIVATION_WAS_ACCEPTED'
                then
                    raise;
                end if;


                if v_error_message <>
                    'Marketplace product status transition is not allowed'
                then

                    raise exception
                        using
                            errcode = 'P0001',
                            message =
                                'BAZAR A6 lifecycle: unexpected archived reactivation error: ' ||
                                v_error_message;

                end if;

        end;


        -- ==================================================
        -- TEST 8
        -- ARCHIVED IDEMPOTENCY
        -- ==================================================

        v_returned_product_id :=
            public.marketplace_set_product_status(
                p_product_id =>
                    v_draft_archive_id,

                p_seller_organization_id =>
                    v_organization_id,

                p_target_status =>
                    'archived'
            );


        if v_returned_product_id
            is distinct from
            v_draft_archive_id
        then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A6 lifecycle: archived idempotency failed';

        end if;


        -- ==================================================
        -- ACTIVE CART
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
                customer_id
            )
            values (
                v_user_id
            )
            returning id
            into v_cart_id;

        end if;


        -- ==================================================
        -- PUBLICATION TIMESTAMP SENTINEL
        --
        -- now() is transaction-stable, so we deliberately
        -- install an old sentinel timestamp before transitions.
        -- This makes preservation independently testable.
        -- ==================================================

        update public.marketplace_products

        set
            published_at =
                v_publication_sentinel

        where
            product_id =
                v_lifecycle_id;


        -- ==================================================
        -- PRODUCT IN ACTIVE CART
        -- ==================================================

        insert into public.marketplace_cart_items(
            cart_id,
            product_id,
            quantity,
            mode
        )
        values (
            v_cart_id,
            v_lifecycle_id,
            1,
            'sale'
        );


        -- ==================================================
        -- TEST 9
        -- PUBLISHED -> INACTIVE
        -- + ACTIVE CART CLEANUP
        -- ==================================================

        perform public.marketplace_set_product_status(
            p_product_id =>
                v_lifecycle_id,

            p_seller_organization_id =>
                v_organization_id,

            p_target_status =>
                'inactive'
        );


        select
            status,
            published_at

        into
            v_status,
            v_published_at

        from public.marketplace_products

        where
            product_id =
                v_lifecycle_id;


        if v_status <> 'inactive' then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A6 lifecycle: published->inactive failed';

        end if;


        if v_published_at
            is distinct from
            v_publication_sentinel
        then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A6 lifecycle: first publication timestamp lost on deactivate';

        end if;


        select count(*)
        into v_count
        from public.marketplace_cart_items cart_item
        where
            cart_item.cart_id =
                v_cart_id

            and cart_item.product_id =
                v_lifecycle_id;


        if v_count <> 0 then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A6 lifecycle: inactive product survived active-cart cleanup';

        end if;


        -- ==================================================
        -- TEST 10
        -- INACTIVE -> PUBLISHED
        -- ==================================================

        perform public.marketplace_set_product_status(
            p_product_id =>
                v_lifecycle_id,

            p_seller_organization_id =>
                v_organization_id,

            p_target_status =>
                'published'
        );


        select
            status,
            published_at

        into
            v_status,
            v_published_at

        from public.marketplace_products

        where
            product_id =
                v_lifecycle_id;


        if v_status <> 'published' then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A6 lifecycle: inactive->published failed';

        end if;


        if v_published_at
            is distinct from
            v_publication_sentinel
        then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A6 lifecycle: first publication timestamp changed on reactivate';

        end if;


        -- ==================================================
        -- TEST 11
        -- PUBLISHED -> INACTIVE -> ARCHIVED
        -- ==================================================

        perform public.marketplace_set_product_status(
            p_product_id =>
                v_lifecycle_id,

            p_seller_organization_id =>
                v_organization_id,

            p_target_status =>
                'inactive'
        );


        perform public.marketplace_set_product_status(
            p_product_id =>
                v_lifecycle_id,

            p_seller_organization_id =>
                v_organization_id,

            p_target_status =>
                'archived'
        );


        select
            status,
            published_at

        into
            v_status,
            v_published_at

        from public.marketplace_products

        where
            product_id =
                v_lifecycle_id;


        if v_status <> 'archived' then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A6 lifecycle: inactive->archived failed';

        end if;


        if v_published_at
            is distinct from
            v_publication_sentinel
        then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A6 lifecycle: publication timestamp lost on archive';

        end if;


        -- ==================================================
        -- TEST 12
        -- PUBLISHED -> ARCHIVED DIRECT
        -- + ACTIVE CART CLEANUP
        -- ==================================================

        insert into public.marketplace_cart_items(
            cart_id,
            product_id,
            quantity,
            mode
        )
        values (
            v_cart_id,
            v_published_archive_id,
            1,
            'sale'
        );


        perform public.marketplace_set_product_status(
            p_product_id =>
                v_published_archive_id,

            p_seller_organization_id =>
                v_organization_id,

            p_target_status =>
                'archived'
        );


        select status
        into v_status
        from public.marketplace_products
        where
            product_id =
                v_published_archive_id;


        if v_status <> 'archived' then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A6 lifecycle: published->archived failed';

        end if;


        select count(*)
        into v_count
        from public.marketplace_cart_items cart_item
        where
            cart_item.cart_id =
                v_cart_id

            and cart_item.product_id =
                v_published_archive_id;


        if v_count <> 0 then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A6 lifecycle: archived product survived active-cart cleanup';

        end if;


        -- ==================================================
        -- TEST 13
        --
        -- marketplace_update_product() MUST NOT BYPASS
        -- LIFECYCLE.
        --
        -- published -> draft is forbidden.
        --
        -- The RPC changes canonical products first, therefore
        -- this also proves atomic rollback after the lifecycle
        -- trigger rejects the extension update.
        -- ==================================================

        begin

            perform public.marketplace_update_product(
                p_product_id =>
                    v_update_guard_id,

                p_seller_organization_id =>
                    v_organization_id,

                p_title =>
                    v_marker || 'UPDATE_GUARD_ILLEGAL_CHANGE',

                p_description =>
                    v_marker || 'UPDATE_GUARD_ILLEGAL_CHANGE',

                p_listing_type =>
                    'sale',

                p_category =>
                    null,

                p_sale_price =>
                    99999,

                p_rental_price_per_day =>
                    null,

                p_deposit_amount =>
                    null,

                p_stock =>
                    99,

                p_condition =>
                    'excellent',

                p_location =>
                    'Illegal lifecycle update',

                p_status =>
                    'draft',

                p_images =>
                    array[]::text[]
            );


            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR_A6_UPDATE_RPC_BYPASSED_LIFECYCLE';


        exception
            when others then

                v_error_message :=
                    sqlerrm;


                if v_error_message =
                    'BAZAR_A6_UPDATE_RPC_BYPASSED_LIFECYCLE'
                then
                    raise;
                end if;


                if v_error_message <>
                    'Marketplace product status transition is not allowed'
                then

                    raise exception
                        using
                            errcode = 'P0001',
                            message =
                                'BAZAR A6 lifecycle: unexpected update RPC transition error: ' ||
                                v_error_message;

                end if;

        end;


        select
            product.name,
            product.price,
            product.stock

        into
            v_title,
            v_price,
            v_stock

        from public.products product

        where
            product.id =
                v_update_guard_id;


        if v_title <>
            v_marker || 'UPDATE_GUARD_ORIGINAL'
        then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A6 lifecycle: failed update changed canonical title';

        end if;


        if v_price <> 15000 then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A6 lifecycle: failed update changed canonical price';

        end if;


        if v_stock <> 7 then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A6 lifecycle: failed update changed canonical stock';

        end if;


        select status
        into v_status
        from public.marketplace_products
        where
            product_id =
                v_update_guard_id;


        if v_status <> 'published' then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A6 lifecycle: failed update changed lifecycle status';

        end if;


        -- ==================================================
        -- TEST 14
        -- WRONG SELLER ORGANIZATION
        -- ==================================================

        begin

            perform public.marketplace_set_product_status(
                p_product_id =>
                    v_update_guard_id,

                p_seller_organization_id =>
                    gen_random_uuid(),

                p_target_status =>
                    'inactive'
            );


            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR_A6_WRONG_SELLER_ORGANIZATION_WAS_ACCEPTED';


        exception
            when others then

                v_error_message :=
                    sqlerrm;


                if v_error_message =
                    'BAZAR_A6_WRONG_SELLER_ORGANIZATION_WAS_ACCEPTED'
                then
                    raise;
                end if;


                if v_error_message <>
                    'Marketplace product does not belong to this seller organization'
                then

                    raise exception
                        using
                            errcode = 'P0001',
                            message =
                                'BAZAR A6 lifecycle: unexpected seller ownership error: ' ||
                                v_error_message;

                end if;

        end;


        -- ==================================================
        -- TEST 15
        -- UNAUTHORIZED USER
        -- ==================================================

        v_fake_user_id :=
            gen_random_uuid();


        perform set_config(
            'request.jwt.claim.sub',
            v_fake_user_id::text,
            true
        );


        begin

            perform public.marketplace_set_product_status(
                p_product_id =>
                    v_update_guard_id,

                p_seller_organization_id =>
                    v_organization_id,

                p_target_status =>
                    'inactive'
            );


            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR_A6_UNAUTHORIZED_USER_WAS_ACCEPTED';


        exception
            when others then

                v_error_message :=
                    sqlerrm;


                if v_error_message =
                    'BAZAR_A6_UNAUTHORIZED_USER_WAS_ACCEPTED'
                then
                    raise;
                end if;


                if v_error_message <>
                    'Marketplace seller is not authorized for this organization'
                then

                    raise exception
                        using
                            errcode = 'P0001',
                            message =
                                'BAZAR A6 lifecycle: unexpected authorization error: ' ||
                                v_error_message;

                end if;

        end;


        -- Restore legitimate auth context.

        perform set_config(
            'request.jwt.claim.sub',
            v_user_id::text,
            true
        );


        -- ==================================================
        -- FINAL TEST STATE ASSERTION
        -- ==================================================

        select status
        into v_status
        from public.marketplace_products
        where
            product_id =
                v_update_guard_id;


        if v_status <> 'published' then

            raise exception
                using
                    errcode = 'P0001',
                    message =
                        'BAZAR A6 lifecycle: security tests changed product status';

        end if;


        -- ==================================================
        -- ALL TESTS PASSED
        --
        -- FORCE ROLLBACK OF ALL TEMPORARY TEST DATA.
        -- ==================================================

        raise exception
            using
                errcode = 'P0001',
                message =
                    'BAZAR_A6_LIFECYCLE_TEST_DATA_CLEANUP';


    exception
        when others then

            v_error_message :=
                sqlerrm;


            if v_error_message <>
                'BAZAR_A6_LIFECYCLE_TEST_DATA_CLEANUP'
            then
                raise;
            end if;

    end;


    -- ======================================================
    -- ZERO TEST DATA
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
                    'BAZAR A6 lifecycle: verification product survived cleanup';

    end if;


    if exists (
        select 1

        from public.marketplace_products marketplace_product

        where
            marketplace_product.description like
                v_marker || '%'
    ) then

        raise exception
            using
                errcode = 'P0001',
                message =
                    'BAZAR A6 lifecycle: verification extension survived cleanup';

    end if;


    if (
        v_draft_publish_id is not null
        and exists (
            select 1
            from public.marketplace_cart_items
            where product_id =
                v_draft_publish_id
        )
    ) then

        raise exception
            using
                errcode = 'P0001',
                message =
                    'BAZAR A6 lifecycle: verification cart row survived cleanup';

    end if;


    if (
        v_lifecycle_id is not null
        and exists (
            select 1
            from public.marketplace_cart_items
            where product_id =
                v_lifecycle_id
        )
    ) then

        raise exception
            using
                errcode = 'P0001',
                message =
                    'BAZAR A6 lifecycle: lifecycle cart row survived cleanup';

    end if;


    raise notice
        'BAZAR-B1-A6-A4-A4-LIFECYCLE-VERIFIED user=% organization=%',
        v_user_id,
        v_organization_id;

end;
$verification$;


commit;

-- BAZAR-B1-A6-A4-A4-LIFECYCLE-VERIFIED