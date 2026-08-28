begin;

-- ============================================================
-- INDESY MIALY / INDESY BAZAR
-- SUPER ADMIN MARKETPLACE ANALYTICS
-- ============================================================


-- ============================================================
-- INDEXES ANALYTICS
-- ============================================================

create index if not exists
idx_marketplace_orders_created_at
on public.marketplace_orders(created_at);


create index if not exists
idx_marketplace_orders_payment_created
on public.marketplace_orders(payment_status, created_at);


create index if not exists
idx_marketplace_orders_seller_created
on public.marketplace_orders(
    seller_organization_id,
    created_at
);


create index if not exists
idx_marketplace_transactions_created
on public.marketplace_transactions(created_at);


create index if not exists
idx_marketplace_payments_created
on public.marketplace_payments(created_at);


create index if not exists
idx_marketplace_favorites_created
on public.marketplace_favorites(created_at);


create index if not exists
idx_marketplace_carts_created
on public.marketplace_carts(created_at);


create index if not exists
idx_marketplace_order_groups_created
on public.marketplace_order_groups(created_at);


create index if not exists
idx_marketplace_rentals_status
on public.marketplace_rentals(status);


create index if not exists
idx_marketplace_products_status_type
on public.marketplace_products(
    status,
    listing_type
);


-- ============================================================
-- RPC MARKETPLACE ANALYTICS
-- ============================================================

