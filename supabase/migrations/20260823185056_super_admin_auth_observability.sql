begin;


-- ============================================================
-- INDESY CONTROL CENTER
-- LOT 3G-B
-- AUTH OBSERVABILITY
--
-- NO:
-- email
-- password
-- access token
-- refresh token
-- IP
-- user agent
--
-- This is application-observed authentication telemetry.
-- ============================================================


create table if not exists
public.auth_observability_events (

    id uuid primary key
        default gen_random_uuid(),

    event_id uuid not null unique,

    observed_at timestamptz not null
        default now(),

    outcome text not null,

    duration_ms integer not null,

    error_category text,

    auth_method text not null
        default 'password',

    source text not null
        default 'web_client_repository',

    constraint
    auth_observability_events_outcome_check
    check (
        outcome in (
            'success',
            'failure'
        )
    ),

    constraint
    auth_observability_events_duration_check
    check (
        duration_ms
        between 0 and 120000
    ),

    constraint
    auth_observability_events_error_check
    check (
        error_category is null
        or
        error_category in (
            'invalid_credentials',
            'email_not_confirmed',
            'user_banned',
            'rate_limited',
            'network_error',
            'service_error',
            'validation_error',
            'unknown'
        )
    ),

    constraint
    auth_observability_events_method_check
    check (
        auth_method =
        'password'
    ),

    constraint
    auth_observability_events_source_check
    check (
        source =
        'web_client_repository'
    ),

    constraint
    auth_observability_events_success_error_check
    check (
        (
            outcome =
            'success'

            and

            error_category
            is null
        )
        or
        (
            outcome =
            'failure'
        )
    )
);


create index if not exists
auth_observability_events_observed_idx

on public.auth_observability_events(
    observed_at desc
);


create index if not exists
auth_observability_events_outcome_idx

on public.auth_observability_events(
    outcome,
    observed_at desc
);


create index if not exists
auth_observability_events_error_idx

on public.auth_observability_events(
    error_category,
    observed_at desc
)

where
    outcome =
    'failure';


alter table
public.auth_observability_events
enable row level security;


revoke all
on table
public.auth_observability_events
from anon, authenticated;


-- ============================================================
-- TELEMETRY INGESTION
--
-- The browser never receives INSERT access to the table.
-- It can only call this constrained function.
--
-- Successful observations require a real authenticated JWT.
--
-- Anonymous failures have a coarse global ingestion ceiling
-- to protect the observability table from runaway writes.
-- ============================================================

create or replace function
public.record_auth_observability_event(

    p_event_id uuid,

    p_outcome text,

    p_duration_ms integer,

    p_error_category text

)
returns boolean

language plpgsql
volatile
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

declare

    v_outcome text;

    v_category text;

    v_recent_total bigint;

    v_recent_anonymous_failures bigint;

    v_rows integer;

begin

    v_outcome :=
        lower(
            btrim(
                coalesce(
                    p_outcome,
                    ''
                )
            )
        );


    if
        v_outcome not in (
            'success',
            'failure'
        )
    then

        return false;

    end if;


    if
        p_event_id
        is null
    then

        return false;

    end if;


    if
        p_duration_ms
        is null
        or
        p_duration_ms < 0
        or
        p_duration_ms > 120000
    then

        return false;

    end if;


    if
        v_outcome =
        'success'
    then

        /*
         * A successful login observation is accepted only
         * after Supabase has issued an authenticated session.
         */
        if
            auth.uid()
            is null
        then

            return false;

        end if;


        v_category :=
            null;

    else

        v_category :=
            lower(
                btrim(
                    coalesce(
                        p_error_category,
                        'unknown'
                    )
                )
            );


        if
            v_category not in (
                'invalid_credentials',
                'email_not_confirmed',
                'user_banned',
                'rate_limited',
                'network_error',
                'service_error',
                'validation_error',
                'unknown'
            )
        then

            v_category :=
                'unknown';

        end if;

    end if;


    /*
     * Coarse global safety ceiling.
     *
     * This is not a security rate limiter for authentication.
     * Supabase Auth remains responsible for authentication
     * attack protection.
     */
    select
        count(*)

    into
        v_recent_total

    from
        public.auth_observability_events

    where
        observed_at >=
        now() -
        interval '1 minute';


    if
        v_recent_total >=
        600
    then

        return false;

    end if;


    if
        v_outcome =
        'failure'

        and

        auth.uid()
        is null
    then

        select
            count(*)

        into
            v_recent_anonymous_failures

        from
            public.auth_observability_events

        where
            outcome =
            'failure'

            and

            observed_at >=
            now() -
            interval '1 minute';


        if
            v_recent_anonymous_failures >=
            240
        then

            return false;

        end if;

    end if;


    insert into
    public.auth_observability_events (

        event_id,

        observed_at,

        outcome,

        duration_ms,

        error_category,

        auth_method,

        source

    )
    values (

        p_event_id,

        now(),

        v_outcome,

        p_duration_ms,

        v_category,

        'password',

        'web_client_repository'

    )

    on conflict (
        event_id
    )
    do nothing;


    get diagnostics
        v_rows =
        row_count;


    return
        v_rows = 1;

