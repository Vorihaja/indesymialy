begin;


-- ============================================================
-- INDESY CONTROL CENTER
-- LOT 3G-A1
--
-- Monitoring HTTP réel de la production Vercel actuelle.
--
-- IMPORTANT:
-- Ceci mesure la joignabilité HTTP externe de l'application.
-- Cela ne prétend pas encore mesurer séparément la santé
-- PostgreSQL de l'application distante.
-- ============================================================


create extension
if not exists pg_net
with schema extensions;


create extension
if not exists pg_cron
with schema pg_catalog;


-- ============================================================
-- CONFIGURATION
-- ============================================================

create table if not exists
public.platform_http_monitor_config (

    id smallint primary key
        default 1,

    target_url text not null,

    enabled boolean not null
        default true,

    interval_minutes integer not null
        default 5,

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now(),

    constraint
    platform_http_monitor_config_singleton_check
    check (
        id = 1
    ),

    constraint
    platform_http_monitor_config_https_check
    check (
        lower(
            left(
                target_url,
                8
            )
        ) =
        'https://'
    ),

    constraint
    platform_http_monitor_config_interval_check
    check (
        interval_minutes
        between 1 and 60
    )
);


insert into
public.platform_http_monitor_config (

    id,
    target_url,
    enabled,
    interval_minutes

)
values (

    1,
    'https://indesymialy.vercel.app/',
    true,
    5

)

on conflict (
    id
)

do update set

    target_url =
        excluded.target_url,

    enabled =
        excluded.enabled,

    interval_minutes =
        excluded.interval_minutes,

    updated_at =
        now();


alter table
public.platform_http_monitor_config
enable row level security;


revoke all
on table
public.platform_http_monitor_config
from anon, authenticated;


-- ============================================================
-- CHECK HISTORY
-- ============================================================

create table if not exists
public.platform_http_uptime_checks (

    id uuid primary key
        default gen_random_uuid(),

    request_id bigint unique,

    target_url text not null,

    requested_at timestamptz not null
        default now(),

    completed_at timestamptz,

    status text not null
        default 'pending',

    http_status integer,

    response_ms numeric,

    timed_out boolean not null
        default false,

    error_code text,

    constraint
    platform_http_uptime_checks_status_check
    check (
        status in (
            'pending',
            'up',
            'down'
        )
    ),

    constraint
    platform_http_uptime_checks_http_status_check
    check (
        http_status is null
        or
        http_status between 100 and 599
    ),

    constraint
    platform_http_uptime_checks_response_ms_check
    check (
        response_ms is null
        or
        response_ms >= 0
    )
);


create index if not exists
platform_http_uptime_checks_requested_idx

on public.platform_http_uptime_checks(
    requested_at desc
);


create index if not exists
platform_http_uptime_checks_status_idx

on public.platform_http_uptime_checks(
    status,
    requested_at desc
);


alter table
public.platform_http_uptime_checks
enable row level security;


revoke all
on table
public.platform_http_uptime_checks
from anon, authenticated;


-- ============================================================
-- INCIDENT HISTORY
-- ============================================================

create table if not exists
public.platform_http_uptime_incidents (

    id uuid primary key
        default gen_random_uuid(),

    started_at timestamptz not null,

    resolved_at timestamptz,

    status text not null
        default 'open',

    failure_count integer not null
        default 1,

    first_check_id uuid
        references
        public.platform_http_uptime_checks(id)
        on delete set null,

    latest_check_id uuid
        references
        public.platform_http_uptime_checks(id)
        on delete set null,

    recovery_check_id uuid
        references
        public.platform_http_uptime_checks(id)
        on delete set null,

    last_http_status integer,

    last_error_code text,

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now(),

    constraint
    platform_http_uptime_incidents_status_check
    check (
        status in (
            'open',
            'resolved'
        )
    )
);


create unique index if not exists
platform_http_uptime_one_open_incident_idx

on public.platform_http_uptime_incidents(
    status
)

where
    status =
    'open';


create index if not exists
platform_http_uptime_incidents_started_idx

on public.platform_http_uptime_incidents(
    started_at desc
);


alter table
public.platform_http_uptime_incidents
enable row level security;


revoke all
on table
public.platform_http_uptime_incidents
from anon, authenticated;


-- ============================================================
-- INCIDENT STATE
-- ============================================================

