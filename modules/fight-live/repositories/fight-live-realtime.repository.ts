import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  Database,
} from "@/infrastructure/supabase/database.types";

import type {
  RealtimeSubscriptionObserver,
} from "@/modules/realtime-observability/types";

import {
  RealtimeObservabilityService,
} from "@/modules/realtime-observability/services/realtime-observability.service";


type RealtimeRow =
  Record<string, unknown>;


export class FightLiveRealtimeRepository {

  private readonly observations =
    new WeakMap<
      RealtimeChannel,
      RealtimeSubscriptionObserver
    >();


  constructor(
    private readonly supabase:
      SupabaseClient<Database>,

    private readonly observability:
      RealtimeObservabilityService,
  ) {}


  private remember(
    channel:
      RealtimeChannel,

    observation:
      RealtimeSubscriptionObserver,
  ): RealtimeChannel {

    this.observations.set(
      channel,
      observation,
    );


    return channel;
  }


  subscribeToFightEvents(
    fightId:
      string,

    callback:
      (
        payload:
          RealtimePostgresChangesPayload<RealtimeRow>,
      ) => void,
  ) {

    const observation =
      this.observability
        .createSubscriptionObserver(
          "fight_live",
          "fight_events",
        );


    const channel =
      this.supabase
        .channel(
          `fight-events-${fightId}`,
        )
        .on(
          "postgres_changes",
          {
            event:
              "*",

            schema:
              "public",

            table:
              "fight_event_log",

            filter:
              `fight_id=eq.${fightId}`,
          },
          callback,
        )
        .subscribe(
          (
            status,
            error,
          ) => {

            observation.observe(
              status,
              error,
            );
          },
        );


    return this.remember(
      channel,
      observation,
    );
  }


  subscribeToTimer(
    fightId:
      string,

    callback:
      (
        payload:
          RealtimePostgresChangesPayload<RealtimeRow>,
      ) => void,
  ) {

    const observation =
      this.observability
        .createSubscriptionObserver(
          "fight_live",
          "timer",
        );


    const channel =
      this.supabase
        .channel(
          `fight-timer-${fightId}`,
        )
        .on(
          "postgres_changes",
          {
            event:
              "*",

            schema:
              "public",

            table:
              "fight_timer_events",

            filter:
              `fight_id=eq.${fightId}`,
          },
          callback,
        )
        .subscribe(
          (
            status,
            error,
          ) => {

            observation.observe(
              status,
              error,
            );
          },
        );


    return this.remember(
      channel,
      observation,
    );
  }


  subscribeToScores(
    fightId:
      string,

    callback:
      (
        payload:
          RealtimePostgresChangesPayload<RealtimeRow>,
      ) => void,
  ) {

    const observation =
      this.observability
        .createSubscriptionObserver(
          "fight_live",
          "scores",
        );


    const channel =
      this.supabase
        .channel(
          `fight-scores-${fightId}`,
        )
        .on(
          "postgres_changes",
          {
            event:
              "*",

            schema:
              "public",

            table:
              "fight_scores",

            filter:
              `fight_id=eq.${fightId}`,
          },
          callback,
        )
        .subscribe(
          (
            status,
            error,
          ) => {

            observation.observe(
              status,
              error,
            );
          },
        );


    return this.remember(
      channel,
      observation,
    );
  }


  subscribeToStatus(
    fightId:
      string,

    callback:
      (
        payload:
          RealtimePostgresChangesPayload<RealtimeRow>,
      ) => void,
  ) {

    const observation =
      this.observability
        .createSubscriptionObserver(
          "fight_live",
          "status",
        );


    const channel =
      this.supabase
        .channel(
          `fight-status-${fightId}`,
        )
        .on(
          "postgres_changes",
          {
            event:
              "UPDATE",

            schema:
              "public",

            table:
              "fights",

            filter:
              `id=eq.${fightId}`,
          },
          callback,
        )
        .subscribe(
          (
            status,
            error,
          ) => {

            observation.observe(
              status,
              error,
            );
          },
        );


    return this.remember(
      channel,
      observation,
    );
  }


  subscribeToResult(
    fightId:
      string,

    callback:
      (
        payload:
          RealtimePostgresChangesPayload<RealtimeRow>,
      ) => void,
  ) {

    const observation =
      this.observability
        .createSubscriptionObserver(
          "fight_live",
          "result",
        );


    const channel =
      this.supabase
        .channel(
          `fight-result-${fightId}`,
        )
        .on(
          "postgres_changes",
          {
            event:
              "*",

            schema:
              "public",

            table:
              "fight_decisions",

            filter:
              `fight_id=eq.${fightId}`,
          },
          callback,
        )
        .subscribe(
          (
            status,
            error,
          ) => {

            observation.observe(
              status,
              error,
            );
          },
        );


    return this.remember(
      channel,
      observation,
    );
  }


  async unsubscribe(
    channel:
      RealtimeChannel,
  ) {

    const observation =
      this.observations.get(
        channel,
      );


    observation
      ?.markIntentionalClose();


    try {

      await this.supabase
        .removeChannel(
          channel,
        );

    } finally {

      this.observations.delete(
        channel,
      );
    }
  }
}