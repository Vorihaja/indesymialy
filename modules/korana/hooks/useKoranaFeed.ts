"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  makeGetKoranaFeedUseCase,
} from "../factories/korana-feed.factory";

import type {
  KoranaFeedMode,
  KoranaFeedSnapshot,
} from "../feed.types";


export function useKoranaFeed() {

  const useCase =
    useMemo(
      () =>
        makeGetKoranaFeedUseCase(),
      [],
    );


  const [
    data,
    setData,
  ] =
    useState<
      KoranaFeedSnapshot | null
    >(
      null,
    );


  const [
    mode,
    setMode,
  ] =
    useState<KoranaFeedMode>(
      "for_you",
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
    useState(
      true,
    );


  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );


  const load =
    useCallback(
      async () => {

        setLoading(
          true,
        );

        setError(
          null,
        );


        try {

          const snapshot =
            await useCase.execute(
              {
                mode,

                actorId:
                  activeActorId,

                limit:
                  20,
              },
            );


          setData(
            snapshot,
          );


          if (
            !activeActorId &&
            snapshot.currentActor
          ) {

            setActiveActorId(
              snapshot.currentActor.id,
            );
          }

        } catch (
          reason
        ) {

          setError(
            reason instanceof Error
              ? reason.message
              : "Impossible de charger Indesy Korana.",
          );

        } finally {

          setLoading(
            false,
          );
        }

      },
      [
        activeActorId,
        mode,
        useCase,
      ],
    );


  useEffect(
    () => {

      queueMicrotask(
        () => {

          void load();
        },
      );

    },
    [
      load,
    ],
  );


  const selectActor =
    useCallback(
      (
        actorId:
          string,
      ) => {

        setActiveActorId(
          actorId,
        );

      },
      [],
    );


  const showForYou =
    useCallback(
      () => {

        setMode(
          "for_you",
        );

      },
      [],
    );


  const showFollowing =
    useCallback(
      () => {

        setMode(
          "following",
        );

      },
      [],
    );


  return {
    data,

    mode,

    activeActorId,

    loading,

    error,

    refresh:
      load,

    selectActor,

    showForYou,

    showFollowing,
  };
}