import {
  supabase,
} from "@/lib/supabase";

import type {
  SuperAdminAuthDailyPoint,
  SuperAdminAuthErrorCategory,
  SuperAdminAuthObservability,
  SuperAdminAuthOutcome,
  SuperAdminAuthRecentEvent,
} from "../auth-observability.types";


type JsonRecord =
  Record<string, unknown>;


function record(
  value: unknown,
): JsonRecord {

  return (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value,
    )
  )
    ? value as JsonRecord
    : {};
}


function array(
  value: unknown,
): unknown[] {

  return Array.isArray(
    value,
  )
    ? value
    : [];
}


function text(
  value: unknown,
  fallback = "",
): string {

  return typeof value ===
    "string"
    ? value
    : fallback;
}


function nullableText(
  value: unknown,
): string | null {

  return typeof value ===
    "string"
    ? value
    : null;
}


function number(
  value: unknown,
): number {

  if (
    typeof value ===
      "number" &&
    Number.isFinite(
      value,
    )
  ) {

    return value;
  }


  const parsed =
    Number(
      value,
    );


  return Number.isFinite(
    parsed,
  )
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
    Number(
      value,
    );


  return Number.isFinite(
    parsed,
  )
    ? parsed
    : null;
}


function bool(
  value: unknown,
): boolean {

  return value === true;
}


function outcome(
  value: unknown,
): SuperAdminAuthOutcome {

  return value ===
    "success"
    ? "success"
    : "failure";
}


function category(
  value: unknown,
): SuperAdminAuthErrorCategory | null {

  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value,
    )
  ) {

    return null;
  }


  const row =
    record(
      value,
    );


  const name =
    text(
      row.category,
    );


  if (!name) {
    return null;
  }


  return {
    category:
      name,

    count:
      number(
        row.count,
      ),

    share:
      nullableNumber(
        row.share,
      ),
  };
}


function dailyPoint(
  value: unknown,
): SuperAdminAuthDailyPoint | null {

  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value,
    )
  ) {

    return null;
  }


  const row =
    record(
      value,
    );


  const day =
    text(
      row.day,
    );


  if (!day) {
    return null;
  }


  return {
    day,

    attempts:
      number(
        row.attempts,
      ),

    successes:
      number(
        row.successes,
      ),

    failures:
      number(
        row.failures,
      ),

    failureRate:
      nullableNumber(
        row.failureRate,
      ),

    p95DurationMs:
      nullableNumber(
        row.p95DurationMs,
      ),
  };
}


function recentEvent(
  value: unknown,
): SuperAdminAuthRecentEvent | null {

  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value,
    )
  ) {

    return null;
  }


  const row =
    record(
      value,
    );


  const observedAt =
    text(
      row.observedAt,
    );


  if (!observedAt) {
    return null;
  }


  return {
    observedAt,

    outcome:
      outcome(
        row.outcome,
      ),

    durationMs:
      number(
        row.durationMs,
      ),

    errorCategory:
      nullableText(
        row.errorCategory,
      ),
  };
}


export class SuperAdminAuthObservabilityRepository {

  async getAnalytics(
    from: Date,
    to: Date,
  ): Promise<SuperAdminAuthObservability> {

    const {
      data,
      error,
    } =
      await supabase.rpc(
        "super_admin_auth_observability",
        {
          p_from:
            from.toISOString(),

          p_to:
            to.toISOString(),
        },
      );


    if (error) {

      throw new Error(
        error.message,
      );
    }


    const root =
      record(
        data,
      );


    const privacy =
      record(
        root.privacy,
      );


    const limitations =
      record(
        root.limitations,
      );


    return {
      source:
        text(
          root.source,
        ),

      coverageStartedAt:
        nullableText(
          root.coverageStartedAt,
        ),

      lastSuccessAt:
        nullableText(
          root.lastSuccessAt,
        ),

      lastFailureAt:
        nullableText(
          root.lastFailureAt,
        ),

      attempts:
        number(
          root.attempts,
        ),

      successes:
        number(
          root.successes,
        ),

      failures:
        number(
          root.failures,
        ),

      successRate:
        nullableNumber(
          root.successRate,
        ),

      failureRate:
        nullableNumber(
          root.failureRate,
        ),

      averageDurationMs:
        nullableNumber(
          root.averageDurationMs,
        ),

      p95DurationMs:
        nullableNumber(
          root.p95DurationMs,
        ),

      successAverageDurationMs:
        nullableNumber(
          root.successAverageDurationMs,
        ),

      failureAverageDurationMs:
        nullableNumber(
          root.failureAverageDurationMs,
        ),

      previousAttempts:
        number(
          root.previousAttempts,
        ),

      previousSuccesses:
        number(
          root.previousSuccesses,
        ),

      previousFailures:
        number(
          root.previousFailures,
        ),

      previousFailureRate:
        nullableNumber(
          root.previousFailureRate,
        ),

      previousP95DurationMs:
        nullableNumber(
          root.previousP95DurationMs,
        ),

      attemptGrowthPct:
        nullableNumber(
          root.attemptGrowthPct,
        ),

      failureRateDelta:
        nullableNumber(
          root.failureRateDelta,
        ),

      p95DurationChangePct:
        nullableNumber(
          root.p95DurationChangePct,
        ),

      errorCategories:
        array(
          root.errorCategories,
        )
          .map(
            category,
          )
          .filter(
            (
              item,
            ): item is SuperAdminAuthErrorCategory =>
              item !== null,
          ),

      daily:
        array(
          root.daily,
        )
          .map(
            dailyPoint,
          )
          .filter(
            (
              item,
            ): item is SuperAdminAuthDailyPoint =>
              item !== null,
          ),

      recentEvents:
        array(
          root.recentEvents,
        )
          .map(
            recentEvent,
          )
          .filter(
            (
              item,
            ): item is SuperAdminAuthRecentEvent =>
              item !== null,
          ),

      privacy: {
        storesEmail:
          bool(
            privacy.storesEmail,
          ),

        storesPassword:
          bool(
            privacy.storesPassword,
          ),

        storesTokens:
          bool(
            privacy.storesTokens,
          ),

        storesIp:
          bool(
            privacy.storesIp,
          ),

        storesUserAgent:
          bool(
            privacy.storesUserAgent,
          ),
      },

      limitations: {
        applicationObserved:
          bool(
            limitations.applicationObserved,
          ),

        forensicAuthServerLog:
          bool(
            limitations.forensicAuthServerLog,
          ),

        anonymousFailureIngestionProtected:
          bool(
            limitations.anonymousFailureIngestionProtected,
          ),
      },
    };
  }
}