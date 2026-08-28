export type SuperAdminPerformanceStatus =
  | "achieved"
  | "watch"
  | "critical"
  | "not_configured"
  | "unavailable";

export type SuperAdminPerformanceDirection =
  | "higher_is_better"
  | "lower_is_better";

export interface SuperAdminPerformancePeriod {
  from: string;
  to: string;
}

export interface SuperAdminPerformanceSummary {
  overallScore: number | null;

  status: SuperAdminPerformanceStatus;

  totalMetrics: number;

  configuredMetrics: number;

  evaluatedMetrics: number;

  achievedMetrics: number;

  watchMetrics: number;

  criticalMetrics: number;
}

export interface SuperAdminPerformanceDomain {
  domain: string;

  label: string;

  configuredMetrics: number;

  evaluatedMetrics: number;

  score: number | null;

  status: SuperAdminPerformanceStatus;
}

export interface SuperAdminPerformanceMetric {
  code: string;

  domain: string;

  domainLabel: string;

  label: string;

  description: string;

  unit: string;

  direction: SuperAdminPerformanceDirection;

  source: string;

  formula: string;

  actualValue: number | null;

  targetValue: number | null;

  targetUpdatedAt: string | null;

  targetNotes: string | null;

  score: number | null;

  gap: number | null;

  status: SuperAdminPerformanceStatus;
}

export interface SuperAdminPerformanceScoring {
  weighting: "equal";

  maximumScore: number;

  watchThreshold: number;

  configuredOnly: boolean;

  unavailableExcluded: boolean;
}

export interface SuperAdminPerformanceAnalytics {
  period: SuperAdminPerformancePeriod;

  summary: SuperAdminPerformanceSummary;

  domains: SuperAdminPerformanceDomain[];

  metrics: SuperAdminPerformanceMetric[];

  scoring: SuperAdminPerformanceScoring;
}
