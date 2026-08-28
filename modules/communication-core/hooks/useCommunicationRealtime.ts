"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  RealtimeChannel,
} from "@supabase/supabase-js";

import {
  createCommunicationRealtimeService,
} from "../factories/communication-realtime.factory";

import type {
  RealtimeCommunicationEvent,
} from "../types";

import type {
  CommunicationRealtimeChange,
  CommunicationRealtimeStatus,
} from "../repositories/communication-realtime.repository";


const MAX_DEBUG_EVENTS =
  25;


export interface UseCommunicationRealtimeOptions {
  enabled?: boolean;
  conversationId?: string;
  subscribeProfile?: boolean;

  onChange?:
    (
      change:
        CommunicationRealtimeChange,
    ) => void;

  onConversationAuthorizationChanged?:
    (
      conversationId: string,
    ) => void;
}


function legacyChannelFromTable(
  table: string,
): RealtimeCommunicationEvent["channel"] {

  if (
    table === "messages"
  ) {
    return "message";
  }

  if (
    table === "message_reads"
  ) {
    return "read";
  }

  return "conversation";
}


function changeEntityId(
  change:
    CommunicationRealtimeChange,
): string {

  const source =
    change.record ??
    change.oldRecord;

  const id =
    source?.id;

  if (
    typeof id === "string"
  ) {
    return id;
  }

  const topicId =
    change.topic
      .split(":")
      .slice(1)
      .join(":");

  return topicId || "unknown";
}


function toLegacyEvent(
  change:
    CommunicationRealtimeChange,
): RealtimeCommunicationEvent {

  return {
    channel:
      legacyChannelFromTable(
        change.table,
      ),

    entityId:
      changeEntityId(
        change,
      ),

    occurredAt:
      new Date()
        .toISOString(),

    payload: {
      topic:
        change.topic,

      operation:
        change.operation,

      schema:
        change.schema,

      table:
        change.table,

      record:
        change.record,

      old_record:
        change.oldRecord,

      broadcast_id:
        change.broadcastId,
    },
  };
}


function participantAuthorizationChanged(
  change:
    CommunicationRealtimeChange,
): boolean {

  if (
    change.table !==
      "conversation_participants"
  ) {
    return false;
  }


  /*
   * Toute modification de participants peut modifier
   * le résultat de messaging_can_access_conversation().
   *
   * Nous forçons donc une nouvelle autorisation du channel,
   * sans essayer de reproduire côté navigateur toute la
   * logique profile / organization de PostgreSQL.
   */
  return (
    change.operation === "INSERT" ||
    change.operation === "UPDATE" ||
    change.operation === "DELETE"
  );
}


