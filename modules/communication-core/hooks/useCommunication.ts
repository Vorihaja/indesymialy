"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  createCommunicationUseCase,
} from "../factories/communication.factory";

import {
  useCommunicationRealtime,
} from "./useCommunicationRealtime";

import type {
  CommunicationRealtimeChange,
} from "../repositories/communication-realtime.repository";

import type {
  CommunicationAttachmentUpload,
  CommunicationConversation,
  CommunicationRole,
  FightProposal,
  NotificationCategory,
  NotificationPreferences,
  SponsorOffer,
} from "../types";


function conversationIdFromRealtimeChange(
  change:
    CommunicationRealtimeChange,
): string | null {

  if (
    change.topic.startsWith(
      "conversation:",
    )
  ) {

    return change.topic.slice(
      "conversation:".length,
    );
  }


  const source =
    change.record ??
    change.oldRecord;


  const conversationId =
    source?.conversation_id;


  if (
    typeof conversationId ===
      "string"
  ) {

    return conversationId;
  }


  if (
    change.table ===
      "conversations"
  ) {

    const id =
      source?.id;

    return typeof id ===
      "string"
        ? id
        : null;
  }


  return null;
}


function sortConversations(
  conversations:
    CommunicationConversation[],
): CommunicationConversation[] {

  return [
    ...conversations,
  ].sort(
    (
      left,
      right,
    ) =>
      new Date(
        right.lastActivityAt,
      ).getTime() -
      new Date(
        left.lastActivityAt,
      ).getTime(),
  );
}


