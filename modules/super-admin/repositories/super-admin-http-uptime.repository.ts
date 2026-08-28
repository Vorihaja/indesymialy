import {
  supabase,
} from "@/lib/supabase";

import type {
  SuperAdminHttpUptimeAnalytics,
  SuperAdminHttpUptimeCheck,
  SuperAdminHttpUptimeIncident,
  SuperAdminHttpUptimeStatus,
} from "../http-uptime.types";


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


function status(
  value: unknown,
): SuperAdminHttpUptimeStatus {

  if (
    value === "up" ||
    value === "down"
  ) {
    return value;
  }


  return "pending";
}


function check(
  value: unknown,
): SuperAdminHttpUptimeCheck | null {

  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }


  const row =
    record(value);


  const checkedAt =
    text(
      row.checkedAt,
    );


  if (!checkedAt) {
    return null;
  }


  return {
    checkedAt,

    completedAt:
      nullableText(
        row.completedAt,
      ),

    status:
      status(
        row.status,
      ),

    httpStatus:
      nullableNumber(
        row.httpStatus,
      ),

    responseMs:
      nullableNumber(
        row.responseMs,
      ),

    timedOut:
      bool(
        row.timedOut,
      ),

    errorCode:
      nullableText(
        row.errorCode,
      ),
  };
}


function incident(
  value: unknown,
): SuperAdminHttpUptimeIncident | null {

  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }


  const row =
    record(value);


  const startedAt =
    text(
      row.startedAt,
    );


  if (!startedAt) {
    return null;
  }


  return {
    startedAt,

    durationSeconds:
      number(
        row.durationSeconds,
      ),

    failureCount:
      number(
        row.failureCount,
      ),

    lastHttpStatus:
      nullableNumber(
        row.lastHttpStatus,
      ),

    lastErrorCode:
      nullableText(
        row.lastErrorCode,
      ),
  };
}


export class SuperAdminHttpUptimeRepository {

  async getAnalytics(
    from: Date,
    to: Date,
  ): Promise<SuperAdminHttpUptimeAnalytics> {

    const {
      data,
      error,
    } =
      await supabase.rpc(
        "super_admin_http_uptime_analytics",
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
      record(data);


    return {
      enabled:
        bool(
          root.enabled,
        ),

      targetUrl:
        nullableText(
          root.targetUrl,
        ),

      intervalMinutes:
        number(
          root.intervalMinutes,
        ),

      coverageStartedAt:
        nullableText(
          root.coverageStartedAt,
        ),

      totalChecks:
        number(
          root.totalChecks,
        ),

      healthyChecks:
        number(
          root.healthyChecks,
        ),

      downChecks:
        number(
          root.downChecks,
        ),

      uptimeRate:
        nullableNumber(
          root.uptimeRate,
        ),

      averageResponseMs:
        nullableNumber(
          root.averageResponseMs,
        ),

      p95ResponseMs:
        nullableNumber(
          root.p95ResponseMs,
        ),

      latest:
        check(
          root.latest,
        ),

      activeIncident:
        incident(
          root.activeIncident,
        ),

      recentChecks:
        array(
          root.recentChecks,
        )
          .map(
            check,
          )
          .filter(
            (
              item,
            ): item is SuperAdminHttpUptimeCheck =>
              item !== null,
          ),
    };
  }
}