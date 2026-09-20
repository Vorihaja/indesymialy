"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  createRefereeAssignmentsUseCase,
} from "../factories/referee-assignments.factory";
import type {
  RefereeAssignmentItem,
  RefereeAssignmentResponse,
} from "../types";

function errorMessage(
  reason: unknown,
) {
  if (reason instanceof Error) {
    return reason.message;
  }

  return "Une erreur est survenue pendant le chargement des désignations.";
}

export function useRefereeAssignments() {
  const useCase =
    useMemo(
      () =>
        createRefereeAssignmentsUseCase(),
      [],
    );

  const [
    items,
    setItems,
  ] =
    useState<
      RefereeAssignmentItem[]
    >([]);

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

  const [
    mutatingResponses,
    setMutatingResponses,
  ] = useState<
    Record<
      string,
      RefereeAssignmentResponse
    >
  >({});

  const mutatingKeysRef =
    useRef(new Set<string>());

  const load =
    useCallback(
      async (
        silent = false,
      ) => {
        if (!silent) {
          setLoading(true);
        }

        setError(null);

        try {
          setItems(
            await useCase.list(),
          );
        } catch (reason) {
          setError(
            errorMessage(reason),
          );
        } finally {
          if (!silent) {
            setLoading(false);
          }
        }
      },
      [useCase],
    );

  useEffect(() => {
    void load();
  }, [load]);

  const respond =
    useCallback(
      async (
        item:
          RefereeAssignmentItem,
        status:
          RefereeAssignmentResponse,
      ) => {
        if (
          mutatingKeysRef.current.has(
            item.key,
          )
        ) {
          return;
        }

        mutatingKeysRef.current.add(
          item.key,
        );

        setMutatingResponses(
          (current) => ({
            ...current,
            [item.key]: status,
          }),
        );

        setError(null);

        try {
          await useCase.respond({
            source: item.source,
            sourceId:
              item.sourceId,
            status,
          });

          await load(true);
        } catch (reason) {
          setError(
            errorMessage(reason),
          );
        } finally {
          mutatingKeysRef.current.delete(
            item.key,
          );

          setMutatingResponses(
            (current) => {
              const next = {
                ...current,
              };

              delete next[item.key];

              return next;
            },
          );
        }
      },
      [
        load,
        useCase,
      ],
    );

  return {
    items,
    loading,
    error,
    mutatingResponses,
    refresh: () =>
      load(false),
    respond,
  };
}