end;

$function$;


revoke all
on function
public.record_auth_observability_event(
    uuid,
    text,
    integer,
    text
)
from public;


grant execute
on function
public.record_auth_observability_event(
    uuid,
    text,
    integer,
    text
)
to anon, authenticated;


-- ============================================================
-- SUPER ADMIN ANALYTICS
-- ============================================================

create or replace function
public.super_admin_auth_observability(

    p_from timestamptz
        default now() -
        interval '30 days',

    p_to timestamptz
        default now()

)
returns jsonb

language plpgsql
stable
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

declare

    v_duration interval;

    v_previous_from timestamptz;

    v_attempts bigint := 0;

    v_successes bigint := 0;

    v_failures bigint := 0;

    v_success_rate numeric;

    v_failure_rate numeric;

    v_average_ms numeric;

    v_p95_ms numeric;

    v_success_average_ms numeric;

    v_failure_average_ms numeric;


    v_previous_attempts bigint := 0;

    v_previous_successes bigint := 0;

    v_previous_failures bigint := 0;

    v_previous_failure_rate numeric;

    v_previous_p95_ms numeric;


    v_attempt_growth numeric;

    v_failure_rate_delta numeric;

    v_p95_change numeric;


    v_coverage_started_at timestamptz;

    v_last_success_at timestamptz;

    v_last_failure_at timestamptz;


    v_categories jsonb;

    v_daily jsonb;

    v_recent jsonb;