export function useConversations(
  query = "",
  conversationId?: string,
  role?: CommunicationRole,
) {

  const useCase =
    useMemo(
      () =>
        createCommunicationUseCase(
          role,
        ),
      [
        role,
      ],
    );


  const [
    conversations,
    setConversations,
  ] =
    useState<
      CommunicationConversation[]
    >([]);


  const [
    active,
    setActive,
  ] =
    useState<
      CommunicationConversation |
      null
    >(null);


  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );


  const [
    error,
    setError,
  ] =
    useState<
      string |
      null
    >(null);


  const realtimeTimers =
    useRef<
      Map<
        string,
        ReturnType<
          typeof setTimeout
        >
      >
    >(
      new Map(),
    );


  const removeConversation =
    useCallback(
      (
        id: string,
      ) => {

        setConversations(
          (
            current,
          ) =>
            current.filter(
              (
                item,
              ) =>
                item.id !== id,
            ),
        );


        setActive(
          (
            current,
          ) =>
            current?.id === id
              ? null
              : current,
        );
      },
      [],
    );


  const mergeConversation =
    useCallback(
      (
        value:
          CommunicationConversation,
      ) => {

        setConversations(
          (
            current,
          ) => {

            const exists =
              current.some(
                (
                  item,
                ) =>
                  item.id ===
                  value.id,
              );


            if (
              !exists &&
              query.trim()
            ) {

              return current;
            }


            const next =
              exists
                ? current.map(
                    (
                      item,
                    ) =>
                      item.id ===
                      value.id
                        ? value
                        : item,
                  )
                : [
                    value,
                    ...current,
                  ];


            return sortConversations(
              next,
            );
          },
        );


        setActive(
          (
            current,
          ) => {

            if (
              current?.id ===
                value.id ||
              conversationId ===
                value.id
            ) {

              return value;
            }


            return current;
          },
        );
      },
      [
        conversationId,
        query,
      ],
    );


  const reloadConversation =
    useCallback(
      async (
        id: string,
      ) => {

        try {

          const next =
            await useCase
              .conversation(
                id,
              );


          if (
            next
          ) {

            mergeConversation(
              next,
            );

          } else {

            removeConversation(
              id,
            );
          }

        } catch (
          reason:
            unknown
        ) {

          /*
           * Une conversation peut devenir inaccessible
           * après un changement de participants.
           *
           * Le channel est déjà réautorisé par le hook
           * Realtime. On évite ici un refresh global.
           */
          setError(
            reason instanceof Error
              ? reason.message
              : "Erreur lors de la mise à jour de la conversation.",
          );
        }
      },
      [
        mergeConversation,
        removeConversation,
        useCase,
      ],
    );


  const scheduleRealtimeReload =
    useCallback(
      (
        id: string,
      ) => {

        const previousTimer =
          realtimeTimers.current
            .get(
              id,
            );


        if (
          previousTimer
        ) {

          clearTimeout(
            previousTimer,
          );
        }


        const timer =
          setTimeout(
            () => {

              realtimeTimers.current
                .delete(
                  id,
                );

              void reloadConversation(
                id,
              );
            },
            80,
          );


        realtimeTimers.current
          .set(
            id,
            timer,
          );
      },
      [
        reloadConversation,
      ],
    );


  useEffect(
    () => {

      const timers =
        realtimeTimers.current;


      return () => {

        for (
          const timer of timers.values()
        ) {

          clearTimeout(
            timer,
          );
        }


        timers.clear();
      };
    },
    [],
  );


  const refresh =
    useCallback(
      async () => {

        setLoading(
          true,
        );

        setError(
          null,
        );


        try {

          const items =
            await useCase
              .conversations(
                query,
              );


          setConversations(
            items,
          );


          const selected =
            conversationId
              ? await useCase
                  .conversation(
                    conversationId,
                  )
              : items[0] ??
                null;


          setActive(
            selected,
          );


          if (
            selected
          ) {

            void useCase
              .markRead(
                selected.id,
              )
              .catch(
                () => undefined,
              );
          }

        } catch (
          reason:
            unknown
        ) {

          setError(
            reason instanceof Error
              ? reason.message
              : "Erreur inattendue",
          );

        } finally {

          setLoading(
            false,
          );
        }
      },
      [
        conversationId,
        query,
        useCase,
      ],
    );


  useEffect(
    () => {

      queueMicrotask(
        () => {

          void refresh();
        },
      );
    },
    [
      refresh,
    ],
  );


  const realtime =
    useCommunicationRealtime(
      {
        enabled:
          Boolean(
            active?.id,
          ),

        conversationId:
          active?.id,

        subscribeProfile:
          true,

        onChange:
          (
            change,
          ) => {

            const targetConversationId =
              conversationIdFromRealtimeChange(
                change,
              );


            if (
              targetConversationId
            ) {

              scheduleRealtimeReload(
                targetConversationId,
              );
            }
          },

        onConversationAuthorizationChanged:
          (
            changedConversationId,
          ) => {

            scheduleRealtimeReload(
              changedConversationId,
            );
          },
      },
    );


  const searchRecipients =
    useCallback(
      async (
        recipientQuery:
          string,
      ) => {

        return useCase
          .searchRecipients(
            recipientQuery,
          );
      },
      [
        useCase,
      ],
    );


  const openPrivate =
    useCallback(
      async (
        actorId:
          string,
      ) => {

        const conversation =
          await useCase
            .openPrivateConversation(
              actorId,
            );


        mergeConversation(
          conversation,
        );


        setActive(
          conversation,
        );


        return conversation;
      },
      [
        mergeConversation,
        useCase,
      ],
    );

  return {
    conversations,
    active,
    loading,
    error,

    realtimeConnected:
      realtime.connected,

    realtimeProfileId:
      realtime.profileId,

    realtimeStatus:
      realtime.conversationStatus,

    realtimeError:
      realtime.error,

    searchRecipients,

    openPrivate,

    select:
      setActive,

    refresh,

    send:
      async (
        content: string,
        replyToId?: string,
        attachments?:
          CommunicationAttachmentUpload[],
      ) => {

        if (
          !active
        ) {
          return;
        }


        await useCase
          .send(
            active.id,
            content,
            replyToId,
            attachments,
          );


        await reloadConversation(
          active.id,
        );
      },

    create:
      async (
        title: string,
        kind:
          "private" |
          "group",
        role:
          CommunicationRole,
      ) => {

        const created =
          await useCase
            .createConversation(
              title,
              kind,
              role,
            );


        mergeConversation(
          created,
        );

        setActive(
          created,
        );


        return created;
      },

    action:
      async (
        id: string,
        action:
          "archive" |
          "delete_local" |
          "favorite" |
          "mute",
      ) => {

        await useCase
          .updateConversation(
            id,
            action,
          );


        await reloadConversation(
          id,
        );
      },
  };
}


