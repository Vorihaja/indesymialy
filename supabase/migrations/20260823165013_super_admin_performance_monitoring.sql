begin;

-- ============================================================
-- INDESY CONTROL CENTER
-- PERFORMANCE MONITORING
--
-- Un snapshot quotidien maximum par période :
-- 7 / 30 / 90 / 365 jours.
--
-- Aucun CRUD métier.
-- Aucune donnée simulée.
-- ============================================================


create table if not exists
public.super_admin_performance_snapshots (

    id uuid primary key
        default gen_random_uuid(),

    snapshot_date date not null,

    captured_at timestamptz not null
        default now(),

    period_days integer not null,

    period_from timestamptz not null,

    period_to timestamptz not null,

    overall_score numeric,

    status text not null,

    configured_metrics integer not null
        default 0,

    evaluated_metrics integer not null
        default 0,

    achieved_metrics integer not null
        default 0,

    watch_metrics integer not null
        default 0,

    critical_metrics integer not null
        default 0,

    target_configuration_updated_at timestamptz,

    summary jsonb not null
        default '{}'::jsonb,

    domains jsonb not null
        default '[]'::jsonb,

    metrics jsonb not null
        default '[]'::jsonb,

    constraint
    super_admin_performance_snapshots_period_check
    check (
        period_days in (
            7,
            30,
            90,
            365
        )
    ),

    constraint
    super_admin_performance_snapshots_period_dates_check
    check (
        period_to >
        period_from
    ),

    constraint
    super_admin_performance_snapshots_unique_day
    unique (
        snapshot_date,
        period_days
    )

);


create index if not exists
super_admin_performance_snapshots_history_idx

on public.super_admin_performance_snapshots(
    period_days,
    snapshot_date desc
);


alter table
public.super_admin_performance_snapshots
enable row level security;


revoke all
on table
public.super_admin_performance_snapshots
from anon, authenticated;


-- ============================================================
-- CAPTURE CURRENT PERFORMANCE
-- ============================================================

create or replace function
public.super_admin_capture_performance_snapshot(
    p_period_days integer
)
returns jsonb

language plpgsql
security definer

set search_path = public, pg_temp

as $function$

declare

    v_from timestamptz;
    v_to timestamptz;

    v_snapshot_date date;

    v_payload jsonb;

    v_summary jsonb;

    v_target_updated_at timestamptz;

    v_overall_score numeric;

