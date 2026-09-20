"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createSellerMarketplaceUseCase,
} from "../factories/seller-marketplace.factory";

import type {
  SellerMarketplaceSnapshot,
} from "../types";

function errorMessage(
  reason: unknown,
) {
  return reason instanceof Error
    ? reason.message
    : "Le cockpit Marketplace est temporairement indisponible.";
}

export function useSellerMarketplace(
  periodDays = 30,
) {
  const useCase =
    useMemo(
      () =>
        createSellerMarketplaceUseCase(),
      [],
    );

  const [
    data,
    setData,
  ] =
    useState<SellerMarketplaceSnapshot | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

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
            await useCase.execute(
              periodDays,
            );

          setData(
            result,
          );
        }
        catch (reason) {
          setData(
            null,
          );

          setError(
            errorMessage(
              reason,
            ),
          );
        }
        finally {
          setLoading(false);
        }
      },
      [
        periodDays,
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

  return {
    data,
    loading,
    error,
    refresh,
  };
}