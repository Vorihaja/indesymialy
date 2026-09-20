"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createPromotionsV2UseCase,
} from "./promotions-v2.factory";

import type {
  MarketplaceBundleInput,
  MarketplacePartnershipInput,
  PromotionsV2Snapshot,
  PromotionV2Status,
} from "./types";


function readableError(
  cause: unknown,
) {
  if (
    cause instanceof Error
  ) {
    return cause.message;
  }

  if (
    cause &&
    typeof cause === "object" &&
    "message" in cause &&
    typeof (
      cause as {
        message?: unknown;
      }
    ).message === "string"
  ) {
    return (
      cause as {
        message: string;
      }
    ).message;
  }

  return "Opération impossible.";
}


export function usePromotionsV2() {
  const useCase =
    useMemo(
      () =>
        createPromotionsV2UseCase(),
      [],
    );

  const [
    data,
    setData,
  ] =
    useState<
      PromotionsV2Snapshot | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    mutating,
    setMutating,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );


  const refresh =
    useCallback(
      async () => {
        setLoading(true);
        setError(null);

        try {
          const result =
            await useCase.load();

          setData(result);

          return result;
        }
        catch (cause) {
          setData(null);

          setError(
            readableError(
              cause,
            ),
          );

          throw cause;
        }
        finally {
          setLoading(false);
        }
      },
      [
        useCase,
      ],
    );


  useEffect(
    () => {
      void refresh().catch(
        () => undefined,
      );
    },
    [
      refresh,
    ],
  );


  const run =
    useCallback(
      async (
        action:
          () =>
            Promise<unknown>,
      ) => {
        setMutating(true);
        setError(null);

        try {
          await action();
          await refresh();
        }
        catch (cause) {
          setError(
            readableError(
              cause,
            ),
          );

          throw cause;
        }
        finally {
          setMutating(false);
        }
      },
      [
        refresh,
      ],
    );


  return {
    data,
    loading,
    mutating,
    error,
    refresh,

    saveBundle:
      (
        input:
          MarketplaceBundleInput,
      ) =>
        run(
          () =>
            useCase
              .saveBundle(
                input,
              ),
        ),

    setBundleStatus:
      (
        id: string,
        status:
          PromotionV2Status,
      ) =>
        run(
          () =>
            useCase
              .setBundleStatus(
                id,
                status,
              ),
        ),

    savePartnership:
      (
        input:
          MarketplacePartnershipInput,
      ) =>
        run(
          () =>
            useCase
              .savePartnership(
                input,
              ),
        ),

    setPartnershipStatus:
      (
        id: string,
        status:
          PromotionV2Status,
        note: string,
      ) =>
        run(
          () =>
            useCase
              .setPartnershipStatus(
                id,
                status,
                note,
              ),
        ),
  };
}