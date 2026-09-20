"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createDeliveryAdvancedUseCase,
} from "./delivery-advanced.factory";

import type {
  CreateReturnInput,
  DeliveryAdvancedSnapshot,
  DeliveryCarrierInput,
  DeliveryZoneInput,
  MarketplaceReturnResolution,
  MarketplaceReturnStatus,
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


export function useDeliveryAdvanced() {
  const useCase =
    useMemo(
      () =>
        createDeliveryAdvancedUseCase(),
      [],
    );

  const [
    data,
    setData,
  ] =
    useState<
      DeliveryAdvancedSnapshot | null
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
          const next =
            await useCase.load();

          setData(next);

          return next;
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
      [useCase],
    );


  useEffect(
    () => {
      void refresh().catch(
        () => undefined,
      );
    },
    [refresh],
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
      [refresh],
    );


  return {
    data,
    loading,
    mutating,
    error,
    refresh,

    saveCarrier:
      (
        input:
          DeliveryCarrierInput,
      ) =>
        run(
          () =>
            useCase
              .saveCarrier(
                input,
              ),
        ),

    archiveCarrier:
      (
        id: string,
      ) =>
        run(
          () =>
            useCase
              .archiveCarrier(
                id,
              ),
        ),

    assignCarrier:
      (
        deliveryId: string,
        carrierId: string | null,
        trackingNumber: string,
      ) =>
        run(
          () =>
            useCase
              .assignCarrier(
                deliveryId,
                carrierId,
                trackingNumber,
              ),
        ),

    saveZone:
      (
        input:
          DeliveryZoneInput,
      ) =>
        run(
          () =>
            useCase
              .saveZone(
                input,
              ),
        ),

    archiveZone:
      (
        id: string,
      ) =>
        run(
          () =>
            useCase
              .archiveZone(
                id,
              ),
        ),

    createReturn:
      (
        input:
          CreateReturnInput,
      ) =>
        run(
          () =>
            useCase
              .createReturn(
                input,
              ),
        ),

    transitionReturn:
      (
        id: string,
        status:
          MarketplaceReturnStatus,
        note: string,
        resolution?:
          MarketplaceReturnResolution,
      ) =>
        run(
          () =>
            useCase
              .transitionReturn(
                id,
                status,
                note,
                resolution,
              ),
        ),
  };
}