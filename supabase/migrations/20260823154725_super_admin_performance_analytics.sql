begin;

-- ============================================================
-- INDESY CONTROL CENTER
-- EXECUTIVE PERFORMANCE SCORECARD
--
-- Principes :
--
-- 1. Aucune cible fictive.
-- 2. Les cibles commencent à NULL.
-- 3. Un KPI sans cible ne participe jamais au score.
-- 4. Un KPI indisponible ne participe jamais au score.
-- 5. Tous les KPI configurés ont le même poids.
-- 6. Le score est plafonné à 100.
-- 7. Aucun CRUD de cible n'est exposé dans /vh-teck.
-- ============================================================


-- ============================================================
-- TARGET STORAGE
-- ============================================================

create table if not exists
public.super_admin_kpi_targets (

    metric_code text primary key,

    target_value numeric,

    enabled boolean not null
        default true,

    notes text,

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now(),

    updated_by uuid
        references public.profiles(id)
        on delete set null,

    constraint
    super_admin_kpi_targets_value_check
    check (
        target_value is null
        or target_value >= 0
    ),

    constraint
    super_admin_kpi_targets_code_check
    check (
        metric_code in (

            'user_growth_pct',

            'user_verification_rate',

            'organization_verification_rate',

            'event_readiness_rate',

            'fight_completion_rate',

            'event_cancellation_rate',

            'marketplace_payment_success_rate',

            'marketplace_repeat_buyer_rate',

            'marketplace_low_stock_rate',

            'business_volume_growth_pct',

            'database_cache_hit_rate'

        )
    )
);


comment on table
public.super_admin_kpi_targets
is
'Executive KPI targets. Targets are intentionally not editable from the Super Admin Control Center.';


alter table
public.super_admin_kpi_targets
enable row level security;


revoke all
on table public.super_admin_kpi_targets
from anon, authenticated;


-- ============================================================
-- REGISTER SUPPORTED KPI
--
-- NULL = objectif non configuré.
-- ============================================================

insert into public.super_admin_kpi_targets (
    metric_code,
    target_value
)
values

    (
        'user_growth_pct',
        null
    ),

    (
        'user_verification_rate',
        null
    ),

    (
        'organization_verification_rate',
        null
    ),

    (
        'event_readiness_rate',
        null
    ),

    (
        'fight_completion_rate',
        null
    ),

    (
        'event_cancellation_rate',
        null
    ),

    (
        'marketplace_payment_success_rate',
        null
    ),

    (
        'marketplace_repeat_buyer_rate',
        null
    ),

    (
        'marketplace_low_stock_rate',
        null
    ),

    (
        'business_volume_growth_pct',
        null
    ),

    (
        'database_cache_hit_rate',
        null
    )

on conflict (
    metric_code
)
do nothing;


-- ============================================================
-- PERFORMANCE RPC
-- ============================================================

create or replace function
public.super_admin_performance_analytics(

    p_from timestamptz
        default now() - interval '30 days',

    p_to timestamptz
        default now()

)
returns jsonb

language plpgsql
stable
security definer

set search_path = public

as $function$

declare

    v_core jsonb;
    v_marketplace jsonb;
    v_business jsonb;

    v_actuals jsonb;

    v_total_users numeric;
    v_organizations numeric;

    v_events_created numeric;
    v_events_cancelled numeric;

    v_fights_created numeric;

    v_marketplace_orders numeric;
    v_marketplace_buyers numeric;
    v_marketplace_products numeric;

    v_metrics jsonb :=
        '[]'::jsonb;

    v_domains jsonb :=
        '[]'::jsonb;

    v_overall_score numeric;

    v_total_metrics bigint := 0;
    v_configured_metrics bigint := 0;
    v_evaluated_metrics bigint := 0;

    v_achieved_metrics bigint := 0;
    v_watch_metrics bigint := 0;
    v_critical_metrics bigint := 0;

