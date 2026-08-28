begin;

-- ============================================================
-- INDESY CONTROL CENTER
-- BUSINESS CONSOLIDATED ANALYTICS
--
-- IMPORTANT :
-- "business volume" != revenu net de la plateforme.
--
-- Il regroupe, dans une même devise :
-- - Marketplace GMV payé
-- - Billetterie payée
-- - Valeur des contrats sponsoring payés
--
-- Les abonnements sont exclus des montants car la table
-- subscriptions ne possède ni devise ni horodatage.
-- ============================================================


create index if not exists
idx_ticket_sales_sold_at_business
on public.ticket_sales(sold_at);


create index if not exists
idx_ticket_sales_payment_business
on public.ticket_sales(payment_status, sold_at);


create index if not exists
idx_sponsor_contracts_created_business
on public.sponsor_contracts(created_at);


create index if not exists
idx_sponsor_contracts_payment_business
on public.sponsor_contracts(payment_status, created_at);


create index if not exists
idx_financial_payments_occurred_business
on public.financial_payments(occurred_at);


create or replace function
public.super_admin_business_analytics(
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

    v_marketplace numeric := 0;
    v_marketplace_previous numeric := 0;

    v_ticketing numeric := 0;
    v_ticketing_previous numeric := 0;

    v_sponsorship numeric := 0;
    v_sponsorship_previous numeric := 0;

    v_volume numeric := 0;
    v_volume_previous numeric := 0;

    v_marketplace_orders bigint := 0;

    v_ticket_transactions bigint := 0;
    v_ticket_units numeric := 0;
    v_ticket_unknown_currency bigint := 0;

    v_sponsor_contracts bigint := 0;

    v_active_subscriptions bigint := 0;

    v_financial_payments bigint := 0;

    v_source_breakdown jsonb := '[]'::jsonb;
    v_currency_breakdown jsonb := '[]'::jsonb;
    v_subscription_plans jsonb := '[]'::jsonb;

    v_financial_sources jsonb := '[]'::jsonb;
    v_financial_statuses jsonb := '[]'::jsonb;

    v_top_events jsonb := '[]'::jsonb;
    v_top_sponsors jsonb := '[]'::jsonb;

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
    -- Devise représentant le plus fort volume business
    -- sur la période courante.
    -- ========================================================

    select currency_code
    into v_primary_currency

    from (

        select
            o.currency as currency_code,
            sum(o.subtotal)::numeric as amount

        from public.marketplace_orders o

        where o.created_at >= p_from
          and o.created_at < p_to
          and o.payment_status = 'paid'

        group by o.currency


        union all


        select
            tt.currency_code,
            sum(
                coalesce(
                    ts.total_amount,
                    0
                )
            )::numeric

        from public.ticket_sales ts

        join public.ticket_types tt
          on tt.id = ts.ticket_type_id

        where ts.sold_at >= p_from
          and ts.sold_at < p_to

          and lower(
              trim(
                  coalesce(
                      ts.payment_status,
                      ''
                  )
              )
          ) in (
              'paid',
              'completed',
              'succeeded',
              'payé',
              'paye'
          )

        group by tt.currency_code


        union all


        select
            sc.currency_code,
            sum(sc.amount)::numeric

        from public.sponsor_contracts sc

        where sc.created_at >= p_from
          and sc.created_at < p_to

          and lower(
              trim(
                  sc.payment_status
              )
          ) = 'paid'

        group by sc.currency_code

    ) source_amounts

    where currency_code is not null

    group by currency_code

    order by
        sum(amount) desc

    limit 1;


    -- ========================================================
    -- MARKETPLACE GMV
    -- ========================================================

    if v_primary_currency is not null then

        select
            coalesce(
                sum(o.subtotal),
                0
            )

        into v_marketplace

        from public.marketplace_orders o

        where o.created_at >= p_from
          and o.created_at < p_to
          and o.payment_status = 'paid'
          and o.currency = v_primary_currency;


        select
            coalesce(
                sum(o.subtotal),
                0
            )

        into v_marketplace_previous

        from public.marketplace_orders o

        where o.created_at >= v_previous_from
          and o.created_at < v_previous_to
          and o.payment_status = 'paid'
          and o.currency = v_primary_currency;

    end if;


    -- ========================================================
    -- TICKETING
    -- ========================================================

    if v_primary_currency is not null then

        select
            coalesce(
                sum(
                    ts.total_amount
                ),
                0
            )

        into v_ticketing

        from public.ticket_sales ts

        join public.ticket_types tt
          on tt.id = ts.ticket_type_id

        where ts.sold_at >= p_from
          and ts.sold_at < p_to

          and tt.currency_code =
              v_primary_currency

          and lower(
              trim(
                  coalesce(
                      ts.payment_status,
                      ''
                  )
              )
          ) in (
              'paid',
              'completed',
              'succeeded',
              'payé',
              'paye'
          );


        select
            coalesce(
                sum(
                    ts.total_amount
                ),
                0
            )

        into v_ticketing_previous

        from public.ticket_sales ts

        join public.ticket_types tt
          on tt.id = ts.ticket_type_id

        where ts.sold_at >= v_previous_from
          and ts.sold_at < v_previous_to

          and tt.currency_code =
              v_primary_currency

          and lower(
              trim(
                  coalesce(
                      ts.payment_status,
                      ''
                  )
              )
          ) in (
              'paid',
              'completed',
              'succeeded',
              'payé',
              'paye'
          );

    end if;


    -- ========================================================
    -- SPONSORSHIP
    --
    -- La table sponsor_contracts ne possède pas paid_at.
    -- La période repose donc sur created_at.
    -- ========================================================

    if v_primary_currency is not null then

        select
            coalesce(
                sum(sc.amount),
                0
            )

        into v_sponsorship

        from public.sponsor_contracts sc

        where sc.created_at >= p_from
          and sc.created_at < p_to

          and sc.currency_code =
              v_primary_currency

          and lower(
              trim(
                  sc.payment_status
              )
          ) = 'paid';


        select
            coalesce(
                sum(sc.amount),
                0
            )

        into v_sponsorship_previous

        from public.sponsor_contracts sc

        where sc.created_at >= v_previous_from
          and sc.created_at < v_previous_to

          and sc.currency_code =
              v_primary_currency

          and lower(
              trim(
                  sc.payment_status
              )
          ) = 'paid';

    end if;


    v_volume :=
        v_marketplace +
        v_ticketing +
        v_sponsorship;


    v_volume_previous :=
        v_marketplace_previous +
        v_ticketing_previous +
        v_sponsorship_previous;


    -- ========================================================
    -- OPERATIONAL COUNTS
    -- ========================================================

    select count(*)
    into v_marketplace_orders

    from public.marketplace_orders o

    where o.created_at >= p_from
      and o.created_at < p_to
      and o.payment_status = 'paid';


    select
        count(*),

        coalesce(
            sum(
                ts.quantity
            ),
            0
        )

    into
        v_ticket_transactions,
        v_ticket_units

    from public.ticket_sales ts

    where ts.sold_at >= p_from
      and ts.sold_at < p_to

      and lower(
          trim(
              coalesce(
                  ts.payment_status,
                  ''
              )
          )
      ) in (
          'paid',
          'completed',
          'succeeded',
          'payé',
          'paye'
      );


    select count(*)
    into v_ticket_unknown_currency

    from public.ticket_sales ts

    left join public.ticket_types tt
      on tt.id = ts.ticket_type_id

    where ts.sold_at >= p_from
      and ts.sold_at < p_to

      and lower(
          trim(
              coalesce(
                  ts.payment_status,
                  ''
              )
          )
      ) in (
          'paid',
          'completed',
          'succeeded',
          'payé',
          'paye'
      )

      and tt.currency_code is null;


    select count(*)
    into v_sponsor_contracts

    from public.sponsor_contracts sc

    where sc.created_at >= p_from
      and sc.created_at < p_to

      and lower(
          trim(
              sc.payment_status
          )
      ) = 'paid';


    -- ========================================================
    -- CURRENT SUBSCRIPTIONS
    --
    -- Aucune période possible :
    -- pas de created_at, started_at ou currency.
    -- ========================================================

    select count(*)
    into v_active_subscriptions

    from public.subscriptions s

    where lower(
        trim(
            coalesce(
                s.status,
                ''
            )
        )
    ) in (
        'active',
        'actif'
    );


    -- ========================================================
    -- FINANCIAL LEDGER ACTIVITY
    --
    -- Observatoire du ledger officiel.
    -- NON ajouté au business volume pour éviter double compte.
    -- ========================================================

    select count(*)
    into v_financial_payments

    from public.financial_payments fp

    where fp.occurred_at >= p_from
      and fp.occurred_at < p_to;


    -- ========================================================
    -- SOURCE BREAKDOWN
    -- ========================================================

    v_source_breakdown :=
        jsonb_build_array(

            jsonb_build_object(
                'label',
                'Marketplace GMV',

                'value',
                v_marketplace
            ),

            jsonb_build_object(
                'label',
                'Billetterie',

                'value',
                v_ticketing
            ),

            jsonb_build_object(
                'label',
                'Sponsoring',

                'value',
                v_sponsorship
            )

        );


    -- ========================================================
    -- CURRENCIES
    -- ========================================================

    select
        coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'currency',
                    q.currency,

                    'marketplace',
                    q.marketplace,

                    'ticketing',
                    q.ticketing,

                    'sponsorship',
                    q.sponsorship,

                    'total',
                    q.marketplace +
                    q.ticketing +
                    q.sponsorship
                )
                order by (
                    q.marketplace +
                    q.ticketing +
                    q.sponsorship
                ) desc
            ),
            '[]'::jsonb
        )

    into v_currency_breakdown

    from (

        select
            currencies.currency,

            coalesce(
                marketplace.amount,
                0
            ) as marketplace,

            coalesce(
                ticketing.amount,
                0
            ) as ticketing,

            coalesce(
                sponsorship.amount,
                0
            ) as sponsorship

        from (

            select distinct currency
            from public.marketplace_orders

            union

            select distinct currency_code
            from public.ticket_types

            union

            select distinct currency_code
            from public.sponsor_contracts

        ) currencies


        left join (

            select
                o.currency,
                sum(o.subtotal) as amount

            from public.marketplace_orders o

            where o.created_at >= p_from
              and o.created_at < p_to
              and o.payment_status = 'paid'

            group by o.currency

        ) marketplace
          on marketplace.currency =
             currencies.currency


        left join (

            select
                tt.currency_code as currency,
                sum(
                    coalesce(
                        ts.total_amount,
                        0
                    )
                ) as amount

            from public.ticket_sales ts

            join public.ticket_types tt
              on tt.id = ts.ticket_type_id

            where ts.sold_at >= p_from
              and ts.sold_at < p_to

              and lower(
                  trim(
                      coalesce(
                          ts.payment_status,
                          ''
                      )
                  )
              ) in (
                  'paid',
                  'completed',
                  'succeeded',
                  'payé',
                  'paye'
              )

            group by tt.currency_code

        ) ticketing
          on ticketing.currency =
             currencies.currency


        left join (

            select
                sc.currency_code as currency,
                sum(sc.amount) as amount

            from public.sponsor_contracts sc

            where sc.created_at >= p_from
              and sc.created_at < p_to

              and lower(
                  trim(
                      sc.payment_status
                  )
              ) = 'paid'

            group by sc.currency_code

        ) sponsorship
          on sponsorship.currency =
             currencies.currency

        where currencies.currency is not null

    ) q;


    -- ========================================================
    -- SUBSCRIPTION PLANS
    -- ========================================================

    select
        coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'label',
                    q.plan,

                    'value',
                    q.total
                )
                order by q.total desc
            ),
            '[]'::jsonb
        )

    into v_subscription_plans

    from (

        select
            coalesce(
                s.plan,
                'Sans plan'
            ) as plan,

            count(*) as total

        from public.subscriptions s

        where lower(
            trim(
                coalesce(
                    s.status,
                    ''
                )
            )
        ) in (
            'active',
            'actif'
        )

        group by s.plan

    ) q;


    -- ========================================================
    -- FINANCIAL SOURCES
    -- ========================================================

    select
        coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'label',
                    q.source_type,

                    'currency',
                    q.currency_code,

                    'value',
                    q.total,

                    'amount',
                    q.amount
                )
                order by q.amount desc
            ),
            '[]'::jsonb
        )

    into v_financial_sources

    from (

        select
            fp.source_type,
            fp.currency_code,

            count(*) as total,

            sum(fp.amount) as amount

        from public.financial_payments fp

        where fp.occurred_at >= p_from
          and fp.occurred_at < p_to

        group by
            fp.source_type,
            fp.currency_code

    ) q;


    -- ========================================================
    -- FINANCIAL STATUSES
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

    into v_financial_statuses

    from (

        select
            fp.status,
            count(*) as total

        from public.financial_payments fp

        where fp.occurred_at >= p_from
          and fp.occurred_at < p_to

        group by fp.status

    ) q;


    -- ========================================================
    -- TOP TICKETING EVENTS
    -- ========================================================

    if v_primary_currency is not null then

        select
            coalesce(
                jsonb_agg(
                    jsonb_build_object(
                        'id',
                        q.id,

                        'label',
                        q.title,

                        'units',
                        q.units,

                        'amount',
                        q.amount
                    )
                    order by q.amount desc
                ),
                '[]'::jsonb
            )

        into v_top_events

        from (

            select
                e.id,
                e.title,

                coalesce(
                    sum(
                        ts.quantity
                    ),
                    0
                ) as units,

                coalesce(
                    sum(
                        ts.total_amount
                    ),
                    0
                ) as amount

            from public.ticket_sales ts

            join public.ticket_types tt
              on tt.id =
                 ts.ticket_type_id

            join public.events e
              on e.id =
                 ts.event_id

            where ts.sold_at >= p_from
              and ts.sold_at < p_to

              and tt.currency_code =
                  v_primary_currency

              and lower(
                  trim(
                      coalesce(
                          ts.payment_status,
                          ''
                      )
                  )
              ) in (
                  'paid',
                  'completed',
                  'succeeded',
                  'payé',
                  'paye'
              )

            group by
                e.id,
                e.title

            order by amount desc

            limit 10

        ) q;

    end if;


    -- ========================================================
    -- TOP SPONSORS
    -- ========================================================

    if v_primary_currency is not null then

        select
            coalesce(
                jsonb_agg(
                    jsonb_build_object(
                        'id',
                        q.id,

                        'label',
                        q.name,

                        'contracts',
                        q.contracts,

                        'amount',
                        q.amount
                    )
                    order by q.amount desc
                ),
                '[]'::jsonb
            )

        into v_top_sponsors

        from (

            select
                sp.id,
                sp.name,

                count(sc.id) as contracts,

                sum(sc.amount) as amount

            from public.sponsor_contracts sc

            join public.event_sponsors es
              on es.id =
                 sc.event_sponsor_id

            join public.sponsors sp
              on sp.id =
                 es.sponsor_id

            where sc.created_at >= p_from
              and sc.created_at < p_to

              and sc.currency_code =
                  v_primary_currency

              and lower(
                  trim(
                      sc.payment_status
                  )
              ) = 'paid'

            group by
                sp.id,
                sp.name

            order by amount desc

            limit 10

        ) q;

    end if;


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

                    'marketplace',
                    q.marketplace,

                    'ticketing',
                    q.ticketing,

                    'sponsorship',
                    q.sponsorship,

                    'total',
                    q.marketplace +
                    q.ticketing +
                    q.sponsorship
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
                select
                    coalesce(
                        sum(o.subtotal),
                        0
                    )

                from public.marketplace_orders o

                where o.created_at >= day_value
                  and o.created_at <
                      day_value +
                      interval '1 day'

                  and o.payment_status =
                      'paid'

                  and v_primary_currency
                      is not null

                  and o.currency =
                      v_primary_currency

            ) as marketplace,


            (
                select
                    coalesce(
                        sum(
                            ts.total_amount
                        ),
                        0
                    )

                from public.ticket_sales ts

                join public.ticket_types tt
                  on tt.id =
                     ts.ticket_type_id

                where ts.sold_at >= day_value
                  and ts.sold_at <
                      day_value +
                      interval '1 day'

                  and v_primary_currency
                      is not null

                  and tt.currency_code =
                      v_primary_currency

                  and lower(
                      trim(
                          coalesce(
                              ts.payment_status,
                              ''
                          )
                      )
                  ) in (
                      'paid',
                      'completed',
                      'succeeded',
                      'payé',
                      'paye'
                  )

            ) as ticketing,


            (
                select
                    coalesce(
                        sum(sc.amount),
                        0
                    )

                from public.sponsor_contracts sc

                where sc.created_at >= day_value
                  and sc.created_at <
                      day_value +
                      interval '1 day'

                  and v_primary_currency
                      is not null

                  and sc.currency_code =
                      v_primary_currency

                  and lower(
                      trim(
                          sc.payment_status
                      )
                  ) = 'paid'

            ) as sponsorship


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

            'businessVolume',
            v_volume,

            'businessVolumeGrowth',
            case

                when v_volume_previous = 0
                    then null

                else round(
                    (
                        (
                            v_volume -
                            v_volume_previous
                        )
                        /
                        v_volume_previous
                    ) * 100,
                    1
                )

            end,

            'marketplaceGmv',
            v_marketplace,

            'ticketingRevenue',
            v_ticketing,

            'sponsorshipValue',
            v_sponsorship,

            'marketplacePaidOrders',
            v_marketplace_orders,

            'ticketTransactions',
            v_ticket_transactions,

            'ticketUnits',
            v_ticket_units,

            'paidSponsorContracts',
            v_sponsor_contracts,

            'activeSubscriptions',
            v_active_subscriptions,

            'financialPayments',
            v_financial_payments,

            'ticketSalesWithoutCurrency',
            v_ticket_unknown_currency

        ),


        'breakdowns',
        jsonb_build_object(

            'sources',
            v_source_breakdown,

            'currencies',
            v_currency_breakdown,

            'subscriptionPlans',
            v_subscription_plans,

            'financialSources',
            v_financial_sources,

            'financialStatuses',
            v_financial_statuses,

            'topEvents',
            v_top_events,

            'topSponsors',
            v_top_sponsors

        ),


        'dailySeries',
        v_daily_series

    );

end;

$function$;


revoke all
on function public.super_admin_business_analytics(
    timestamptz,
    timestamptz
)
from public;


grant execute
on function public.super_admin_business_analytics(
    timestamptz,
    timestamptz
)
to authenticated;


commit;