export function useProposals(
  kind:
    "fight" |
    "sponsor",
) {

  const useCase =
    useMemo(
      () =>
        createCommunicationUseCase(),
      [],
    );


  const [
    items,
    setItems,
  ] =
    useState<
      Array<
        FightProposal |
        SponsorOffer
      >
    >([]);


  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );


  const refresh =
    useCallback(
      async () => {

        setItems(
          kind === "fight"
            ? await useCase
                .fightProposals()
            : await useCase
                .sponsorOffers(),
        );

        setLoading(
          false,
        );
      },
      [
        kind,
        useCase,
      ],
    );


  useEffect(
    () => {

      queueMicrotask(
        () => {

          void refresh();
        },
      );
    },
    [
      refresh,
    ],
  );


  return {
    items,
    loading,

    decide:
      async (
        id: string,
        status:
          "accepted" |
          "refused" |
          "countered",
      ) => {

        if (
          kind === "fight"
        ) {

          await useCase
            .decideFightProposal(
              id,
              status,
            );

        } else {

          await useCase
            .decideSponsorOffer(
              id,
              status,
            );
        }


        await refresh();
      },
  };
}


export function useNotifications(
  category?:
    NotificationCategory,
) {

  const useCase =
    useMemo(
      () =>
        createCommunicationUseCase(),
      [],
    );


  const [
    items,
    setItems,
  ] =
    useState<
      Awaited<
        ReturnType<
          typeof useCase.notifications
        >
      >
    >([]);


  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );


  const refresh =
    useCallback(
      async () => {

        setItems(
          await useCase
            .notifications(
              category,
            ),
        );

        setLoading(
          false,
        );
      },
      [
        category,
        useCase,
      ],
    );


  useEffect(
    () => {

      queueMicrotask(
        () => {

          void refresh();
        },
      );
    },
    [
      refresh,
    ],
  );


  return {
    items,

    unread:
      items.filter(
        (
          item,
        ) =>
          !item.readAt,
      ).length,

    loading,

    read:
      async (
        id: string,
      ) => {

        await useCase
          .readNotification(
            id,
          );

        await refresh();
      },

    readAll:
      async () => {

        await useCase
          .readAllNotifications();

        await refresh();
      },

    remove:
      async (
        id: string,
      ) => {

        await useCase
          .deleteNotification(
            id,
          );

        await refresh();
      },
  };
}


export function useNotificationPreferences() {

  const useCase =
    useMemo(
      () =>
        createCommunicationUseCase(),
      [],
    );


  const [
    preferences,
    setPreferences,
  ] =
    useState<
      NotificationPreferences |
      null
    >(null);


  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );


  useEffect(
    () => {

      let active =
        true;


      void useCase
        .preferences()
        .then(
          (
            value,
          ) => {

            if (
              active
            ) {

              setPreferences(
                value,
              );
            }
          },
        )
        .finally(
          () => {

            if (
              active
            ) {

              setLoading(
                false,
              );
            }
          },
        );


      return () => {

        active =
          false;
      };
    },
    [
      useCase,
    ],
  );


  return {
    preferences,
    loading,

    save:
      async (
        value:
          NotificationPreferences,
      ) => {

        const saved =
          await useCase
            .savePreferences(
              value,
            );

        setPreferences(
          saved,
        );
      },
  };
}
