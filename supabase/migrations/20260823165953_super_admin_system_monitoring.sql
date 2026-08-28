begin;

-- ============================================================
-- INDESY CONTROL CENTER
-- SYSTEM MONITORING
--
-- REAL SOURCES ONLY:
-- - PostgreSQL statistics
-- - Supabase Auth when available
-- - Supabase Storage when available
-- - Supabase migration history when available
-- - PostgreSQL backends identifiable as Realtime
--
-- NOT SIMULATED:
-- - Vercel uptime
-- - Vercel application errors
-- - network availability history
-- - authentication failure rate
-- - WebSocket client connection count
-- ============================================================


create table if not exists
public.super_admin_system_snapshots (

    id uuid primary key
        default gen_random_uuid(),

    captured_hour timestamptz not null,

    captured_at timestamptz not null
        default now(),

    period_days integer not null,

    database_size_bytes bigint not null
        default 0,

    database_connections integer not null
        default 0,

    active_connections integer not null
        default 0,

    connection_usage_rate numeric,

    cache_hit_rate numeric,

    rollback_rate numeric,

    deadlocks bigint not null
        default 0,

    temp_bytes bigint not null
        default 0,

    auth_users bigint not null
        default 0,

    auth_signins_period bigint not null
        default 0,

    storage_available boolean not null
        default false,

    storage_objects bigint not null
        default 0,

    storage_bytes bigint not null
        default 0,

    realtime_db_backends bigint not null
        default 0,

    client_rpc_latency_ms numeric,

    constraint
    super_admin_system_snapshots_period_check
    check (
        period_days in (
            7,
            30,
            90,
            365
        )
    ),

    constraint
    super_admin_system_snapshots_latency_check
    check (
        client_rpc_latency_ms is null
        or (
            client_rpc_latency_ms >= 0
            and
            client_rpc_latency_ms <= 600000
        )
    ),

    constraint
    super_admin_system_snapshots_hour_unique
    unique (
        captured_hour,
        period_days
    )

);


create index if not exists
super_admin_system_snapshots_history_idx

on public.super_admin_system_snapshots(
    period_days,
    captured_at desc
);


alter table
public.super_admin_system_snapshots
enable row level security;


revoke all
on table
public.super_admin_system_snapshots
from anon, authenticated;


-- ============================================================
-- CURRENT SYSTEM ANALYTICS
-- ============================================================

create or replace function
public.super_admin_system_analytics(

    p_from timestamptz
        default now() - interval '30 days',

    p_to timestamptz
        default now()

)
returns jsonb

language plpgsql
stable
security definer

set search_path = pg_catalog, public, pg_temp

as $function$