create or replace function
public.platform_http_apply_incident_state(

    p_check_id uuid,

    p_status text,

    p_observed_at timestamptz,

    p_http_status integer,

    p_error_code text

)
returns void

language plpgsql
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

declare

    v_incident_id uuid;

begin

    if
        p_status =
        'up'
    then

        select
            id

        into
            v_incident_id

        from
            public.platform_http_uptime_incidents

        where
            status =
            'open'

        limit 1

        for update;


        if
            v_incident_id
            is not null
        then

            update
            public.platform_http_uptime_incidents

            set
                status =
                    'resolved',

                resolved_at =
                    p_observed_at,

                recovery_check_id =
                    p_check_id,

                updated_at =
                    now()

            where
                id =
                v_incident_id;

        end if;


        return;

    end if;


    if
        p_status <>
        'down'
    then

        return;

    end if;


    select
        id

    into
        v_incident_id

    from
        public.platform_http_uptime_incidents

    where
        status =
        'open'

    limit 1

    for update;


    if
        v_incident_id
        is null
    then

        insert into
        public.platform_http_uptime_incidents (

            started_at,

            status,

            failure_count,

            first_check_id,

            latest_check_id,

            last_http_status,

            last_error_code

        )
        values (

            p_observed_at,

            'open',

            1,

            p_check_id,

            p_check_id,

            p_http_status,

            p_error_code

        );


        return;

    end if;


    update
    public.platform_http_uptime_incidents

    set
        failure_count =
            failure_count + 1,

        latest_check_id =
            p_check_id,

        last_http_status =
            p_http_status,

        last_error_code =
            p_error_code,

        updated_at =
            now()

    where
        id =
        v_incident_id;

end;

$function$;


revoke all
on function
public.platform_http_apply_incident_state(
    uuid,
    text,
    timestamptz,
    integer,
    text
)
from public;


-- ============================================================
-- ENQUEUE HTTP CHECK
-- ============================================================

create or replace function
public.platform_http_enqueue_check()
returns bigint

language plpgsql
security definer

set search_path =
    pg_catalog,
    public,
    net,
    pg_temp

as $function$

declare

    v_url text;

    v_enabled boolean;

    v_request_id bigint;

    v_check_id uuid;

begin

    select

        target_url,

        enabled

    into

        v_url,

        v_enabled

    from
        public.platform_http_monitor_config

    where
        id =
        1;


    if
        not found
        or
        not coalesce(
            v_enabled,
            false
        )
    then

        return null;

    end if;


    begin

        select
            net.http_get(

                url :=
                    v_url,

                headers :=
                    jsonb_build_object(

                        'Accept',
                        'text/html,application/xhtml+xml',

                        'User-Agent',
                        'Indesy-Control-Center-Uptime/1.0',

                        'Cache-Control',
                        'no-cache'

                    ),

                timeout_milliseconds :=
                    10000

            )

        into
            v_request_id;


        insert into
        public.platform_http_uptime_checks (

            request_id,

            target_url,

            requested_at,

            status

        )
        values (

            v_request_id,

            v_url,

            now(),

            'pending'

        );


        return
            v_request_id;


    exception
        when others then


            insert into
            public.platform_http_uptime_checks (

                request_id,

                target_url,

                requested_at,

                completed_at,

                status,

                timed_out,

                error_code

            )
            values (

                null,

                v_url,

                now(),

                now(),

                'down',

                false,

                'enqueue_error'

            )

            returning
                id

            into
                v_check_id;


            perform
            public.platform_http_apply_incident_state(

                v_check_id,

                'down',

                now(),

                null,

                'enqueue_error'

            );


            return null;

    end;

end;

$function$;


revoke all
on function
public.platform_http_enqueue_check()
from public;


-- ============================================================
-- COLLECT PG_NET RESPONSES
-- ============================================================

create or replace function
public.platform_http_collect_checks()
returns integer

language plpgsql
security definer

set search_path =
    pg_catalog,
    public,
    net,
    pg_temp

as $function$

declare

    v_row record;

    v_status text;

    v_error_code text;

    v_response_ms numeric;

    v_count integer :=
        0;

