'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createFinanceUseCase } from '../factory';
import type {
  FinanceCategory,
  FinanceLedgerEntry,
  FinanceManualOperationDetails,
  FinanceOperationType,
  FinanceOwner,
  FinanceSnapshot,
} from '../types';
import {
  resolveFinanceOwnersForRole,
  resolveInitialFinanceOwner,
  resolveSelectedFinanceOwner,
} from '../owner-context';

function idempotencyKey(prefix: string) {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return `${prefix}:${crypto.randomUUID()}`;
  }

  return `${prefix}:${Date.now()}:${Math.random()
    .toString(36)
    .slice(2)}`;
}

function financeErrorMessage(
  cause: unknown,
): string {
  return cause instanceof Error
    ? cause.message
    : 'Erreur lors de l’opération financière.';
}

export interface SaveFinanceOperationInput {
  operationType: FinanceOperationType;
  amount: number;
  currencyCode?: string;
  categoryId?: string;
  categoryName: string;
  description: string;
  occurredAt?: string;
  reference?: string;
  paymentMethod?: string;
  counterpartyName?: string;
  notes?: string;
  receiptPath?: string;
}

export function useFinance(role: string) {
  const useCase = useMemo(
    () => createFinanceUseCase(role),
    [role],
  );

  const [owners, setOwners] =
    useState<FinanceOwner[]>([]);

  const [owner, setOwner] =
    useState<FinanceOwner | null>(null);

  const [snapshot, setSnapshot] =
    useState<FinanceSnapshot | null>(null);

  const [entries, setEntries] =
    useState<FinanceLedgerEntry[]>([]);

  const [categories, setCategories] =
    useState<FinanceCategory[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadOwnerData = useCallback(
    async (target: FinanceOwner) => {
      try {
        setLoading(true);
        setError(null);

        const [
          nextSnapshot,
          nextEntries,
          nextCategories,
        ] = await Promise.all([
          useCase.snapshot(target),
          useCase.entries(target),
          useCase.categories(target),
        ]);

        setSnapshot(nextSnapshot);
        setEntries(nextEntries);
        setCategories(nextCategories);
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Erreur de chargement des finances.',
        );
      } finally {
        setLoading(false);
      }
    },
    [useCase],
  );

  useEffect(() => {
    let active = true;

    void useCase
      .owners()
      .then((items) => {
        if (!active) return;

        const scopedOwners =
          resolveFinanceOwnersForRole(role, items);
        setOwners(scopedOwners);

        const selected =
          resolveInitialFinanceOwner(role, items);

        setOwner(selected ?? null);
      })
      .catch((cause) => {
        if (!active) return;

        setError(
          cause instanceof Error
            ? cause.message
            : 'Contexte financier indisponible.',
        );

        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [role, useCase]);

  useEffect(() => {
    if (!owner) return;

    // The selected server-authorized owner is the external context to load.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOwnerData(owner);
  }, [loadOwnerData, owner]);

  const refresh = useCallback(async () => {
    if (!owner) return;

    await loadOwnerData(owner);
  }, [loadOwnerData, owner]);

  const selectOwner = useCallback(
    (requestedKey: string) => {
      const selected = resolveSelectedFinanceOwner(
        role,
        owners,
        requestedKey,
      );

      if (selected) {
        setOwner(selected);
      }
    },
    [owners, role],
  );

  const getManualOperation = useCallback(
    async (
      operationId: string,
    ): Promise<FinanceManualOperationDetails | null> => {
      try {
        setError(null);

        if (!owner) {
          throw new Error('Contexte financier indisponible.');
        }

        return await useCase.manualOperation(
          owner,
          operationId,
        );
      } catch (cause) {
        setError(financeErrorMessage(cause));
        throw cause;
      }
    },
    [owner, useCase],
  );

  const createCategory = useCallback(
    async (
      operationType: FinanceOperationType,
      name: string,
    ) => {
      if (!owner) {
        throw new Error(
          'Contexte financier indisponible.',
        );
      }

      try {
        setSaving(true);
        setError(null);

        const id =
          await useCase.createCategory({
            owner,
            operationType,
            name,
          });

        const next =
          await useCase.categories(owner);

        setCategories(next);

        return id;
      } catch (cause) {
        setError(financeErrorMessage(cause));
        throw cause;
      } finally {
        setSaving(false);
      }
    },
    [owner, useCase],
  );

  const updateCategory = useCallback(
    async (
      categoryId: string,
      name: string,
    ) => {
      if (!owner) {
        throw new Error('Contexte financier indisponible.');
      }

      try {
        setSaving(true);

        await useCase.updateCategory({
          owner,
          categoryId,
          name,
        });

        setCategories(
          await useCase.categories(owner),
        );
      } finally {
        setSaving(false);
      }
    },
    [owner, useCase],
  );

  const archiveCategory = useCallback(
    async (categoryId: string) => {
      if (!owner) {
        throw new Error('Contexte financier indisponible.');
      }

      try {
        setSaving(true);

        await useCase.archiveCategory(
          owner,
          categoryId,
        );

        if (owner) {
          setCategories(
            await useCase.categories(owner),
          );
        }
      } finally {
        setSaving(false);
      }
    },
    [owner, useCase],
  );

  const saveOperation = useCallback(
    async (
      input: SaveFinanceOperationInput,
    ) => {
      if (!owner) {
        throw new Error(
          'Contexte financier indisponible.',
        );
      }

      try {
        setSaving(true);
        setError(null);

        await useCase.postManualOperation({
          owner,
          operationType:
            input.operationType,
          amount: input.amount,
          currencyCode:
            input.currencyCode ?? 'MGA',
          categoryId: input.categoryId,
          categoryName:
            input.categoryName,
          description:
            input.description,
          idempotencyKey:
            idempotencyKey(
              'manual-finance',
            ),
          occurredAt:
            input.occurredAt,
          reference:
            input.reference,
          paymentMethod:
            input.paymentMethod,
          counterpartyName:
            input.counterpartyName,
          notes:
            input.notes,
          receiptPath:
            input.receiptPath,
        });

        await loadOwnerData(owner);
      } catch (cause) {
        setError(financeErrorMessage(cause));
        throw cause;
      } finally {
        setSaving(false);
      }
    },
    [
      loadOwnerData,
      owner,
      useCase,
    ],
  );

  const reverseOperation = useCallback(
    async (
      operationId: string,
      reason?: string,
    ) => {
      if (!owner) return;

      try {
        setSaving(true);
        setError(null);

        await useCase.reverseManualOperation({
          owner,
          operationId,
          idempotencyKey:
            `manual-finance-reversal:${operationId}`,
          reason,
        });

        await loadOwnerData(owner);
      } catch (cause) {
        setError(financeErrorMessage(cause));
        throw cause;
      } finally {
        setSaving(false);
      }
    },
    [
      loadOwnerData,
      owner,
      useCase,
    ],
  );

  return {
    owners,
    owner,
    snapshot,
    entries,
    categories,
    loading,
    saving,
    error,
    selectOwner,
    getManualOperation,
    refresh,
    createCategory,
    updateCategory,
    archiveCategory,
    saveOperation,
    reverseOperation,
  };
}
