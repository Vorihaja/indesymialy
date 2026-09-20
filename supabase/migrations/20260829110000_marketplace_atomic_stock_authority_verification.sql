-- ============================================================
-- INDESY MIALY / INDESY BAZAR
-- BAZAR-B1-A7-A2D
--
-- REAL TRANSACTIONAL STOCK AUTHORITY VERIFICATION
--
-- Any failed assertion aborts the whole migration transaction.
--
-- The fixture product is created through
-- marketplace_create_product(...)
-- and is physically removed only by the migration role during
-- test cleanup.
--
-- Seller application physical deletion remains forbidden.
--
-- PERSISTENT_TEST_ROWS=0
-- ============================================================

begin;


do $verify$

declare

    v_org_id uuid;
    v_actor_id uuid;

    v_unauthorized_actor_id uuid;
    v_wrong_org_id uuid;

    v_product_id uuid;

    v_available integer;
    v_reserved integer;
    v_product_stock integer;

    v_result integer;

    v_count integer;

    v_reason_prefix text :=
        'BAZAR-B1-A7-A2D:' ||
        gen_random_uuid()::text;

    v_reason_in text;
    v_reason_out text;
    v_reason_negative text;
    v_reason_wrong_org text;
    v_reason_unauthorized text;

    v_previous_sub text :=
        current_setting(
            'request.jwt.claim.sub',
            true
        );

    v_previous_claims text :=
        current_setting(
            'request.jwt.claims',
            true
        );