create or replace function
public.super_admin_marketplace_analytics(
    p_from timestamptz default now() - interval '30 days',
    p_to timestamptz default now()
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $function$

declare

    v_previous_from timestamptz;
    v_previous_to timestamptz;

    v_primary_currency text;

    v_orders bigint := 0;
    v_orders_previous bigint := 0;

    v_paid_orders bigint := 0;
    v_paid_orders_previous bigint := 0;

    v_gmv numeric := 0;
    v_gmv_previous numeric := 0;

    v_paid_order_total numeric := 0;
    v_fees numeric := 0;

    v_buyers bigint := 0;
    v_repeat_buyers bigint := 0;
    v_sellers bigint := 0;

    v_products bigint := 0;
    v_published_products bigint := 0;
    v_products_added bigint := 0;

    v_low_stock bigint := 0;
    v_out_of_stock bigint := 0;
    v_available_units numeric := 0;
    v_reserved_units numeric := 0;

    v_favorites bigint := 0;
    v_favorites_added bigint := 0;

    v_active_carts bigint := 0;
    v_carts_created bigint := 0;
    v_checkout_groups bigint := 0;

    v_sale_units numeric := 0;
    v_rental_units numeric := 0;

    v_active_rentals bigint := 0;
    v_returned_rentals bigint := 0;

    v_deliveries bigint := 0;
    v_completed_deliveries bigint := 0;

    v_order_statuses jsonb := '[]'::jsonb;
    v_listing_types jsonb := '[]'::jsonb;
    v_categories jsonb := '[]'::jsonb;

    v_payment_methods jsonb := '[]'::jsonb;
    v_payment_statuses jsonb := '[]'::jsonb;

    v_top_sellers jsonb := '[]'::jsonb;
    v_top_products jsonb := '[]'::jsonb;

    v_transaction_types jsonb := '[]'::jsonb;
    v_currency_breakdown jsonb := '[]'::jsonb;

    v_daily_series jsonb := '[]'::jsonb;

begin

    -- ========================================================
    -- SECURITY
    -- ========================================================

    if not public.is_super_admin() then
        raise exception 'FORBIDDEN'
            using errcode = '42501';
    end if;


    if p_to <= p_from then
        raise exception
            'La date de fin doit être postérieure à la date de début.';
    end if;


    if p_to - p_from > interval '2 years' then
        raise exception
            'La période maximale autorisée est de deux ans.';
    end if;


    v_previous_to := p_from;

    v_previous_from :=
        p_from - (p_to - p_from);


    -- ========================================================
    -- PRIMARY CURRENCY
    --
    -- On ne mélange jamais plusieurs devises dans le KPI GMV.
    -- La devise principale est celle ayant le plus grand GMV
    -- payé sur la période.
    -- ========================================================

    select o.currency
    into v_primary_currency
    from public.marketplace_orders o

    where o.created_at >= p_from
      and o.created_at < p_to
      and o.payment_status = 'paid'

    group by o.currency

    order by
        sum(o.subtotal) desc

    limit 1;


    -- ========================================================
    -- ORDERS
    -- ========================================================

    select count(*)
    into v_orders
    from public.marketplace_orders o

    where o.created_at >= p_from
      and o.created_at < p_to;


    select count(*)
    into v_orders_previous
    from public.marketplace_orders o

    where o.created_at >= v_previous_from
      and o.created_at < v_previous_to;


    select count(*)
    into v_paid_orders
    from public.marketplace_orders o

    where o.created_at >= p_from
      and o.created_at < p_to
      and o.payment_status = 'paid';


    select count(*)
    into v_paid_orders_previous
    from public.marketplace_orders o

    where o.created_at >= v_previous_from
      and o.created_at < v_previous_to
      and o.payment_status = 'paid';


    -- ========================================================
    -- MONEY
    --
    -- GMV = subtotal des commandes payées.
    -- Les frais sont affichés séparément.
    -- ========================================================

    if v_primary_currency is not null then

        select
            coalesce(
                sum(o.subtotal),
                0
            ),

            coalesce(
                sum(o.total),
                0
            ),

            coalesce(
                sum(o.fees),
                0
            )

        into
            v_gmv,
            v_paid_order_total,
            v_fees

        from public.marketplace_orders o

        where o.created_at >= p_from
          and o.created_at < p_to

          and o.payment_status = 'paid'

          and o.currency =
              v_primary_currency;


        select
            coalesce(
                sum(o.subtotal),
                0
            )

        into v_gmv_previous

        from public.marketplace_orders o

        where o.created_at >= v_previous_from
          and o.created_at < v_previous_to

          and o.payment_status = 'paid'

          and o.currency =
              v_primary_currency;

    end if;


    -- ========================================================
    -- BUYERS / SELLERS
    -- ========================================================

    select count(
        distinct o.customer_id
    )
    into v_buyers

    from public.marketplace_orders o

    where o.created_at >= p_from
      and o.created_at < p_to
      and o.payment_status = 'paid';


    select count(*)
    into v_repeat_buyers

    from (

        select
            o.customer_id

        from public.marketplace_orders o

        where o.created_at >= p_from
          and o.created_at < p_to
          and o.payment_status = 'paid'

        group by o.customer_id

        having count(*) > 1

    ) q;


    select count(
        distinct o.seller_organization_id
    )
    into v_sellers

    from public.marketplace_orders o

    where o.created_at >= p_from
      and o.created_at < p_to
      and o.payment_status = 'paid';


    -- ========================================================
    -- PRODUCTS
    -- ========================================================

    select
        count(*),

        count(*) filter (
            where mp.status = 'published'
        ),

        count(*) filter (
            where mp.created_at >= p_from
              and mp.created_at < p_to
        )

    into
        v_products,
        v_published_products,
        v_products_added

    from public.marketplace_products mp;


    -- ========================================================
    -- INVENTORY
    -- ========================================================

    select
        count(*) filter (
            where mi.available <=
                  mi.low_stock_threshold
        ),

        count(*) filter (
            where mi.available <= 0
        ),

        coalesce(
            sum(mi.available),
            0
        ),

        coalesce(
            sum(mi.reserved),
            0
        )

    into
        v_low_stock,
        v_out_of_stock,
        v_available_units,
        v_reserved_units

    from public.marketplace_inventory mi;


    -- ========================================================
    -- FAVORITES
    -- ========================================================

    select count(*)
    into v_favorites
    from public.marketplace_favorites;


    select count(*)
    into v_favorites_added
    from public.marketplace_favorites mf

    where mf.created_at >= p_from
      and mf.created_at < p_to;


    -- ========================================================
    -- CART / CHECKOUT FUNNEL
    -- ========================================================

    select count(*)
    into v_active_carts

    from public.marketplace_carts mc

    where mc.status = 'active';


    select count(*)
    into v_carts_created

    from public.marketplace_carts mc

    where mc.created_at >= p_from
      and mc.created_at < p_to;


    select count(*)
    into v_checkout_groups

    from public.marketplace_order_groups mog

    where mog.created_at >= p_from
      and mog.created_at < p_to;


    -- ========================================================
    -- SALES / RENTALS
    -- ========================================================

    select
        coalesce(
            sum(ol.quantity) filter (
                where ol.mode = 'sale'
            ),
            0
        ),

        coalesce(
            sum(ol.quantity) filter (
                where ol.mode = 'rental'
            ),
            0
        )

    into
        v_sale_units,
        v_rental_units

    from public.marketplace_order_lines ol

    join public.marketplace_orders o
      on o.id = ol.order_id

    where o.created_at >= p_from
      and o.created_at < p_to
      and o.payment_status = 'paid';


    -- ========================================================
    -- RENTALS
    -- ========================================================

    select count(*)
    into v_active_rentals

    from public.marketplace_rentals mr

    where mr.status = 'active';


    select count(*)
    into v_returned_rentals

    from public.marketplace_rentals mr

    where mr.returned_at >= p_from
      and mr.returned_at < p_to;


    -- ========================================================
    -- DELIVERIES
    --
    -- Cohorte = commandes créées pendant la période.
    -- ========================================================

    select
        count(d.id),

        count(d.id) filter (
            where d.status = 'completed'
        )

    into
        v_deliveries,
        v_completed_deliveries

    from public.marketplace_deliveries d

    join public.marketplace_orders o
      on o.id = d.order_id

    where o.created_at >= p_from
      and o.created_at < p_to;


    -- ========================================================
    -- ORDER STATUS BREAKDOWN
    -- ========================================================

    select
        coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'label',
                    q.status,

                    'value',
                    q.total
                )
                order by q.total desc
            ),
            '[]'::jsonb
        )

    into v_order_statuses

    from (

        select
            o.status,
            count(*) as total

        from public.marketplace_orders o

        where o.created_at >= p_from
          and o.created_at < p_to

        group by o.status

    ) q;


    -- ========================================================
    -- LISTING TYPES
    -- ========================================================

    select
        coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'label',
                    q.listing_type,

                    'value',
                    q.total
                )
                order by q.total desc
            ),
            '[]'::jsonb
        )

    into v_listing_types

    from (

        select
            mp.listing_type,
            count(*) as total

        from public.marketplace_products mp

        where mp.status = 'published'

        group by mp.listing_type

    ) q;


    -- ========================================================
    -- CATEGORIES
    -- ========================================================

    select
        coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'label',
                    q.name,

                    'value',
                    q.total
                )
                order by q.total desc
            ),
            '[]'::jsonb
        )

    into v_categories

    from (

        select
            mc.name,
            count(mp.product_id) as total

        from public.marketplace_categories mc

        left join public.marketplace_products mp
          on mp.category_id = mc.id
         and mp.status = 'published'

        where mc.is_active = true

        group by
            mc.id,
            mc.name

    ) q;


    -- ========================================================
    -- PAYMENT METHODS
    -- ========================================================

    select
        coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'label',
                    q.method,

                    'value',
                    q.total
                )
                order by q.total desc
            ),
            '[]'::jsonb
        )

    into v_payment_methods

    from (

        select
            mp.method,
            count(*) as total

        from public.marketplace_payments mp

        where mp.created_at >= p_from
          and mp.created_at < p_to

        group by mp.method

    ) q;


    -- ========================================================
    -- PAYMENT STATUSES
    -- ========================================================

    select
        coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'label',
                    q.status,

                    'value',
                    q.total
                )
                order by q.total desc
            ),
            '[]'::jsonb
        )

    into v_payment_statuses

    from (

        select
            mp.status,
            count(*) as total

        from public.marketplace_payments mp

        where mp.created_at >= p_from
          and mp.created_at < p_to

        group by mp.status

    ) q;


    -- ========================================================
    -- TOP SELLERS
    -- Même devise que le KPI GMV principal.
    -- ========================================================

    if v_primary_currency is not null then

        select
            coalesce(
                jsonb_agg(
                    jsonb_build_object(
                        'id',
                        q.organization_id,

                        'label',
                        q.name,

                        'orders',
                        q.orders,

                        'amount',
                        q.amount
                    )
                    order by q.amount desc
                ),
                '[]'::jsonb
            )

        into v_top_sellers

        from (

            select
                org.id as organization_id,
                org.name,

                count(*) as orders,

                coalesce(
                    sum(o.subtotal),
                    0
                ) as amount

            from public.marketplace_orders o

            join public.organizations org
              on org.id =
                 o.seller_organization_id

            where o.created_at >= p_from
              and o.created_at < p_to
              and o.payment_status = 'paid'
              and o.currency =
                  v_primary_currency

            group by
                org.id,
                org.name

            order by amount desc

            limit 10

        ) q;

    end if;


    -- ========================================================
    -- TOP PRODUCTS
    -- ========================================================

    if v_primary_currency is not null then

        select
            coalesce(
                jsonb_agg(
                    jsonb_build_object(
                        'id',
                        q.product_id,

                        'label',
                        q.product_title,

                        'units',
                        q.units,

                        'amount',
                        q.amount
                    )
                    order by q.amount desc
                ),
                '[]'::jsonb
            )

        into v_top_products

        from (

            select
                ol.product_id,
                ol.product_title,

                coalesce(
                    sum(ol.quantity),
                    0
                ) as units,

                coalesce(
                    sum(ol.line_total),
                    0
                ) as amount

            from public.marketplace_order_lines ol

            join public.marketplace_orders o
              on o.id = ol.order_id

            where o.created_at >= p_from
              and o.created_at < p_to

              and o.payment_status = 'paid'

              and o.currency =
                  v_primary_currency

            group by
                ol.product_id,
                ol.product_title

            order by amount desc

            limit 10

        ) q;

    end if;


    -- ========================================================
    -- TRANSACTION TYPES
    --
    -- Le libellé inclut la devise afin de ne pas additionner
    -- silencieusement plusieurs monnaies.
    -- ========================================================

    select
        coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'label',
                    q.transaction_type ||
                    ' · ' ||
                    q.currency,

                    'value',
                    q.total,

                    'amount',
                    q.amount,

                    'currency',
                    q.currency
                )
                order by q.amount desc
            ),
            '[]'::jsonb
        )

    into v_transaction_types

    from (

        select
            mt.transaction_type,
            mt.currency,

            count(*) as total,

            coalesce(
                sum(mt.amount),
                0
            ) as amount

        from public.marketplace_transactions mt

        where mt.created_at >= p_from
          and mt.created_at < p_to

        group by
            mt.transaction_type,
            mt.currency

    ) q;


    -- ========================================================
    -- CURRENCY BREAKDOWN
    -- ========================================================

    select
        coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'currency',
                    q.currency,

                    'orders',
                    q.orders,

                    'gmv',
                    q.gmv
                )
                order by q.gmv desc
            ),
            '[]'::jsonb
        )

    into v_currency_breakdown

    from (

        select
            o.currency,

            count(*) as orders,

            coalesce(
                sum(o.subtotal),
                0
            ) as gmv

        from public.marketplace_orders o

        where o.created_at >= p_from
          and o.created_at < p_to
          and o.payment_status = 'paid'

        group by o.currency

    ) q;


    -- ========================================================
    -- DAILY SERIES
    -- ========================================================

    select
        coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'date',
                    to_char(
                        q.day_value,
                        'YYYY-MM-DD'
                    ),

                    'orders',
                    q.orders,

                    'paidOrders',
                    q.paid_orders,

                    'gmv',
                    q.gmv
                )
                order by q.day_value
            ),
            '[]'::jsonb
        )

    into v_daily_series

    from (

        select
            day_value,

            (
                select count(*)

                from public.marketplace_orders o

                where o.created_at >=
                      day_value

                  and o.created_at <
                      day_value +
                      interval '1 day'
            ) as orders,


            (
                select count(*)

                from public.marketplace_orders o

                where o.created_at >=
                      day_value

                  and o.created_at <
                      day_value +
                      interval '1 day'

                  and o.payment_status =
                      'paid'
            ) as paid_orders,


            (
                select
                    coalesce(
                        sum(o.subtotal),
                        0
                    )

                from public.marketplace_orders o

                where o.created_at >=
                      day_value

                  and o.created_at <
                      day_value +
                      interval '1 day'

                  and o.payment_status =
                      'paid'

                  and (
                      v_primary_currency
                      is not null
                  )

                  and o.currency =
                      v_primary_currency
            ) as gmv


        from generate_series(

            date_trunc(
                'day',
                p_from
            ),

            date_trunc(
                'day',
                p_to
            ),

            interval '1 day'

        ) day_value

    ) q;


    -- ========================================================
    -- RESULT
    -- ========================================================

    return jsonb_build_object(

        'period',
        jsonb_build_object(

            'from',
            p_from,

            'to',
            p_to,

            'previousFrom',
            v_previous_from,

            'previousTo',
            v_previous_to

        ),


        'headline',
        jsonb_build_object(

            'primaryCurrency',
            v_primary_currency,


            'gmv',
            v_gmv,


            'gmvGrowth',
            case

                when v_gmv_previous = 0
                    then null

                else round(
                    (
                        (
                            v_gmv -
                            v_gmv_previous
                        )
                        /
                        v_gmv_previous
                    ) * 100,
                    1
                )

            end,


            'orders',
            v_orders,


            'ordersGrowth',
            case

                when v_orders_previous = 0
                    then null

                else round(
                    (
                        (
                            v_orders -
                            v_orders_previous
                        )::numeric
                        /
                        v_orders_previous
                    ) * 100,
                    1
                )

            end,


            'paidOrders',
            v_paid_orders,


            'paymentSuccessRate',
            case

                when v_orders = 0
                    then 0

                else round(
                    (
                        v_paid_orders::numeric
                        /
                        v_orders
                    ) * 100,
                    1
                )

            end,


            'averageOrderValue',
            case

                when v_paid_orders = 0
                    then 0

                else round(
                    v_paid_order_total
                    /
                    v_paid_orders,
                    2
                )

            end,


            'buyers',
            v_buyers,


            'repeatBuyerRate',
            case

                when v_buyers = 0
                    then 0

                else round(
                    (
                        v_repeat_buyers::numeric
                        /
                        v_buyers
                    ) * 100,
                    1
                )

            end,


            'sellers',
            v_sellers,


            'products',
            v_products,


            'publishedProducts',
            v_published_products,


            'productsAdded',
            v_products_added,


            'lowStock',
            v_low_stock,


            'outOfStock',
            v_out_of_stock,


            'favorites',
            v_favorites,


            'favoritesAdded',
            v_favorites_added,


            'activeCarts',
            v_active_carts

        ),


        'funnel',
        jsonb_build_object(

            'cartsCreated',
            v_carts_created,

            'checkoutGroups',
            v_checkout_groups,

            'orders',
            v_orders,

            'paidOrders',
            v_paid_orders,


            'checkoutRate',
            case

                when v_carts_created = 0
                    then 0

                else round(
                    (
                        v_checkout_groups::numeric
                        /
                        v_carts_created
                    ) * 100,
                    1
                )

            end

        ),


        'commerce',
        jsonb_build_object(

            'saleUnits',
            v_sale_units,

            'rentalUnits',
            v_rental_units,

            'activeRentals',
            v_active_rentals,

            'returnedRentals',
            v_returned_rentals,

            'availableUnits',
            v_available_units,

            'reservedUnits',
            v_reserved_units,

            'fees',
            v_fees,


            'deliveryCompletionRate',
            case

                when v_deliveries = 0
                    then 0

                else round(
                    (
                        v_completed_deliveries::numeric
                        /
                        v_deliveries
                    ) * 100,
                    1
                )

            end

        ),


        'breakdowns',
        jsonb_build_object(

            'orderStatuses',
            v_order_statuses,

            'listingTypes',
            v_listing_types,

            'categories',
            v_categories,

            'paymentMethods',
            v_payment_methods,

            'paymentStatuses',
            v_payment_statuses,

            'topSellers',
            v_top_sellers,

            'topProducts',
            v_top_products,

            'transactionTypes',
            v_transaction_types,

            'currencies',
            v_currency_breakdown

        ),


        'dailySeries',
        v_daily_series

    );

end;

$function$;


revoke all
on function public.super_admin_marketplace_analytics(
    timestamptz,
    timestamptz
)
from public;


grant execute
on function public.super_admin_marketplace_analytics(
    timestamptz,
    timestamptz
)
to authenticated;


commit;