begin

    if not public.is_super_admin() then

        raise exception
            'FORBIDDEN'
            using errcode =
            '42501';

    end if;


    if
        p_to <=
        p_from
    then

        raise exception
            'Période invalide.';

    end if;


    if
        p_to -
        p_from >
        interval '2 years'
    then

        raise exception
            'La période maximale est de deux ans.';

    end if;


    v_duration :=
        p_to -
        p_from;


    v_previous_from :=
        p_from -
        v_duration;


    -- ========================================================
    -- CURRENT PERIOD
    -- ========================================================

    select

        count(*),

        count(*) filter (
            where
                outcome =
                'success'
        ),

        count(*) filter (
            where
                outcome =
                'failure'
        ),

        round(
            avg(
                duration_ms
            )::numeric,
            1
        ),

        round(
            (
                percentile_cont(
                    0.95
                )
                within group (
                    order by
                        duration_ms
                )
            )::numeric,
            1
        ),

        round(
            avg(
                duration_ms
            )
            filter (
                where
                    outcome =
                    'success'
            )::numeric,
            1
        ),

        round(
            avg(
                duration_ms
            )
            filter (
                where
                    outcome =
                    'failure'
            )::numeric,
            1
        )

    into

        v_attempts,

        v_successes,

        v_failures,

        v_average_ms,

        v_p95_ms,

        v_success_average_ms,

        v_failure_average_ms

    from
        public.auth_observability_events

    where
        observed_at >=
        p_from

        and

        observed_at <
        p_to;


    if
        v_attempts >
        0
    then

        v_success_rate :=
            round(
                (
                    v_successes::numeric
                    /
                    v_attempts::numeric
                )
                *
                100,
                2
            );


        v_failure_rate :=
            round(
                (
                    v_failures::numeric
                    /
                    v_attempts::numeric
                )
                *
                100,
                2
            );

    end if;


    -- ========================================================
    -- PREVIOUS EQUAL-DURATION PERIOD
    -- ========================================================

    select

        count(*),

        count(*) filter (
            where
                outcome =
                'success'
        ),

        count(*) filter (
            where
                outcome =
                'failure'
        ),

        round(
            (
                percentile_cont(
                    0.95
                )
                within group (
                    order by
                        duration_ms
                )
            )::numeric,
            1
        )

    into

        v_previous_attempts,

        v_previous_successes,

        v_previous_failures,

        v_previous_p95_ms

    from
        public.auth_observability_events

    where
        observed_at >=
        v_previous_from

        and

        observed_at <
        p_from;


    if
        v_previous_attempts >
        0
    then

        v_previous_failure_rate :=
            round(
                (
                    v_previous_failures::numeric
                    /
                    v_previous_attempts::numeric
                )
                *
                100,
                2
            );

    end if;


    -- ========================================================
    -- COMPARISONS
    -- ========================================================

    if
        v_previous_attempts >
        0
    then

        v_attempt_growth :=
            round(
                (
                    (
                        v_attempts -
                        v_previous_attempts
                    )::numeric
                    /
                    v_previous_attempts::numeric
                )
                *
                100,
                2
            );

    end if;


    if
        v_failure_rate
        is not null

        and

        v_previous_failure_rate
        is not null
    then

        v_failure_rate_delta :=
            round(
                v_failure_rate -
                v_previous_failure_rate,
                2
            );

    end if;


    if
        v_p95_ms
        is not null

        and

        v_previous_p95_ms
        is not null

        and

        v_previous_p95_ms >
        0
    then

        v_p95_change :=
            round(
                (
                    (
                        v_p95_ms -
                        v_previous_p95_ms
                    )
                    /
                    v_previous_p95_ms
                )
                *
                100,
                2
            );

    end if;


    -- ========================================================
    -- COVERAGE
    -- ========================================================

    select
        min(
            observed_at
        )

    into
        v_coverage_started_at

    from
        public.auth_observability_events;


    select
        max(
            observed_at
        )
        filter (
            where
                outcome =
                'success'
        ),

        max(
            observed_at
        )
        filter (
            where
                outcome =
                'failure'
        )

    into
        v_last_success_at,
        v_last_failure_at

    from
        public.auth_observability_events;


    -- ========================================================
    -- FAILURE CATEGORIES
    -- ========================================================

    select
        coalesce(

            jsonb_agg(

                jsonb_build_object(

                    'category',
                        q.category,

                    'count',
                        q.total,

                    'share',
                        case

                            when
                                v_failures =
                                0
                            then
                                null

                            else
                                round(
                                    (
                                        q.total::numeric
                                        /
                                        v_failures::numeric
                                    )
                                    *
                                    100,
                                    2
                                )

                        end

                )

                order by
                    q.total desc,
                    q.category asc

            ),

            '[]'::jsonb

        )

    into
        v_categories

    from (

        select

            coalesce(
                error_category,
                'unknown'
            )
                as category,

            count(*)
                as total

        from
            public.auth_observability_events

        where
            observed_at >=
            p_from

            and

            observed_at <
            p_to

            and

            outcome =
            'failure'

        group by
            coalesce(
                error_category,
                'unknown'
            )

    ) q;


    -- ========================================================
    -- DAILY SERIES
    -- ========================================================

    select
        coalesce(

            jsonb_agg(

                jsonb_build_object(

                    'day',
                        q.day,

                    'attempts',
                        q.attempts,

                    'successes',
                        q.successes,

                    'failures',
                        q.failures,

                    'failureRate',
                        case

                            when
                                q.attempts =
                                0
                            then
                                null

                            else
                                round(
                                    (
                                        q.failures::numeric
                                        /
                                        q.attempts::numeric
                                    )
                                    *
                                    100,
                                    2
                                )

                        end,

                    'p95DurationMs',
                        q.p95_duration_ms

                )

                order by
                    q.day asc

            ),

            '[]'::jsonb

        )

    into
        v_daily

    from (

        select

            date_trunc(
                'day',
                observed_at
            )::date::text
                as day,

            count(*)
                as attempts,

            count(*) filter (
                where
                    outcome =
                    'success'
            )
                as successes,

            count(*) filter (
                where
                    outcome =
                    'failure'
            )
                as failures,

            round(
                (
                    percentile_cont(
                        0.95
                    )
                    within group (
                        order by
                            duration_ms
                    )
                )::numeric,
                1
            )
                as p95_duration_ms

        from
            public.auth_observability_events

        where
            observed_at >=
            p_from

            and

            observed_at <
            p_to

        group by
            date_trunc(
                'day',
                observed_at
            )::date

    ) q;


    -- ========================================================
    -- RECENT EVENTS
    -- ========================================================

    select
        coalesce(

            jsonb_agg(

                jsonb_build_object(

                    'observedAt',
                        q.observed_at,

                    'outcome',
                        q.outcome,

                    'durationMs',
                        q.duration_ms,

                    'errorCategory',
                        q.error_category

                )

                order by
                    q.observed_at desc

            ),

            '[]'::jsonb

        )

    into
        v_recent

    from (

        select

            observed_at,

            outcome,

            duration_ms,

            error_category

        from
            public.auth_observability_events

        order by
            observed_at desc

        limit 20

    ) q;


    return
        jsonb_build_object(

            'source',
                'web_client_repository',

            'coverageStartedAt',
                v_coverage_started_at,

            'lastSuccessAt',
                v_last_success_at,

            'lastFailureAt',
                v_last_failure_at,

            'attempts',
                v_attempts,

            'successes',
                v_successes,

            'failures',
                v_failures,

            'successRate',
                v_success_rate,

            'failureRate',
                v_failure_rate,

            'averageDurationMs',
                v_average_ms,

            'p95DurationMs',
                v_p95_ms,

            'successAverageDurationMs',
                v_success_average_ms,

            'failureAverageDurationMs',
                v_failure_average_ms,

            'previousAttempts',
                v_previous_attempts,

            'previousSuccesses',
                v_previous_successes,

            'previousFailures',
                v_previous_failures,

            'previousFailureRate',
                v_previous_failure_rate,

            'previousP95DurationMs',
                v_previous_p95_ms,

            'attemptGrowthPct',
                v_attempt_growth,

            'failureRateDelta',
                v_failure_rate_delta,

            'p95DurationChangePct',
                v_p95_change,

            'errorCategories',
                v_categories,

            'daily',
                v_daily,

            'recentEvents',
                v_recent,

            'privacy',
                jsonb_build_object(

                    'storesEmail',
                        false,

                    'storesPassword',
                        false,

                    'storesTokens',
                        false,

                    'storesIp',
                        false,

                    'storesUserAgent',
                        false

                ),

            'limitations',
                jsonb_build_object(

                    'applicationObserved',
                        true,

                    'forensicAuthServerLog',
                        false,

                    'anonymousFailureIngestionProtected',
                        true

                )

        );