begin

    v_reason_in :=
        v_reason_prefix || ':in';

    v_reason_out :=
        v_reason_prefix || ':out';

    v_reason_negative :=
        v_reason_prefix || ':negative';

    v_reason_wrong_org :=
        v_reason_prefix || ':wrong-org';

    v_reason_unauthorized :=
        v_reason_prefix || ':unauthorized';


    -- ========================================================
    -- 1. EXISTING SELLER ORGANIZATION
    --
    -- No organization fixture is created.
    --
    -- Prefer the organization owner.
    -- If owner_id is null, use an active authorized member.
    -- ========================================================

    select
        o.id,
        coalesce(
            o.owner_id,
            authorized_member.profile_id
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
            om.organization_id =
                o.id

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

        order by
            om.profile_id

        limit 1

    ) authorized_member
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
            authorized_member.profile_id
        )
        is not null

    order by
        case
            when o.owner_id is not null
                then 0
            else 1
        end,
        o.id

    limit 1;


    if (
        v_org_id is null
        or v_actor_id is null
    ) then

        raise exception
            'BAZAR-B1-A7-A2D: no eligible existing seller organization was found';

    end if;


    -- ========================================================
    -- 2. MOCK AUTHENTICATED SELLER
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
            'BAZAR-B1-A7-A2D: auth.uid mock failed';

    end if;


    -- ========================================================
    -- 3. PRIVILEGE HARDENING
    -- ========================================================

    if
        has_table_privilege(
            'authenticated',
            'public.marketplace_inventory',
            'INSERT'
        )
        or
        has_table_privilege(
            'authenticated',
            'public.marketplace_inventory',
            'UPDATE'
        )
        or
        has_table_privilege(
            'authenticated',
            'public.marketplace_inventory',
            'DELETE'
        )
    then

        raise exception
            'BAZAR-B1-A7-A2D: authenticated still has direct inventory mutation privilege';

    end if;


    if
        has_table_privilege(
            'authenticated',
            'public.marketplace_stock_movements',
            'INSERT'
        )
        or
        has_table_privilege(
            'authenticated',
            'public.marketplace_stock_movements',
            'UPDATE'
        )
        or
        has_table_privilege(
            'authenticated',
            'public.marketplace_stock_movements',
            'DELETE'
        )
    then

        raise exception
            'BAZAR-B1-A7-A2D: authenticated still has direct ledger mutation privilege';

    end if;


    if not has_function_privilege(
        'authenticated',
        'public.marketplace_adjust_stock(uuid,uuid,integer,text)',
        'EXECUTE'
    ) then

        raise exception
            'BAZAR-B1-A7-A2D: authenticated cannot execute marketplace_adjust_stock';

    end if;


    if has_function_privilege(
        'anon',
        'public.marketplace_adjust_stock(uuid,uuid,integer,text)',
        'EXECUTE'
    ) then

        raise exception
            'BAZAR-B1-A7-A2D: anon can execute marketplace_adjust_stock';

    end if;


    -- ========================================================
    -- 4. CREATE TEMPORARY PRODUCT THROUGH CERTIFIED RPC
    --
    -- category intentionally NULL:
    -- no Marketplace category fixture is required.
    -- ========================================================

    select
        public.marketplace_create_product(
            p_seller_organization_id =>
                v_org_id,

            p_title =>
                'BAZAR B1 A7 stock verification',

            p_description =>
                'Temporary stock authority verification fixture',

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
                'draft',

            p_images =>
                '{}'::text[]
        )

    into
        v_product_id;


    if v_product_id is null then

        raise exception
            'BAZAR-B1-A7-A2D: marketplace_create_product returned NULL';

    end if;


    if not exists (

        select
            1

        from
            public.marketplace_products mp

        where
            mp.product_id =
                v_product_id

    ) then

        raise exception
            'BAZAR-B1-A7-A2D: marketplace product extension was not created';

    end if;


    if not exists (

        select
            1

        from
            public.marketplace_inventory i

        where
            i.product_id =
                v_product_id

    ) then

        raise exception
            'BAZAR-B1-A7-A2D: marketplace inventory was not created';

    end if;


    -- ========================================================
    -- 5. SIMULATE RESERVED INVENTORY
    --
    -- Manual stock adjustment must NEVER change this value.
    --
    -- This direct mutation is executed by migration owner only,
    -- never by authenticated application users.
    -- ========================================================

    update
        public.marketplace_inventory

    set
        reserved =
            4,

        updated_at =
            now()

    where
        product_id =
            v_product_id;


    if not found then

        raise exception
            'BAZAR-B1-A7-A2D: unable to prepare reserved inventory';

    end if;


    -- ========================================================
    -- 6. BASELINE
    -- ========================================================

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
            v_product_id;


    select
        p.stock

    into
        v_product_stock

    from
        public.products p

    where
        p.id =
            v_product_id;


    if v_available <> 10 then

        raise exception
            'BAZAR-B1-A7-A2D: initial available expected 10, got %',
            v_available;

    end if;


    if v_reserved <> 4 then

        raise exception
            'BAZAR-B1-A7-A2D: initial reserved expected 4, got %',
            v_reserved;

    end if;


    if v_product_stock <> 10 then

        raise exception
            'BAZAR-B1-A7-A2D: initial products.stock mirror expected 10, got %',
            v_product_stock;

    end if;


    -- ========================================================
    -- 7. POSITIVE ADJUSTMENT : +5
    -- ========================================================

    select
        public.marketplace_adjust_stock(
            p_product_id =>
                v_product_id,

            p_seller_organization_id =>
                v_org_id,

            p_delta =>
                5,

            p_reason =>
                v_reason_in
        )

    into
        v_result;


    if v_result <> 15 then

        raise exception
            'BAZAR-B1-A7-A2D: +5 RPC expected return 15, got %',
            v_result;

    end if;


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
            v_product_id;


    select
        p.stock

    into
        v_product_stock

    from
        public.products p

    where
        p.id =
            v_product_id;


    if v_available <> 15 then

        raise exception
            'BAZAR-B1-A7-A2D: +5 available expected 15, got %',
            v_available;

    end if;


    if v_reserved <> 4 then

        raise exception
            'BAZAR-B1-A7-A2D: +5 changed reserved inventory';

    end if;


    if v_product_stock <> 15 then

        raise exception
            'BAZAR-B1-A7-A2D: +5 products.stock mirror expected 15, got %',
            v_product_stock;

    end if;


    select
        count(*)

    into
        v_count

    from
        public.marketplace_stock_movements sm

    where
        sm.product_id =
            v_product_id

      and
        sm.movement_type =
            'in'

      and
        sm.quantity =
            5

      and
        sm.reason =
            v_reason_in

      and
        sm.order_id is null

      and
        sm.created_by =
            v_actor_id;


    if v_count <> 1 then

        raise exception
            'BAZAR-B1-A7-A2D: +5 ledger movement expected exactly 1 row, got %',
            v_count;

    end if;


    -- ========================================================
    -- 8. NEGATIVE DELTA WITH VALID STOCK : -3
    -- ========================================================

    select
        public.marketplace_adjust_stock(
            p_product_id =>
                v_product_id,

            p_seller_organization_id =>
                v_org_id,

            p_delta =>
                -3,

            p_reason =>
                v_reason_out
        )

    into
        v_result;


    if v_result <> 12 then

        raise exception
            'BAZAR-B1-A7-A2D: -3 RPC expected return 12, got %',
            v_result;

    end if;


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
            v_product_id;


    select
        p.stock

    into
        v_product_stock

    from
        public.products p

    where
        p.id =
            v_product_id;


    if v_available <> 12 then

        raise exception
            'BAZAR-B1-A7-A2D: -3 available expected 12, got %',
            v_available;

    end if;


    if v_reserved <> 4 then

        raise exception
            'BAZAR-B1-A7-A2D: -3 changed reserved inventory';

    end if;


    if v_product_stock <> 12 then

        raise exception
            'BAZAR-B1-A7-A2D: -3 products.stock mirror expected 12, got %',
            v_product_stock;

    end if;


    select
        count(*)

    into
        v_count

    from
        public.marketplace_stock_movements sm

    where
        sm.product_id =
            v_product_id

      and
        sm.movement_type =
            'out'

      and
        sm.quantity =
            3

      and
        sm.reason =
            v_reason_out

      and
        sm.order_id is null

      and
        sm.created_by =
            v_actor_id;


    if v_count <> 1 then

        raise exception
            'BAZAR-B1-A7-A2D: -3 ledger movement expected exactly 1 row, got %',
            v_count;

    end if;


    -- ========================================================
    -- 9. NEGATIVE STOCK REJECTION + ATOMIC ROLLBACK
    -- ========================================================

    begin

        perform
            public.marketplace_adjust_stock(
                p_product_id =>
                    v_product_id,

                p_seller_organization_id =>
                    v_org_id,

                p_delta =>
                    -1000,

                p_reason =>
                    v_reason_negative
            );


        raise exception
            'BAZAR_VERIFY_NEGATIVE_STOCK_NOT_REJECTED';

    exception

        when others then

            if sqlerrm =
                'BAZAR_VERIFY_NEGATIVE_STOCK_NOT_REJECTED'
            then

                raise;

            end if;


            if position(
                'negative'
                in lower(sqlerrm)
            ) = 0 then

                raise exception
                    'BAZAR-B1-A7-A2D: unexpected negative-stock error: %',
                    sqlerrm;

            end if;

    end;


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
            v_product_id;


    select
        p.stock

    into
        v_product_stock

    from
        public.products p

    where
        p.id =
            v_product_id;


    if (
        v_available <> 12
        or v_reserved <> 4
        or v_product_stock <> 12
    ) then

        raise exception
            'BAZAR-B1-A7-A2D: failed negative adjustment changed inventory or mirror';

    end if;


    select
        count(*)

    into
        v_count

    from
        public.marketplace_stock_movements sm

    where
        sm.product_id =
            v_product_id

      and
        sm.reason =
            v_reason_negative;


    if v_count <> 0 then

        raise exception
            'BAZAR-B1-A7-A2D: failed negative adjustment created a ledger row';

    end if;


    -- ========================================================
    -- 10. EMPTY REASON REJECTION
    -- ========================================================

    begin

        perform
            public.marketplace_adjust_stock(
                p_product_id =>
                    v_product_id,

                p_seller_organization_id =>
                    v_org_id,

                p_delta =>
                    1,

                p_reason =>
                    '   '
            );


        raise exception
            'BAZAR_VERIFY_EMPTY_REASON_NOT_REJECTED';

    exception

        when others then

            if sqlerrm =
                'BAZAR_VERIFY_EMPTY_REASON_NOT_REJECTED'
            then

                raise;

            end if;


            if position(
                'reason'
                in lower(sqlerrm)
            ) = 0 then

                raise exception
                    'BAZAR-B1-A7-A2D: unexpected empty-reason error: %',
                    sqlerrm;

            end if;

    end;


    -- ========================================================
    -- 11. WRONG ORGANIZATION REJECTION
    -- ========================================================

    v_wrong_org_id :=
        gen_random_uuid();


    while v_wrong_org_id = v_org_id loop

        v_wrong_org_id :=
            gen_random_uuid();

    end loop;


    begin

        perform
            public.marketplace_adjust_stock(
                p_product_id =>
                    v_product_id,

                p_seller_organization_id =>
                    v_wrong_org_id,

                p_delta =>
                    1,

                p_reason =>
                    v_reason_wrong_org
            );


        raise exception
            'BAZAR_VERIFY_WRONG_ORG_NOT_REJECTED';

    exception

        when others then

            if sqlerrm =
                'BAZAR_VERIFY_WRONG_ORG_NOT_REJECTED'
            then

                raise;

            end if;


            if position(
                'does not own'
                in lower(sqlerrm)
            ) = 0 then

                raise exception
                    'BAZAR-B1-A7-A2D: unexpected wrong-organization error: %',
                    sqlerrm;

            end if;

    end;


    -- ========================================================
    -- 12. UNAUTHORIZED USER REJECTION
    -- ========================================================

    loop

        v_unauthorized_actor_id :=
            gen_random_uuid();


        exit when
            v_unauthorized_actor_id <> v_actor_id

            and not exists (

                select
                    1

                from
                    public.organizations o

                where
                    o.owner_id =
                        v_unauthorized_actor_id

            )

            and not exists (

                select
                    1

                from
                    public.organization_members om

                where
                    om.profile_id =
                        v_unauthorized_actor_id

            );

    end loop;


    perform set_config(
        'request.jwt.claim.sub',
        v_unauthorized_actor_id::text,
        true
    );


    perform set_config(
        'request.jwt.claims',
        json_build_object(
            'sub',
            v_unauthorized_actor_id::text,
            'role',
            'authenticated'
        )::text,
        true
    );


    begin

        perform
            public.marketplace_adjust_stock(
                p_product_id =>
                    v_product_id,

                p_seller_organization_id =>
                    v_org_id,

                p_delta =>
                    1,

                p_reason =>
                    v_reason_unauthorized
            );


        raise exception
            'BAZAR_VERIFY_UNAUTHORIZED_NOT_REJECTED';

    exception

        when others then

            if sqlerrm =
                'BAZAR_VERIFY_UNAUTHORIZED_NOT_REJECTED'
            then

                raise;

            end if;


            if position(
                'not authorized'
                in lower(sqlerrm)
            ) = 0 then

                raise exception
                    'BAZAR-B1-A7-A2D: unexpected unauthorized-user error: %',
                    sqlerrm;

            end if;

    end;


    -- Restore authorized seller identity.

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


    -- ========================================================
    -- 13. ALL FAILED OPERATIONS MUST HAVE LEFT STATE INTACT
    -- ========================================================

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
            v_product_id;


    select
        p.stock

    into
        v_product_stock

    from
        public.products p

    where
        p.id =
            v_product_id;


    if (
        v_available <> 12
        or v_reserved <> 4
        or v_product_stock <> 12
    ) then

        raise exception
            'BAZAR-B1-A7-A2D: rejected operations changed stock state';

    end if;


    select
        count(*)

    into
        v_count

    from
        public.marketplace_stock_movements sm

    where
        sm.product_id =
            v_product_id

      and
        sm.reason in (
            v_reason_negative,
            v_reason_wrong_org,
            v_reason_unauthorized
        );


    if v_count <> 0 then

        raise exception
            'BAZAR-B1-A7-A2D: rejected operations created ledger rows';

    end if;


    -- Exactly two successful verification movements must exist.

    select
        count(*)

    into
        v_count

    from
        public.marketplace_stock_movements sm

    where
        sm.product_id =
            v_product_id

      and
        sm.reason like
            v_reason_prefix || ':%';


    if v_count <> 2 then

        raise exception
            'BAZAR-B1-A7-A2D: expected exactly 2 successful stock movements, got %',
            v_count;

    end if;


    -- ========================================================
    -- 14. TEST CLEANUP
    --
    -- Migration owner cleanup only.
    --
    -- The application seller still has no physical delete path.
    --
    -- products delete cascades to:
    -- - marketplace_products
    -- - marketplace_inventory
    -- - marketplace_product_images
    -- - marketplace_stock_movements
    -- ========================================================

    delete from
        public.products

    where
        id =
            v_product_id;


    get diagnostics
        v_count =
            row_count;


    if v_count <> 1 then

        raise exception
            'BAZAR-B1-A7-A2D: test product cleanup failed';

    end if;


    -- ========================================================
    -- 15. ZERO PERSISTENT TEST ROWS
    -- ========================================================

    if exists (

        select
            1

        from
            public.products p

        where
            p.id =
                v_product_id

    ) then

        raise exception
            'BAZAR-B1-A7-A2D: persistent products test row remains';

    end if;


    if exists (

        select
            1

        from
            public.marketplace_products mp

        where
            mp.product_id =
                v_product_id

    ) then

        raise exception
            'BAZAR-B1-A7-A2D: persistent marketplace_products test row remains';

    end if;


    if exists (

        select
            1

        from
            public.marketplace_inventory i

        where
            i.product_id =
                v_product_id

    ) then

        raise exception
            'BAZAR-B1-A7-A2D: persistent inventory test row remains';

    end if;


    if exists (

        select
            1

        from
            public.marketplace_product_images mpi

        where
            mpi.product_id =
                v_product_id

    ) then

        raise exception
            'BAZAR-B1-A7-A2D: persistent product-image test row remains';

    end if;


    if exists (

        select
            1

        from
            public.marketplace_stock_movements sm

        where
            sm.product_id =
                v_product_id

           or
            sm.reason like
                v_reason_prefix || ':%'

    ) then

        raise exception
            'BAZAR-B1-A7-A2D: persistent stock movement test row remains';

    end if;


    -- ========================================================
    -- 16. RESTORE PREVIOUS JWT SETTINGS
    -- ========================================================

    perform set_config(
        'request.jwt.claim.sub',
        coalesce(
            v_previous_sub,
            ''
        ),
        true
    );


    perform set_config(
        'request.jwt.claims',
        coalesce(
            v_previous_claims,
            ''
        ),
        true
    );


    raise notice
        'BAZAR-B1-A7-A2D-STOCK-AUTHORITY-VERIFIED';


    raise notice
        'PERSISTENT_TEST_ROWS=0';

end;

$verify$;


commit;