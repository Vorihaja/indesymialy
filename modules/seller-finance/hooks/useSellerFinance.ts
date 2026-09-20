"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createSellerFinanceUseCase,
} from "../factories/seller-finance.factory";

import type {
  SellerFinanceTransaction,
  SellerRevenueSnapshot,
} from "../types";

function message(
  reason: unknown,
) {
  return reason instanceof Error
    ? reason.message
    : "Les données financières sont indisponibles.";
}

export function useSellerTransactions() {
  const useCase =
    useMemo(
      () =>
        createSellerFinanceUseCase(),
      [],
    );

  const [
    data,
    setData,
  ] =
    useState<SellerFinanceTransaction[] | null>(
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
            await useCase.transactions();

          setData(
            result,
          );

          return result;
        }
        catch (reason) {
          setError(
            message(reason),
          );

          throw reason;
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

  return {
    data,
    loading,
    error,
    refresh,
  };
}

export function useSellerRevenue() {
  const useCase =
    useMemo(
      () =>
        createSellerFinanceUseCase(),
      [],
    );

  const [
    data,
    setData,
  ] =
    useState<SellerRevenueSnapshot | null>(
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
            await useCase.revenue();

          setData(
            result,
          );

          return result;
        }
        catch (reason) {
          setError(
            message(reason),
          );

          throw reason;
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

  return {
    data,
    loading,
    error,
    refresh,
  };
}