end;

$function$;


revoke all
on function
public.super_admin_auth_observability(
    timestamptz,
    timestamptz
)
from public;


grant execute
on function
public.super_admin_auth_observability(
    timestamptz,
    timestamptz
)
to authenticated;


-- ============================================================
-- RETENTION
-- ============================================================

create or replace function
public.prune_auth_observability_events()
returns integer

language plpgsql
volatile
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

declare

    v_deleted integer;

begin

    delete from
        public.auth_observability_events

    where
        observed_at <
        now() -
        interval '400 days';


    get diagnostics
        v_deleted =
        row_count;


    return
        v_deleted;

end;

$function$;


revoke all
on function
public.prune_auth_observability_events()
from public;


-- ============================================================
-- DAILY RETENTION JOB
-- ============================================================

create extension
if not exists pg_cron;


do $block$

declare

    v_job_id bigint;

begin

    for v_job_id in

        select
            jobid

        from
            cron.job

        where
            jobname =
            'indesy-auth-observability-retention'

    loop

        perform
            cron.unschedule(
                v_job_id
            );

    end loop;

end;

$block$;


select
cron.schedule(

    'indesy-auth-observability-retention',

    '41 3 * * *',

    $cron$

        select
            public.prune_auth_observability_events();

    $cron$

);


commit;