declare

    -- PostgreSQL

    v_database_size bigint := 0;

    v_database_started_at timestamptz;
    v_database_uptime_seconds bigint;

    v_connections integer := 0;
    v_active_connections integer := 0;
    v_idle_connections integer := 0;

    v_max_connections integer := 0;

    v_connection_usage_rate numeric;

    v_blks_hit bigint := 0;
    v_blks_read bigint := 0;

    v_cache_hit_rate numeric;

    v_xact_commit bigint := 0;
    v_xact_rollback bigint := 0;

    v_rollback_rate numeric;

    v_deadlocks bigint := 0;

    v_temp_bytes bigint := 0;

    v_stats_reset timestamptz;

    v_public_tables bigint := 0;
    v_public_indexes bigint := 0;
    v_extensions bigint := 0;

    v_top_tables jsonb :=
        '[]'::jsonb;


    -- Auth

    v_auth_available boolean :=
        false;

    v_auth_users bigint := 0;

    v_auth_new_users bigint := 0;

    v_auth_signins bigint := 0;

    v_auth_last_signin timestamptz;


    -- Storage

    v_storage_available boolean :=
        false;

    v_storage_buckets bigint := 0;

    v_storage_objects bigint := 0;

    v_storage_bytes bigint := 0;

    v_top_buckets jsonb :=
        '[]'::jsonb;


    -- Realtime observation

    v_realtime_db_backends bigint :=
        0;


    -- Migration history

    v_migrations_available boolean :=
        false;

    v_migrations_count bigint :=
        0;

    v_latest_migration text;


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


    if
        p_to - p_from >
        interval '2 years'
    then

        raise exception
            'La période maximale autorisée est de deux ans.';

    end if;


    -- ========================================================
    -- DATABASE SIZE + UPTIME
    -- ========================================================

    begin

        v_database_size :=
            pg_database_size(
                current_database()
            );

    exception
        when others then

            v_database_size :=
                0;

    end;


    begin

        v_database_started_at :=
            pg_postmaster_start_time();

        v_database_uptime_seconds :=
            greatest(
                0,
                extract(
                    epoch
                    from
                    (
                        now() -
                        v_database_started_at
                    )
                )::bigint
            );

    exception
        when others then

            v_database_started_at :=
                null;

            v_database_uptime_seconds :=
                null;

    end;


    -- ========================================================
    -- PG_STAT_DATABASE
    -- ========================================================

    select

        coalesce(
            d.numbackends,
            0
        ),

        coalesce(
            d.blks_hit,
            0
        ),

        coalesce(
            d.blks_read,
            0
        ),

        coalesce(
            d.xact_commit,
            0
        ),

        coalesce(
            d.xact_rollback,
            0
        ),

        coalesce(
            d.deadlocks,
            0
        ),

        coalesce(
            d.temp_bytes,
            0
        ),

        d.stats_reset

    into

        v_connections,

        v_blks_hit,

        v_blks_read,

        v_xact_commit,

        v_xact_rollback,

        v_deadlocks,

        v_temp_bytes,

        v_stats_reset

    from
        pg_stat_database d

    where
        d.datname =
        current_database();


    -- ========================================================
    -- CONNECTION ACTIVITY
    -- ========================================================

    select

        count(*) filter (
            where
                a.state =
                'active'
        )::integer,

        count(*) filter (
            where
                a.state =
                'idle'
        )::integer

    into

        v_active_connections,
        v_idle_connections

    from
        pg_stat_activity a

    where
        a.datname =
        current_database();


    begin

        v_max_connections :=
            current_setting(
                'max_connections'
            )::integer;

    exception
        when others then

            v_max_connections :=
                0;

    end;


    v_connection_usage_rate :=
        case

            when
                v_max_connections <= 0
            then null

            else round(
                (
                    v_connections::numeric
                    /
                    v_max_connections::numeric
                )
                * 100,
                2
            )

        end;


    -- ========================================================
    -- CACHE
    -- ========================================================

    v_cache_hit_rate :=
        case

            when
                (
                    v_blks_hit +
                    v_blks_read
                ) = 0
            then null

            else round(
                (
                    v_blks_hit::numeric
                    /
                    (
                        v_blks_hit +
                        v_blks_read
                    )::numeric
                )
                * 100,
                2
            )

        end;


    -- ========================================================
    -- ROLLBACK RATIO
    -- ========================================================

    v_rollback_rate :=
        case

            when
                (
                    v_xact_commit +
                    v_xact_rollback
                ) = 0
            then null

            else round(
                (
                    v_xact_rollback::numeric
                    /
                    (
                        v_xact_commit +
                        v_xact_rollback
                    )::numeric
                )
                * 100,
                2
            )

        end;


    -- ========================================================
    -- DATABASE OBJECTS
    -- ========================================================

    select
        count(*)::bigint

    into
        v_public_tables

    from
        pg_stat_user_tables

    where
        schemaname =
        'public';


    select
        count(*)::bigint

    into
        v_public_indexes

    from
        pg_indexes

    where
        schemaname =
        'public';


    select
        count(*)::bigint

    into
        v_extensions

    from
        pg_extension;


    -- ========================================================
    -- TOP TABLES
    --
    -- n_live_tup is an estimate from PostgreSQL statistics.
    -- ========================================================

    select
        coalesce(

            jsonb_agg(

                jsonb_build_object(

                    'name',
                    q.table_name,

                    'totalBytes',
                    q.total_bytes,

                    'estimatedRows',
                    q.estimated_rows

                )

                order by
                    q.total_bytes desc

            ),

            '[]'::jsonb

        )

    into
        v_top_tables

    from (

        select

            s.relname
                as table_name,

            pg_total_relation_size(
                s.relid
            )
                as total_bytes,

            coalesce(
                s.n_live_tup,
                0
            )::bigint
                as estimated_rows

        from
            pg_stat_user_tables s

        where
            s.schemaname =
            'public'

        order by
            total_bytes desc

        limit 10

    ) q;


    -- ========================================================
    -- AUTH
    -- ========================================================

    if
        to_regclass(
            'auth.users'
        ) is not null
    then

        v_auth_available :=
            true;


        execute $sql$

            select

                count(*)::bigint,

                count(*) filter (
                    where
                        created_at >= $1
                        and
                        created_at < $2
                )::bigint,

                count(*) filter (
                    where
                        last_sign_in_at >= $1
                        and
                        last_sign_in_at < $2
                )::bigint,

                max(
                    last_sign_in_at
                )

            from
                auth.users

        $sql$

        using
            p_from,
            p_to

        into

            v_auth_users,
            v_auth_new_users,
            v_auth_signins,
            v_auth_last_signin;

    end if;


    -- ========================================================
    -- STORAGE
    -- ========================================================

    if
        to_regclass(
            'storage.objects'
        ) is not null
    then

        v_storage_available :=
            true;


        execute $sql$

            select

                count(*)::bigint,

                coalesce(
                    sum(
                        case

                            when
                                coalesce(
                                    metadata ->>
                                    'size',
                                    ''
                                )
                                ~
                                '^[0-9]+$'

                            then
                                (
                                    metadata ->>
                                    'size'
                                )::bigint

                            else
                                0

                        end
                    ),
                    0
                )::bigint

            from
                storage.objects

        $sql$

        into
            v_storage_objects,
            v_storage_bytes;


        if
            to_regclass(
                'storage.buckets'
            ) is not null
        then

            execute
                'select count(*)::bigint from storage.buckets'

            into
                v_storage_buckets;

        end if;


        execute $sql$

            select
                coalesce(

                    jsonb_agg(

                        jsonb_build_object(

                            'bucketId',
                            q.bucket_id,

                            'objects',
                            q.objects,

                            'bytes',
                            q.bytes

                        )

                        order by
                            q.bytes desc

                    ),

                    '[]'::jsonb

                )

            from (

                select

                    bucket_id,

                    count(*)::bigint
                        as objects,

                    coalesce(
                        sum(
                            case

                                when
                                    coalesce(
                                        metadata ->>
                                        'size',
                                        ''
                                    )
                                    ~
                                    '^[0-9]+$'

                                then
                                    (
                                        metadata ->>
                                        'size'
                                    )::bigint

                                else
                                    0

                            end
                        ),
                        0
                    )::bigint
                        as bytes

                from
                    storage.objects

                group by
                    bucket_id

                order by
                    bytes desc

                limit 10

            ) q

        $sql$

        into
            v_top_buckets;

    end if;


    -- ========================================================
    -- REALTIME DATABASE BACKENDS
    --
    -- This is NOT the number of connected WebSocket users.
    -- It only counts PostgreSQL sessions whose application name
    -- is identifiable as a Realtime process.
    -- ========================================================

    select
        count(*)::bigint

    into
        v_realtime_db_backends

    from
        pg_stat_activity a

    where
        a.datname =
        current_database()

        and

        lower(
            coalesce(
                a.application_name,
                ''
            )
        ) like
        '%realtime%';


    -- ========================================================
    -- SUPABASE MIGRATIONS
    -- ========================================================

    if
        to_regclass(
            'supabase_migrations.schema_migrations'
        ) is not null
    then

        v_migrations_available :=
            true;


        execute $sql$

            select

                count(*)::bigint,

                max(
                    version::text
                )

            from
                supabase_migrations.schema_migrations

        $sql$

        into
            v_migrations_count,
            v_latest_migration;

    end if;


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


            'observedAt',
            now(),


            'database',

            jsonb_build_object(

                'reachable',
                true,

                'sizeBytes',
                v_database_size,

                'startedAt',
                v_database_started_at,

                'uptimeSeconds',
                v_database_uptime_seconds,

                'connections',
                v_connections,

                'activeConnections',
                v_active_connections,

                'idleConnections',
                v_idle_connections,

                'maxConnections',
                v_max_connections,

                'connectionUsageRate',
                v_connection_usage_rate,

                'cacheHitRate',
                v_cache_hit_rate,

                'transactionsCommitted',
                v_xact_commit,

                'transactionsRolledBack',
                v_xact_rollback,

                'rollbackRate',
                v_rollback_rate,

                'deadlocks',
                v_deadlocks,

                'tempBytes',
                v_temp_bytes,

                'statsResetAt',
                v_stats_reset,

                'publicTables',
                v_public_tables,

                'publicIndexes',
                v_public_indexes,

                'extensions',
                v_extensions,

                'topTables',
                v_top_tables

            ),


            'auth',

            jsonb_build_object(

                'available',
                v_auth_available,

                'totalUsers',
                v_auth_users,

                'newUsersPeriod',
                v_auth_new_users,

                'signInsPeriod',
                v_auth_signins,

                'lastSignInAt',
                v_auth_last_signin

            ),


            'storage',

            jsonb_build_object(

                'available',
                v_storage_available,

                'buckets',
                v_storage_buckets,

                'objects',
                v_storage_objects,

                'bytes',
                v_storage_bytes,

                'topBuckets',
                v_top_buckets

            ),


            'realtime',

            jsonb_build_object(

                'databaseBackends',
                v_realtime_db_backends,

                'websocketConnectionsAvailable',
                false

            ),


            'migrations',

            jsonb_build_object(

                'available',
                v_migrations_available,

                'count',
                v_migrations_count,

                'latestVersion',
                v_latest_migration

            ),


            'coverage',

            jsonb_build_object(

                'databaseMetrics',
                true,

                'authMetrics',
                v_auth_available,

                'storageMetrics',
                v_storage_available,

                'supabaseRpcLatency',
                true,

                'applicationUptime',
                false,

                'networkAvailabilityHistory',
                false,

                'vercelErrors',
                false,

                'authFailureRate',
                false,

                'realtimeWebsocketConnections',
                false

            )

        );

