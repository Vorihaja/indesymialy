begin;


-- ============================================================
-- INDESY CONTROL CENTER
-- LOT 3G-C1
-- REALTIME OBSERVABILITY
--
-- Instrumented domains:
--   communication
--   fight_live
--
-- No:
--   user id
--   email
--   fight id
--   message id
--   message content
--   realtime payload
--   token
--   IP
--   User-Agent
-- ============================================================


create table if not exists
public.realtime_observability_events (

    id uuid primary key
        default gen_random_uuid(),

    event_id uuid not null unique,

    subscription_id uuid not null,

    observed_at timestamptz not null
        default now(),

    domain text not null,

    channel_kind text not null,

    status text not null,

    duration_ms integer not null,

    is_initial_status boolean not null
        default false,

    intentional boolean not null
        default false,

    error_category text,

    source text not null
        default 'supabase_realtime_client',


    constraint
    realtime_observability_events_domain_check
    check (
        domain in (
            'communication',
            'fight_live'
        )
    ),


    constraint
    realtime_observability_events_status_check
    check (
        status in (
            'SUBSCRIBED',
            'CHANNEL_ERROR',
            'TIMED_OUT',
            'CLOSED'
        )
    ),


    constraint
    realtime_observability_events_duration_check
    check (
        duration_ms
        between 0 and 600000
    ),


    constraint
    realtime_observability_events_error_check
    check (
        error_category is null
        or
        error_category in (
            'timeout',
            'authorization',
            'network',
            'socket_closed',
            'binding_mismatch',
            'server',
            'unknown'
        )
    ),


    constraint
    realtime_observability_events_source_check
    check (
        source =
        'supabase_realtime_client'
    ),


    constraint
    realtime_observability_events_channel_check
    check (

        (
            domain =
            'communication'

            and

            channel_kind in (
                'messages',
                'message_reads',
                'conversations',
                'system_notifications',
                'fight_proposals',
                'sponsor_offers'
            )
        )

        or

        (
            domain =
            'fight_live'

            and

            channel_kind in (
                'fight_events',
                'timer',
                'scores',
                'status',
                'result'
            )
        )

    )

);


create index if not exists
realtime_observability_events_observed_idx

on public.realtime_observability_events(
    observed_at desc
);


create index if not exists
realtime_observability_events_subscription_idx

on public.realtime_observability_events(
    subscription_id,
    observed_at asc
);


create index if not exists
realtime_observability_events_domain_idx

on public.realtime_observability_events(
    domain,
    observed_at desc
);


create index if not exists
realtime_observability_events_status_idx

on public.realtime_observability_events(
    status,
    observed_at desc
);


alter table
public.realtime_observability_events
enable row level security;


revoke all
on table
public.realtime_observability_events
from anon, authenticated;


-- ============================================================
-- INGESTION RPC
-- ============================================================

