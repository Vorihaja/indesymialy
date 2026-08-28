import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  Database,
} from "@/infrastructure/supabase/database.types";

import type {
  RealtimeErrorCategory,
  RealtimeObservabilityChannelKind,
  RealtimeObservabilityDomain,
  RealtimeObservedStatus,
} from "../types";


export interface RecordRealtimeObservationInput {
  eventId: string;

  subscriptionId: string;

  domain:
    RealtimeObservabilityDomain;

  channelKind:
    RealtimeObservabilityChannelKind;

  status:
    RealtimeObservedStatus;

  durationMs: number;

  isInitialStatus: boolean;

  intentional: boolean;

  errorCategory:
    RealtimeErrorCategory | null;
}


export class RealtimeObservabilityRepository {

  constructor(
    private readonly supabase:
      SupabaseClient<Database>,
  ) {}


  record(
    input:
      RecordRealtimeObservationInput,
  ): void {

    /*
     * Observability is deliberately best-effort.
     * It must never block or alter a Realtime channel.
     */
    void this.supabase
      .rpc(
        "record_realtime_observability_event",
        {
          p_event_id:
            input.eventId,

          p_subscription_id:
            input.subscriptionId,

          p_domain:
            input.domain,

          p_channel_kind:
            input.channelKind,

          p_status:
            input.status,

          p_duration_ms:
            Math.max(
              0,
              Math.min(
                600000,
                Math.round(
                  input.durationMs,
                ),
              ),
            ),

          p_is_initial_status:
            input.isInitialStatus,

          p_intentional:
            input.intentional,

          p_error_category:
            input.errorCategory ??
            "",
        },
      )
      .then(
        () =>
          undefined,

        () =>
          undefined,
      );
  }
}