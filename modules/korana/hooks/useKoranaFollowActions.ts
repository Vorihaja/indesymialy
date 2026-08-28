"use client";

import {
  useMemo,
  useState,
} from "react";

import type {
  KoranaFollowInput,
} from "../follow.types";

import {
  makeFollowKoranaActorUseCase,
  makeUnfollowKoranaActorUseCase,
} from "../factories/korana-follow.factory";


export function useKoranaFollowActions() {

  const followUseCase =
    useMemo(
      () =>
        makeFollowKoranaActorUseCase(),
      [],
    );


  const unfollowUseCase =
    useMemo(
      () =>
        makeUnfollowKoranaActorUseCase(),
      [],
    );


  /*
   * A Set is used instead of a single boolean.
   *
   * This allows Korana to know exactly which target Actor
   * currently has a Follow / Unfollow request in progress.
   *
   * Example:
   *
   * pendingActorIds = Set(["actor-b"])
   *
   * Actor A -> normal
   * Actor B -> spinner
   * Actor C -> normal
   */

  const [
    pendingActorIds,
    setPendingActorIds,
  ] =
    useState<Set<string>>(
      () =>
        new Set(),
    );


  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );


  const pending =
    pendingActorIds.size >
    0;


  function isPending(
    followedActorId:
      string,
  ) {

    return pendingActorIds.has(
      followedActorId,
    );
  }


  function markPending(
    followedActorId:
      string,
  ) {

    setPendingActorIds(
      (current) => {

        const next =
          new Set(
            current,
          );


        next.add(
          followedActorId,
        );


        return next;
      },
    );
  }


  function clearPending(
    followedActorId:
      string,
  ) {

    setPendingActorIds(
      (current) => {

        const next =
          new Set(
            current,
          );


        next.delete(
          followedActorId,
        );


        return next;
      },
    );
  }


  async function run<T>(
    followedActorId:
      string,

    action:
      () => Promise<T>,
  ) {

    markPending(
      followedActorId,
    );

    setError(
      null,
    );


    try {

      return await action();

    } catch (
      reason
    ) {

      const message =
        reason instanceof Error
          ? reason.message
          : "Impossible de modifier cet abonnement Korana.";


      setError(
        message,
      );


      throw reason;

    } finally {

      clearPending(
        followedActorId,
      );
    }
  }


  return {

    /*
     * Kept for backward compatibility.
     *
     * Components that only handle one target can still use
     * `pending`.
     */

    pending,


    /*
     * Preferred method for lists of Actors.
     */

    isPending,


    error,


    clearError:
      () =>
        setError(
          null,
        ),


    follow:
      (
        input:
          KoranaFollowInput,
      ) =>
        run(
          input.followedActorId,

          () =>
            followUseCase.execute(
              input,
            ),
        ),


    unfollow:
      (
        input:
          KoranaFollowInput,
      ) =>
        run(
          input.followedActorId,

          () =>
            unfollowUseCase.execute(
              input,
            ),
        ),
  };
}