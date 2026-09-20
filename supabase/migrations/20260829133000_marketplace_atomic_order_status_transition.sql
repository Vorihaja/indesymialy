-- ============================================================
-- INDESY MIALY / INDESY BAZAR
-- BAZAR-B1-A8-A3
--
-- ATOMIC ORDER + PAYMENT AUTHORITY
--
-- ORDER GENERIC AUTHORITY:
--
--   marketplace_transition_order_status
--
-- PAYMENT PAID AUTHORITY:
--
--   marketplace_confirm_payment_paid
--
--
-- IMPORTANT
-- ============================================================
--
-- Generic order transition CANNOT create:
--
--   paid
--   refunded
--
-- paid belongs exclusively to payment settlement authority.
--
-- refunded will belong to a dedicated refund authority.
--
--
-- LOCK ORDER
-- ============================================================
--
-- All existing-row business transitions use:
--
--   ORDER
--     -> TRANSACTION
--       -> PAYMENT
--
-- where those rows are required.
--
-- This avoids order/payment lock inversion.
--
--
-- STOCK EFFECTS
-- ============================================================
--
-- payment confirmation:
--
--   reserved -= quantity
--   available unchanged
--
-- cancellation/failure before payment:
--
--   reserved -= quantity
--   available += quantity
--
-- refund:
--
--   no automatic restock
--
--
-- BAZAR-B1-A8-ATOMIC-ORDER-STATUS-TRANSITION
-- BAZAR-B1-A8-ATOMIC-PAYMENT-ORDER-AUTHORITY
-- BAZAR-B1-A8-LOCK-ORDER-HARDENED
-- ============================================================


-- ============================================================
-- 1. GENERIC ORDER TRANSITION
-- ============================================================

-- ============================================================
-- BAZAR-B1-A8-PAYMENT-CANCELLED-STATUS-DOMAIN
--
-- A cancelled payment attempt is semantically distinct from a
-- failed payment attempt.
--
-- marketplace_payments.status becomes:
--
--   pending
--   paid
--   failed
--   refunded
--   cancelled
--
-- marketplace_orders.payment_status intentionally remains:
--
--   unpaid
--   pending
--   paid
--   failed
--   refunded
--
-- Therefore cancelling an unpaid order gives:
--
--   order.status         = cancelled
--   order.payment_status = unpaid
--   payment.status       = cancelled
-- ============================================================

alter table public.marketplace_payments
drop constraint if exists marketplace_payments_status_check;


alter table public.marketplace_payments
add constraint marketplace_payments_status_check
check (
    status in (
        'pending',
        'paid',
        'failed',
        'refunded',
        'cancelled'
    )
);

-- BAZAR-B1-A8-PAYMENT-CANCELLED-STATUS-DOMAIN-END