begin

    for v_row in

        select

            c.id
                as check_id,

            c.requested_at,

            r.status_code,

            r.timed_out,

            r.error_msg,

            r.created

        from
            public.platform_http_uptime_checks c

        join
            net._http_response r

          on
            r.id =
            c.request_id

        where
            c.status =
            'pending'

        order by
            c.requested_at asc

    loop

        v_response_ms :=
            greatest(

                0::numeric,

                round(

                    extract(
                        epoch
                        from
                        (
                            v_row.created -
                            v_row.requested_at
                        )
                    )
                    *
                    1000,

                    0

                )

            );


        if
            coalesce(
                v_row.timed_out,
                false
            )
        then

            v_status :=
                'down';

            v_error_code :=
                'timeout';


        elsif
            v_row.error_msg
            is not null
        then

            v_status :=
                'down';

            v_error_code :=
                'network_error';


        elsif
            v_row.status_code
            between 200 and 399
        then

            v_status :=
                'up';

            v_error_code :=
                null;


        else

            v_status :=
                'down';

            v_error_code :=
                case

                    when
                        v_row.status_code
                        is null
                    then
                        'no_http_status'

                    else
                        'http_'
                        ||
                        v_row.status_code::text

                end;

        end if;


        update
        public.platform_http_uptime_checks

        set
            completed_at =
                v_row.created,

            status =
                v_status,

            http_status =
                v_row.status_code,

            response_ms =
                v_response_ms,

            timed_out =
                coalesce(
                    v_row.timed_out,
                    false
                ),

            error_code =
                v_error_code

        where
            id =
            v_row.check_id;


        perform
        public.platform_http_apply_incident_state(

            v_row.check_id,

            v_status,

            v_row.created,

            v_row.status_code,

            v_error_code

        );


        v_count :=
            v_count + 1;

    end loop;


    -- ========================================================
    -- REQUESTS WITHOUT RESPONSE AFTER THREE MINUTES
    -- ========================================================

    for v_row in

        select

            id
                as check_id,

            requested_at

        from
            public.platform_http_uptime_checks

        where
            status =
            'pending'

            and

            requested_at <
            now() -
            interval '3 minutes'

        order by
            requested_at asc

    loop

        update
        public.platform_http_uptime_checks

        set
            completed_at =
                now(),

            status =
                'down',

            timed_out =
                true,

            error_code =
                'response_missing'

        where
            id =
            v_row.check_id

            and

            status =
            'pending';


        if found then

            perform
            public.platform_http_apply_incident_state(

                v_row.check_id,

                'down',

                now(),

                null,

                'response_missing'

            );


            v_count :=
                v_count + 1;

        end if;

    end loop;


    return
        v_count;

end;

$function$;


revoke all
on function
public.platform_http_collect_checks()
from public;


-- ============================================================
-- RETENTION
-- ============================================================

create or replace function
public.platform_http_prune_checks()
returns integer

language plpgsql
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
        public.platform_http_uptime_checks

    where
        requested_at <
        now() -
        interval '400 days';


    get diagnostics
        v_deleted =
        row_count;


    delete from
        public.platform_http_uptime_incidents

    where
        status =
        'resolved'

        and

        resolved_at <
        now() -
        interval '400 days';


    return
        v_deleted;

end;

$function$;


revoke all
on function
public.platform_http_prune_checks()
from public;


-- ============================================================
-- SUPER ADMIN READ MODEL
-- ============================================================

