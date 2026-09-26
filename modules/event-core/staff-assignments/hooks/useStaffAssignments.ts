"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  normalizeBackendError,
} from "@/shared/errors/backend-error";

import {
  createStaffAssignmentUseCase,
} from "../factories/staff-assignment.factory";
import type {
  StaffAssignmentRequest,
} from "../types";

export function useStaffAssignments() {
  const useCase = useMemo(
    () => createStaffAssignmentUseCase(),
    [],
  );

  const [items, setItems] =
    useState<StaffAssignmentRequest[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [mutatingResponses, setMutatingResponses] =
    useState<Record<string, boolean>>({});

  const refresh = useCallback(
    async () => {
      try {
        setLoading(true);
        setError(null);

        setItems(
          await useCase.listActionable(),
        );
      } catch (reason) {
        setError(
          normalizeBackendError(reason).message,
        );
      } finally {
        setLoading(false);
      }
    },
    [useCase],
  );

  useEffect(
    () => {
      queueMicrotask(
        () => {
          void refresh();
        },
      );
    },
    [refresh],
  );

  const respond = useCallback(
    async (
      item: StaffAssignmentRequest,
      accept: boolean,
    ) => {
      setMutatingResponses(
        (current) => ({
          ...current,
          [item.id]: true,
        }),
      );

      setError(null);

      try {
        await useCase.respond(
          item.id,
          accept,
        );

        setItems(
          (current) =>
            current.filter(
              (candidate) =>
                candidate.id !== item.id,
            ),
        );
      } catch (reason) {
        setError(
          normalizeBackendError(reason).message,
        );

        throw reason;
      } finally {
        setMutatingResponses(
          (current) => {
            const next = {
              ...current,
            };

            delete next[item.id];

            return next;
          },
        );
      }
    },
    [useCase],
  );

  return {
    items,
    loading,
    error,
    mutatingResponses,
    refresh,
    respond,
  };
}