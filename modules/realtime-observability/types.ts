export type RealtimeObservabilityDomain =
  | "communication"
  | "fight_live";


export type RealtimeCommunicationChannelKind =
  | "messages"
  | "message_reads"
  | "conversations"
  | "system_notifications"
  | "fight_proposals"
  | "sponsor_offers";


export type RealtimeFightLiveChannelKind =
  | "fight_events"
  | "timer"
  | "scores"
  | "status"
  | "result";


export type RealtimeObservabilityChannelKind =
  | RealtimeCommunicationChannelKind
  | RealtimeFightLiveChannelKind;


export type RealtimeObservedStatus =
  | "SUBSCRIBED"
  | "CHANNEL_ERROR"
  | "TIMED_OUT"
  | "CLOSED";


export type RealtimeErrorCategory =
  | "timeout"
  | "authorization"
  | "network"
  | "socket_closed"
  | "binding_mismatch"
  | "server"
  | "unknown";


export interface RealtimeSubscriptionObserver {
  observe(
    status: string,
    error?: Error,
  ): void;

  markIntentionalClose(): void;
}