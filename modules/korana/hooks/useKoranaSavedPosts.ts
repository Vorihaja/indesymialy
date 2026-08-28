"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  KoranaSavedPostsSnapshot,
} from "../saved-post.types";

import {
  createGetKoranaSavedPostsUseCase,
} from "../factories/korana-saved-post.factory";


function readableError(
  reason: unknown,
) {

  const message =
    reason instanceof Error
      ? reason.message
      : "Impossible de charger les publications enregistrées.";


  if (
    message.includes(
      "AUTHENTICATION_REQUIRED",
    )
  ) {

    return "Connecte-toi pour accéder à tes publications enregistrées.";
  }


  if (
    message.includes(
      "KORANA_ACTOR_FORBIDDEN",
    )
  ) {

    return "Cette identité Korana n’est pas accessible.";
  }


  return message;
}


export function useKoranaSavedPosts() {

  const useCase =
    useMemo(
      () =>
        createGetKoranaSavedPostsUseCase(),
      [],
    );


  const [
    data,
    setData,
  ] =
    useState<KoranaSavedPostsSnapshot | null>(
      null,
    );


  const [
    activeActorId,
    setActiveActorId,
  ] =
    useState<string | null>(
      null,
    );


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    loadingMore,
    setLoadingMore,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );


  const load =
    useCallback(
      async (
        actorId:
          string | null,

        before:
          string | null,

        append:
          boolean,
      ) => {

        if (append) {

          setLoadingMore(
            true,
          );

        } else {

          setLoading(
            true,
          );
        }


        setError(
          null,
        );


        try {

          const snapshot =
            await useCase.execute(
              {
                actorId,

                limit:
                  30,

                before,
              },
            );


          if (append) {

            setData(
              (current) => {

                if (
                  !current ||
                  current.currentActor?.id !==
                    snapshot.currentActor?.id
                ) {

                  return snapshot;
                }


                const existing =
                  new Set(
                    current.items.map(
                      (item) =>
                        item.id,
                    ),
                  );


                return {
                  ...snapshot,

                  items: [
                    ...current.items,

                    ...snapshot.items.filter(
                      (item) =>
                        !existing.has(
                          item.id,
                        ),
                    ),
                  ],
                };
              },
            );

          } else {

            setData(
              snapshot,
            );
          }


          if (
            !actorId &&
            snapshot.currentActor?.id
          ) {

            setActiveActorId(
              snapshot.currentActor.id,
            );
          }

        } catch (
          reason
        ) {

          setError(
            readableError(
              reason,
            ),
          );

        } finally {

          setLoading(
            false,
          );

          setLoadingMore(
            false,
          );
        }
      },
      [
        useCase,
      ],
    );


  useEffect(
    () => {

      void load(
        activeActorId,
        null,
        false,
      );

    },
    [
      activeActorId,
      load,
    ],
  );


  const refresh =
    useCallback(
      async () => {

        await load(
          activeActorId,
          null,
          false,
        );

      },
      [
        activeActorId,
        load,
      ],
    );


  const loadMore =
    useCallback(
      async () => {

        if (
          !data?.pagination.hasMore ||
          !data.pagination.nextBefore ||
          loadingMore
        ) {

          return;
        }


        await load(
          activeActorId,
          data.pagination.nextBefore,
          true,
        );

      },
      [
        activeActorId,
        data,
        load,
        loadingMore,
      ],
    );


  function selectActor(
    actorId: string,
  ) {

    if (
      actorId ===
      activeActorId
    ) {

      return;
    }


    setActiveActorId(
      actorId,
    );
  }


  return {
    data,
    activeActorId,
    loading,
    loadingMore,
    error,
    refresh,
    loadMore,
    selectActor,
  };
}