export type SuperAdminPerformanceTrend =
  | "improving"
  | "stable"
  | "degrading"
  | "unavailable";

export type SuperAdminStrategicStatus =
  | "maturity"
  | "achieved"
  | "watch"
  | "critical"
  | "not_configured"
  | "unavailable";

export interface SuperAdminPerformanceSnapshot {
  snapshotDate: string;

  capturedAt: string;

  periodDays: number;

  periodFrom: string;

  periodTo: string;

  overallScore: number | null;

  status: string;

  configuredMetrics: number;

  evaluatedMetrics: number;

  achievedMetrics: number;

  watchMetrics: number;

  criticalMetrics: number;

  targetConfigurationUpdatedAt:
    string | null;
}
