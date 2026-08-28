import {
  supabase,
} from "@/lib/supabase";

import type {
  SuperAdminRealtimeChannelBreakdown,
  SuperAdminRealtimeDailyPoint,
  SuperAdminRealtimeDomainBreakdown,
  SuperAdminRealtimeObservability,
  SuperAdminRealtimeRecentEvent,
} from "../realtime-observability.types";


type JsonRecord =
  Record<string, unknown>;


function record(
  value: unknown,
): JsonRecord {

  return (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value,
    )
  )
    ? value as JsonRecord
    : {};
}


function array(
  value: unknown,
): unknown[] {

  return Array.isArray(
    value,
  )
    ? value
    : [];
}


function text(
  value: unknown,
  fallback = "",
): string {

  return typeof value ===
    "string"
    ? value
    : fallback;
}


function nullableText(
  value: unknown,
): string | null {

  return typeof value ===
    "string"
    ? value
    : null;
}


function number(
  value: unknown,
): number {

  const parsed =
    Number(
      value,
    );


  return Number.isFinite(
    parsed,
  )
    ? parsed
    : 0;
}


function nullableNumber(
  value: unknown,
): number | null {

  if (
    value === null ||
    value === undefined
  ) {

    return null;
  }


  const parsed =
    Number(
      value,
    );


  return Number.isFinite(
    parsed,
  )
    ? parsed
    : null;
}


function bool(
  value: unknown,
): boolean {

  return value === true;
}


function domainRow(
  value: unknown,
): SuperAdminRealtimeDomainBreakdown | null {

  const row =
    record(
      value,
    );


  const domain =
    text(
      row.domain,
    );


  if (!domain) {
    return null;
  }


  return {
    domain,

    attempts:
      number(
        row.attempts,
      ),

    successes:
      number(
        row.successes,
      ),

    failures:
      number(
        row.failures,
      ),

    successRate:
      nullableNumber(
        row.successRate,
      ),

    channelErrors:
      number(
        row.channelErrors,
      ),

    timeouts:
      number(
        row.timeouts,
      ),

    unexpectedClosures:
      number(
        row.unexpectedClosures,
      ),

    p95SubscriptionMs:
      nullableNumber(
        row.p95SubscriptionMs,
      ),
  };
}


function channelRow(
  value: unknown,
): SuperAdminRealtimeChannelBreakdown | null {

  const row =
    record(
      value,
    );


  const domain =
    text(
      row.domain,
    );


  const channelKind =
    text(
      row.channelKind,
    );


  if (
    !domain ||
    !channelKind
  ) {

    return null;
  }


  return {
    domain,

    channelKind,

    attempts:
      number(
        row.attempts,
      ),

    successes:
      number(
        row.successes,
      ),

    failures:
      number(
        row.failures,
      ),

    channelErrors:
      number(
        row.channelErrors,
      ),

    timeouts:
      number(
        row.timeouts,
      ),

    unexpectedClosures:
      number(
        row.unexpectedClosures,
      ),

    p95SubscriptionMs:
      nullableNumber(
        row.p95SubscriptionMs,
      ),
  };
}


function dailyRow(
  value: unknown,
): SuperAdminRealtimeDailyPoint | null {

  const row =
    record(
      value,
    );


  const day =
    text(
      row.day,
    );


  if (!day) {
    return null;
  }


  return {
    day,

    attempts:
      number(
        row.attempts,
      ),

    successes:
      number(
        row.successes,
      ),

    failures:
      number(
        row.failures,
      ),

    channelErrors:
      number(
        row.channelErrors,
      ),

    timeouts:
      number(
        row.timeouts,
      ),

    unexpectedClosures:
      number(
        row.unexpectedClosures,
      ),
  };
}


function recentRow(
  value: unknown,
): SuperAdminRealtimeRecentEvent | null {

  const row =
    record(
      value,
    );


  const observedAt =
    text(
      row.observedAt,
    );


  if (!observedAt) {
    return null;
  }


  return {
    observedAt,

    domain:
      text(
        row.domain,
      ),

    channelKind:
      text(
        row.channelKind,
      ),

    status:
      text(
        row.status,
      ),

    durationMs:
      number(
        row.durationMs,
      ),

    initial:
      bool(
        row.initial,
      ),

    intentional:
      bool(
        row.intentional,
      ),

    errorCategory:
      nullableText(
        row.errorCategory,
      ),
  };
}


