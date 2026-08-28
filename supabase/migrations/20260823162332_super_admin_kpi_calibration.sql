begin;

-- ============================================================
-- INDESY CONTROL CENTER
-- STRATEGIC KPI CALIBRATION
--
-- REAL VALUE        = read-only
-- CRITICAL VALUE    = strategic threshold
-- TARGET VALUE      = score objective
-- MATURITY VALUE    = long-term strategic target
--
-- No direct table access is exposed.
-- Writes are only possible through the Super Admin RPC.
-- ============================================================


-- ============================================================
-- EXTEND KPI TARGET STORAGE
-- ============================================================

alter table
public.super_admin_kpi_targets

add column if not exists
critical_value numeric,

add column if not exists
maturity_value numeric;


-- Growth KPI may legitimately use negative values.
alter table
public.super_admin_kpi_targets

drop constraint if exists
super_admin_kpi_targets_value_check;


-- ============================================================
-- HISTORY
-- ============================================================

create table if not exists
public.super_admin_kpi_target_history (

    id uuid primary key
        default gen_random_uuid(),

    metric_code text not null
        references public.super_admin_kpi_targets(
            metric_code
        )
        on delete cascade,

    previous_values jsonb not null
        default '{}'::jsonb,

    new_values jsonb not null
        default '{}'::jsonb,

    changed_by uuid
        references public.profiles(id)
        on delete set null,

    changed_at timestamptz not null
        default now()

);


create index if not exists
super_admin_kpi_target_history_metric_idx

on public.super_admin_kpi_target_history(
    metric_code,
    changed_at desc
);


alter table
public.super_admin_kpi_target_history
enable row level security;


revoke all
on table public.super_admin_kpi_target_history
from anon, authenticated;


revoke all
on table public.super_admin_kpi_targets
from anon, authenticated;


-- ============================================================
-- READ CONFIGURATION
-- ============================================================

create or replace function
public.super_admin_kpi_target_configuration()
returns jsonb

language plpgsql
stable
security definer

set search_path = public, pg_temp

as $function$

declare
    v_result jsonb;
begin

    if not public.is_super_admin() then

        raise exception
            'FORBIDDEN'
            using errcode = '42501';

    end if;


    with catalog (
        position,
        metric_code,
        direction,
        min_value,
        max_value,
        step_value
    )
    as (

        values

        (
            10,
            'user_growth_pct',
            'higher_is_better',
            -100::numeric,
            300::numeric,
            1::numeric
        ),

        (
            20,
            'user_verification_rate',
            'higher_is_better',
            0::numeric,
            100::numeric,
            1::numeric
        ),

        (
            30,
            'organization_verification_rate',
            'higher_is_better',
            0::numeric,
            100::numeric,
            1::numeric
        ),

        (
            40,
            'event_readiness_rate',
            'higher_is_better',
            0::numeric,
            100::numeric,
            1::numeric
        ),

        (
            50,
            'fight_completion_rate',
            'higher_is_better',
            0::numeric,
            100::numeric,
            1::numeric
        ),

        (
            60,
            'event_cancellation_rate',
            'lower_is_better',
            0::numeric,
            100::numeric,
            1::numeric
        ),

        (
            70,
            'marketplace_payment_success_rate',
            'higher_is_better',
            0::numeric,
            100::numeric,
            1::numeric
        ),

        (
            80,
            'marketplace_repeat_buyer_rate',
            'higher_is_better',
            0::numeric,
            100::numeric,
            1::numeric
        ),

        (
            90,
            'marketplace_low_stock_rate',
            'lower_is_better',
            0::numeric,
            100::numeric,
            1::numeric
        ),

        (
            100,
            'business_volume_growth_pct',
            'higher_is_better',
            -100::numeric,
            500::numeric,
            1::numeric
        ),

        (
            110,
            'database_cache_hit_rate',
            'higher_is_better',
            0::numeric,
            100::numeric,
            0.1::numeric
        )

    )


    select
        coalesce(

            jsonb_agg(

                jsonb_build_object(

                    'metricCode',
                    c.metric_code,

                    'direction',
                    c.direction,

                    'minValue',
                    c.min_value,

                    'maxValue',
                    c.max_value,

                    'stepValue',
                    c.step_value,

                    'criticalValue',
                    t.critical_value,

                    'targetValue',
                    t.target_value,

                    'maturityValue',
                    t.maturity_value,

                    'enabled',
                    coalesce(
                        t.enabled,
                        true
                    ),

                    'notes',
                    t.notes,

                    'updatedAt',
                    t.updated_at

                )

                order by c.position

            ),

            '[]'::jsonb

        )

    into v_result

    from catalog c

    left join
    public.super_admin_kpi_targets t

      on t.metric_code =
         c.metric_code;


    return v_result;

