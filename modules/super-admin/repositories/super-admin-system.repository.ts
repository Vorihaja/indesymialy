import {
  supabase,
} from "@/lib/supabase";

import type {
  SuperAdminSystemAnalytics,
  SuperAdminSystemCoverage,
  SuperAdminSystemSnapshot,
  SuperAdminSystemStorageBucket,
  SuperAdminSystemTopTable,
} from "../system.types";

type JsonRecord =
  Record<string, unknown>;

function record(
  value: unknown,
): JsonRecord {

  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  )
    ? value as JsonRecord
    : {};
}

function array(
  value: unknown,
): unknown[] {

  return Array.isArray(value)
    ? value
    : [];
}

function text(
  value: unknown,
  fallback = "",
): string {

  return typeof value === "string"
    ? value
    : fallback;
}

function nullableText(
  value: unknown,
): string | null {

  return typeof value === "string"
    ? value
    : null;
}

function number(
  value: unknown,
): number {

  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function nullableNumber(
  value: unknown,
): number | null {

  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function bool(
  value: unknown,
): boolean {

  return value === true;
}

function topTables(
  value: unknown,
): SuperAdminSystemTopTable[] {

  return array(
    value,
  ).map(
    (item) => {

      const row =
        record(item);

      return {
        name:
          text(
            row.name,
          ),

        totalBytes:
          number(
            row.totalBytes,
          ),

        estimatedRows:
          number(
            row.estimatedRows,
          ),
      };
    },
  );
}

function topBuckets(
  value: unknown,
): SuperAdminSystemStorageBucket[] {

  return array(
    value,
  ).map(
    (item) => {

      const row =
        record(item);

      return {
        bucketId:
          text(
            row.bucketId,
            "Sans bucket",
          ),

        objects:
          number(
            row.objects,
          ),

        bytes:
          number(
            row.bytes,
          ),
      };
    },
  );
}

function coverage(
  value: unknown,
): SuperAdminSystemCoverage {

  const row =
    record(value);

  return {
    databaseMetrics:
      bool(
        row.databaseMetrics,
      ),

    authMetrics:
      bool(
        row.authMetrics,
      ),

    storageMetrics:
      bool(
        row.storageMetrics,
      ),

    supabaseRpcLatency:
      bool(
        row.supabaseRpcLatency,
      ),

    applicationUptime:
      bool(
        row.applicationUptime,
      ),

    networkAvailabilityHistory:
      bool(
        row.networkAvailabilityHistory,
      ),

    vercelErrors:
      bool(
        row.vercelErrors,
      ),

    authFailureRate:
      bool(
        row.authFailureRate,
      ),

    realtimeWebsocketConnections:
      bool(
        row.realtimeWebsocketConnections,
      ),
  };
}

export class SuperAdminSystemRepository {

  async getAnalytics(
    from: Date,
    to: Date,
  ): Promise<SuperAdminSystemAnalytics> {

    const startedAt =
      Date.now();


    const {
      data,
      error,
    } =
      await supabase.rpc(
        "super_admin_system_analytics",
        {
          p_from:
            from.toISOString(),

          p_to:
            to.toISOString(),
        },
      );


    const rpcRoundTripMs =
      Math.max(
        0,
        Date.now() -
        startedAt,
      );


    if (error) {

      throw new Error(
        error.message,
      );
    }


    const root =
      record(data);

    const period =
      record(
        root.period,
      );

    const database =
      record(
        root.database,
      );

    const auth =
      record(
        root.auth,
      );

    const storage =
      record(
        root.storage,
      );

    const realtime =
      record(
        root.realtime,
      );

    const migrations =
      record(
        root.migrations,
      );


    return {

      period: {
        from:
          text(
            period.from,
          ),

        to:
          text(
            period.to,
          ),
      },


      observedAt:
        text(
          root.observedAt,
        ),


      rpcRoundTripMs,


      database: {

        reachable:
          bool(
            database.reachable,
          ),

        sizeBytes:
          number(
            database.sizeBytes,
          ),

        startedAt:
          nullableText(
            database.startedAt,
          ),

        uptimeSeconds:
          nullableNumber(
            database.uptimeSeconds,
          ),

        connections:
          number(
            database.connections,
          ),

        activeConnections:
          number(
            database.activeConnections,
          ),

        idleConnections:
          number(
            database.idleConnections,
          ),

        maxConnections:
          number(
            database.maxConnections,
          ),

        connectionUsageRate:
          nullableNumber(
            database.connectionUsageRate,
          ),

        cacheHitRate:
          nullableNumber(
            database.cacheHitRate,
          ),

        transactionsCommitted:
          number(
            database.transactionsCommitted,
          ),

        transactionsRolledBack:
          number(
            database.transactionsRolledBack,
          ),

        rollbackRate:
          nullableNumber(
            database.rollbackRate,
          ),

        deadlocks:
          number(
            database.deadlocks,
          ),

        tempBytes:
          number(
            database.tempBytes,
          ),

        statsResetAt:
          nullableText(
            database.statsResetAt,
          ),

        publicTables:
          number(
            database.publicTables,
          ),

        publicIndexes:
          number(
            database.publicIndexes,
          ),

        extensions:
          number(
            database.extensions,
          ),

        topTables:
          topTables(
            database.topTables,
          ),
      },


      auth: {

        available:
          bool(
            auth.available,
          ),

        totalUsers:
          number(
            auth.totalUsers,
          ),

        newUsersPeriod:
          number(
            auth.newUsersPeriod,
          ),

        signInsPeriod:
          number(
            auth.signInsPeriod,
          ),

        lastSignInAt:
          nullableText(
            auth.lastSignInAt,
          ),
      },


      storage: {

        available:
          bool(
            storage.available,
          ),

        buckets:
          number(
            storage.buckets,
          ),

        objects:
          number(
            storage.objects,
          ),

        bytes:
          number(
            storage.bytes,
          ),

        topBuckets:
          topBuckets(
            storage.topBuckets,
          ),
      },


      realtime: {

        databaseBackends:
          number(
            realtime.databaseBackends,
          ),

        websocketConnectionsAvailable:
          bool(
            realtime.websocketConnectionsAvailable,
          ),
      },


      migrations: {

        available:
          bool(
            migrations.available,
          ),

        count:
          number(
            migrations.count,
          ),

        latestVersion:
          nullableText(
            migrations.latestVersion,
          ),
      },


      coverage:
        coverage(
          root.coverage,
        ),
    };
  }


  async captureSnapshot(
    periodDays: number,
    rpcLatencyMs: number,
  ): Promise<void> {

    const {
      error,
    } =
      await supabase.rpc(
        "super_admin_capture_system_snapshot",
        {
          p_period_days:
            periodDays,

          p_client_rpc_latency_ms:
            rpcLatencyMs,
        },
      );


    if (error) {

      throw new Error(
        error.message,
      );
    }
  }


  async getHistory(
    periodDays: number,
    limit = 24,
  ): Promise<SuperAdminSystemSnapshot[]> {

    const {
      data,
      error,
    } =
      await supabase.rpc(
        "super_admin_system_snapshot_history",
        {
          p_period_days:
            periodDays,

          p_limit:
            limit,
        },
      );


    if (error) {

      throw new Error(
        error.message,
      );
    }


    return array(
      data,
    ).map(
      (item) => {

        const row =
          record(item);

        return {

          capturedAt:
            text(
              row.capturedAt,
            ),

          periodDays:
            number(
              row.periodDays,
            ),

          databaseSizeBytes:
            number(
              row.databaseSizeBytes,
            ),

          databaseConnections:
            number(
              row.databaseConnections,
            ),

          activeConnections:
            number(
              row.activeConnections,
            ),

          connectionUsageRate:
            nullableNumber(
              row.connectionUsageRate,
            ),

          cacheHitRate:
            nullableNumber(
              row.cacheHitRate,
            ),

          rollbackRate:
            nullableNumber(
              row.rollbackRate,
            ),

          deadlocks:
            number(
              row.deadlocks,
            ),

          tempBytes:
            number(
              row.tempBytes,
            ),

          authUsers:
            number(
              row.authUsers,
            ),

          authSignInsPeriod:
            number(
              row.authSignInsPeriod,
            ),

          storageAvailable:
            bool(
              row.storageAvailable,
            ),

          storageObjects:
            number(
              row.storageObjects,
            ),

          storageBytes:
            number(
              row.storageBytes,
            ),

          realtimeDatabaseBackends:
            number(
              row.realtimeDatabaseBackends,
            ),

          clientRpcLatencyMs:
            nullableNumber(
              row.clientRpcLatencyMs,
            ),
        };
      },
    );
  }
}
