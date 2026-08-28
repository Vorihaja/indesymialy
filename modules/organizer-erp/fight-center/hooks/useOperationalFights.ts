'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { normalizeBackendError } from '@/shared/errors/backend-error';
import { createOperationalFightsUseCase } from '../factories/operational-fights.factory';
import type {
  OperationalFightDraft,
  OperationalFightItem,
  OperationalFightSnapshot,
} from '../types';

export function useOperationalFights(
  eventId: string | null,
) {
  const useCase = useMemo(
    () => createOperationalFightsUseCase(),
    [],
  );

  const [data, setData] =
    useState<OperationalFightSnapshot | null>(null);
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
      const snapshot =
        await useCase.load(eventId);
      setData(snapshot);
    } catch (reason) {
      setData(null);
      setError(
        normalizeBackendError(reason).message,
      );
    } finally {
      setLoading(false);
    }
  }, [eventId, useCase]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const mutate = useCallback(
    async <T,>(action: () => Promise<T>) => {
      setMutating(true);
      setError(null);

      try {
        const result = await action();
        await refresh();
        return result;
      } catch (reason) {
        const message =
          normalizeBackendError(reason).message;
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

    update: (
      fightId: string,
      draft: OperationalFightDraft,
    ) => {
      if (!eventId) {
        return Promise.reject(
          new Error('Aucun événement actif.'),
        );
      }

      return mutate(() =>
        useCase.update(
          eventId,
          fightId,
          draft,
        ),
      );
    },

    markReady: (
      fight: OperationalFightItem,
    ) => {
      if (!eventId) {
        return Promise.reject(
          new Error('Aucun événement actif.'),
        );
      }

      return mutate(() =>
        useCase.markReady(
          eventId,
          fight,
        ),
      );
    },

    returnToScheduled: (
      fight: OperationalFightItem,
    ) => {
      if (!eventId) {
        return Promise.reject(
          new Error('Aucun événement actif.'),
        );
      }

      return mutate(() =>
        useCase.returnToScheduled(
          eventId,
          fight,
        ),
      );
    },
  };
}
