"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createSellerPerformanceUseCase,
} from "../factories/seller-performance.factory";

import type {
  SellerPerformanceSnapshot,
} from "../types";

export function useSellerPerformance(
  from: string,
  to: string,
) {
  const useCase =
    useMemo(
      () =>
        createSellerPerformanceUseCase(),
      [],
    );

  const [
    data,
    setData,
  ] =
    useState<SellerPerformanceSnapshot | null>(
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
        try {
          setLoading(true);

          setData(
            await useCase.execute(
              from,
              to,
            ),
          );

          setError(null);
        }
        catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Performance indisponible.",
          );
        }
        finally {
          setLoading(false);
        }
      },
      [
        from,
        to,
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