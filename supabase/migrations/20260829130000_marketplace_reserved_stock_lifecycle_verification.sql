-- ============================================================
-- BAZAR-B1-A8-A2D-R2
-- REAL RESERVED INVENTORY LIFECYCLE VERIFICATION
--
-- Test fixtures are entirely reverted with SAVEPOINT.
--
-- BAZAR-B1-A8-A2D-R2-VERIFIED
-- PERSISTENT_TEST_ROWS=0
-- ============================================================

begin;

savepoint bazar_b1_a8_fixture;


do $verify$

declare

    v_org_id uuid;
    v_actor_id uuid;

    v_product_id uuid;

    v_cart_consume_id uuid;
    v_cart_release_id uuid;

    v_order_consume_id uuid;
    v_order_release_id uuid;

    v_available integer;
    v_reserved integer;
    v_mirror integer;

    v_remaining integer;
    v_result integer;
    v_count integer;

    v_consume_key text :=
        'A8-CONSUME-' ||
        gen_random_uuid()::text;

    v_release_key text :=
        'A8-RELEASE-' ||
        gen_random_uuid()::text;

begin

    -- ========================================================
    -- 1. ELIGIBLE ORGANIZATION / ACTOR
    -- ========================================================

    select
        o.id,

        coalesce(
            o.owner_id,
            member_candidate.profile_id
        )

    into
        v_org_id,
        v_actor_id

    from
        public.organizations o

    left join lateral (

        select
            om.profile_id

        from
            public.organization_members om

        where
            om.organization_id = o.id

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
            ) = 'active'

        order by
            om.profile_id

        limit 1

    ) member_candidate
        on true

    where
        coalesce(
            o.status,
            'active'
        )
        not in (
            'suspended',
            'deleted'
        )

      and
        coalesce(
            o.owner_id,
            member_candidate.profile_id
        )
        is not null

    order by
        o.id

    limit 1;


    if (
        v_org_id is null
        or v_actor_id is null
    ) then

        raise exception
            'A8: no eligible seller organization';

    end if;


    -- ========================================================
    -- 2. MOCK AUTH
    -- ========================================================

    perform set_config(
        'request.jwt.claim.sub',
        v_actor_id::text,
        true
    );

    perform set_config(
        'request.jwt.claims',
        json_build_object(
            'sub',
            v_actor_id::text,
            'role',
            'authenticated'
        )::text,
        true
    );


    if auth.uid() is distinct from v_actor_id then

        raise exception
            'A8: auth mock failed';

    end if;


    -- ========================================================
    -- 3. PRIVILEGES
    -- ========================================================

    if has_function_privilege(
        'authenticated',
        'public.marketplace_consume_order_reservation(uuid,text)',
        'EXECUTE'
    ) then

        raise exception
            'A8: authenticated can consume directly';

    end if;


    if has_function_privilege(
        'authenticated',
        'public.marketplace_release_order_reservation(uuid,text)',
        'EXECUTE'
    ) then

        raise exception
            'A8: authenticated can release directly';

    end if;


    if not has_function_privilege(
        'service_role',
        'public.marketplace_consume_order_reservation(uuid,text)',
        'EXECUTE'
    ) then

        raise exception
            'A8: service_role consume privilege missing';

    end if;


    if not has_function_privilege(
        'service_role',
        'public.marketplace_release_order_reservation(uuid,text)',
        'EXECUTE'
    ) then

        raise exception
            'A8: service_role release privilege missing';

    end if;


    -- ========================================================
    -- 4. CREATE PUBLISHED PRODUCT, STOCK 10
    -- ========================================================

    select
        public.marketplace_create_product(
            p_seller_organization_id =>
                v_org_id,

            p_title =>
                'A8 reserved lifecycle verification',

            p_description =>
                'Temporary SAVEPOINT fixture',

            p_listing_type =>
                'sale',

            p_category =>
                null,

            p_sale_price =>
                1000::numeric,

            p_rental_price_per_day =>
                null,

            p_deposit_amount =>
                null,

            p_stock =>
                10,

            p_condition =>
                'new',

            p_location =>
                'Verification',

            p_status =>
                'published',

            p_images =>
                '{}'::text[]
        )

    into
        v_product_id;


    if v_product_id is null then

        raise exception
            'A8: temporary product was not created';

    end if;


    select
        i.available,
        i.reserved,
        p.stock

    into
        v_available,
        v_reserved,
        v_mirror

    from
        public.marketplace_inventory i

    join
        public.products p
        on p.id = i.product_id

    where
        i.product_id =
            v_product_id;


    if (
        v_available <> 10
        or v_reserved <> 0
        or v_mirror <> 10
    ) then

        raise exception
            'A8: invalid initial inventory';

    end if;


    -- ========================================================
    -- 5. CHECKOUT #1 — QUANTITY 3
    -- ========================================================

    insert into
        public.marketplace_carts
        (
            customer_id,
            currency,
            status
        )

    values
        (
            v_actor_id,
            'MGA',
            'active'
        )

    returning id
    into
        v_cart_consume_id;


    insert into
        public.marketplace_cart_items
        (
            cart_id,
            product_id,
            quantity,
            mode
        )

    values
        (
            v_cart_consume_id,
            v_product_id,
            3,
            'sale'
        );


    select
        result_row.order_id

    into
        v_order_consume_id

    from
        public.marketplace_checkout(
            p_cart_id =>
                v_cart_consume_id,

            p_customer_name =>
                'A8 Verification',

            p_customer_email =>
                'a8@indesy.test',

            p_customer_phone =>
                '0000000000',

            p_fulfillment_method =>
                'pickup',

            p_delivery_address =>
                '',

            p_payment_method =>
                'cash',

            p_idempotency_key =>
                v_consume_key
        )
        as result_row

    limit 1;


    if v_order_consume_id is null then

        raise exception
            'A8: consume checkout returned no order';

    end if;


    select
        i.available,
        i.reserved,
        p.stock

    into
        v_available,
        v_reserved,
        v_mirror

    from
        public.marketplace_inventory i

    join
        public.products p
        on p.id = i.product_id

    where
        i.product_id =
            v_product_id;


    v_remaining :=
        public.marketplace_order_reservation_remaining(
            v_order_consume_id,
            v_product_id
        );


    if (
        v_available <> 7
        or v_reserved <> 3
        or v_mirror <> 7
        or v_remaining <> 3
    ) then

        raise exception
            'A8: checkout reserve state invalid';

    end if;


    select
        count(*)

    into
        v_count

    from
        public.marketplace_stock_movements sm

    where
        sm.order_id =
            v_order_consume_id

      and
        sm.product_id =
            v_product_id

      and
        sm.movement_type =
            'reserve'

      and
        sm.quantity =
            3;


    if v_count <> 1 then

        raise exception
            'A8: reserve ledger missing';

    end if;


    -- ========================================================
    -- 6. BLANK CONSUME REASON
    -- ========================================================

    begin

        perform
            public.marketplace_consume_order_reservation(
                v_order_consume_id,
                '   '
            );

        raise exception
            'A8_EXPECTED_CONSUME_REASON_FAILURE';

    exception

        when others then

            if sqlerrm =
                'A8_EXPECTED_CONSUME_REASON_FAILURE'
            then

                raise;

            end if;

            if position(
                'reason'
                in lower(sqlerrm)
            ) = 0 then

                raise exception
                    'A8: unexpected consume reason error: %',
                    sqlerrm;

            end if;

    end;


    -- ========================================================
    -- 7. CONSUME QUANTITY 3
    -- ========================================================

    v_result :=
        public.marketplace_consume_order_reservation(
            v_order_consume_id,
            'A8 verified sale'
        );


    if v_result <> 3 then

        raise exception
            'A8: consume result expected 3, got %',
            v_result;

    end if;


    select
        i.available,
        i.reserved,
        p.stock

    into
        v_available,
        v_reserved,
        v_mirror

    from
        public.marketplace_inventory i

    join
        public.products p
        on p.id = i.product_id

    where
        i.product_id =
            v_product_id;


    v_remaining :=
        public.marketplace_order_reservation_remaining(
            v_order_consume_id,
            v_product_id
        );


    if (
        v_available <> 7
        or v_reserved <> 0
        or v_mirror <> 7
        or v_remaining <> 0
    ) then

        raise exception
            'A8: consume state invalid';

    end if;


    select
        count(*)

    into
        v_count

    from
        public.marketplace_stock_movements sm

    where
        sm.order_id =
            v_order_consume_id

      and
        sm.product_id =
            v_product_id

      and
        sm.movement_type =
            'out'

      and
        sm.quantity =
            3

      and
        sm.reason like
            'ORDER_RESERVATION_CONSUMED:%';


    if v_count <> 1 then

        raise exception
            'A8: consume ledger invalid';

    end if;


    -- ========================================================
    -- 8. CONSUME AGAIN => 0
    -- ========================================================

    v_result :=
        public.marketplace_consume_order_reservation(
            v_order_consume_id,
            'A8 duplicate consume'
        );


    if v_result <> 0 then

        raise exception
            'A8: duplicate consume was not idempotent';

    end if;


    -- ========================================================
    -- 9. RELEASE AFTER CONSUME => 0
    -- ========================================================

    v_result :=
        public.marketplace_release_order_reservation(
            v_order_consume_id,
            'A8 release after consume'
        );


    if v_result <> 0 then

        raise exception
            'A8: release after consume was not no-op';

    end if;


    select
        count(*)

    into
        v_count

    from
        public.marketplace_stock_movements sm

    where
        sm.order_id =
            v_order_consume_id

      and
        sm.product_id =
            v_product_id

      and
        sm.movement_type =
            'release';


    if v_count <> 0 then

        raise exception
            'A8: release movement created after consume';

    end if;


    -- ========================================================
    -- 10. CHECKOUT #2 — QUANTITY 2
    --
    -- Before:
    -- available 7
    -- reserved 0
    --
    -- After checkout:
    -- available 5
    -- reserved 2
    -- ========================================================

    insert into
        public.marketplace_carts
        (
            customer_id,
            currency,
            status
        )

    values
        (
            v_actor_id,
            'MGA',
            'active'
        )

    returning id
    into
        v_cart_release_id;


    insert into
        public.marketplace_cart_items
        (
            cart_id,
            product_id,
            quantity,
            mode
        )

    values
        (
            v_cart_release_id,
            v_product_id,
            2,
            'sale'
        );


    select
        result_row.order_id

    into
        v_order_release_id

    from
        public.marketplace_checkout(
            p_cart_id =>
                v_cart_release_id,

            p_customer_name =>
                'A8 Verification',

            p_customer_email =>
                'a8@indesy.test',

            p_customer_phone =>
                '0000000000',

            p_fulfillment_method =>
                'pickup',

            p_delivery_address =>
                '',

            p_payment_method =>
                'cash',

            p_idempotency_key =>
                v_release_key
        )
        as result_row

    limit 1;


    if v_order_release_id is null then

        raise exception
            'A8: release checkout returned no order';

    end if;


    select
        i.available,
        i.reserved,
        p.stock

    into
        v_available,
        v_reserved,
        v_mirror

    from
        public.marketplace_inventory i

    join
        public.products p
        on p.id = i.product_id

    where
        i.product_id =
            v_product_id;


    v_remaining :=
        public.marketplace_order_reservation_remaining(
            v_order_release_id,
            v_product_id
        );


    if (
        v_available <> 5
        or v_reserved <> 2
        or v_mirror <> 5
        or v_remaining <> 2
    ) then

        raise exception
            'A8: second checkout reserve state invalid';

    end if;


    -- ========================================================
    -- 11. BLANK RELEASE REASON
    -- ========================================================

    begin

        perform
            public.marketplace_release_order_reservation(
                v_order_release_id,
                '   '
            );

        raise exception
            'A8_EXPECTED_RELEASE_REASON_FAILURE';

    exception

        when others then

            if sqlerrm =
                'A8_EXPECTED_RELEASE_REASON_FAILURE'
            then

                raise;

            end if;

            if position(
                'reason'
                in lower(sqlerrm)
            ) = 0 then

                raise exception
                    'A8: unexpected release reason error: %',
                    sqlerrm;

            end if;

    end;


    -- ========================================================
    -- 12. RELEASE QUANTITY 2
    -- ========================================================

    v_result :=
        public.marketplace_release_order_reservation(
            v_order_release_id,
            'A8 cancelled sale'
        );


    if v_result <> 2 then

        raise exception
            'A8: release result expected 2, got %',
            v_result;

    end if;


    select
        i.available,
        i.reserved,
        p.stock

    into
        v_available,
        v_reserved,
        v_mirror

    from
        public.marketplace_inventory i

    join
        public.products p
        on p.id = i.product_id

    where
        i.product_id =
            v_product_id;


    v_remaining :=
        public.marketplace_order_reservation_remaining(
            v_order_release_id,
            v_product_id
        );


    if (
        v_available <> 7
        or v_reserved <> 0
        or v_mirror <> 7
        or v_remaining <> 0
    ) then

        raise exception
            'A8: release state invalid';

    end if;


    select
        count(*)

    into
        v_count

    from
        public.marketplace_stock_movements sm

    where
        sm.order_id =
            v_order_release_id

      and
        sm.product_id =
            v_product_id

      and
        sm.movement_type =
            'release'

      and
        sm.quantity =
            2

      and
        sm.reason like
            'ORDER_RESERVATION_RELEASED:%';


    if v_count <> 1 then

        raise exception
            'A8: release ledger invalid';

    end if;


    -- ========================================================
    -- 13. RELEASE AGAIN => 0
    -- ========================================================

    v_result :=
        public.marketplace_release_order_reservation(
            v_order_release_id,
            'A8 duplicate release'
        );


    if v_result <> 0 then

        raise exception
            'A8: duplicate release was not idempotent';

    end if;


    -- ========================================================
    -- 14. CONSUME AFTER RELEASE => 0
    -- ========================================================

    v_result :=
        public.marketplace_consume_order_reservation(
            v_order_release_id,
            'A8 consume after release'
        );


    if v_result <> 0 then

        raise exception
            'A8: consume after release was not no-op';

    end if;


    select
        count(*)

    into
        v_count

    from
        public.marketplace_stock_movements sm

    where
        sm.order_id =
            v_order_release_id

      and
        sm.product_id =
            v_product_id

      and
        sm.movement_type =
            'out'

      and
        sm.reason like
            'ORDER_RESERVATION_CONSUMED:%';


    if v_count <> 0 then

        raise exception
            'A8: consume movement created after release';

    end if;


    -- ========================================================
    -- 15. FINAL STATE INSIDE FIXTURE
    --
    -- Original stock: 10
    -- Permanently sold: 3
    -- Released checkout: 2
    --
    -- Final available: 7
    -- Final reserved: 0
    -- Mirror: 7
    -- ========================================================

    select
        i.available,
        i.reserved,
        p.stock

    into
        v_available,
        v_reserved,
        v_mirror

    from
        public.marketplace_inventory i

    join
        public.products p
        on p.id = i.product_id

    where
        i.product_id =
            v_product_id;


    if (
        v_available <> 7
        or v_reserved <> 0
        or v_mirror <> 7
    ) then

        raise exception
            'A8: final inventory state invalid';

    end if;


    raise notice
        'A8_REAL_CHECKOUT_RESERVATION_VERIFIED';

    raise notice
        'A8_CONSUME_VERIFIED';

    raise notice
        'A8_RELEASE_VERIFIED';

    raise notice
        'A8_IDEMPOTENCY_VERIFIED';

    raise notice
        'A8_FIRST_TERMINAL_ACTION_WINS_VERIFIED';

end;

$verify$;


-- ============================================================
-- Roll back ALL fixture business rows.
--
-- The migration itself continues successfully.
-- ============================================================

rollback to savepoint bazar_b1_a8_fixture;

release savepoint bazar_b1_a8_fixture;


do $certification$

begin

    raise notice
        'BAZAR-B1-A8-A2D-R2-VERIFIED';

    raise notice
        'REAL_CHECKOUT_RESERVATION_VERIFIED=True';

    raise notice
        'CONSUME_VERIFIED=True';

    raise notice
        'RELEASE_VERIFIED=True';

    raise notice
        'LEDGER_DERIVED_IDEMPOTENCY_VERIFIED=True';

    raise notice
        'FIRST_TERMINAL_ACTION_WINS=True';

    raise notice
        'PERSISTENT_TEST_ROWS=0';

end;

$certification$;


commit;