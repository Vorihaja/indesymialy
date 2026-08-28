export interface SuperAdminRealtimeDomainBreakdown {
  domain: string;

  attempts: number;

  successes: number;

  failures: number;

  successRate: number | null;

  channelErrors: number;

  timeouts: number;

  unexpectedClosures: number;

  p95SubscriptionMs: number | null;
}


export interface SuperAdminRealtimeChannelBreakdown {
  domain: string;

  channelKind: string;

  attempts: number;

  successes: number;

  failures: number;

  channelErrors: number;

  timeouts: number;

  unexpectedClosures: number;

  p95SubscriptionMs: number | null;
}


export interface SuperAdminRealtimeDailyPoint {
  day: string;

  attempts: number;

  successes: number;

  failures: number;

  channelErrors: number;

  timeouts: number;

  unexpectedClosures: number;
}


export interface SuperAdminRealtimeRecentEvent {
  observedAt: string;

  domain: string;

  channelKind: string;

  status: string;

  durationMs: number;

  initial: boolean;

  intentional: boolean;

  errorCategory: string | null;
}


export interface SuperAdminRealtimeObservability {
  source: string;

  coverageStartedAt: string | null;

  lastSubscribedAt: string | null;

  lastProblemAt: string | null;

  subscriptionAttempts: number;

  successfulSubscriptions: number;

  failedSubscriptions: number;

  cancelledSubscriptions: number;

  subscriptionSuccessRate: number | null;

  previousSubscriptionSuccessRate: number | null;

  subscriptionSuccessRateDelta: number | null;

  channelErrors: number;

  timeouts: number;

  unexpectedClosures: number;

  intentionalClosures: number;

  reconnections: number;

  averageSubscriptionMs: number | null;

  p95SubscriptionMs: number | null;

  domainBreakdown:
    SuperAdminRealtimeDomainBreakdown[];

  channelBreakdown:
    SuperAdminRealtimeChannelBreakdown[];

  daily:
    SuperAdminRealtimeDailyPoint[];

  recentEvents:
    SuperAdminRealtimeRecentEvent[];

  privacy: {
    storesUserIdentity: boolean;

    storesFightId: boolean;

    storesMessageContent: boolean;

    storesRealtimePayload: boolean;

    storesToken: boolean;

    storesIp: boolean;

    storesUserAgent: boolean;
  };

  coverage: {
    communication: boolean;

    fightLive: boolean;

    breakingNews: boolean;

    presence: boolean;

    globalWebsocketConnections: boolean;
  };
}