end;

$function$;


-- ============================================================
-- SNAPSHOT CAPTURE
-- ============================================================

create or replace function
public.super_admin_capture_system_snapshot(

    p_period_days integer,

    p_client_rpc_latency_ms numeric
        default null

)
returns jsonb

language plpgsql
security definer

set search_path = pg_catalog, public, pg_temp

as $function$

declare

    v_to timestamptz;
    v_from timestamptz;

    v_hour timestamptz;

    v_payload jsonb;

begin

    if not public.is_super_admin() then

        raise exception
            'FORBIDDEN'
            using errcode = '42501';

    end if;


    if
        p_period_days not in (
            7,
            30,
            90,
            365
        )
    then

        raise exception
            'Période Analytics non supportée.';

    end if;


    if
        p_client_rpc_latency_ms is not null
        and
        (
            p_client_rpc_latency_ms < 0
            or
            p_client_rpc_latency_ms > 600000
        )
    then

        raise exception
            'Latence RPC invalide.';

    end if;


    v_to :=
        now();

    v_from :=
        v_to -
        make_interval(
            days =>
                p_period_days
        );

    v_hour :=
        date_trunc(
            'hour',
            v_to
        );


    v_payload :=
        public.super_admin_system_analytics(
            v_from,
            v_to
        );


    insert into
    public.super_admin_system_snapshots (

        captured_hour,

        captured_at,

        period_days,

        database_size_bytes,

        database_connections,

        active_connections,

        connection_usage_rate,

        cache_hit_rate,

        rollback_rate,

        deadlocks,

        temp_bytes,

        auth_users,

        auth_signins_period,

        storage_available,

        storage_objects,

        storage_bytes,

        realtime_db_backends,

        client_rpc_latency_ms

    )
    values (

        v_hour,

        v_to,

        p_period_days,

        coalesce(
            (
                v_payload #>>
                '{database,sizeBytes}'
            )::bigint,
            0
        ),

        coalesce(
            (
                v_payload #>>
                '{database,connections}'
            )::integer,
            0
        ),

        coalesce(
            (
                v_payload #>>
                '{database,activeConnections}'
            )::integer,
            0
        ),

        nullif(
            v_payload #>>
            '{database,connectionUsageRate}',
            ''
        )::numeric,

        nullif(
            v_payload #>>
            '{database,cacheHitRate}',
            ''
        )::numeric,

        nullif(
            v_payload #>>
            '{database,rollbackRate}',
            ''
        )::numeric,

        coalesce(
            (
                v_payload #>>
                '{database,deadlocks}'
            )::bigint,
            0
        ),

        coalesce(
            (
                v_payload #>>
                '{database,tempBytes}'
            )::bigint,
            0
        ),

        coalesce(
            (
                v_payload #>>
                '{auth,totalUsers}'
            )::bigint,
            0
        ),

        coalesce(
            (
                v_payload #>>
                '{auth,signInsPeriod}'
            )::bigint,
            0
        ),

        coalesce(
            (
                v_payload #>>
                '{storage,available}'
            )::boolean,
            false
        ),

        coalesce(
            (
                v_payload #>>
                '{storage,objects}'
            )::bigint,
            0
        ),

        coalesce(
            (
                v_payload #>>
                '{storage,bytes}'
            )::bigint,
            0
        ),

        coalesce(
            (
                v_payload #>>
                '{realtime,databaseBackends}'
            )::bigint,
            0
        ),

        p_client_rpc_latency_ms

    )

    on conflict (
        captured_hour,
        period_days
    )

    do update set

        captured_at =
            excluded.captured_at,

        database_size_bytes =
            excluded.database_size_bytes,

        database_connections =
            excluded.database_connections,

        active_connections =
            excluded.active_connections,

        connection_usage_rate =
            excluded.connection_usage_rate,

        cache_hit_rate =
            excluded.cache_hit_rate,

        rollback_rate =
            excluded.rollback_rate,

        deadlocks =
            excluded.deadlocks,

        temp_bytes =
            excluded.temp_bytes,

        auth_users =
            excluded.auth_users,

        auth_signins_period =
            excluded.auth_signins_period,

        storage_available =
            excluded.storage_available,

        storage_objects =
            excluded.storage_objects,

        storage_bytes =
            excluded.storage_bytes,

        realtime_db_backends =
            excluded.realtime_db_backends,

        client_rpc_latency_ms =
            excluded.client_rpc_latency_ms;


    return
        jsonb_build_object(

            'capturedAt',
            v_to,

            'periodDays',
            p_period_days

        );

