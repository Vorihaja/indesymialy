import {
  supabase,
} from "@/lib/supabase";

import type {
  SuperAdminPerformanceAnalytics,
  SuperAdminPerformanceDirection,
  SuperAdminPerformanceDomain,
  SuperAdminPerformanceMetric,
  SuperAdminPerformanceStatus,
} from "../performance.types";

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

function boolean(
  value: unknown,
): boolean {
  return value === true;
}

function status(
  value: unknown,
): SuperAdminPerformanceStatus {
  switch (value) {

    case "achieved":
    case "watch":
    case "critical":
    case "not_configured":
    case "unavailable":
      return value;

    default:
      return "unavailable";
  }
}

function direction(
  value: unknown,
): SuperAdminPerformanceDirection {
  return value ===
    "lower_is_better"
    ? "lower_is_better"
    : "higher_is_better";
}

function domains(
  value: unknown,
): SuperAdminPerformanceDomain[] {
  return array(value).map(
    (item) => {

      const row =
        record(item);

      return {
        domain:
          text(
            row.domain,
          ),

        label:
          text(
            row.label,
          ),

        configuredMetrics:
          number(
            row.configuredMetrics,
          ),

        evaluatedMetrics:
          number(
            row.evaluatedMetrics,
          ),

        score:
          nullableNumber(
            row.score,
          ),

        status:
          status(
            row.status,
          ),
      };
    },
  );
}

function metrics(
  value: unknown,
): SuperAdminPerformanceMetric[] {
  return array(value).map(
    (item) => {

      const row =
        record(item);

      return {
        code:
          text(
            row.code,
          ),

        domain:
          text(
            row.domain,
          ),

        domainLabel:
          text(
            row.domainLabel,
          ),

        label:
          text(
            row.label,
          ),

        description:
          text(
            row.description,
          ),

        unit:
          text(
            row.unit,
          ),

        direction:
          direction(
            row.direction,
          ),

        source:
          text(
            row.source,
          ),

        formula:
          text(
            row.formula,
          ),

        actualValue:
          nullableNumber(
            row.actualValue,
          ),

        targetValue:
          nullableNumber(
            row.targetValue,
          ),

        targetUpdatedAt:
          nullableText(
            row.targetUpdatedAt,
          ),

        targetNotes:
          nullableText(
            row.targetNotes,
          ),

        score:
          nullableNumber(
            row.score,
          ),

        gap:
          nullableNumber(
            row.gap,
          ),

        status:
          status(
            row.status,
          ),
      };
    },
  );
}

export class SuperAdminPerformanceRepository {

  async getAnalytics(
    from: Date,
    to: Date,
  ): Promise<SuperAdminPerformanceAnalytics> {

    const {
      data,
      error,
    } = await supabase.rpc(
      "super_admin_performance_analytics",
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

    const period =
      record(
        root.period,
      );

    const summary =
      record(
        root.summary,
      );

    const scoring =
      record(
        root.scoring,
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


      summary: {

        overallScore:
          nullableNumber(
            summary.overallScore,
          ),

        status:
          status(
            summary.status,
          ),

        totalMetrics:
          number(
            summary.totalMetrics,
          ),

        configuredMetrics:
          number(
            summary.configuredMetrics,
          ),

        evaluatedMetrics:
          number(
            summary.evaluatedMetrics,
          ),

        achievedMetrics:
          number(
            summary.achievedMetrics,
          ),

        watchMetrics:
          number(
            summary.watchMetrics,
          ),

        criticalMetrics:
          number(
            summary.criticalMetrics,
          ),
      },


      domains:
        domains(
          root.domains,
        ),


      metrics:
        metrics(
          root.metrics,
        ),


      scoring: {

        weighting:
          "equal",

        maximumScore:
          number(
            scoring.maximumScore,
          ),

        watchThreshold:
          number(
            scoring.watchThreshold,
          ),

        configuredOnly:
          boolean(
            scoring.configuredOnly,
          ),

        unavailableExcluded:
          boolean(
            scoring.unavailableExcluded,
          ),
      },
    };
  }
}
