"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createPromotionsUseCase,
} from "../factories/promotions.factory";

import type {
  PromotionCampaignInput,
  PromotionCodeInput,
  PromotionCodeStatus,
  PromotionsSnapshot,
  PromotionStatus,
} from "../types";

export function usePromotions() {
  const useCase =
    useMemo(
      () =>
        createPromotionsUseCase(),
      [],
    );

  const [
    data,
    setData,
  ] =
    useState<PromotionsSnapshot | null>(
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
        catch (reason) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Les promotions sont indisponibles.",
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

  async function run<T>(
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
    catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "L’opération promotionnelle a échoué.",
      );

      throw reason;
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

    saveCampaign(
      input:
        PromotionCampaignInput,
    ) {
      return run(
        () =>
          useCase.saveCampaign(
            input,
          ),
      );
    },

    setCampaignStatus(
      id: string,
      status:
        PromotionStatus,
    ) {
      return run(
        () =>
          useCase.setCampaignStatus(
            id,
            status,
          ),
      );
    },

    saveCode(
      input:
        PromotionCodeInput,
    ) {
      return run(
        () =>
          useCase.saveCode(
            input,
          ),
      );
    },

    setCodeStatus(
      id: string,
      status:
        PromotionCodeStatus,
    ) {
      return run(
        () =>
          useCase.setCodeStatus(
            id,
            status,
          ),
      );
    },
  };
}