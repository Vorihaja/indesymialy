'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { normalizeBackendError } from '@/shared/errors/backend-error';
import { createFightOfficialsUseCase } from '../factories/fight-officials.factory';
import type {
  AssignFightOfficialDraft,
  FightOfficialsSnapshot,
  FightOfficialStatus,
} from '../types';

export function useFightOfficials(
  eventId: string | null,
) {
  const useCase = useMemo(
    () => createFightOfficialsUseCase(),
    [],
  );

  const [data, setData] =
    useState<FightOfficialsSnapshot | null>(null);
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
    assign: (draft: AssignFightOfficialDraft) => {
      if (!eventId) {
        return Promise.reject(new Error('Aucun événement actif.'));
      }
      return mutate(() => useCase.assign(eventId, draft));
    },
    setStatus: (
      assignmentId: string,
      status: FightOfficialStatus,
    ) => {
      if (!eventId) {
        return Promise.reject(new Error('Aucun événement actif.'));
      }
      return mutate(() =>
        useCase.updateStatus(eventId, {
          assignmentId,
          status,
        }),
      );
    },
  };
}
