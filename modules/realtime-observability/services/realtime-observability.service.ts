import {
  RealtimeObservabilityRepository,
} from "../repositories/realtime-observability.repository";

import type {
  RealtimeErrorCategory,
  RealtimeObservabilityChannelKind,
  RealtimeObservabilityDomain,
  RealtimeObservedStatus,
  RealtimeSubscriptionObserver,
} from "../types";


function identifier(): string {

  if (
    typeof globalThis.crypto !==
      "undefined" &&
    typeof globalThis.crypto.randomUUID ===
      "function"
  ) {

    return globalThis.crypto.randomUUID();
  }


  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
    .replace(
      /[xy]/g,
      (character) => {

        const random =
          Math.floor(
            Math.random() *
            16,
          );


        const value =
          character === "x"
            ? random
            : (
                random &
                0x3
              ) |
              0x8;


        return value.toString(
          16,
        );
      },
    );
}


function elapsedSince(
  startedAt: number,
): number {

  return Math.max(
    0,
    Date.now() -
      startedAt,
  );
}


function isObservedStatus(
  status: string,
): status is RealtimeObservedStatus {

  return (
    status ===
      "SUBSCRIBED" ||
    status ===
      "CHANNEL_ERROR" ||
    status ===
      "TIMED_OUT" ||
    status ===
      "CLOSED"
  );
}


function classifyError(
  status: RealtimeObservedStatus,
  error?: Error,
): RealtimeErrorCategory | null {

  if (
    status ===
    "SUBSCRIBED"
  ) {

    return null;
  }


  if (
    status ===
    "TIMED_OUT"
  ) {

    return "timeout";
  }


  const message =
    (
      error?.message ??
      ""
    )
      .toLowerCase();


  if (
    message.includes(
      "mismatch",
    ) &&
    message.includes(
      "binding",
    )
  ) {

    return "binding_mismatch";
  }


  if (
    message.includes(
      "unauthorized",
    ) ||
    message.includes(
      "forbidden",
    ) ||
    message.includes(
      "permission",
    ) ||
    message.includes(
      "policy",
    ) ||
    message.includes(
      "rls",
    )
  ) {

    return "authorization";
  }


  if (
    message.includes(
      "socket closed",
    ) ||
    message.includes(
      "websocket closed",
    )
  ) {

    return "socket_closed";
  }


  if (
    message.includes(
      "network",
    ) ||
    message.includes(
      "failed to fetch",
    ) ||
    message.includes(
      "connection",
    )
  ) {

    return "network";
  }


  if (
    message.includes(
      "server",
    ) ||
    message.includes(
      "internal",
    )
  ) {

    return "server";
  }


  if (
    status ===
    "CLOSED"
  ) {

    return "socket_closed";
  }


  return "unknown";
}


export class RealtimeObservabilityService {

  constructor(
    private readonly repository:
      RealtimeObservabilityRepository,
  ) {}


  createSubscriptionObserver(
    domain:
      RealtimeObservabilityDomain,

    channelKind:
      RealtimeObservabilityChannelKind,
  ): RealtimeSubscriptionObserver {

    const subscriptionId =
      identifier();


    const startedAt =
      Date.now();


    let hasObservedStatus =
      false;


    let intentionalClose =
      false;


    return {

      markIntentionalClose() {

        intentionalClose =
          true;
      },


      observe:
        (
          rawStatus:
            string,

          error?:
            Error,
        ) => {

          if (
            !isObservedStatus(
              rawStatus,
            )
          ) {

            return;
          }


          const isInitialStatus =
            !hasObservedStatus;


          hasObservedStatus =
            true;


          this.repository.record({
            eventId:
              identifier(),

            subscriptionId,

            domain,

            channelKind,

            status:
              rawStatus,

            durationMs:
              elapsedSince(
                startedAt,
              ),

            isInitialStatus,

            intentional:
              rawStatus ===
                "CLOSED"
                ? intentionalClose
                : false,

            errorCategory:
              classifyError(
                rawStatus,
                error,
              ),
          });
        },
    };
  }
}