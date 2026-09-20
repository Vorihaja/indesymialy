"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createSellerAgendaUseCase,
} from "../factories/seller-agenda.factory";

import type {
  AgendaManualStatus,
  SellerAgendaItemInput,
  SellerAgendaSnapshot,
} from "../types";

function createRange() {
  const now =
    new Date();

  const from =
    new Date(now);

  from.setDate(
    from.getDate() -
      90,
  );

  const to =
    new Date(now);

  to.setDate(
    to.getDate() +
      365,
  );

  return {
    from:
      from.toISOString(),

    to:
      to.toISOString(),
  };
}

export function useSellerAgenda() {
  const useCase =
    useMemo(
      () =>
        createSellerAgendaUseCase(),
      [],
    );

  const range =
    useMemo(
      createRange,
      [],
    );

  const [
    snapshot,
    setSnapshot,
  ] =
    useState<SellerAgendaSnapshot | null>(
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
    useState<string | null>(null);

  const refresh =
    useCallback(
      async () => {
        setLoading(true);
        setError(null);

        try {
          const result =
            await useCase.snapshot(
              range.from,
              range.to,
            );

          setSnapshot(
            result,
          );

          return result;
        }
        catch (cause) {
          const message =
            cause instanceof Error
              ? cause.message
              : "Agenda indisponible.";

          setError(
            message,
          );

          throw cause;
        }
        finally {
          setLoading(false);
        }
      },
      [
        range.from,
        range.to,
        useCase,
      ],
    );

  useEffect(() => {
    void refresh().catch(
      () => undefined,
    );
  }, [refresh]);

  const run =
    async <T,>(
      action:
        () => Promise<T>,
    ) => {
      setMutating(true);
      setError(null);

      try {
        const result =
          await action();

        await refresh();

        return result;
      }
      catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Opération Agenda impossible.",
        );

        throw cause;
      }
      finally {
        setMutating(false);
      }
    };

  return {
    snapshot,

    items:
      snapshot?.items ?? [],

    loading,
    mutating,
    error,
    refresh,

    save:
      (
        input:
          SellerAgendaItemInput,
      ) =>
        run(
          () =>
            useCase.save(
              input,
            ),
        ),

    setStatus:
      (
        id: string,
        status:
          AgendaManualStatus,
      ) =>
        run(
          () =>
            useCase.setStatus(
              id,
              status,
            ),
        ),
  };
}