create or replace function
public.super_admin_http_uptime_analytics(

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

    v_url text;

    v_enabled boolean;

    v_interval integer;

    v_first_check timestamptz;

    v_total bigint := 0;

    v_up bigint := 0;

    v_down bigint := 0;

    v_average numeric;

    v_p95 numeric;

    v_latest jsonb;

    v_active_incident jsonb;

    v_recent_checks jsonb;

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


    select

        target_url,

        enabled,

        interval_minutes

    into

        v_url,

        v_enabled,

        v_interval

    from
        public.platform_http_monitor_config

    where
        id =
        1;


    select
        min(
            requested_at
        )

    into
        v_first_check

    from
        public.platform_http_uptime_checks

    where
        status <>
        'pending';


    select

        count(*) filter (
            where
                status <>
                'pending'
        ),

        count(*) filter (
            where
                status =
                'up'
        ),

        count(*) filter (
            where
                status =
                'down'
        ),

        round(
            avg(
                response_ms
            ) filter (
                where
                    response_ms
                    is not null
            ),
            1
        ),

        round(
            (
                percentile_cont(
                    0.95
                )
                within group (
                    order by
                        response_ms
                )
                filter (
                    where
                        response_ms
                        is not null
                )
            )::numeric,
            1
        )

    into

        v_total,

        v_up,

        v_down,

        v_average,

        v_p95

    from
        public.platform_http_uptime_checks

    where
        requested_at >=
        p_from

        and

        requested_at <
        p_to;


    select
        jsonb_build_object(

            'checkedAt',
                q.requested_at,

            'completedAt',
                q.completed_at,

            'status',
                q.status,

            'httpStatus',
                q.http_status,

            'responseMs',
                q.response_ms,

            'timedOut',
                q.timed_out,

            'errorCode',
                q.error_code

        )

    into
        v_latest

    from (

        select
            *

        from
            public.platform_http_uptime_checks

        where
            status <>
            'pending'

        order by
            requested_at desc

        limit 1

    ) q;


    select
        jsonb_build_object(

            'startedAt',
                i.started_at,

            'durationSeconds',
                greatest(
                    0,
                    extract(
                        epoch
                        from
                        (
                            now() -
                            i.started_at
                        )
                    )::bigint
                ),

            'failureCount',
                i.failure_count,

            'lastHttpStatus',
                i.last_http_status,

            'lastErrorCode',
                i.last_error_code

        )

    into
        v_active_incident

    from
        public.platform_http_uptime_incidents i

    where
        i.status =
        'open'

    limit 1;


    select
        coalesce(

            jsonb_agg(

                jsonb_build_object(

                    'checkedAt',
                        q.requested_at,

                    'completedAt',
                        q.completed_at,

                    'status',
                        q.status,

                    'httpStatus',
                        q.http_status,

                    'responseMs',
                        q.response_ms,

                    'timedOut',
                        q.timed_out,

                    'errorCode',
                        q.error_code

                )

                order by
                    q.requested_at desc

            ),

            '[]'::jsonb

        )

    into
        v_recent_checks

    from (

        select
            *

        from
            public.platform_http_uptime_checks

        where
            status <>
            'pending'

        order by
            requested_at desc

        limit 20

    ) q;


    return
        jsonb_build_object(

            'enabled',
                coalesce(
                    v_enabled,
                    false
                ),

            'targetUrl',
                v_url,

            'intervalMinutes',
                coalesce(
                    v_interval,
                    5
                ),

            'coverageStartedAt',
                v_first_check,

            'totalChecks',
                v_total,

            'healthyChecks',
                v_up,

            'downChecks',
                v_down,

            'uptimeRate',
                case

                    when
                        v_total =
                        0
                    then null

                    else
                        round(
                            (
                                v_up::numeric
                                /
                                v_total::numeric
                            )
                            *
                            100,
                            3
                        )

                end,

            'averageResponseMs',
                v_average,

            'p95ResponseMs',
                v_p95,

            'latest',
                v_latest,

            'activeIncident',
                v_active_incident,

            'recentChecks',
                v_recent_checks

        );

end;

$function$;


revoke all
on function
public.super_admin_http_uptime_analytics(
    timestamptz,
    timestamptz
)
from public;


grant execute
on function
public.super_admin_http_uptime_analytics(
    timestamptz,
    timestamptz
)
to authenticated;


-- ============================================================
-- CLEAN EXISTING JOBS WITH SAME NAMES
-- ============================================================

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
            jobname in (
                'indesy-http-uptime-probe',
                'indesy-http-uptime-collector',
                'indesy-http-uptime-retention'
            )

    loop

        perform
            cron.unschedule(
                v_job_id
            );

    end loop;

end;

$block$;


-- ============================================================
-- PROBE EVERY 5 MINUTES
-- ============================================================

select
cron.schedule(

    'indesy-http-uptime-probe',

    '*/5 * * * *',

    $cron$

        select
            public.platform_http_enqueue_check();

    $cron$

);


-- ============================================================
-- COLLECT EVERY MINUTE
-- ============================================================

select
cron.schedule(

    'indesy-http-uptime-collector',

    '* * * * *',

    $cron$

        select
            public.platform_http_collect_checks();

    $cron$

);


-- ============================================================
-- RETENTION DAILY
-- ============================================================

select
cron.schedule(

    'indesy-http-uptime-retention',

    '17 3 * * *',

    $cron$

        select
            public.platform_http_prune_checks();

    $cron$

);


-- ============================================================
-- FIRST CHECK NOW
-- ============================================================

select
public.platform_http_enqueue_check();


commit;