create or replace function
public.record_realtime_observability_event(

    p_event_id uuid,

    p_subscription_id uuid,

    p_domain text,

    p_channel_kind text,

    p_status text,

    p_duration_ms integer,

    p_is_initial_status boolean,

    p_intentional boolean,

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

    v_domain text;

    v_channel_kind text;

    v_status text;

    v_error_category text;

    v_intentional boolean;

    v_recent_total bigint;

    v_recent_anonymous bigint;

    v_rows integer;

begin

    if
        p_event_id is null
        or
        p_subscription_id is null
    then

        return false;

    end if;


    v_domain :=
        lower(
            btrim(
                coalesce(
                    p_domain,
                    ''
                )
            )
        );


    v_channel_kind :=
        lower(
            btrim(
                coalesce(
                    p_channel_kind,
                    ''
                )
            )
        );


    v_status :=
        upper(
            btrim(
                coalesce(
                    p_status,
                    ''
                )
            )
        );


    if
        v_domain not in (
            'communication',
            'fight_live'
        )
    then

        return false;

    end if;


    if
        v_domain =
        'communication'

        and

        v_channel_kind not in (
            'messages',
            'message_reads',
            'conversations',
            'system_notifications',
            'fight_proposals',
            'sponsor_offers'
        )
    then

        return false;

    end if;


    if
        v_domain =
        'fight_live'

        and

        v_channel_kind not in (
            'fight_events',
            'timer',
            'scores',
            'status',
            'result'
        )
    then

        return false;

    end if;


    if
        v_status not in (
            'SUBSCRIBED',
            'CHANNEL_ERROR',
            'TIMED_OUT',
            'CLOSED'
        )
    then

        return false;

    end if;


    if
        p_duration_ms is null
        or
        p_duration_ms < 0
        or
        p_duration_ms > 600000
    then

        return false;

    end if;


    v_intentional :=
        case

            when
                v_status =
                'CLOSED'
            then
                coalesce(
                    p_intentional,
                    false
                )

            else
                false

        end;


    v_error_category :=
        lower(
            btrim(
                coalesce(
                    p_error_category,
                    ''
                )
            )
        );


    if
        v_status =
        'SUBSCRIBED'
    then

        v_error_category :=
            null;

    else

        if
            v_error_category not in (
                'timeout',
                'authorization',
                'network',
                'socket_closed',
                'binding_mismatch',
                'server',
                'unknown'
            )
        then

            v_error_category :=
                'unknown';

        end if;

    end if;


    -- ========================================================
    -- COARSE INGESTION SAFETY
    -- NOT AN AUTHENTICATION / DOS SECURITY SYSTEM
    -- ========================================================

    select
        count(*)

    into
        v_recent_total

    from
        public.realtime_observability_events

    where
        observed_at >=
        now() -
        interval '1 minute';


    if
        v_recent_total >=
        2000
    then

        return false;

    end if;


    if
        auth.uid()
        is null
    then

        select
            count(*)

        into
            v_recent_anonymous

        from
            public.realtime_observability_events

        where
            observed_at >=
            now() -
            interval '1 minute';


        if
            v_recent_anonymous >=
            600
        then

            return false;

        end if;

    end if;


    insert into
    public.realtime_observability_events (

        event_id,

        subscription_id,

        observed_at,

        domain,

        channel_kind,

        status,

        duration_ms,

        is_initial_status,

        intentional,

        error_category,

        source

    )
    values (

        p_event_id,

        p_subscription_id,

        now(),

        v_domain,

        v_channel_kind,

        v_status,

        p_duration_ms,

        coalesce(
            p_is_initial_status,
            false
        ),

        v_intentional,

        v_error_category,

        'supabase_realtime_client'

    )

    on conflict (
        event_id
    )
    do nothing;


    get diagnostics
        v_rows =
        row_count;


    return
        v_rows =
        1;

end;

$function$;


revoke all
on function
public.record_realtime_observability_event(
    uuid,
    uuid,
    text,
    text,
    text,
    integer,
    boolean,
    boolean,
    text
)
from public;


grant execute
on function
public.record_realtime_observability_event(
    uuid,
    uuid,
    text,
    text,
    text,
    integer,
    boolean,
    boolean,
    text
)
to anon, authenticated;


-- ============================================================
-- SUPER ADMIN ANALYTICS
-- ============================================================

create or replace function
public.super_admin_realtime_observability(

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

    v_cancelled bigint := 0;

    v_success_rate numeric;


    v_channel_errors bigint := 0;

    v_timeouts bigint := 0;

    v_unexpected_closures bigint := 0;

    v_intentional_closures bigint := 0;

    v_reconnections bigint := 0;


    v_average_subscription_ms numeric;

    v_p95_subscription_ms numeric;


    v_previous_success_rate numeric;

    v_success_rate_delta numeric;


    v_coverage_started_at timestamptz;

    v_last_subscribed_at timestamptz;

    v_last_problem_at timestamptz;


    v_domain_breakdown jsonb;

    v_channel_breakdown jsonb;

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
    -- INITIAL SUBSCRIPTION OUTCOMES
    -- ========================================================

    select

        count(*) filter (
            where
                is_initial_status
        ),

        count(*) filter (
            where
                is_initial_status

                and

                status =
                'SUBSCRIBED'
        ),

        count(*) filter (
            where
                is_initial_status

                and

                (
                    status in (
                        'CHANNEL_ERROR',
                        'TIMED_OUT'
                    )

                    or

                    (
                        status =
                        'CLOSED'

                        and

                        not intentional
                    )
                )
        ),

        count(*) filter (
            where
                is_initial_status

                and

                status =
                'CLOSED'

                and

                intentional
        ),

        count(*) filter (
            where
                status =
                'CHANNEL_ERROR'
        ),

        count(*) filter (
            where
                status =
                'TIMED_OUT'
        ),

        count(*) filter (
            where
                status =
                'CLOSED'

                and

                not intentional
        ),

        count(*) filter (
            where
                status =
                'CLOSED'

                and

                intentional
        ),

        count(*) filter (
            where
                status =
                'SUBSCRIBED'

                and

                not is_initial_status
        ),

        round(
            avg(
                duration_ms
            )
            filter (
                where
                    status =
                    'SUBSCRIBED'

                    and

                    is_initial_status
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
                filter (
                    where
                        status =
                        'SUBSCRIBED'

                        and

                        is_initial_status
                )
            )::numeric,
            1
        )

    into

        v_attempts,

        v_successes,

        v_failures,

        v_cancelled,

        v_channel_errors,

        v_timeouts,

        v_unexpected_closures,

        v_intentional_closures,

        v_reconnections,

        v_average_subscription_ms,

        v_p95_subscription_ms

    from
        public.realtime_observability_events

    where
        observed_at >=
        p_from

        and

        observed_at <
        p_to;


    if
        (
            v_successes +
            v_failures
        ) >
        0
    then

        v_success_rate :=
            round(
                (
                    v_successes::numeric
                    /
                    (
                        v_successes +
                        v_failures
                    )::numeric
                )
                *
                100,
                2
            );

    end if;


    -- ========================================================
    -- PREVIOUS PERIOD SUCCESS RATE
    -- ========================================================

    select

        case

            when
                (
                    count(*) filter (
                        where
                            is_initial_status

                            and

                            status =
                            'SUBSCRIBED'
                    )

                    +

                    count(*) filter (
                        where
                            is_initial_status

                            and

                            (
                                status in (
                                    'CHANNEL_ERROR',
                                    'TIMED_OUT'
                                )

                                or

                                (
                                    status =
                                    'CLOSED'

                                    and

                                    not intentional
                                )
                            )
                    )
                ) =
                0
            then
                null

            else

                round(
                    (
                        count(*) filter (
                            where
                                is_initial_status

                                and

                                status =
                                'SUBSCRIBED'
                        )
                    )::numeric

                    /

                    (
                        count(*) filter (
                            where
                                is_initial_status

                                and

                                status =
                                'SUBSCRIBED'
                        )

                        +

                        count(*) filter (
                            where
                                is_initial_status

                                and

                                (
                                    status in (
                                        'CHANNEL_ERROR',
                                        'TIMED_OUT'
                                    )

                                    or

                                    (
                                        status =
                                        'CLOSED'

                                        and

                                        not intentional
                                    )
                                )
                        )
                    )::numeric

                    *
                    100,
                    2
                )

        end

    into
        v_previous_success_rate

    from
        public.realtime_observability_events

    where
        observed_at >=
        v_previous_from

        and

        observed_at <
        p_from;


    if
        v_success_rate is not null

        and

        v_previous_success_rate is not null
    then

        v_success_rate_delta :=
            round(
                v_success_rate -
                v_previous_success_rate,
                2
            );

    end if;


    -- ========================================================
    -- COVERAGE
    -- ========================================================

    select
        min(
            observed_at
        ),

        max(
            observed_at
        )
        filter (
            where
                status =
                'SUBSCRIBED'
        ),

        max(
            observed_at
        )
        filter (
            where
                status in (
                    'CHANNEL_ERROR',
                    'TIMED_OUT'
                )

                or

                (
                    status =
                    'CLOSED'

                    and

                    not intentional
                )
        )

    into

        v_coverage_started_at,

        v_last_subscribed_at,

        v_last_problem_at

    from
        public.realtime_observability_events;


    -- ========================================================
    -- DOMAIN BREAKDOWN
    -- ========================================================

    select
        coalesce(

            jsonb_agg(

                jsonb_build_object(

                    'domain',
                        q.domain,

                    'attempts',
                        q.attempts,

                    'successes',
                        q.successes,

                    'failures',
                        q.failures,

                    'successRate',
                        case

                            when
                                (
                                    q.successes +
                                    q.failures
                                ) =
                                0
                            then
                                null

                            else
                                round(
                                    (
                                        q.successes::numeric
                                        /
                                        (
                                            q.successes +
                                            q.failures
                                        )::numeric
                                    )
                                    *
                                    100,
                                    2
                                )

                        end,

                    'channelErrors',
                        q.channel_errors,

                    'timeouts',
                        q.timeouts,

                    'unexpectedClosures',
                        q.unexpected_closures,

                    'p95SubscriptionMs',
                        q.p95_subscription_ms

                )

                order by
                    q.domain asc

            ),

            '[]'::jsonb

        )

    into
        v_domain_breakdown

    from (

        select

            domain,

            count(*) filter (
                where
                    is_initial_status
            )
                as attempts,

            count(*) filter (
                where
                    is_initial_status

                    and

                    status =
                    'SUBSCRIBED'
            )
                as successes,

            count(*) filter (
                where
                    is_initial_status

                    and

                    (
                        status in (
                            'CHANNEL_ERROR',
                            'TIMED_OUT'
                        )

                        or

                        (
                            status =
                            'CLOSED'

                            and

                            not intentional
                        )
                    )
            )
                as failures,

            count(*) filter (
                where
                    status =
                    'CHANNEL_ERROR'
            )
                as channel_errors,

            count(*) filter (
                where
                    status =
                    'TIMED_OUT'
            )
                as timeouts,

            count(*) filter (
                where
                    status =
                    'CLOSED'

                    and

                    not intentional
            )
                as unexpected_closures,

            round(
                (
                    percentile_cont(
                        0.95
                    )
                    within group (
                        order by
                            duration_ms
                    )
                    filter (
                        where
                            is_initial_status

                            and

                            status =
                            'SUBSCRIBED'
                    )
                )::numeric,
                1
            )
                as p95_subscription_ms

        from
            public.realtime_observability_events

        where
            observed_at >=
            p_from

            and

            observed_at <
            p_to

        group by
            domain

    ) q;


    -- ========================================================
    -- CHANNEL BREAKDOWN
    -- ========================================================

    select
        coalesce(

            jsonb_agg(

                jsonb_build_object(

                    'domain',
                        q.domain,

                    'channelKind',
                        q.channel_kind,

                    'attempts',
                        q.attempts,

                    'successes',
                        q.successes,

                    'failures',
                        q.failures,

                    'channelErrors',
                        q.channel_errors,

                    'timeouts',
                        q.timeouts,

                    'unexpectedClosures',
                        q.unexpected_closures,

                    'p95SubscriptionMs',
                        q.p95_subscription_ms

                )

                order by
                    q.attempts desc,
                    q.domain asc,
                    q.channel_kind asc

            ),

            '[]'::jsonb

        )

    into
        v_channel_breakdown

    from (

        select

            domain,

            channel_kind,

            count(*) filter (
                where
                    is_initial_status
            )
                as attempts,

            count(*) filter (
                where
                    is_initial_status

                    and

                    status =
                    'SUBSCRIBED'
            )
                as successes,

            count(*) filter (
                where
                    is_initial_status

                    and

                    (
                        status in (
                            'CHANNEL_ERROR',
                            'TIMED_OUT'
                        )

                        or

                        (
                            status =
                            'CLOSED'

                            and

                            not intentional
                        )
                    )
            )
                as failures,

            count(*) filter (
                where
                    status =
                    'CHANNEL_ERROR'
            )
                as channel_errors,

            count(*) filter (
                where
                    status =
                    'TIMED_OUT'
            )
                as timeouts,

            count(*) filter (
                where
                    status =
                    'CLOSED'

                    and

                    not intentional
            )
                as unexpected_closures,

            round(
                (
                    percentile_cont(
                        0.95
                    )
                    within group (
                        order by
                            duration_ms
                    )
                    filter (
                        where
                            is_initial_status

                            and

                            status =
                            'SUBSCRIBED'
                    )
                )::numeric,
                1
            )
                as p95_subscription_ms

        from
            public.realtime_observability_events

        where
            observed_at >=
            p_from

            and

            observed_at <
            p_to

        group by
            domain,
            channel_kind

    ) q;


    -- ========================================================
    -- DAILY
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

                    'channelErrors',
                        q.channel_errors,

                    'timeouts',
                        q.timeouts,

                    'unexpectedClosures',
                        q.unexpected_closures

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

            count(*) filter (
                where
                    is_initial_status
            )
                as attempts,

            count(*) filter (
                where
                    is_initial_status

                    and

                    status =
                    'SUBSCRIBED'
            )
                as successes,

            count(*) filter (
                where
                    is_initial_status

                    and

                    (
                        status in (
                            'CHANNEL_ERROR',
                            'TIMED_OUT'
                        )

                        or

                        (
                            status =
                            'CLOSED'

                            and

                            not intentional
                        )
                    )
            )
                as failures,

            count(*) filter (
                where
                    status =
                    'CHANNEL_ERROR'
            )
                as channel_errors,

            count(*) filter (
                where
                    status =
                    'TIMED_OUT'
            )
                as timeouts,

            count(*) filter (
                where
                    status =
                    'CLOSED'

                    and

                    not intentional
            )
                as unexpected_closures

        from
            public.realtime_observability_events

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

                    'domain',
                        q.domain,

                    'channelKind',
                        q.channel_kind,

                    'status',
                        q.status,

                    'durationMs',
                        q.duration_ms,

                    'initial',
                        q.is_initial_status,

                    'intentional',
                        q.intentional,

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

            domain,

            channel_kind,

            status,

            duration_ms,

            is_initial_status,

            intentional,

            error_category

        from
            public.realtime_observability_events

        order by
            observed_at desc

        limit 30

    ) q;


    return
        jsonb_build_object(

            'source',
                'supabase_realtime_client',

            'coverageStartedAt',
                v_coverage_started_at,

            'lastSubscribedAt',
                v_last_subscribed_at,

            'lastProblemAt',
                v_last_problem_at,

            'subscriptionAttempts',
                v_attempts,

            'successfulSubscriptions',
                v_successes,

            'failedSubscriptions',
                v_failures,

            'cancelledSubscriptions',
                v_cancelled,

            'subscriptionSuccessRate',
                v_success_rate,

            'previousSubscriptionSuccessRate',
                v_previous_success_rate,

            'subscriptionSuccessRateDelta',
                v_success_rate_delta,

            'channelErrors',
                v_channel_errors,

            'timeouts',
                v_timeouts,

            'unexpectedClosures',
                v_unexpected_closures,

            'intentionalClosures',
                v_intentional_closures,

            'reconnections',
                v_reconnections,

            'averageSubscriptionMs',
                v_average_subscription_ms,

            'p95SubscriptionMs',
                v_p95_subscription_ms,

            'domainBreakdown',
                v_domain_breakdown,

            'channelBreakdown',
                v_channel_breakdown,

            'daily',
                v_daily,

            'recentEvents',
                v_recent,

            'privacy',
                jsonb_build_object(

                    'storesUserIdentity',
                        false,

                    'storesFightId',
                        false,

                    'storesMessageContent',
                        false,

                    'storesRealtimePayload',
                        false,

                    'storesToken',
                        false,

                    'storesIp',
                        false,

                    'storesUserAgent',
                        false

                ),

            'coverage',
                jsonb_build_object(

                    'communication',
                        true,

                    'fightLive',
                        true,

                    'breakingNews',
                        false,

                    'presence',
                        false,

                    'globalWebsocketConnections',
                        false

                )

        );

end;

$function$;


revoke all
on function
public.super_admin_realtime_observability(
    timestamptz,
    timestamptz
)
from public;


grant execute
on function
public.super_admin_realtime_observability(
    timestamptz,
    timestamptz
)
to authenticated;


-- ============================================================
-- RETENTION
-- ============================================================

create or replace function
public.prune_realtime_observability_events()
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
        public.realtime_observability_events

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
public.prune_realtime_observability_events()
from public;


-- ============================================================
-- RETENTION CRON
-- ============================================================

create extension if not exists pg_cron;


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
            'indesy-realtime-observability-retention'

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

    'indesy-realtime-observability-retention',

    '52 3 * * *',

    $cron$

        select
            public.prune_realtime_observability_events();

    $cron$

);


commit;