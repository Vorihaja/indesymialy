import {
  supabase,
} from "@/lib/supabase";

import type {
  Json,
} from "@/infrastructure/supabase/database.types";

import type {
  SuperAdminPerformanceDirection,
} from "../performance.types";

import type {
  SuperAdminKpiTargetConfiguration,
  SuperAdminKpiTargetUpdate,
} from "../performance-target.types";

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

  return number(value);
}

function direction(
  value: unknown,
): SuperAdminPerformanceDirection {
  return value === "lower_is_better"
    ? "lower_is_better"
    : "higher_is_better";
}

export class SuperAdminPerformanceTargetRepository {

  async getConfiguration():
    Promise<SuperAdminKpiTargetConfiguration[]> {

    const {
      data,
      error,
    } = await supabase.rpc(
      "super_admin_kpi_target_configuration",
    );

    if (error) {
      throw new Error(
        error.message,
      );
    }

    return array(data).map(
      (item) => {

        const row =
          record(item);

        return {
          metricCode:
            text(
              row.metricCode,
            ),

          direction:
            direction(
              row.direction,
            ),

          minValue:
            number(
              row.minValue,
            ),

          maxValue:
            number(
              row.maxValue,
            ),

          stepValue:
            number(
              row.stepValue,
            ),

          criticalValue:
            nullableNumber(
              row.criticalValue,
            ),

          targetValue:
            nullableNumber(
              row.targetValue,
            ),

          maturityValue:
            nullableNumber(
              row.maturityValue,
            ),

          enabled:
            row.enabled !== false,

          notes:
            nullableText(
              row.notes,
            ),

          updatedAt:
            nullableText(
              row.updatedAt,
            ),
        };
      },
    );
  }


  async saveConfiguration(
    targets:
      SuperAdminKpiTargetUpdate[],
  ): Promise<number> {

    const payload =
      targets.map(
        (target) => ({
          metricCode:
            target.metricCode,

          criticalValue:
            target.criticalValue,

          targetValue:
            target.targetValue,

          maturityValue:
            target.maturityValue,

          enabled:
            target.enabled,

          notes:
            target.notes,
        }),
      ) as unknown as Json;


    const {
      data,
      error,
    } = await supabase.rpc(
      "super_admin_save_kpi_targets",
      {
        p_targets:
          payload,
      },
    );

    if (error) {
      throw new Error(
        error.message,
      );
    }

    const result =
      record(data);

    return number(
      result.updated,
    );
  }
}
