export type SuperAdminAuthOutcome =
  | "success"
  | "failure";


export interface SuperAdminAuthErrorCategory {
  category: string;

  count: number;

  share: number | null;
}


export interface SuperAdminAuthDailyPoint {
  day: string;

  attempts: number;

  successes: number;

  failures: number;

  failureRate: number | null;

  p95DurationMs: number | null;
}


export interface SuperAdminAuthRecentEvent {
  observedAt: string;

  outcome: SuperAdminAuthOutcome;

  durationMs: number;

  errorCategory: string | null;
}


export interface SuperAdminAuthObservability {
  source: string;

  coverageStartedAt: string | null;

  lastSuccessAt: string | null;

  lastFailureAt: string | null;

  attempts: number;

  successes: number;

  failures: number;

  successRate: number | null;

  failureRate: number | null;

  averageDurationMs: number | null;

  p95DurationMs: number | null;

  successAverageDurationMs: number | null;

  failureAverageDurationMs: number | null;

  previousAttempts: number;

  previousSuccesses: number;

  previousFailures: number;

  previousFailureRate: number | null;

  previousP95DurationMs: number | null;

  attemptGrowthPct: number | null;

  failureRateDelta: number | null;

  p95DurationChangePct: number | null;

  errorCategories:
    SuperAdminAuthErrorCategory[];

  daily:
    SuperAdminAuthDailyPoint[];

  recentEvents:
    SuperAdminAuthRecentEvent[];

  privacy: {
    storesEmail: boolean;

    storesPassword: boolean;

    storesTokens: boolean;

    storesIp: boolean;

    storesUserAgent: boolean;
  };

  limitations: {
    applicationObserved: boolean;

    forensicAuthServerLog: boolean;

    anonymousFailureIngestionProtected: boolean;
  };
}