begin

    -- ========================================================
    -- SECURITY
    -- ========================================================

    if not public.is_super_admin() then

        raise exception
            'FORBIDDEN'
            using errcode = '42501';

    end if;


    if p_to <= p_from then

        raise exception
            'La date de fin doit être postérieure à la date de début.';

    end if;


    if p_to - p_from >
       interval '2 years'
    then

        raise exception
            'La période maximale autorisée est de deux ans.';

    end if;


    -- ========================================================
    -- EXISTING REAL ANALYTICS
    -- ========================================================

    select
        public.super_admin_analytics_snapshot(
            p_from,
            p_to
        )
    into v_core;


    select
        public.super_admin_marketplace_analytics(
            p_from,
            p_to
        )
    into v_marketplace;


    select
        public.super_admin_business_analytics(
            p_from,
            p_to
        )
    into v_business;


    -- ========================================================
    -- DENOMINATORS
    -- ========================================================

    v_total_users :=
        coalesce(
            nullif(
                v_core #>>
                '{overview,totalUsers}',
                ''
            )::numeric,
            0
        );


    v_organizations :=
        coalesce(
            nullif(
                v_core #>>
                '{overview,organizations}',
                ''
            )::numeric,
            0
        );


    v_events_created :=
        coalesce(
            nullif(
                v_core #>>
                '{sport,eventsCreated}',
                ''
            )::numeric,
            0
        );


    v_events_cancelled :=
        coalesce(
            nullif(
                v_core #>>
                '{sport,eventsCancelled}',
                ''
            )::numeric,
            0
        );


    v_fights_created :=
        coalesce(
            nullif(
                v_core #>>
                '{sport,fightsCreated}',
                ''
            )::numeric,
            0
        );


    v_marketplace_orders :=
        coalesce(
            nullif(
                v_marketplace #>>
                '{headline,orders}',
                ''
            )::numeric,
            0
        );


    v_marketplace_buyers :=
        coalesce(
            nullif(
                v_marketplace #>>
                '{headline,buyers}',
                ''
            )::numeric,
            0
        );


    v_marketplace_products :=
        coalesce(
            nullif(
                v_marketplace #>>
                '{headline,products}',
                ''
            )::numeric,
            0
        );


    -- ========================================================
    -- ACTUAL VALUES
    --
    -- NULL means the metric cannot be evaluated reliably.
    -- ========================================================

    v_actuals :=
        jsonb_build_object(


            -- ------------------------------------------------
            -- GROWTH
            -- ------------------------------------------------

            'user_growth_pct',

            case

                when
                    v_core #>>
                    '{overview,newUsersGrowth}'
                    is null
                then null

                else
                    (
                        v_core #>>
                        '{overview,newUsersGrowth}'
                    )::numeric

            end,


            -- ------------------------------------------------
            -- USERS
            -- ------------------------------------------------

            'user_verification_rate',

            case

                when v_total_users = 0
                then null

                else
                    (
                        v_core #>>
                        '{overview,verifiedUserRate}'
                    )::numeric

            end,


            -- ------------------------------------------------
            -- ORGANIZATIONS
            -- ------------------------------------------------

            'organization_verification_rate',

            case

                when v_organizations = 0
                then null

                else round(
                    (
                        (
                            v_core #>>
                            '{overview,verifiedOrganizations}'
                        )::numeric
                        /
                        v_organizations
                    )
                    * 100,
                    2
                )

            end,


            -- ------------------------------------------------
            -- SPORT
            -- ------------------------------------------------

            'event_readiness_rate',

            case

                when v_events_created = 0
                then null

                else
                    (
                        v_core #>>
                        '{sport,averageReadiness}'
                    )::numeric

            end,


            'fight_completion_rate',

            case

                when v_fights_created = 0
                then null

                else
                    (
                        v_core #>>
                        '{sport,fightCompletionRate}'
                    )::numeric

            end,


            'event_cancellation_rate',

            case

                when v_events_created = 0
                then null

                else round(
                    (
                        v_events_cancelled
                        /
                        v_events_created
                    )
                    * 100,
                    2
                )

            end,


            -- ------------------------------------------------
            -- MARKETPLACE
            -- ------------------------------------------------

            'marketplace_payment_success_rate',

            case

                when v_marketplace_orders = 0
                then null

                else
                    (
                        v_marketplace #>>
                        '{headline,paymentSuccessRate}'
                    )::numeric

            end,


            'marketplace_repeat_buyer_rate',

            case

                when v_marketplace_buyers = 0
                then null

                else
                    (
                        v_marketplace #>>
                        '{headline,repeatBuyerRate}'
                    )::numeric

            end,


            'marketplace_low_stock_rate',

            case

                when v_marketplace_products = 0
                then null

                else round(
                    (
                        (
                            v_marketplace #>>
                            '{headline,lowStock}'
                        )::numeric
                        /
                        v_marketplace_products
                    )
                    * 100,
                    2
                )

            end,


            -- ------------------------------------------------
            -- BUSINESS
            -- ------------------------------------------------

            'business_volume_growth_pct',

            case

                when
                    v_business #>>
                    '{headline,businessVolumeGrowth}'
                    is null
                then null

                else
                    (
                        v_business #>>
                        '{headline,businessVolumeGrowth}'
                    )::numeric

            end,


            -- ------------------------------------------------
            -- SYSTEM
            -- ------------------------------------------------

            'database_cache_hit_rate',

            case

                when
                    v_core #>>
                    '{system,databaseCacheHitRate}'
                    is null
                then null

                else
                    (
                        v_core #>>
                        '{system,databaseCacheHitRate}'
                    )::numeric

            end

        );


    -- ========================================================
    -- SCORECARD
    --
    -- higher_is_better :
    -- score = actual / target * 100
    --
    -- lower_is_better :
    -- si actual <= target : 100
    -- sinon target / actual * 100
    --
    -- Scores bornés entre 0 et 100.
    -- ========================================================

    with metric_catalog (
        position,
        code,
        domain,
        domain_label,
        label,
        description,
        unit,
        direction,
        source,
        formula
    )
    as (

        values


        (
            10,
            'user_growth_pct',
            'growth',
            'Croissance',
            'Croissance utilisateurs',
            'Évolution des nouvelles inscriptions par rapport à la période précédente.',
            'percent',
            'higher_is_better',
            'super_admin_analytics_snapshot.overview.newUsersGrowth',
            'Nouveaux utilisateurs période courante vs période précédente.'
        ),


        (
            20,
            'user_verification_rate',
            'users',
            'Utilisateurs',
            'Vérification utilisateurs',
            'Part des profils vérifiés dans l’ensemble des utilisateurs.',
            'percent',
            'higher_is_better',
            'super_admin_analytics_snapshot.overview.verifiedUserRate',
            'Profils vérifiés / utilisateurs × 100.'
        ),


        (
            30,
            'organization_verification_rate',
            'organizations',
            'Organisations',
            'Vérification organisations',
            'Part des organisations vérifiées.',
            'percent',
            'higher_is_better',
            'super_admin_analytics_snapshot.overview',
            'Organisations vérifiées / organisations × 100.'
        ),


        (
            40,
            'event_readiness_rate',
            'sport',
            'Sport',
            'Readiness événements',
            'Niveau moyen de préparation des événements créés sur la période.',
            'percent',
            'higher_is_better',
            'super_admin_analytics_snapshot.sport.averageReadiness',
            'Moyenne des readiness_percent des événements concernés.'
        ),


        (
            50,
            'fight_completion_rate',
            'sport',
            'Sport',
            'Complétion combats',
            'Part des combats terminés parmi les combats créés sur la période.',
            'percent',
            'higher_is_better',
            'super_admin_analytics_snapshot.sport.fightCompletionRate',
            'Combats terminés / combats créés × 100.'
        ),


        (
            60,
            'event_cancellation_rate',
            'sport',
            'Sport',
            'Annulation événements',
            'Part des événements annulés parmi ceux créés sur la période.',
            'percent',
            'lower_is_better',
            'super_admin_analytics_snapshot.sport',
            'Événements annulés / événements créés × 100.'
        ),


        (
            70,
            'marketplace_payment_success_rate',
            'marketplace',
            'Marketplace',
            'Succès de paiement',
            'Part des commandes Marketplace dont le paiement est confirmé.',
            'percent',
            'higher_is_better',
            'super_admin_marketplace_analytics.headline.paymentSuccessRate',
            'Commandes payées / commandes créées × 100.'
        ),


        (
            80,
            'marketplace_repeat_buyer_rate',
            'marketplace',
            'Marketplace',
            'Repeat buyers',
            'Part des acheteurs ayant réalisé plusieurs commandes payées sur la période.',
            'percent',
            'higher_is_better',
            'super_admin_marketplace_analytics.headline.repeatBuyerRate',
            'Acheteurs récurrents / acheteurs × 100.'
        ),


        (
            90,
            'marketplace_low_stock_rate',
            'marketplace',
            'Marketplace',
            'Stock faible',
            'Part des références Marketplace dont le stock atteint ou passe sous le seuil faible.',
            'percent',
            'lower_is_better',
            'super_admin_marketplace_analytics.headline',
            'Références en stock faible / produits Marketplace × 100.'
        ),


        (
            100,
            'business_volume_growth_pct',
            'business',
            'Business',
            'Croissance Volume Business',
            'Évolution du Volume Business consolidé face à la période précédente.',
            'percent',
            'higher_is_better',
            'super_admin_business_analytics.headline.businessVolumeGrowth',
            'Volume Business courant vs période précédente.'
        ),


        (
            110,
            'database_cache_hit_rate',
            'system',
            'Système',
            'Cache PostgreSQL',
            'Part des lectures PostgreSQL servies depuis le cache.',
            'percent',
            'higher_is_better',
            'super_admin_analytics_snapshot.system.databaseCacheHitRate',
            'Blocs servis depuis le cache / lectures totales × 100.'
        )

    ),


    metrics as (

        select

            c.*,

            case

                when
                    jsonb_typeof(
                        v_actuals ->
                        c.code
                    ) = 'number'
                then
                    (
                        v_actuals ->>
                        c.code
                    )::numeric

                else null

            end
            as actual_value,

            case
                when t.enabled
                then t.target_value
                else null
            end
            as target_value,

            t.updated_at
            as target_updated_at,

            t.notes
            as target_notes

        from metric_catalog c

        left join
        public.super_admin_kpi_targets t

          on t.metric_code =
             c.code

    ),


    scored_base as (

        select

            m.*,


            case

                when
                    m.actual_value is null
                    or
                    m.target_value is null
                then null


                when
                    m.direction =
                    'higher_is_better'
                then

                    case

                        when
                            m.target_value = 0
                        then

                            case
                                when
                                    m.actual_value >= 0
                                then 100::numeric
                                else 0::numeric
                            end

                        else

                            least(
                                100::numeric,

                                greatest(
                                    0::numeric,

                                    (
                                        m.actual_value
                                        /
                                        m.target_value
                                    )
                                    * 100
                                )
                            )

                    end


                else

                    case

                        when
                            m.actual_value <=
                            m.target_value
                        then 100::numeric


                        when
                            m.actual_value = 0
                        then 100::numeric


                        when
                            m.target_value = 0
                        then 0::numeric


                        else

                            least(
                                100::numeric,

                                greatest(
                                    0::numeric,

                                    (
                                        m.target_value
                                        /
                                        m.actual_value
                                    )
                                    * 100
                                )
                            )

                    end

            end
            as score,


            case

                when
                    m.actual_value is null
                    or
                    m.target_value is null
                then null


                when
                    m.direction =
                    'higher_is_better'
                then
                    m.actual_value -
                    m.target_value


                else
                    m.target_value -
                    m.actual_value

            end
            as gap

        from metrics m

    ),


    scored as (

        select

            s.*,


            case

                when
                    s.target_value is null
                then
                    'not_configured'


                when
                    s.actual_value is null
                then
                    'unavailable'


                when
                    s.score >= 100
                then
                    'achieved'


                when
                    s.score >= 80
                then
                    'watch'


                else
                    'critical'

            end
            as status

        from scored_base s

    )


    select

        coalesce(
            jsonb_agg(

                jsonb_build_object(

                    'code',
                    s.code,

                    'domain',
                    s.domain,

                    'domainLabel',
                    s.domain_label,

                    'label',
                    s.label,

                    'description',
                    s.description,

                    'unit',
                    s.unit,

                    'direction',
                    s.direction,

                    'source',
                    s.source,

                    'formula',
                    s.formula,

                    'actualValue',
                    s.actual_value,

                    'targetValue',
                    s.target_value,

                    'targetUpdatedAt',
                    s.target_updated_at,

                    'targetNotes',
                    s.target_notes,

                    'score',
                    case
                        when s.score is null
                        then null
                        else round(
                            s.score,
                            1
                        )
                    end,

                    'gap',
                    case
                        when s.gap is null
                        then null
                        else round(
                            s.gap,
                            2
                        )
                    end,

                    'status',
                    s.status

                )

                order by s.position

            ),
            '[]'::jsonb
        ),


        count(*),


        count(*) filter (
            where
                s.target_value
                is not null
        ),


        count(*) filter (
            where
                s.score
                is not null
        ),


        count(*) filter (
            where
                s.status =
                'achieved'
        ),


        count(*) filter (
            where
                s.status =
                'watch'
        ),


        count(*) filter (
            where
                s.status =
                'critical'
        ),


        round(
            avg(
                s.score
            ),
            1
        )


    into

        v_metrics,

        v_total_metrics,

        v_configured_metrics,

        v_evaluated_metrics,

        v_achieved_metrics,

        v_watch_metrics,

        v_critical_metrics,

        v_overall_score


    from scored s;


    -- ========================================================
    -- DOMAIN SCORES
    -- ========================================================

    with metric_catalog (
        position,
        code,
        domain,
        domain_label,
        direction
    )
    as (

        values

        (
            10,
            'user_growth_pct',
            'growth',
            'Croissance',
            'higher_is_better'
        ),

        (
            20,
            'user_verification_rate',
            'users',
            'Utilisateurs',
            'higher_is_better'
        ),

        (
            30,
            'organization_verification_rate',
            'organizations',
            'Organisations',
            'higher_is_better'
        ),

        (
            40,
            'event_readiness_rate',
            'sport',
            'Sport',
            'higher_is_better'
        ),

        (
            50,
            'fight_completion_rate',
            'sport',
            'Sport',
            'higher_is_better'
        ),

        (
            60,
            'event_cancellation_rate',
            'sport',
            'Sport',
            'lower_is_better'
        ),

        (
            70,
            'marketplace_payment_success_rate',
            'marketplace',
            'Marketplace',
            'higher_is_better'
        ),

        (
            80,
            'marketplace_repeat_buyer_rate',
            'marketplace',
            'Marketplace',
            'higher_is_better'
        ),

        (
            90,
            'marketplace_low_stock_rate',
            'marketplace',
            'Marketplace',
            'lower_is_better'
        ),

        (
            100,
            'business_volume_growth_pct',
            'business',
            'Business',
            'higher_is_better'
        ),

        (
            110,
            'database_cache_hit_rate',
            'system',
            'Système',
            'higher_is_better'
        )

    ),


    metrics as (

        select

            c.*,

            case

                when
                    jsonb_typeof(
                        v_actuals ->
                        c.code
                    ) = 'number'
                then
                    (
                        v_actuals ->>
                        c.code
                    )::numeric

                else null

            end
            as actual_value,

            case
                when t.enabled
                then t.target_value
                else null
            end
            as target_value

        from metric_catalog c

        left join
        public.super_admin_kpi_targets t

          on t.metric_code =
             c.code

    ),


    scored as (

        select

            m.*,


            case

                when
                    m.actual_value is null
                    or
                    m.target_value is null
                then null


                when
                    m.direction =
                    'higher_is_better'
                then

                    case

                        when
                            m.target_value = 0
                        then

                            case
                                when
                                    m.actual_value >= 0
                                then 100::numeric
                                else 0::numeric
                            end

                        else

                            least(
                                100::numeric,

                                greatest(
                                    0::numeric,

                                    (
                                        m.actual_value
                                        /
                                        m.target_value
                                    )
                                    * 100
                                )
                            )

                    end


                else

                    case

                        when
                            m.actual_value <=
                            m.target_value
                        then 100::numeric

                        when
                            m.target_value = 0
                        then 0::numeric

                        else

                            least(
                                100::numeric,

                                greatest(
                                    0::numeric,

                                    (
                                        m.target_value
                                        /
                                        m.actual_value
                                    )
                                    * 100
                                )
                            )

                    end

            end
            as score

        from metrics m

    ),


    grouped as (

        select

            domain,

            domain_label,

            min(position)
                as position,

            count(*) filter (
                where
                    target_value
                    is not null
            )
                as configured,

            count(score)
                as evaluated,

            round(
                avg(score),
                1
            )
                as score

        from scored

        group by
            domain,
            domain_label

    )


    select

        coalesce(

            jsonb_agg(

                jsonb_build_object(

                    'domain',
                    g.domain,

                    'label',
                    g.domain_label,

                    'configuredMetrics',
                    g.configured,

                    'evaluatedMetrics',
                    g.evaluated,

                    'score',
                    g.score,

                    'status',
                    case

                        when
                            g.configured = 0
                        then
                            'not_configured'

                        when
                            g.evaluated = 0
                        then
                            'unavailable'

                        when
                            g.score >= 100
                        then
                            'achieved'

                        when
                            g.score >= 80
                        then
                            'watch'

                        else
                            'critical'

                    end

                )

                order by g.position

            ),

            '[]'::jsonb
        )

    into v_domains

    from grouped g;


    -- ========================================================
    -- RESULT
    -- ========================================================

    return
        jsonb_build_object(


            'period',
            jsonb_build_object(

                'from',
                p_from,

                'to',
                p_to

            ),


            'summary',
            jsonb_build_object(

                'overallScore',
                v_overall_score,

                'status',
                case

                    when
                        v_configured_metrics = 0
                    then
                        'not_configured'

                    when
                        v_evaluated_metrics = 0
                    then
                        'unavailable'

                    when
                        v_overall_score >= 100
                    then
                        'achieved'

                    when
                        v_overall_score >= 80
                    then
                        'watch'

                    else
                        'critical'

                end,

                'totalMetrics',
                v_total_metrics,

                'configuredMetrics',
                v_configured_metrics,

                'evaluatedMetrics',
                v_evaluated_metrics,

                'achievedMetrics',
                v_achieved_metrics,

                'watchMetrics',
                v_watch_metrics,

                'criticalMetrics',
                v_critical_metrics

            ),


            'domains',
            v_domains,


            'metrics',
            v_metrics,


            'scoring',
            jsonb_build_object(

                'weighting',
                'equal',

                'maximumScore',
                100,

                'watchThreshold',
                80,

                'configuredOnly',
                true,

                'unavailableExcluded',
                true

            )

        );

end;

$function$;


comment on function
public.super_admin_performance_analytics(
    timestamptz,
    timestamptz
)
is
'Read-only Super Admin executive scorecard. Only configured and measurable KPI participate in scores.';


revoke all
on function
public.super_admin_performance_analytics(
    timestamptz,
    timestamptz
)
from public;


grant execute
on function
public.super_admin_performance_analytics(
    timestamptz,
    timestamptz
)
to authenticated;


commit;
