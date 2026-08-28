import {
  supabase,
} from "@/lib/supabase";

import type {
  SuperAdminPerformanceSnapshot,
} from "../performance-monitoring.types";

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

  return number(
    value,
  );
}

export class SuperAdminPerformanceMonitorRepository {

  async captureSnapshot(
    periodDays: number,
  ): Promise<void> {

    const {
      error,
    } = await supabase.rpc(
      "super_admin_capture_performance_snapshot",
      {
        p_period_days:
          periodDays,
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
    limit = 12,
  ): Promise<SuperAdminPerformanceSnapshot[]> {

    const {
      data,
      error,
    } = await supabase.rpc(
      "super_admin_performance_snapshot_history",
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
          record(
            item,
          );

        return {
          snapshotDate:
            text(
              row.snapshotDate,
            ),

          capturedAt:
            text(
              row.capturedAt,
            ),

          periodDays:
            number(
              row.periodDays,
            ),

          periodFrom:
            text(
              row.periodFrom,
            ),

          periodTo:
            text(
              row.periodTo,
            ),

          overallScore:
            nullableNumber(
              row.overallScore,
            ),

          status:
            text(
              row.status,
              "unavailable",
            ),

          configuredMetrics:
            number(
              row.configuredMetrics,
            ),

          evaluatedMetrics:
            number(
              row.evaluatedMetrics,
            ),

          achievedMetrics:
            number(
              row.achievedMetrics,
            ),

          watchMetrics:
            number(
              row.watchMetrics,
            ),

          criticalMetrics:
            number(
              row.criticalMetrics,
            ),

          targetConfigurationUpdatedAt:
            nullableText(
              row.targetConfigurationUpdatedAt,
            ),
        };
      },
    );
  }
}
