"use client";

import {
  useCallback,
  useMemo,
  useState,
} from "react";

import { createMarketplaceUseCase } from "../factories/marketplace.factory";
import type { OrderStatus } from "../types";

export function useMarketplaceStore() {
  const useCase =
    useMemo(
      () => createMarketplaceUseCase(),
      []
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const run =
    useCallback(
      async <T,>(
        action: () => Promise<T>
      ): Promise<T> => {
        try {
          setLoading(true);
          setError(null);

          return await action();
        } catch (cause) {
          const message =
            cause instanceof Error
              ? cause.message
              : "Erreur Marketplace inattendue.";

          setError(message);

          throw cause;
        } finally {
          setLoading(false);
        }
      },
      []
    );

  const updateOrderStatus =
    useCallback(
      (
        id: string,
        status: OrderStatus,
        reason?: string
      ) =>
        run(
          () =>
            useCase.updateOrderStatus(
              id,
              status,
              reason
            )
        ),
      [
        run,
        useCase,
      ]
    );

  const confirmPaymentPaid =
    useCallback(
      (
        paymentId: string,
        providerReference?: string,
        reason?: string
      ) =>
        run(
          () =>
            useCase.confirmPaymentPaid(
              paymentId,
              providerReference,
              reason
            )
        ),
      [
        run,
        useCase,
      ]
    );

  return {
    useCase,
    run,
    updateOrderStatus,
    confirmPaymentPaid,
    loading,
    error,
  };
}