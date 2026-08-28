import type {
  RealtimeChannel,
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  Database,
} from "@/infrastructure/supabase/database.types";

import type {
  RealtimeCommunicationChannelKind,
  RealtimeSubscriptionObserver,
} from "@/modules/realtime-observability/types";

import {
  RealtimeObservabilityService,
} from "@/modules/realtime-observability/services/realtime-observability.service";


export type CommunicationRealtimeOperation =
  | "INSERT"
  | "UPDATE"
  | "DELETE";


export type CommunicationRealtimeStatus =
  | "IDLE"
  | "SUBSCRIBED"
  | "CHANNEL_ERROR"
  | "TIMED_OUT"
  | "CLOSED";


export interface CommunicationRealtimeChange {
  topic: string;
  operation: CommunicationRealtimeOperation;
  schema: string;
  table: string;
  record: Record<string, unknown> | null;
  oldRecord: Record<string, unknown> | null;
  broadcastId?: string;
}


export type CommunicationRealtimeChangeCallback =
  (
    change: CommunicationRealtimeChange,
  ) => void;


export type CommunicationRealtimeStatusCallback =
  (
    status: CommunicationRealtimeStatus,
    error?: Error,
  ) => void;


type UnknownRecord =
  Record<string, unknown>;


function asRecord(
  value: unknown,
): UnknownRecord | null {

  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as UnknownRecord;
}


function asString(
  value: unknown,
): string | undefined {

  return typeof value === "string"
    ? value
    : undefined;
}


function normalizeBroadcastChange(
  topic: string,
  fallbackOperation: CommunicationRealtimeOperation,
  rawPayload: unknown,
): CommunicationRealtimeChange {

  const envelope =
    asRecord(rawPayload) ?? {};

  const payload =
    asRecord(
      envelope.payload,
    ) ?? envelope;

  const operationValue =
    asString(
      payload.operation,
    );

  const operation:
    CommunicationRealtimeOperation =
      operationValue === "INSERT" ||
      operationValue === "UPDATE" ||
      operationValue === "DELETE"
        ? operationValue
        : fallbackOperation;

  return {
    topic,
    operation,

    schema:
      asString(
        payload.schema,
      ) ?? "public",

    table:
      asString(
        payload.table,
      ) ?? "unknown",

    record:
      asRecord(
        payload.record,
      ),

    oldRecord:
      asRecord(
        payload.old_record,
      ),

    broadcastId:
      asString(
        payload.id,
      ) ??
      asString(
        asRecord(
          envelope.meta,
        )?.id,
      ),
  };
}


export class CommunicationRealtimeRepository {

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


  async currentProfileId():
    Promise<string> {

    const {
      data,
      error,
    } =
      await this.supabase.auth
        .getUser();

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error(
        "Utilisateur non authentifié pour le Realtime.",
      );
    }

    return data.user.id;
  }


  async subscribeConversation(
    conversationId: string,

    callback:
      CommunicationRealtimeChangeCallback,

    statusCallback?:
      CommunicationRealtimeStatusCallback,
  ): Promise<RealtimeChannel> {

    return this.subscribePrivateTopic(
      `conversation:${conversationId}`,
      "conversations",
      callback,
      statusCallback,
    );
  }


  async subscribeProfile(
    profileId: string,

    callback:
      CommunicationRealtimeChangeCallback,

    statusCallback?:
      CommunicationRealtimeStatusCallback,
  ): Promise<RealtimeChannel> {

    return this.subscribePrivateTopic(
      `profile:${profileId}`,
      "message_reads",
      callback,
      statusCallback,
    );
  }


  private async subscribePrivateTopic(
    topic: string,

    observerKind:
      RealtimeCommunicationChannelKind,

    callback:
      CommunicationRealtimeChangeCallback,

    statusCallback?:
      CommunicationRealtimeStatusCallback,
  ): Promise<RealtimeChannel> {

    /*
     * Realtime Authorization nécessite que le JWT courant
     * soit explicitement transmis au client Realtime.
     */
    await this.supabase.realtime
      .setAuth();


    const observation =
      this.observability
        .createSubscriptionObserver(
          "communication",
          observerKind,
        );


    const channel =
      this.supabase
        .channel(
          topic,
          {
            config: {
              private: true,
            },
          },
        );


    const operations:
      CommunicationRealtimeOperation[] =
        [
          "INSERT",
          "UPDATE",
          "DELETE",
        ];


    for (
      const operation of operations
    ) {

      channel.on(
        "broadcast",
        {
          event:
            operation,
        },
        (
          payload,
        ) => {

          callback(
            normalizeBroadcastChange(
              topic,
              operation,
              payload,
            ),
          );
        },
      );
    }


    channel.subscribe(
      (
        status,
        error,
      ) => {

        observation.observe(
          status,
          error,
        );


        statusCallback?.(
          status as CommunicationRealtimeStatus,
          error,
        );
      },
    );


    this.observations.set(
      channel,
      observation,
    );


    return channel;
  }


  async unsubscribe(
    channel:
      RealtimeChannel,
  ): Promise<void> {

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