export class SuperAdminRealtimeObservabilityRepository {

  async getAnalytics(
    from: Date,
    to: Date,
  ): Promise<SuperAdminRealtimeObservability> {

    const {
      data,
      error,
    } =
      await supabase.rpc(
        "super_admin_realtime_observability",
        {
          p_from:
            from.toISOString(),

          p_to:
            to.toISOString(),
        },
      );


    if (error) {

      throw new Error(
        error.message,
      );
    }


    const root =
      record(
        data,
      );


    const privacy =
      record(
        root.privacy,
      );


    const coverage =
      record(
        root.coverage,
      );


    return {
      source:
        text(
          root.source,
        ),

      coverageStartedAt:
        nullableText(
          root.coverageStartedAt,
        ),

      lastSubscribedAt:
        nullableText(
          root.lastSubscribedAt,
        ),

      lastProblemAt:
        nullableText(
          root.lastProblemAt,
        ),

      subscriptionAttempts:
        number(
          root.subscriptionAttempts,
        ),

      successfulSubscriptions:
        number(
          root.successfulSubscriptions,
        ),

      failedSubscriptions:
        number(
          root.failedSubscriptions,
        ),

      cancelledSubscriptions:
        number(
          root.cancelledSubscriptions,
        ),

      subscriptionSuccessRate:
        nullableNumber(
          root.subscriptionSuccessRate,
        ),

      previousSubscriptionSuccessRate:
        nullableNumber(
          root.previousSubscriptionSuccessRate,
        ),

      subscriptionSuccessRateDelta:
        nullableNumber(
          root.subscriptionSuccessRateDelta,
        ),

      channelErrors:
        number(
          root.channelErrors,
        ),

      timeouts:
        number(
          root.timeouts,
        ),

      unexpectedClosures:
        number(
          root.unexpectedClosures,
        ),

      intentionalClosures:
        number(
          root.intentionalClosures,
        ),

      reconnections:
        number(
          root.reconnections,
        ),

      averageSubscriptionMs:
        nullableNumber(
          root.averageSubscriptionMs,
        ),

      p95SubscriptionMs:
        nullableNumber(
          root.p95SubscriptionMs,
        ),

      domainBreakdown:
        array(
          root.domainBreakdown,
        )
          .map(
            domainRow,
          )
          .filter(
            (
              item,
            ): item is SuperAdminRealtimeDomainBreakdown =>
              item !== null,
          ),

      channelBreakdown:
        array(
          root.channelBreakdown,
        )
          .map(
            channelRow,
          )
          .filter(
            (
              item,
            ): item is SuperAdminRealtimeChannelBreakdown =>
              item !== null,
          ),

      daily:
        array(
          root.daily,
        )
          .map(
            dailyRow,
          )
          .filter(
            (
              item,
            ): item is SuperAdminRealtimeDailyPoint =>
              item !== null,
          ),

      recentEvents:
        array(
          root.recentEvents,
        )
          .map(
            recentRow,
          )
          .filter(
            (
              item,
            ): item is SuperAdminRealtimeRecentEvent =>
              item !== null,
          ),

      privacy: {
        storesUserIdentity:
          bool(
            privacy.storesUserIdentity,
          ),

        storesFightId:
          bool(
            privacy.storesFightId,
          ),

        storesMessageContent:
          bool(
            privacy.storesMessageContent,
          ),

        storesRealtimePayload:
          bool(
            privacy.storesRealtimePayload,
          ),

        storesToken:
          bool(
            privacy.storesToken,
          ),

        storesIp:
          bool(
            privacy.storesIp,
          ),

        storesUserAgent:
          bool(
            privacy.storesUserAgent,
          ),
      },

      coverage: {
        communication:
          bool(
            coverage.communication,
          ),

        fightLive:
          bool(
            coverage.fightLive,
          ),

        breakingNews:
          bool(
            coverage.breakingNews,
          ),

        presence:
          bool(
            coverage.presence,
          ),

        globalWebsocketConnections:
          bool(
            coverage.globalWebsocketConnections,
          ),
      },
    };
  }
}