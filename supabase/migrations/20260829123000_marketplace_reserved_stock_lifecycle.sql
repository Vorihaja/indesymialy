-- ============================================================
-- INDESY MIALY / INDESY BAZAR
-- BAZAR-B1-A8
--
-- ATOMIC RESERVED STOCK LIFECYCLE ENGINE
--
-- Authority:
--
--   marketplace_inventory.available
--   marketplace_inventory.reserved
--
-- Lifecycle:
--
--   reserve:
--       checkout already performs
--       available -= quantity
--       reserved  += quantity
--
--   consume:
--       reserved  -= outstanding
--       available unchanged
--       movement_type = out
--
--   release:
--       reserved  -= outstanding
--       available += outstanding
--       movement_type = release
--
-- Idempotency is ledger-derived.
--
-- Outstanding quantity:
--
--   SUM(reserve)
--   - SUM(release)
--   - SUM(system consume out)
--
-- The first terminal action wins.
--
-- Repeating consume/release once outstanding = 0
-- returns zero and performs no mutation.
--
-- BAZAR-B1-A8-RESERVED-STOCK-LIFECYCLE
-- ============================================================


-- ============================================================
-- 1. INTERNAL OUTSTANDING RESERVATION FUNCTION
-- ============================================================

create or replace function public.marketplace_order_reservation_remaining(
    p_order_id uuid,
    p_product_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$

declare

    v_reserved bigint := 0;
    v_released bigint := 0;
    v_consumed bigint := 0;
    v_remaining bigint := 0;

begin

    if p_order_id is null then

        raise exception
            'Order id is required';

    end if;


    if p_product_id is null then

        raise exception
            'Product id is required';

    end if;


    select
        coalesce(
            sum(
                case
                    when sm.movement_type = 'reserve'
                        then sm.quantity
                    else 0
                end
            ),
            0
        ),

        coalesce(
            sum(
                case
                    when sm.movement_type = 'release'
                        then sm.quantity
                    else 0
                end
            ),
            0
        ),

        coalesce(
            sum(
                case
                    when
                        sm.movement_type = 'out'
                        and sm.reason like
                            'ORDER_RESERVATION_CONSUMED:%'
                    then sm.quantity
                    else 0
                end
            ),
            0
        )

    into
        v_reserved,
        v_released,
        v_consumed

    from
        public.marketplace_stock_movements sm

    where
        sm.order_id =
            p_order_id

      and
        sm.product_id =
            p_product_id;


    v_remaining :=
        v_reserved -
        v_released -
        v_consumed;


    if v_remaining < 0 then

        raise exception
            'Reservation ledger is inconsistent for order % product %',
            p_order_id,
            p_product_id;

    end if;


    if v_remaining > 2147483647 then

        raise exception
            'Reservation quantity exceeds integer range';

    end if;


    return
        v_remaining::integer;

end;

$function$;


revoke all
on function public.marketplace_order_reservation_remaining(
    uuid,
    uuid
)
from public;


revoke all
on function public.marketplace_order_reservation_remaining(
    uuid,
    uuid
)
from anon;


revoke all
on function public.marketplace_order_reservation_remaining(
    uuid,
    uuid
)
from authenticated;


comment on function public.marketplace_order_reservation_remaining(
    uuid,
    uuid
)
is
'BAZAR-B1-A8 internal ledger-derived outstanding reservation quantity.';


-- ============================================================
-- 2. CONSUME ORDER RESERVATION
--
-- Example:
--
-- checkout:
--     available = 10 -> 7
--     reserved  = 0  -> 3
--
-- consume:
--     available = 7
--     reserved  = 3 -> 0
--
-- Physical units have been sold.
-- They must NOT return to available.
-- ============================================================

create or replace function public.marketplace_consume_order_reservation(
    p_order_id uuid,
    p_reason text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$

declare

    v_reason text;

    v_line record;

    v_remaining integer;

    v_inventory_available integer;
    v_inventory_reserved integer;

    v_total_consumed bigint := 0;

begin

    if p_order_id is null then

        raise exception
            'Order id is required';

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


    if v_reason is null then

        raise exception
            'Reservation consume reason is required';

    end if;


    -- --------------------------------------------------------
    -- Lock order first.
    -- This serializes terminal reservation decisions
    -- for the same order.
    -- --------------------------------------------------------

    perform
        1

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


    -- --------------------------------------------------------
    -- Product order ensures deterministic inventory lock order.
    -- --------------------------------------------------------

    for v_line in

        select
            ol.product_id,

            sum(
                ol.quantity
            )::bigint
                as ordered_quantity

        from
            public.marketplace_order_lines ol

        where
            ol.order_id =
                p_order_id

        group by
            ol.product_id

        order by
            ol.product_id

    loop

        if v_line.product_id is null then

            raise exception
                'Order line product id is required';

        end if;


        if
            v_line.ordered_quantity is null
            or v_line.ordered_quantity <= 0
        then

            raise exception
                'Invalid order line quantity for product %',
                v_line.product_id;

        end if;


        -- ----------------------------------------------------
        -- Outstanding is calculated from the immutable ledger.
        -- ----------------------------------------------------

        v_remaining :=
            public.marketplace_order_reservation_remaining(
                p_order_id,
                v_line.product_id
            );


        if v_remaining = 0 then

            continue;

        end if;


        if
            v_remaining::bigint >
            v_line.ordered_quantity
        then

            raise exception
                'Reserved quantity exceeds ordered quantity for product %',
                v_line.product_id;

        end if;


        -- ----------------------------------------------------
        -- Lock operational inventory.
        -- ----------------------------------------------------

        select
            i.available,
            i.reserved

        into
            v_inventory_available,
            v_inventory_reserved

        from
            public.marketplace_inventory i

        where
            i.product_id =
                v_line.product_id

        for update;


        if not found then

            raise exception
                'Marketplace inventory not found for product %',
                v_line.product_id;

        end if;


        if
            v_inventory_reserved <
            v_remaining
        then

            raise exception
                'Reserved inventory is lower than outstanding order reservation for product %',
                v_line.product_id;

        end if;


        -- ----------------------------------------------------
        -- CONSUME
        --
        -- available does not change.
        -- reserved decreases.
        --
        -- products.stock therefore does not change,
        -- which is correct because products.stock mirrors
        -- AVAILABLE units.
        -- ----------------------------------------------------

        update
            public.marketplace_inventory

        set
            reserved =
                reserved -
                v_remaining,

            updated_at =
                now()

        where
            product_id =
                v_line.product_id;


        insert into
            public.marketplace_stock_movements
            (
                product_id,
                movement_type,
                quantity,
                reason,
                order_id,
                created_by
            )

        values
            (
                v_line.product_id,
                'out',
                v_remaining,
                'ORDER_RESERVATION_CONSUMED: ' ||
                    v_reason,
                p_order_id,
                auth.uid()
            );


        v_total_consumed :=
            v_total_consumed +
            v_remaining;

    end loop;


    if v_total_consumed > 2147483647 then

        raise exception
            'Consumed reservation quantity exceeds integer range';

    end if;


    return
        v_total_consumed::integer;

end;

$function$;


revoke all
on function public.marketplace_consume_order_reservation(
    uuid,
    text
)
from public;


revoke all
on function public.marketplace_consume_order_reservation(
    uuid,
    text
)
from anon;


revoke all
on function public.marketplace_consume_order_reservation(
    uuid,
    text
)
from authenticated;


grant execute
on function public.marketplace_consume_order_reservation(
    uuid,
    text
)
to service_role;


comment on function public.marketplace_consume_order_reservation(
    uuid,
    text
)
is
'BAZAR-B1-A8 atomically consumes remaining reserved inventory for an order without restoring available stock. Idempotent through the stock ledger.';


-- ============================================================
-- 3. RELEASE ORDER RESERVATION
--
-- Example:
--
-- checkout:
--     available = 10 -> 7
--     reserved  = 0  -> 3
--
-- release:
--     available = 7 -> 10
--     reserved  = 3 -> 0
--
-- The product becomes sellable again.
--
-- The A7 mirror trigger automatically synchronizes
-- products.stock because available changes.
-- ============================================================

create or replace function public.marketplace_release_order_reservation(
    p_order_id uuid,
    p_reason text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$

declare

    v_reason text;

    v_line record;

    v_remaining integer;

    v_inventory_available integer;
    v_inventory_reserved integer;

    v_new_available bigint;

    v_total_released bigint := 0;

begin

    if p_order_id is null then

        raise exception
            'Order id is required';

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


    if v_reason is null then

        raise exception
            'Reservation release reason is required';

    end if;


    -- --------------------------------------------------------
    -- Serialize terminal reservation decisions.
    -- --------------------------------------------------------

    perform
        1

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


    for v_line in

        select
            ol.product_id,

            sum(
                ol.quantity
            )::bigint
                as ordered_quantity

        from
            public.marketplace_order_lines ol

        where
            ol.order_id =
                p_order_id

        group by
            ol.product_id

        order by
            ol.product_id

    loop

        if v_line.product_id is null then

            raise exception
                'Order line product id is required';

        end if;


        if
            v_line.ordered_quantity is null
            or v_line.ordered_quantity <= 0
        then

            raise exception
                'Invalid order line quantity for product %',
                v_line.product_id;

        end if;


        v_remaining :=
            public.marketplace_order_reservation_remaining(
                p_order_id,
                v_line.product_id
            );


        if v_remaining = 0 then

            continue;

        end if;


        if
            v_remaining::bigint >
            v_line.ordered_quantity
        then

            raise exception
                'Reserved quantity exceeds ordered quantity for product %',
                v_line.product_id;

        end if;


        select
            i.available,
            i.reserved

        into
            v_inventory_available,
            v_inventory_reserved

        from
            public.marketplace_inventory i

        where
            i.product_id =
                v_line.product_id

        for update;


        if not found then

            raise exception
                'Marketplace inventory not found for product %',
                v_line.product_id;

        end if;


        if
            v_inventory_reserved <
            v_remaining
        then

            raise exception
                'Reserved inventory is lower than outstanding order reservation for product %',
                v_line.product_id;

        end if;


        v_new_available :=
            v_inventory_available::bigint +
            v_remaining::bigint;


        if v_new_available > 2147483647 then

            raise exception
                'Released inventory exceeds integer range';

        end if;


        -- ----------------------------------------------------
        -- RELEASE
        --
        -- available returns.
        -- reserved decreases.
        --
        -- A7 trigger synchronizes products.stock automatically.
        -- ----------------------------------------------------

        update
            public.marketplace_inventory

        set
            available =
                available +
                v_remaining,

            reserved =
                reserved -
                v_remaining,

            updated_at =
                now()

        where
            product_id =
                v_line.product_id;


        insert into
            public.marketplace_stock_movements
            (
                product_id,
                movement_type,
                quantity,
                reason,
                order_id,
                created_by
            )

        values
            (
                v_line.product_id,
                'release',
                v_remaining,
                'ORDER_RESERVATION_RELEASED: ' ||
                    v_reason,
                p_order_id,
                auth.uid()
            );


        v_total_released :=
            v_total_released +
            v_remaining;

    end loop;


    if v_total_released > 2147483647 then

        raise exception
            'Released reservation quantity exceeds integer range';

    end if;


    return
        v_total_released::integer;

end;

$function$;


revoke all
on function public.marketplace_release_order_reservation(
    uuid,
    text
)
from public;


revoke all
on function public.marketplace_release_order_reservation(
    uuid,
    text
)
from anon;


revoke all
on function public.marketplace_release_order_reservation(
    uuid,
    text
)
from authenticated;


grant execute
on function public.marketplace_release_order_reservation(
    uuid,
    text
)
to service_role;


comment on function public.marketplace_release_order_reservation(
    uuid,
    text
)
is
'BAZAR-B1-A8 atomically releases remaining reserved inventory for an order back to available stock. Idempotent through the stock ledger.';


-- ============================================================
-- 4. IMPORTANT SECURITY CONTRACT
--
-- These are CORE lifecycle primitives.
--
-- authenticated users do NOT receive direct EXECUTE.
--
-- Later lifecycle entry points will:
--
-- - authorize the caller
-- - validate the business transition
-- - call consume/release internally
--
-- This avoids allowing a client to arbitrarily restore or
-- consume inventory for any order.
-- ============================================================


-- BAZAR-B1-A8-RESERVED-STOCK-LIFECYCLE-END