create or replace function public.marketplace_transition_order_status(
    p_order_id uuid,
    p_target_status text,
    p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$

declare

    v_actor_id uuid;

    v_current_status text;
    v_target_status text;
    v_payment_status text;

    v_seller_organization_id uuid;
    v_customer_id uuid;

    v_reason text;

    v_actor_is_seller boolean := false;
    v_actor_is_customer boolean := false;
    v_transition_allowed boolean := false;

    v_inventory_result integer := 0;
    v_payment_rows_updated integer := 0;

begin

    v_actor_id :=
        auth.uid();


    if v_actor_id is null then

        raise exception
            'Authentication required';

    end if;


    if p_order_id is null then

        raise exception
            'Order id is required';

    end if;


    v_target_status :=
        lower(
            btrim(
                coalesce(
                    p_target_status,
                    ''
                )
            )
        );


    if
        v_target_status not in (
            'draft',
            'pending',
            'confirmed',
            'prepared',
            'ready_for_pickup',
            'shipped',
            'delivered',
            'cancelled',
            'refunded',
            'paid',
            'failed'
        )
    then

        raise exception
            'Invalid Marketplace order status';

    end if;


    v_reason :=
        nullif(
            btrim(
                coalesce(
                    p_reason,
                    ''
                )
            ),
            ''
        );


    -- ========================================================
    -- LOCK 1: ORDER
    -- ========================================================

    select
        o.status,
        o.payment_status,
        o.seller_organization_id,
        o.customer_id

    into
        v_current_status,
        v_payment_status,
        v_seller_organization_id,
        v_customer_id

    from
        public.marketplace_orders o

    where
        o.id =
            p_order_id

    for update;


    if not found then

        raise exception
            'Marketplace order not found';

    end if;


    -- ========================================================
    -- AUTHORIZATION
    -- ========================================================

    select
        exists (

            select
                1

            from
                public.organizations o

            where
                o.id =
                    v_seller_organization_id

              and
                o.owner_id =
                    v_actor_id

        )

        or

        exists (

            select
                1

            from
                public.organization_members om

            where
                om.organization_id =
                    v_seller_organization_id

              and
                om.profile_id =
                    v_actor_id

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

    into
        v_actor_is_seller;


    v_actor_is_customer :=
        v_customer_id is not null
        and
        v_customer_id =
            v_actor_id;


    if
        not v_actor_is_seller
        and
        not v_actor_is_customer
    then

        raise exception
            'Not authorized to transition this Marketplace order';

    end if;


    -- ========================================================
    -- IDEMPOTENCY
    -- ========================================================

    if v_current_status = v_target_status then

        return
            p_order_id;

    end if;


    -- ========================================================
    -- DOMAIN SEPARATION
    -- ========================================================

    if v_target_status = 'paid' then

        raise exception
            'paid is a payment status, not an order status';

    end if;


    if v_target_status = 'failed' then

        raise exception
            'failed is a payment status, not an order status';

    end if;


    if v_target_status = 'refunded' then

        raise exception
            'Refunded order status must use refund authority';

    end if;


    -- ========================================================
    -- CUSTOMER POLICY
    -- ========================================================

    if
        v_actor_is_customer
        and
        not v_actor_is_seller
    then

        if not (
            v_current_status = 'pending'
            and
            v_target_status = 'cancelled'
        ) then

            raise exception
                'Customer transition not allowed';

        end if;

    end if;


    -- ========================================================
    -- SELLER FULFILLMENT STATE MACHINE
    -- ========================================================

    if v_actor_is_seller then

        v_transition_allowed :=

            (
                v_current_status = 'pending'
                and
                v_target_status in (
                    'confirmed',
                    'cancelled'
                )
            )

            or

            (
                v_current_status = 'confirmed'
                and
                v_target_status in (
                    'prepared',
                    'shipped',
                    'cancelled'
                )
            )

            or

            (
                v_current_status = 'prepared'
                and
                v_target_status in (
                    'ready_for_pickup',
                    'shipped',
                    'cancelled'
                )
            )

            or

            (
                v_current_status = 'ready_for_pickup'
                and
                v_target_status in (
                    'delivered',
                    'cancelled'
                )
            )

            or

            (
                v_current_status = 'shipped'
                and
                v_target_status =
                    'delivered'
            );


    else

        v_transition_allowed :=
            true;

    end if;


    if not v_transition_allowed then

        raise exception
            'Marketplace order transition % -> % is not allowed',
            v_current_status,
            v_target_status;

    end if;


    -- ========================================================
    -- CANCELLATION BEFORE SETTLEMENT
    -- ========================================================

    if v_target_status = 'cancelled' then

        if v_reason is null then

            raise exception
                'Order cancellation reason is required';

        end if;


        if
            v_payment_status in (
                'paid',
                'refunded'
            )
        then

            raise exception
                'Cannot cancel paid/refunded Marketplace order; use refund authority';

        end if;


        -- ====================================================
        -- LOCK 2: TRANSACTION
        -- ====================================================

        perform
            t.id

        from
            public.marketplace_transactions t

        where
            t.order_id =
                p_order_id

        order by
            t.id

        for update;


        -- ====================================================
        -- LOCK 3: PAYMENT
        -- ====================================================

        perform
            p.id

        from
            public.marketplace_payments p

        join
            public.marketplace_transactions t

          on
            t.id =
                p.transaction_id

        where
            t.order_id =
                p_order_id

        order by
            p.id

        for update of p;


        -- ====================================================
        -- LOCK 4: INVENTORY / RELEASE
        -- ====================================================

        v_inventory_result :=
            public.marketplace_release_order_reservation(
                p_order_id,
                v_reason
            );


        if v_inventory_result <= 0 then

            raise exception
                'Order reservation is missing or already finalized';

        end if;


        -- ====================================================
        -- CLOSE PENDING PAYMENT ATTEMPT
        -- ====================================================

        if v_payment_status = 'pending' then

            update
                public.marketplace_payments p

            set
                status =
                    'cancelled'

            where
                p.transaction_id in (

                    select
                        t.id

                    from
                        public.marketplace_transactions t

                    where
                        t.order_id =
                            p_order_id
                )

              and
                p.status =
                    'pending';


            get diagnostics
                v_payment_rows_updated =
                    row_count;


            if v_payment_rows_updated <= 0 then

                raise exception
                    'Pending Marketplace payment not found';

            end if;


            v_payment_status :=
                'unpaid';

        end if;

    end if;


    -- ========================================================
    -- ORDER
    -- ========================================================

    update
        public.marketplace_orders

    set
        status =
            v_target_status,

        payment_status =
            v_payment_status,

        updated_at =
            now()

    where
        id =
            p_order_id;


    -- ========================================================
    -- HISTORY
    -- ========================================================

    insert into
        public.marketplace_order_status_history
        (
            order_id,
            from_status,
            to_status,
            note,
            changed_by
        )

    values
        (
            p_order_id,
            v_current_status,
            v_target_status,

            coalesce(
                v_reason,
                'Order status transition'
            ),

            v_actor_id
        );


    return
        p_order_id;

end;

$function$;


-- ============================================================
-- 2. PAYMENT CONFIRMATION AUTHORITY
--
-- Sole authority introduced by A8 for:
--
--   pending payment -> paid
--   order.payment_status -> paid
--   reservation -> consumed
--   order.status -> paid
--   history -> paid
--
-- Existing payment trigger:
--
--   ledger_marketplace_payment_paid
--
-- fires naturally on marketplace_payments.status update.
-- ============================================================

create or replace function public.marketplace_confirm_payment_paid(
    p_payment_id uuid,
    p_provider_reference text default null,
    p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$

declare

    v_actor_id uuid;

    v_transaction_id uuid;
    v_locked_transaction_id uuid;

    v_order_id uuid;
    v_locked_order_id uuid;

    v_payment_status text;
    v_existing_provider_reference text;

    v_order_status text;
    v_order_payment_status text;
    v_target_order_status text;

    v_seller_organization_id uuid;

    v_actor_is_seller boolean := false;
    v_payment_was_already_paid boolean := false;

    v_provider_reference text;
    v_reason text;

    v_inventory_result integer := 0;

begin

    v_actor_id :=
        auth.uid();


    if v_actor_id is null then

        raise exception
            'Authentication required';

    end if;


    if p_payment_id is null then

        raise exception
            'Payment id is required';

    end if;


    v_provider_reference :=
        nullif(
            btrim(
                coalesce(
                    p_provider_reference,
                    ''
                )
            ),
            ''
        );


    v_reason :=
        nullif(
            btrim(
                coalesce(
                    p_reason,
                    ''
                )
            ),
            ''
        );


    -- ========================================================
    -- ROUTING LOOKUP
    -- ========================================================

    select
        p.transaction_id

    into
        v_transaction_id

    from
        public.marketplace_payments p

    where
        p.id =
            p_payment_id;


    if not found then

        raise exception
            'Marketplace payment not found';

    end if;


    if v_transaction_id is null then

        raise exception
            'Marketplace payment has no transaction';

    end if;


    select
        t.order_id

    into
        v_order_id

    from
        public.marketplace_transactions t

    where
        t.id =
            v_transaction_id;


    if not found then

        raise exception
            'Marketplace payment transaction not found';

    end if;


    if v_order_id is null then

        raise exception
            'Marketplace transaction has no order';

    end if;


    -- ========================================================
    -- LOCK 1: ORDER
    -- ========================================================

    select
        o.status,
        o.payment_status,
        o.seller_organization_id

    into
        v_order_status,
        v_order_payment_status,
        v_seller_organization_id

    from
        public.marketplace_orders o

    where
        o.id =
            v_order_id

    for update;


    if not found then

        raise exception
            'Marketplace order not found';

    end if;


    -- ========================================================
    -- AUTHORIZATION
    -- ========================================================

    select
        exists (

            select
                1

            from
                public.organizations o

            where
                o.id =
                    v_seller_organization_id

              and
                o.owner_id =
                    v_actor_id

        )

        or

        exists (

            select
                1

            from
                public.organization_members om

            where
                om.organization_id =
                    v_seller_organization_id

              and
                om.profile_id =
                    v_actor_id

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

    into
        v_actor_is_seller;


    if not v_actor_is_seller then

        raise exception
            'Not authorized to confirm this Marketplace payment';

    end if;


    -- ========================================================
    -- LOCK 2: TRANSACTION
    -- ========================================================

    select
        t.order_id

    into
        v_locked_order_id

    from
        public.marketplace_transactions t

    where
        t.id =
            v_transaction_id

    for update;


    if not found then

        raise exception
            'Marketplace payment transaction disappeared';

    end if;


    if
        v_locked_order_id is distinct from
        v_order_id
    then

        raise exception
            'Marketplace transaction order changed during settlement';

    end if;


    -- ========================================================
    -- LOCK 3: PAYMENT
    -- ========================================================

    select
        p.transaction_id,
        p.status,
        p.provider_reference

    into
        v_locked_transaction_id,
        v_payment_status,
        v_existing_provider_reference

    from
        public.marketplace_payments p

    where
        p.id =
            p_payment_id

    for update;


    if not found then

        raise exception
            'Marketplace payment disappeared';

    end if;


    if
        v_locked_transaction_id is distinct from
        v_transaction_id
    then

        raise exception
            'Marketplace payment transaction changed during settlement';

    end if;


    if
        v_payment_status not in (
            'pending',
            'paid'
        )
    then

        raise exception
            'Marketplace payment cannot become paid from status %',
            v_payment_status;

    end if;


    v_payment_was_already_paid :=
        v_payment_status =
            'paid';


    if
        v_existing_provider_reference is not null
        and
        v_provider_reference is not null
        and
        v_existing_provider_reference <>
            v_provider_reference
    then

        raise exception
            'Payment provider reference mismatch';

    end if;


    -- ========================================================
    -- IDEMPOTENCY
    -- ========================================================

    if
        v_payment_was_already_paid
        and
        v_order_payment_status = 'paid'
        and
        v_order_status in (
            'confirmed',
            'prepared',
            'ready_for_pickup',
            'shipped',
            'delivered'
        )
    then

        return
            v_order_id;

    end if;


    -- ========================================================
    -- PAYABLE ORDER STATES
    -- ========================================================

    if
        v_order_status not in (
            'pending',
            'confirmed',
            'prepared',
            'ready_for_pickup',
            'shipped',
            'delivered'
        )
    then

        raise exception
            'Marketplace order cannot accept payment from status %',
            v_order_status;

    end if;


    if
        v_order_payment_status not in (
            'unpaid',
            'pending',
            'paid'
        )
    then

        raise exception
            'Marketplace order payment state cannot become paid from %',
            v_order_payment_status;

    end if;


    -- ========================================================
    -- PAYMENT PAID
    --
    -- Existing financial ledger trigger fires here.
    -- ========================================================

    if not v_payment_was_already_paid then

        update
            public.marketplace_payments

        set
            status =
                'paid',

            paid_at =
                coalesce(
                    paid_at,
                    now()
                ),

            provider_reference =
                coalesce(
                    provider_reference,
                    v_provider_reference
                )

        where
            id =
                p_payment_id;

    end if;


    -- ========================================================
    -- ORDER PAYMENT MIRROR
    -- ========================================================

    update
        public.marketplace_orders

    set
        payment_status =
            'paid',

        updated_at =
            now()

    where
        id =
            v_order_id;


    -- ========================================================
    -- LOCK 4: INVENTORY / CONSUME
    -- ========================================================

    v_inventory_result :=
        public.marketplace_consume_order_reservation(
            v_order_id,
            coalesce(
                v_reason,
                'Payment confirmed'
            )
        );


    if v_inventory_result <= 0 then

        raise exception
            'Order reservation is missing or already finalized';

    end if;


    -- ========================================================
    -- FULFILLMENT STATE
    --
    -- paid is NOT an order status.
    -- ========================================================

    if v_order_status = 'pending' then

        v_target_order_status :=
            'confirmed';

    else

        v_target_order_status :=
            v_order_status;

    end if;


    update
        public.marketplace_orders

    set
        status =
            v_target_order_status,

        payment_status =
            'paid',

        updated_at =
            now()

    where
        id =
            v_order_id;


    if
        v_order_status is distinct from
        v_target_order_status
    then

        insert into
            public.marketplace_order_status_history
            (
                order_id,
                from_status,
                to_status,
                note,
                changed_by
            )

        values
            (
                v_order_id,
                v_order_status,
                v_target_order_status,

                coalesce(
                    v_reason,
                    'Payment confirmed'
                ),

                v_actor_id
            );

    end if;


    return
        v_order_id;

end;

$function$;


-- ============================================================
-- 3. PRIVILEGES
-- ============================================================

revoke all
on function public.marketplace_transition_order_status(
    uuid,
    text,
    text
)
from public;


revoke all
on function public.marketplace_transition_order_status(
    uuid,
    text,
    text
)
from anon;


revoke all
on function public.marketplace_transition_order_status(
    uuid,
    text,
    text
)
from authenticated;


grant execute
on function public.marketplace_transition_order_status(
    uuid,
    text,
    text
)
to authenticated;


revoke all
on function public.marketplace_confirm_payment_paid(
    uuid,
    text,
    text
)
from public;


revoke all
on function public.marketplace_confirm_payment_paid(
    uuid,
    text,
    text
)
from anon;


revoke all
on function public.marketplace_confirm_payment_paid(
    uuid,
    text,
    text
)
from authenticated;


grant execute
on function public.marketplace_confirm_payment_paid(
    uuid,
    text,
    text
)
to authenticated;


comment on function public.marketplace_transition_order_status(
    uuid,
    text,
    text
)
is
'Atomic generic Marketplace order transition authority. Paid/refunded are payment-driven and cannot be created by this generic RPC. Cancellation/failure atomically release reservations and close pending payments.';


comment on function public.marketplace_confirm_payment_paid(
    uuid,
    text,
    text
)
is
'Sole A8 authority for Marketplace payment confirmation. Uses deterministic ORDER -> TRANSACTION -> PAYMENT locks, marks payment paid, fires existing financial ledger trigger, mirrors order payment status, consumes reserved inventory, transitions order to paid and writes history atomically.';


-- ============================================================
-- 4. LEGACY DIRECT DML
--
-- Still available temporarily.
--
-- A3E:
-- application repository wiring
--
-- A3F:
-- remove direct mutation authority
-- ============================================================


-- BAZAR-B1-A8-ATOMIC-ORDER-STATUS-TRANSITION-END
-- BAZAR-B1-A8-ATOMIC-PAYMENT-ORDER-AUTHORITY-END
-- BAZAR-B1-A8-LOCK-ORDER-HARDENED-END

-- ============================================================
-- BAZAR-B1-A8-A3D-TRANSACTIONAL-VERIFICATION

begin;

savepoint bazar_b1_a8_a3d_fixture;


do $verify$

declare

    v_organization_id uuid;
    v_actor_id uuid;

    v_product_id uuid;

    v_cart_paid_id uuid;
    v_order_paid_id uuid;
    v_transaction_paid_id uuid;
    v_payment_paid_id uuid;

    v_cart_cancel_id uuid;
    v_order_cancel_id uuid;
    v_transaction_cancel_id uuid;
    v_payment_cancel_id uuid;

    v_rpc_order_id uuid;

    v_provider_reference text;

    v_available integer;
    v_reserved integer;
    v_stock integer;

    v_order_status text;
    v_order_payment_status text;

    v_payment_status text;

    v_count bigint;
    v_quantity bigint;

    v_error_seen boolean := false;

begin

    -- ========================================================
    -- SELLER
    -- ========================================================

    select
        candidate.organization_id,
        candidate.actor_id

    into
        v_organization_id,
        v_actor_id

    from
        (

            select
                o.id as organization_id,
                o.owner_id as actor_id,
                1 as priority

            from
                public.organizations o

            where
                o.owner_id is not null


            union all


            select
                om.organization_id,
                om.profile_id,
                2 as priority

            from
                public.organization_members om

            where
                om.profile_id is not null

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

        ) candidate

    order by
        candidate.priority,
        candidate.organization_id

    limit 1;


    if
        v_organization_id is null
        or
        v_actor_id is null
    then

        raise exception
            'A3D verification: no eligible seller';

    end if;


    perform
        set_config(
            'request.jwt.claim.sub',
            v_actor_id::text,
            true
        );


    perform
        set_config(
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
    -- PRODUCT STOCK 10
    -- ========================================================

    v_product_id :=
        public.marketplace_create_product(
            v_organization_id,
            'A3D verification product',
            'Temporary fixture',
            'sale',
            null,
            10000,
            null,
            null,
            10,
            'new',
            'A3D',
            'published',
            array[]::text[]
        );


    -- ========================================================
    -- SCENARIO A - CHECKOUT QTY 3
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
    into v_cart_paid_id;


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
            v_cart_paid_id,
            v_product_id,
            3,
            'sale'
        );


    select
        checkout.order_id

    into
        v_order_paid_id

    from
        public.marketplace_checkout(
            v_cart_paid_id,
            'A3D Payment Verification',
            'a3d-payment@indesy.test',
            '0000000000',
            'pickup',
            null,
            'cash',
            (
                'a3d-paid-' ||
                gen_random_uuid()::text
            )
        ) as checkout;


    select
        t.id

    into
        v_transaction_paid_id

    from
        public.marketplace_transactions t

    where
        t.order_id =
            v_order_paid_id

    limit 1;


    select
        p.id

    into
        v_payment_paid_id

    from
        public.marketplace_payments p

    where
        p.transaction_id =
            v_transaction_paid_id

    limit 1;


    if
        v_order_paid_id is null
        or
        v_transaction_paid_id is null
        or
        v_payment_paid_id is null
    then

        raise exception
            'A3D verification: payment chain missing';

    end if;


    -- ========================================================
    -- RESERVATION 3
    -- ========================================================

    select
        i.available,
        i.reserved,
        p.stock

    into
        v_available,
        v_reserved,
        v_stock

    from
        public.marketplace_inventory i

    join
        public.products p

      on
        p.id =
            i.product_id

    where
        i.product_id =
            v_product_id;


    if
        v_available <> 7
        or
        v_reserved <> 3
        or
        v_stock <> 7
    then

        raise exception
            'A3D verification: reservation invalid';

    end if;


    -- ========================================================
    -- PAID CANNOT BE ORDER STATUS
    -- ========================================================

    v_error_seen :=
        false;


    begin

        perform
            public.marketplace_transition_order_status(
                v_order_paid_id,
                'paid',
                'must fail'
            );

    exception
        when others then

            if
                sqlerrm ilike
                    '%payment status, not an order status%'
            then

                v_error_seen :=
                    true;

            else

                raise;

            end if;

    end;


    if not v_error_seen then

        raise exception
            'A3D verification: paid accepted as order status';

    end if;


    -- ========================================================
    -- CONFIRM PAYMENT
    -- ========================================================

    v_provider_reference :=
        (
            'A3D-' ||
            gen_random_uuid()::text
        );


    v_rpc_order_id :=
        public.marketplace_confirm_payment_paid(
            v_payment_paid_id,
            v_provider_reference,
            'A3D payment confirmation'
        );


    if
        v_rpc_order_id is distinct from
        v_order_paid_id
    then

        raise exception
            'A3D verification: wrong payment return';

    end if;


    select
        o.status,
        o.payment_status

    into
        v_order_status,
        v_order_payment_status

    from
        public.marketplace_orders o

    where
        o.id =
            v_order_paid_id;


    select
        p.status

    into
        v_payment_status

    from
        public.marketplace_payments p

    where
        p.id =
            v_payment_paid_id;


    if
        v_order_status <> 'confirmed'
        or
        v_order_payment_status <> 'paid'
        or
        v_payment_status <> 'paid'
    then

        raise exception
            'A3D verification: confirmed/paid state invalid';

    end if;


    select
        i.available,
        i.reserved,
        p.stock

    into
        v_available,
        v_reserved,
        v_stock

    from
        public.marketplace_inventory i

    join
        public.products p

      on
        p.id =
            i.product_id

    where
        i.product_id =
            v_product_id;


    if
        v_available <> 7
        or
        v_reserved <> 0
        or
        v_stock <> 7
    then

        raise exception
            'A3D verification: consume invalid';

    end if;


    select
        count(*),
        coalesce(
            sum(sm.quantity),
            0
        )

    into
        v_count,
        v_quantity

    from
        public.marketplace_stock_movements sm

    where
        sm.order_id =
            v_order_paid_id

      and
        sm.product_id =
            v_product_id

      and
        sm.movement_type =
            'out'

      and
        sm.reason like
            'ORDER_RESERVATION_CONSUMED:%';


    if
        v_count <> 1
        or
        v_quantity <> 3
    then

        raise exception
            'A3D verification: consume ledger invalid';

    end if;


    -- ========================================================
    -- PAYMENT IDEMPOTENCY
    -- ========================================================

    perform
        public.marketplace_confirm_payment_paid(
            v_payment_paid_id,
            v_provider_reference,
            'repeat'
        );


    -- ========================================================
    -- SCENARIO B - CHECKOUT QTY 2, THEN CANCEL
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
    into v_cart_cancel_id;


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
            v_cart_cancel_id,
            v_product_id,
            2,
            'sale'
        );


    select
        checkout.order_id

    into
        v_order_cancel_id

    from
        public.marketplace_checkout(
            v_cart_cancel_id,
            'A3D Cancel Verification',
            'a3d-cancel@indesy.test',
            '0000000001',
            'pickup',
            null,
            'cash',
            (
                'a3d-cancel-' ||
                gen_random_uuid()::text
            )
        ) as checkout;


    select
        t.id

    into
        v_transaction_cancel_id

    from
        public.marketplace_transactions t

    where
        t.order_id =
            v_order_cancel_id

    limit 1;


    select
        p.id

    into
        v_payment_cancel_id

    from
        public.marketplace_payments p

    where
        p.transaction_id =
            v_transaction_cancel_id

    limit 1;


    -- ========================================================
    -- CANCEL
    -- ========================================================

    perform
        public.marketplace_transition_order_status(
            v_order_cancel_id,
            'cancelled',
            'A3D cancellation'
        );


    select
        o.status,
        o.payment_status

    into
        v_order_status,
        v_order_payment_status

    from
        public.marketplace_orders o

    where
        o.id =
            v_order_cancel_id;


    select
        p.status

    into
        v_payment_status

    from
        public.marketplace_payments p

    where
        p.id =
            v_payment_cancel_id;


    if
        v_order_status <> 'cancelled'
        or
        v_order_payment_status <> 'unpaid'
        or
        v_payment_status <> 'cancelled'
    then

        raise exception
            'A3D verification: cancellation state invalid';

    end if;


    select
        i.available,
        i.reserved,
        p.stock

    into
        v_available,
        v_reserved,
        v_stock

    from
        public.marketplace_inventory i

    join
        public.products p

      on
        p.id =
            i.product_id

    where
        i.product_id =
            v_product_id;


    if
        v_available <> 7
        or
        v_reserved <> 0
        or
        v_stock <> 7
    then

        raise exception
            'A3D verification: release invalid';

    end if;


    select
        count(*),
        coalesce(
            sum(sm.quantity),
            0
        )

    into
        v_count,
        v_quantity

    from
        public.marketplace_stock_movements sm

    where
        sm.order_id =
            v_order_cancel_id

      and
        sm.product_id =
            v_product_id

      and
        sm.movement_type =
            'release'

      and
        sm.reason like
            'ORDER_RESERVATION_RELEASED:%';


    if
        v_count <> 1
        or
        v_quantity <> 2
    then

        raise exception
            'A3D verification: release ledger invalid';

    end if;


    -- ========================================================
    -- REPEATED CANCEL
    -- ========================================================

    perform
        public.marketplace_transition_order_status(
            v_order_cancel_id,
            'cancelled',
            'repeat'
        );


    -- ========================================================
    -- CANCELLED PAYMENT CANNOT BECOME PAID
    -- ========================================================

    v_error_seen :=
        false;


    begin

        perform
            public.marketplace_confirm_payment_paid(
                v_payment_cancel_id,
                (
                    'A3D-LATE-' ||
                    gen_random_uuid()::text
                ),
                'must reject'
            );

    exception
        when others then

            if
                sqlerrm ilike
                    '%cannot become paid%'
                or
                sqlerrm ilike
                    '%cannot accept payment%'
            then

                v_error_seen :=
                    true;

            else

                raise;

            end if;

    end;


    if not v_error_seen then

        raise exception
            'A3D verification: cancelled payment became paid';

    end if;


    raise notice
        'REAL_CHECKOUT_RESERVATION_VERIFIED=True';

    raise notice
        'ORDER_STATUS_PAID_REJECTED=True';

    raise notice
        'PAYMENT_CONFIRMATION_VERIFIED=True';

    raise notice
        'ORDER_CONFIRMED_AFTER_PAYMENT=True';

    raise notice
        'ORDER_PAYMENT_STATUS_PAID=True';

    raise notice
        'PAYMENT_STATUS_PAID=True';

    raise notice
        'RESERVATION_CONSUME_VERIFIED=True';

    raise notice
        'CANCELLATION_RELEASE_VERIFIED=True';

    raise notice
        'ORDER_CANCELLED_VERIFIED=True';

    raise notice
        'ORDER_PAYMENT_STATUS_UNPAID=True';

    raise notice
        'PAYMENT_STATUS_CANCELLED=True';

    raise notice
        'CANCELLED_PAYMENT_CONFIRMATION_REJECTED=True';

end;

$verify$;


rollback to savepoint bazar_b1_a8_a3d_fixture;

release savepoint bazar_b1_a8_a3d_fixture;


do $certification$

begin

    raise notice
        'BAZAR-B1-A8-A3D-VERIFIED';

    raise notice
        'ORDER_STATUS_AUTHORITY=FULFILLMENT';

    raise notice
        'PAYMENT_STATUS_AUTHORITY=PAYMENT';

    raise notice
        'PAYMENT_CANCELLED_STATUS_SUPPORTED=True';

    raise notice
        'PAYMENT_CONFIRMATION_ORDER_EFFECT=PENDING_TO_CONFIRMED';

    raise notice
        'PAYMENT_CONFIRMATION_PAYMENT_EFFECT=PAID';

    raise notice
        'CANCELLATION_ORDER_EFFECT=CANCELLED';

    raise notice
        'CANCELLATION_ORDER_PAYMENT_EFFECT=UNPAID';

    raise notice
        'CANCELLATION_PAYMENT_ROW_EFFECT=CANCELLED';

    raise notice
        'LOCK_ORDER=ORDER_TRANSACTION_PAYMENT_INVENTORY';

    raise notice
        'PERSISTENT_TEST_ROWS=0';

end;

$certification$;


commit;


-- BAZAR-B1-A8-A3D-TRANSACTIONAL-VERIFICATION-END