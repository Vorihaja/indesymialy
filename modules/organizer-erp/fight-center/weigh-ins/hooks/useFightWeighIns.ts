'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { normalizeBackendError } from '@/shared/errors/backend-error';
import { createFightWeighInsUseCase } from '../factories/fight-weigh-ins.factory';
import type {
  FightWeighInAttemptDraft,
  FightWeighInSnapshot,
  FightWeighInWaiverDraft,
} from '../types';

export function useFightWeighIns(
  eventId: string | null,
) {
  const useCase = useMemo(
    () => createFightWeighInsUseCase(),
    [],
  );

  const [data, setData] =
    useState<FightWeighInSnapshot | null>(null);
  const [loading, setLoading] =
    useState(Boolean(eventId));
  const [mutating, setMutating] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!eventId) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setData(await useCase.load(eventId));
    } catch (reason) {
      setData(null);
      setError(normalizeBackendError(reason).message);
    } finally {
      setLoading(false);
    }
  }, [eventId, useCase]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const mutate = useCallback(
    async (action: () => Promise<void>) => {
      setMutating(true);
      setError(null);

      try {
        await action();
        await refresh();
      } catch (reason) {
        const message = normalizeBackendError(reason).message;
        setError(message);
        throw new Error(message);
      } finally {
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
    createAttempt: (draft: FightWeighInAttemptDraft) => {
      if (!eventId) {
        return Promise.reject(new Error('Aucun événement actif.'));
      }
      return mutate(() => useCase.createAttempt(eventId, draft));
    },
    waive: (draft: FightWeighInWaiverDraft) => {
      if (!eventId) {
        return Promise.reject(new Error('Aucun événement actif.'));
      }
      return mutate(() => useCase.waive(eventId, draft));
    },
  };
}
