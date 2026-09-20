"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createSellerCustomersUseCase,
} from "../factories/seller-customers.factory";

import type {
  CustomerDisputeInput,
  CustomerSegmentInput,
  LoyaltyAdjustmentInput,
  SellerCustomersSnapshot,
} from "../types";

export function useSellerCustomers() {
  const useCase =
    useMemo(
      () =>
        createSellerCustomersUseCase(),
      [],
    );

  const [
    data,
    setData,
  ] =
    useState<SellerCustomersSnapshot | null>(
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
        try {
          setLoading(true);

          setData(
            await useCase.execute(),
          );

          setError(null);
        }
        catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Clients indisponibles.",
          );
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
      void refresh();
    },
    [
      refresh,
    ],
  );

  const run =
    useCallback(
      async (
        operation: () => Promise<void>,
      ) => {
        try {
          setMutating(true);
          setError(null);

          await operation();
          await refresh();
        }
        catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Opération impossible.",
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

    saveSegment:
      (
        input: CustomerSegmentInput,
      ) =>
        run(
          () =>
            useCase.saveSegment(
              input,
            ),
        ),

    setSegmentStatus:
      (
        id: string,
        status: "active" | "archived",
      ) =>
        run(
          () =>
            useCase.setSegmentStatus(
              id,
              status,
            ),
        ),

    setSegmentMembers:
      (
        segmentId: string,
        customerIds: string[],
      ) =>
        run(
          () =>
            useCase.setSegmentMembers(
              segmentId,
              customerIds,
            ),
        ),

    adjustLoyalty:
      (
        input: LoyaltyAdjustmentInput,
      ) =>
        run(
          () =>
            useCase.adjustLoyalty(
              input,
            ),
        ),

    saveDispute:
      (
        input: CustomerDisputeInput,
      ) =>
        run(
          () =>
            useCase.saveDispute(
              input,
            ),
        ),
  };
}