export function useCommunicationRealtime(
  input:
    boolean |
    UseCommunicationRealtimeOptions =
      false,
) {

  const options:
    UseCommunicationRealtimeOptions =
      typeof input === "boolean"
        ? {
            enabled:
              input,
          }
        : input;


  const {
    enabled = false,
    conversationId,
    subscribeProfile = true,
  } =
    options;


  const service =
    useMemo(
      () =>
        createCommunicationRealtimeService(),
      [],
    );


  const onChangeRef =
    useRef(
      options.onChange,
    );


  const onAuthorizationChangedRef =
    useRef(
      options
        .onConversationAuthorizationChanged,
    );


  useEffect(
    () => {

      onChangeRef.current =
        options.onChange;

      onAuthorizationChangedRef.current =
        options
          .onConversationAuthorizationChanged;
    },
    [
      options.onChange,
      options
        .onConversationAuthorizationChanged,
    ],
  );


  const [
    events,
    setEvents,
  ] =
    useState<
      RealtimeCommunicationEvent[]
    >([]);


  const [
    profileId,
    setProfileId,
  ] =
    useState<string | null>(
      null,
    );


  const [
    conversationStatus,
    setConversationStatus,
  ] =
    useState<
      CommunicationRealtimeStatus
    >("IDLE");


  const [
    profileStatus,
    setProfileStatus,
  ] =
    useState<
      CommunicationRealtimeStatus
    >("IDLE");


  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );


  useEffect(
    () => {

      if (
        !enabled
      ) {

        setConversationStatus(
          "IDLE",
        );

        setProfileStatus(
          "IDLE",
        );

        setError(
          null,
        );

        return;
      }


      let cancelled =
        false;

      let conversationChannel:
        RealtimeChannel |
        null =
          null;

      let profileChannel:
        RealtimeChannel |
        null =
          null;

      let conversationReauthorizing =
        false;


      const remember =
        (
          change:
            CommunicationRealtimeChange,
        ) => {

          setEvents(
            (
              current,
            ) => {

              const next =
                [
                  ...current,
                  toLegacyEvent(
                    change,
                  ),
                ];

              return next.slice(
                -MAX_DEBUG_EVENTS,
              );
            },
          );


          onChangeRef.current?.(
            change,
          );
        };


      const subscribeConversation =
        async () => {

          if (
            !conversationId ||
            cancelled
          ) {
            return;
          }


          conversationChannel =
            await service
              .subscribeConversation(
                conversationId,

                (
                  change,
                ) => {

                  remember(
                    change,
                  );


                  if (
                    participantAuthorizationChanged(
                      change,
                    )
                  ) {

                    void reauthorizeConversation();
                  }
                },

                (
                  status,
                  channelError,
                ) => {

                  if (
                    cancelled
                  ) {
                    return;
                  }


                  setConversationStatus(
                    status,
                  );


                  if (
                    channelError
                  ) {

                    setError(
                      channelError.message,
                    );
                  }
                },
              );
        };


      const reauthorizeConversation =
        async () => {

          if (
            cancelled ||
            !conversationId ||
            conversationReauthorizing
          ) {
            return;
          }


          conversationReauthorizing =
            true;


          try {

            const previousChannel =
              conversationChannel;

            conversationChannel =
              null;


            if (
              previousChannel
            ) {

              await service
                .unsubscribe(
                  previousChannel,
                );
            }


            if (
              cancelled
            ) {
              return;
            }


            /*
             * Le parent peut en profiter pour relire la
             * conversation et constater une éventuelle
             * perte d'accès.
             */
            onAuthorizationChangedRef
              .current?.(
                conversationId,
              );


            await subscribeConversation();

          } catch (
            reason:
              unknown
          ) {

            if (
              !cancelled
            ) {

              setError(
                reason instanceof Error
                  ? reason.message
                  : "Erreur Realtime inattendue.",
              );

              setConversationStatus(
                "CHANNEL_ERROR",
              );
            }

          } finally {

            conversationReauthorizing =
              false;
          }
        };


      const start =
        async () => {

          try {

            setError(
              null,
            );


            const currentProfileId =
              await service
                .currentProfileId();


            if (
              cancelled
            ) {
              return;
            }


            setProfileId(
              currentProfileId,
            );


            if (
              subscribeProfile
            ) {

              profileChannel =
                await service
                  .subscribeProfile(
                    currentProfileId,

                    remember,

                    (
                      status,
                      channelError,
                    ) => {

                      if (
                        cancelled
                      ) {
                        return;
                      }


                      setProfileStatus(
                        status,
                      );


                      if (
                        channelError
                      ) {

                        setError(
                          channelError.message,
                        );
                      }
                    },
                  );
            }


            await subscribeConversation();

          } catch (
            reason:
              unknown
          ) {

            if (
              cancelled
            ) {
              return;
            }


            setError(
              reason instanceof Error
                ? reason.message
                : "Erreur Realtime inattendue.",
            );


            setConversationStatus(
              "CHANNEL_ERROR",
            );
          }
        };


      void start();


      return () => {

        cancelled =
          true;


        const channels =
          [
            conversationChannel,
            profileChannel,
          ].filter(
            (
              channel,
            ): channel is RealtimeChannel =>
              channel !== null,
          );


        for (
          const channel of channels
        ) {

          void service
            .unsubscribe(
              channel,
            );
        }
      };
    },
    [
      conversationId,
      enabled,
      service,
      subscribeProfile,
    ],
  );


  const connected =
    enabled &&
    (
      conversationId
        ? conversationStatus ===
          "SUBSCRIBED"
        : subscribeProfile
          ? profileStatus ===
            "SUBSCRIBED"
          : false
    );


  return {
    events,
    connected,
    error,
    profileId,
    conversationStatus,
    profileStatus,
  };
}