'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { normalizeBackendError } from '@/shared/errors/backend-error';
import { createFightCenterUseCase } from '../factories/fight-center.factory';
import type {
  FightCardDraft,
  FightCardMoveDirection,
  FightCardSnapshot,
} from '../types';

export function useFightCenter(eventId: string | null) {
  const useCase = useMemo(() => createFightCenterUseCase(), []);

  const [data, setData] = useState<FightCardSnapshot | null>(null);
  const [loading, setLoading] = useState(Boolean(eventId));
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const snapshot = await useCase.load(eventId);
      setData(snapshot);
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
    async <T,>(action: () => Promise<T>) => {
      setMutating(true);
      setError(null);

      try {
        const result = await action();
        await refresh();
        return result;
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

    create: (draft: FightCardDraft) => {
      if (!eventId || !data) {
        return Promise.reject(new Error('Aucun événement actif.'));
      }

      return mutate(() => useCase.create(eventId, draft, data.cards));
    },

    update: (cardId: string, draft: FightCardDraft) => {
      if (!data) {
        return Promise.reject(new Error('Fight Card indisponible.'));
      }

      return mutate(() => useCase.update(cardId, draft, data.cards));
    },

    remove: (cardId: string) => {
      if (!eventId) {
        return Promise.reject(new Error('Aucun événement actif.'));
      }

      return mutate(() => useCase.remove(eventId, cardId));
    },

    move: (cardId: string, direction: FightCardMoveDirection) => {
      if (!eventId) {
        return Promise.reject(new Error('Aucun événement actif.'));
      }

      return mutate(() => useCase.move(eventId, cardId, direction));
    },

    syncConfirmed: () => {
      if (!eventId || !data) {
        return Promise.reject(new Error('Fight Card indisponible.'));
      }

      return mutate(() => useCase.syncConfirmed(eventId, data.cards));
    },
  };
}
