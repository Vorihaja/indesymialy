"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createDeliveryUseCase,
} from "../factories";

import type {
  DeliveryRecord,
} from "../types";

export function useDeliveries() {
  const useCase =
    useMemo(
      () =>
        createDeliveryUseCase(),
      [],
    );

  const [
    deliveries,
    setDeliveries,
  ] =
    useState<DeliveryRecord[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(null);

  const [
    mutatingId,
    setMutatingId,
  ] =
    useState<string | null>(null);

  const refresh =
    useCallback(
      async () => {
        setLoading(true);
        setError(null);

        try {
          const result =
            await useCase.execute();

          setDeliveries(result);

          return result;
        }
        catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Livraisons indisponibles.",
          );

          throw cause;
        }
        finally {
          setLoading(false);
        }
      },
      [useCase],
    );

  useEffect(() => {
    void refresh().catch(
      () => undefined,
    );
  }, [refresh]);

  const updateMetadata =
    async (
      id: string,
      carrier: string,
      trackingNumber: string,
    ) => {
      setMutatingId(id);
      setError(null);

      try {
        await useCase
          .updateMetadata(
            id,
            carrier,
            trackingNumber,
          );

        await refresh();
      }
      catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Mise à jour du suivi impossible.",
        );

        throw cause;
      }
      finally {
        setMutatingId(null);
      }
    };

  return {
    deliveries,
    loading,
    error,
    mutatingId,
    refresh,
    updateMetadata,
  };
}