end;

$function$;


-- ============================================================
-- SYSTEM HISTORY
-- ============================================================

create or replace function
public.super_admin_system_snapshot_history(

    p_period_days integer,

    p_limit integer
        default 24

)
returns jsonb

language plpgsql
stable
security definer

set search_path = pg_catalog, public, pg_temp

as $function$

declare

    v_result jsonb;

begin

    if not public.is_super_admin() then

        raise exception
            'FORBIDDEN'
            using errcode = '42501';

    end if;


    if
        p_period_days not in (
            7,
            30,
            90,
            365
        )
    then

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

                    'capturedAt',
                    q.captured_at,

                    'periodDays',
                    q.period_days,

                    'databaseSizeBytes',
                    q.database_size_bytes,

                    'databaseConnections',
                    q.database_connections,

                    'activeConnections',
                    q.active_connections,

                    'connectionUsageRate',
                    q.connection_usage_rate,

                    'cacheHitRate',
                    q.cache_hit_rate,

                    'rollbackRate',
                    q.rollback_rate,

                    'deadlocks',
                    q.deadlocks,

                    'tempBytes',
                    q.temp_bytes,

                    'authUsers',
                    q.auth_users,

                    'authSignInsPeriod',
                    q.auth_signins_period,

                    'storageAvailable',
                    q.storage_available,

                    'storageObjects',
                    q.storage_objects,

                    'storageBytes',
                    q.storage_bytes,

                    'realtimeDatabaseBackends',
                    q.realtime_db_backends,

                    'clientRpcLatencyMs',
                    q.client_rpc_latency_ms

                )

                order by
                    q.captured_at asc

            ),

            '[]'::jsonb

        )

    into
        v_result

    from (

        select
            s.*

        from
            public.super_admin_system_snapshots s

        where
            s.period_days =
            p_period_days

        order by
            s.captured_at desc

        limit
            p_limit

    ) q;


    return
        v_result;

end;

$function$;


-- ============================================================
-- SECURITY
-- ============================================================

revoke all
on function
public.super_admin_system_analytics(
    timestamptz,
    timestamptz
)
from public;


revoke all
on function
public.super_admin_capture_system_snapshot(
    integer,
    numeric
)
from public;


revoke all
on function
public.super_admin_system_snapshot_history(
    integer,
    integer
)
from public;


grant execute
on function
public.super_admin_system_analytics(
    timestamptz,
    timestamptz
)
to authenticated;


grant execute
on function
public.super_admin_capture_system_snapshot(
    integer,
    numeric
)
to authenticated;


grant execute
on function
public.super_admin_system_snapshot_history(
    integer,
    integer
)
to authenticated;


commit;
