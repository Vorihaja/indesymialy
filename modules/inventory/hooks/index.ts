"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createInventoryUseCase,
} from "../factories";

import type {
  InventoryItem,
} from "../types";

export function useInventory() {
  const useCase =
    useMemo(
      () =>
        createInventoryUseCase(),
      [],
    );

  const [
    items,
    setItems,
  ] =
    useState<InventoryItem[]>([]);

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
    mutatingProductId,
    setMutatingProductId,
  ] =
    useState<string | null>(null);

  const refresh =
    useCallback(
      async () => {
        setLoading(true);
        setError(null);

        try {
          const result =
            await useCase.list();

          setItems(result);

          return result;
        }
        catch (cause) {
          const message =
            cause instanceof Error
              ? cause.message
              : "Inventaire indisponible.";

          setError(message);

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

  const adjust =
    async (
      productId: string,
      quantity: number,
      reason: string,
    ) => {
      setMutatingProductId(productId);
      setError(null);

      try {
        await useCase.adjust(
          productId,
          quantity,
          reason,
        );

        await refresh();
      }
      catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Ajustement impossible.",
        );

        throw cause;
      }
      finally {
        setMutatingProductId(null);
      }
    };

  return {
    items,
    loading,
    error,
    mutatingProductId,
    refresh,
    adjust,
  };
}