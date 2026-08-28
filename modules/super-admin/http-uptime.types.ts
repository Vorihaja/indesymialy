export type SuperAdminHttpUptimeStatus =
  | "pending"
  | "up"
  | "down";


export interface SuperAdminHttpUptimeCheck {
  checkedAt: string;

  completedAt: string | null;

  status: SuperAdminHttpUptimeStatus;

  httpStatus: number | null;

  responseMs: number | null;

  timedOut: boolean;

  errorCode: string | null;
}


export interface SuperAdminHttpUptimeIncident {
  startedAt: string;

  durationSeconds: number;

  failureCount: number;

  lastHttpStatus: number | null;

  lastErrorCode: string | null;
}


export interface SuperAdminHttpUptimeAnalytics {
  enabled: boolean;

  targetUrl: string | null;

  intervalMinutes: number;

  coverageStartedAt: string | null;

  totalChecks: number;

  healthyChecks: number;

  downChecks: number;

  uptimeRate: number | null;

  averageResponseMs: number | null;

  p95ResponseMs: number | null;

  latest: SuperAdminHttpUptimeCheck | null;

  activeIncident: SuperAdminHttpUptimeIncident | null;

  recentChecks: SuperAdminHttpUptimeCheck[];
}