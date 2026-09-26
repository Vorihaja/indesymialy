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
  createOrganizationInvitationUseCase,
} from "../factories/organization-invitation.factory";
import type {
  OrganizationInvitation,
} from "../types";

export function useOrganizationInvitations() {
  const useCase = useMemo(
    () => createOrganizationInvitationUseCase(),
    [],
  );

  const [items, setItems] =
    useState<OrganizationInvitation[]>([]);

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
          await useCase.listPending(),
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
      item: OrganizationInvitation,
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