begin

    if not public.is_super_admin() then

        raise exception
            'FORBIDDEN'
            using errcode = '42501';

    end if;


    if p_period_days not in (
        7,
        30,
        90,
        365
    ) then

        raise exception
            'Période Analytics non supportée.';

    end if;


    v_to :=
        now();

    v_from :=
        v_to -
        make_interval(
            days =>
                p_period_days
        );

    v_snapshot_date :=
        (
            v_to
            at time zone 'UTC'
        )::date;


    v_payload :=
        public.super_admin_performance_analytics(
            v_from,
            v_to
        );


    v_summary :=
        coalesce(
            v_payload ->
            'summary',
            '{}'::jsonb
        );


    select
        max(
            updated_at
        )

    into
        v_target_updated_at

    from
        public.super_admin_kpi_targets;


    v_overall_score :=
        case

            when
                v_summary ->
                'overallScore'
                is null

                or

                jsonb_typeof(
                    v_summary ->
                    'overallScore'
                ) =
                'null'

            then null

            else
                (
                    v_summary ->>
                    'overallScore'
                )::numeric

        end;


    insert into
    public.super_admin_performance_snapshots (

        snapshot_date,

        captured_at,

        period_days,

        period_from,

        period_to,

        overall_score,

        status,

        configured_metrics,

        evaluated_metrics,

        achieved_metrics,

        watch_metrics,

        critical_metrics,

        target_configuration_updated_at,

        summary,

        domains,

        metrics

    )
    values (

        v_snapshot_date,

        v_to,

        p_period_days,

        v_from,

        v_to,

        v_overall_score,

        coalesce(
            v_summary ->>
            'status',
            'unavailable'
        ),

        coalesce(
            (
                v_summary ->>
                'configuredMetrics'
            )::integer,
            0
        ),

        coalesce(
            (
                v_summary ->>
                'evaluatedMetrics'
            )::integer,
            0
        ),

        coalesce(
            (
                v_summary ->>
                'achievedMetrics'
            )::integer,
            0
        ),

        coalesce(
            (
                v_summary ->>
                'watchMetrics'
            )::integer,
            0
        ),

        coalesce(
            (
                v_summary ->>
                'criticalMetrics'
            )::integer,
            0
        ),

        v_target_updated_at,

        v_summary,

        coalesce(
            v_payload ->
            'domains',
            '[]'::jsonb
        ),

        coalesce(
            v_payload ->
            'metrics',
            '[]'::jsonb
        )

    )

    on conflict (
        snapshot_date,
        period_days
    )

    do update set

        captured_at =
            excluded.captured_at,

        period_from =
            excluded.period_from,

        period_to =
            excluded.period_to,

        overall_score =
            excluded.overall_score,

        status =
            excluded.status,

        configured_metrics =
            excluded.configured_metrics,

        evaluated_metrics =
            excluded.evaluated_metrics,

        achieved_metrics =
            excluded.achieved_metrics,

        watch_metrics =
            excluded.watch_metrics,

        critical_metrics =
            excluded.critical_metrics,

        target_configuration_updated_at =
            excluded.target_configuration_updated_at,

        summary =
            excluded.summary,

        domains =
            excluded.domains,

        metrics =
            excluded.metrics;


    return
        jsonb_build_object(

            'snapshotDate',
            v_snapshot_date,

            'capturedAt',
            v_to,

            'periodDays',
            p_period_days,

            'overallScore',
            v_overall_score

        );

end;

$function$;


-- ============================================================
-- READ HISTORY
-- ============================================================

create or replace function
public.super_admin_performance_snapshot_history(

    p_period_days integer,

    p_limit integer
        default 12

)
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


    if p_period_days not in (
        7,
        30,
        90,
        365
    ) then

        raise exception
            'Période Analytics non supportée.';

    end if;


    if
        p_limit < 1
        or
        p_limit > 100
    then

        raise exception
            'La limite doit être comprise entre 1 et 100.';

    end if;


    select
        coalesce(

            jsonb_agg(

                jsonb_build_object(

                    'snapshotDate',
                    h.snapshot_date,

                    'capturedAt',
                    h.captured_at,

                    'periodDays',
                    h.period_days,

                    'periodFrom',
                    h.period_from,

                    'periodTo',
                    h.period_to,

                    'overallScore',
                    h.overall_score,

                    'status',
                    h.status,

                    'configuredMetrics',
                    h.configured_metrics,

                    'evaluatedMetrics',
                    h.evaluated_metrics,

                    'achievedMetrics',
                    h.achieved_metrics,

                    'watchMetrics',
                    h.watch_metrics,

                    'criticalMetrics',
                    h.critical_metrics,

                    'targetConfigurationUpdatedAt',
                    h.target_configuration_updated_at

                )

                order by
                    h.snapshot_date asc

            ),

            '[]'::jsonb

        )

    into
        v_result

    from (

        select
            s.*

        from
            public.super_admin_performance_snapshots s

        where
            s.period_days =
            p_period_days

        order by
            s.snapshot_date desc

        limit
            p_limit

    ) h;


    return
        v_result;

end;

$function$;


comment on table
public.super_admin_performance_snapshots
is
'Daily Super Admin executive performance snapshots used exclusively for strategic trend monitoring.';


revoke all
on function
public.super_admin_capture_performance_snapshot(
    integer
)
from public;


revoke all
on function
public.super_admin_performance_snapshot_history(
    integer,
    integer
)
from public;


grant execute
on function
public.super_admin_capture_performance_snapshot(
    integer
)
to authenticated;


grant execute
on function
public.super_admin_performance_snapshot_history(
    integer,
    integer
)
to authenticated;


commit;
