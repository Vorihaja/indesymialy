"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createAdvancedInventoryUseCase,
} from "./inventory-advanced.factory";

import type {
  AdvancedInventorySnapshot,
  InventoryPhysicalCountInput,
} from "./types";

export function useAdvancedInventory() {
  const useCase =
    useMemo(
      () =>
        createAdvancedInventoryUseCase(),
      [],
    );

  const [
    data,
    setData,
  ] =
    useState<AdvancedInventorySnapshot | null>(
      null,
    );

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
          const snapshot =
            await useCase.execute();

          setData(
            snapshot,
          );

          return snapshot;
        }
        catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "La gestion de stock est indisponible.",
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

  async function mutate<T>(
    action:
      () => Promise<T>,
  ) {
    setMutating(true);
    setError(null);

    try {
      const result =
        await action();

      await refresh();

      return result;
    }
    catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "L’opération de stock a échoué.",
      );

      throw cause;
    }
    finally {
      setMutating(false);
    }
  }

  return {
    data,
    loading,
    mutating,
    error,
    refresh,

    adjust(
      productId: string,
      delta: number,
      reason: string,
    ) {
      return mutate(
        () =>
          useCase.adjust(
            productId,
            delta,
            reason,
          ),
      );
    },

    setThreshold(
      productId: string,
      threshold: number,
    ) {
      return mutate(
        () =>
          useCase.setThreshold(
            productId,
            threshold,
          ),
      );
    },

    startCount(
      note?: string,
    ) {
      return mutate(
        () =>
          useCase.startCount(
            note,
          ),
      );
    },

    saveCount(
      countId: string,
      values:
        InventoryPhysicalCountInput[],
    ) {
      return mutate(
        () =>
          useCase.saveCount(
            countId,
            values,
          ),
      );
    },

    finalizeCount(
      countId: string,
    ) {
      return mutate(
        () =>
          useCase.finalizeCount(
            countId,
          ),
      );
    },

    cancelCount(
      countId: string,
    ) {
      return mutate(
        () =>
          useCase.cancelCount(
            countId,
          ),
      );
    },
  };
}