end;

$function$;


-- ============================================================
-- SAVE CONFIGURATION
-- ============================================================

create or replace function
public.super_admin_save_kpi_targets(
    p_targets jsonb
)
returns jsonb

language plpgsql
security definer

set search_path = public, pg_temp

as $function$

declare

    v_item jsonb;

    v_code text;
    v_direction text;

    v_min numeric;
    v_max numeric;

    v_critical numeric;
    v_target numeric;
    v_maturity numeric;

    v_enabled boolean;
    v_notes text;

    v_previous jsonb;
    v_new jsonb;

    v_changed integer := 0;

begin

    if not public.is_super_admin() then

        raise exception
            'FORBIDDEN'
            using errcode = '42501';

    end if;


    if p_targets is null
       or
       jsonb_typeof(
           p_targets
       ) <> 'array'
    then

        raise exception
            'La configuration KPI doit être un tableau JSON.';

    end if;


    for v_item in

        select value

        from jsonb_array_elements(
            p_targets
        )

    loop

        v_code :=
            nullif(
                btrim(
                    v_item ->>
                    'metricCode'
                ),
                ''
            );


        if v_code is null then

            raise exception
                'metricCode manquant.';

        end if;


        -- ----------------------------------------------------
        -- CATALOG
        -- ----------------------------------------------------

        select
            catalog.direction,
            catalog.min_value,
            catalog.max_value

        into
            v_direction,
            v_min,
            v_max

        from (

            values

            (
                'user_growth_pct',
                'higher_is_better',
                -100::numeric,
                300::numeric
            ),

            (
                'user_verification_rate',
                'higher_is_better',
                0::numeric,
                100::numeric
            ),

            (
                'organization_verification_rate',
                'higher_is_better',
                0::numeric,
                100::numeric
            ),

            (
                'event_readiness_rate',
                'higher_is_better',
                0::numeric,
                100::numeric
            ),

            (
                'fight_completion_rate',
                'higher_is_better',
                0::numeric,
                100::numeric
            ),

            (
                'event_cancellation_rate',
                'lower_is_better',
                0::numeric,
                100::numeric
            ),

            (
                'marketplace_payment_success_rate',
                'higher_is_better',
                0::numeric,
                100::numeric
            ),

            (
                'marketplace_repeat_buyer_rate',
                'higher_is_better',
                0::numeric,
                100::numeric
            ),

            (
                'marketplace_low_stock_rate',
                'lower_is_better',
                0::numeric,
                100::numeric
            ),

            (
                'business_volume_growth_pct',
                'higher_is_better',
                -100::numeric,
                500::numeric
            ),

            (
                'database_cache_hit_rate',
                'higher_is_better',
                0::numeric,
                100::numeric
            )

        )
        as catalog(
            metric_code,
            direction,
            min_value,
            max_value
        )

        where
            catalog.metric_code =
            v_code;


        if not found then

            raise exception
                'KPI inconnu : %',
                v_code;

        end if;


        -- ----------------------------------------------------
        -- VALUES
        -- ----------------------------------------------------

        v_critical :=
            case

                when
                    v_item ?
                    'criticalValue'

                    and

                    jsonb_typeof(
                        v_item ->
                        'criticalValue'
                    ) <> 'null'

                then
                    (
                        v_item ->>
                        'criticalValue'
                    )::numeric

                else null

            end;


        v_target :=
            case

                when
                    v_item ?
                    'targetValue'

                    and

                    jsonb_typeof(
                        v_item ->
                        'targetValue'
                    ) <> 'null'

                then
                    (
                        v_item ->>
                        'targetValue'
                    )::numeric

                else null

            end;


        v_maturity :=
            case

                when
                    v_item ?
                    'maturityValue'

                    and

                    jsonb_typeof(
                        v_item ->
                        'maturityValue'
                    ) <> 'null'

                then
                    (
                        v_item ->>
                        'maturityValue'
                    )::numeric

                else null

            end;


        v_enabled :=
            coalesce(
                (
                    v_item ->>
                    'enabled'
                )::boolean,
                true
            );


        v_notes :=
            nullif(
                btrim(
                    coalesce(
                        v_item ->>
                        'notes',
                        ''
                    )
                ),
                ''
            );


        -- ----------------------------------------------------
        -- RANGE VALIDATION
        -- ----------------------------------------------------

        if
            v_critical is not null
            and
            (
                v_critical < v_min
                or
                v_critical > v_max
            )
        then

            raise exception
                'Seuil critique hors plage pour %.',
                v_code;

        end if;


        if
            v_target is not null
            and
            (
                v_target < v_min
                or
                v_target > v_max
            )
        then

            raise exception
                'Objectif hors plage pour %.',
                v_code;

        end if;


        if
            v_maturity is not null
            and
            (
                v_maturity < v_min
                or
                v_maturity > v_max
            )
        then

            raise exception
                'Objectif maturité hors plage pour %.',
                v_code;

        end if;


        -- ----------------------------------------------------
        -- TARGET IS REQUIRED FOR STRATEGIC MARKERS
        -- ----------------------------------------------------

        if
            v_target is null
            and
            (
                v_critical is not null
                or
                v_maturity is not null
            )
        then

            raise exception
                'Un seuil critique ou une maturité nécessite un objectif pour %.',
                v_code;

        end if;


        -- ----------------------------------------------------
        -- STRATEGIC ORDER
        -- ----------------------------------------------------

        if
            v_direction =
            'higher_is_better'
        then

            if
                v_critical is not null
                and
                v_target is not null
                and
                v_critical >
                v_target
            then

                raise exception
                    'Pour %, le seuil critique doit être inférieur ou égal à l''objectif.',
                    v_code;

            end if;


            if
                v_target is not null
                and
                v_maturity is not null
                and
                v_target >
                v_maturity
            then

                raise exception
                    'Pour %, l''objectif maturité doit être supérieur ou égal à l''objectif.',
                    v_code;

            end if;


            if
                v_critical is not null
                and
                v_maturity is not null
                and
                v_critical >
                v_maturity
            then

                raise exception
                    'Ordre stratégique invalide pour %.',
                    v_code;

            end if;

        else

            if
                v_critical is not null
                and
                v_target is not null
                and
                v_critical <
                v_target
            then

                raise exception
                    'Pour %, le seuil critique doit être supérieur ou égal à l''objectif.',
                    v_code;

            end if;


            if
                v_target is not null
                and
                v_maturity is not null
                and
                v_target <
                v_maturity
            then

                raise exception
                    'Pour %, l''objectif maturité doit être inférieur ou égal à l''objectif.',
                    v_code;

            end if;


            if
                v_critical is not null
                and
                v_maturity is not null
                and
                v_critical <
                v_maturity
            then

                raise exception
                    'Ordre stratégique invalide pour %.',
                    v_code;

            end if;

        end if;


        -- ----------------------------------------------------
        -- PREVIOUS STATE
        -- ----------------------------------------------------

        select
            jsonb_build_object(

                'criticalValue',
                t.critical_value,

                'targetValue',
                t.target_value,

                'maturityValue',
                t.maturity_value,

                'enabled',
                t.enabled,

                'notes',
                t.notes

            )

        into v_previous

        from
        public.super_admin_kpi_targets t

        where
            t.metric_code =
            v_code

        for update;


        -- ----------------------------------------------------
        -- UPSERT
        -- ----------------------------------------------------

        insert into
        public.super_admin_kpi_targets (

            metric_code,

            critical_value,

            target_value,

            maturity_value,

            enabled,

            notes,

            updated_at,

            updated_by

        )
        values (

            v_code,

            v_critical,

            v_target,

            v_maturity,

            v_enabled,

            v_notes,

            now(),

            auth.uid()

        )

        on conflict (
            metric_code
        )

        do update set

            critical_value =
                excluded.critical_value,

            target_value =
                excluded.target_value,

            maturity_value =
                excluded.maturity_value,

            enabled =
                excluded.enabled,

            notes =
                excluded.notes,

            updated_at =
                now(),

            updated_by =
                auth.uid();


        v_new :=
            jsonb_build_object(

                'criticalValue',
                v_critical,

                'targetValue',
                v_target,

                'maturityValue',
                v_maturity,

                'enabled',
                v_enabled,

                'notes',
                v_notes

            );


        if
            v_previous is distinct from
            v_new
        then

            insert into
            public.super_admin_kpi_target_history (

                metric_code,

                previous_values,

                new_values,

                changed_by

            )
            values (

                v_code,

                coalesce(
                    v_previous,
                    '{}'::jsonb
                ),

                v_new,

                auth.uid()

            );


            v_changed :=
                v_changed + 1;

        end if;

    end loop;


    return
        jsonb_build_object(

            'updated',
            v_changed,

            'savedAt',
            now()

        );

end;

$function$;


-- ============================================================
-- SECURITY
-- ============================================================

revoke all
on function
public.super_admin_kpi_target_configuration()
from public;


revoke all
on function
public.super_admin_save_kpi_targets(
    jsonb
)
from public;


grant execute
on function
public.super_admin_kpi_target_configuration()
to authenticated;


grant execute
on function
public.super_admin_save_kpi_targets(
    jsonb
)
to authenticated;


commit;
