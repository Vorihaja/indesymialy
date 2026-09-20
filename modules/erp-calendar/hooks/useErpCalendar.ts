"use client";

import {
  useCallback,
  useRef,
  useState,
} from "react";

import { createErpCalendarUseCase } from "../factories/erp-calendar.factory";

import type {
  ErpCalendarCreateInput,
  ErpCalendarItem,
  ErpCalendarUpdateInput,
} from "../types";

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Une erreur calendrier est survenue.";
}

export function useErpCalendar() {
  const useCaseRef = useRef(
    createErpCalendarUseCase(),
  );

  const rangeRef = useRef<{
    from?: string;
    to?: string;
  }>({});

  const [items, setItems] =
    useState<ErpCalendarItem[]>([]);

  const [isLoading, setIsLoading] =
    useState(false);

  const [isMutating, setIsMutating] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(
    async (
      from?: string,
      to?: string,
    ): Promise<void> => {
      if (from !== undefined || to !== undefined) {
        rangeRef.current = { from, to };
      }

      setIsLoading(true);
      setError(null);

      try {
        setItems(
          await useCaseRef.current.list(
            rangeRef.current.from,
            rangeRef.current.to,
          ),
        );
      } catch (loadError) {
        setError(errorMessage(loadError));
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const create = useCallback(
    async (
      input: ErpCalendarCreateInput,
    ): Promise<void> => {
      setIsMutating(true);
      setError(null);

      try {
        await useCaseRef.current.create(input);
        await load();
      } catch (actionError) {
        setError(errorMessage(actionError));
        throw actionError;
      } finally {
        setIsMutating(false);
      }
    },
    [load],
  );

  const update = useCallback(
    async (
      input: ErpCalendarUpdateInput,
    ): Promise<void> => {
      setIsMutating(true);
      setError(null);

      try {
        await useCaseRef.current.update(input);
        await load();
      } catch (actionError) {
        setError(errorMessage(actionError));
        throw actionError;
      } finally {
        setIsMutating(false);
      }
    },
    [load],
  );

  const archive = useCallback(
    async (id: string): Promise<void> => {
      setIsMutating(true);
      setError(null);

      try {
        await useCaseRef.current.archive(id);
        await load();
      } catch (actionError) {
        setError(errorMessage(actionError));
        throw actionError;
      } finally {
        setIsMutating(false);
      }
    },
    [load],
  );

  return {
    items,
    isLoading,
    isMutating,
    error,
    load,
    create,
    update,
    archive,
  };
}
