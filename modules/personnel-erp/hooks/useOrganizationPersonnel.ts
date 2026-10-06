"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createOrganizationPersonnelUseCase,
} from "../factories/organization-personnel.factory";

import type {
  OrganizationPersonnelSnapshot,
} from "../organization-personnel.types";

function errorMessage(
  error: unknown,
) {
  return error instanceof Error
    ? error.message
    : "Impossible de charger le personnel.";
}

export function useOrganizationPersonnel() {
  const useCase =
    useMemo(
      () =>
        createOrganizationPersonnelUseCase(),
      [],
    );

  const [
    snapshot,
    setSnapshot,
  ] =
    useState<OrganizationPersonnelSnapshot | null>(
      null,
    );

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

  const refresh =
    useCallback(
      async () => {
        setLoading(
          true,
        );

        setError(
          null,
        );

        try {
          const next =
            await useCase.execute();

          setSnapshot(
            next,
          );
        } catch (caught) {
          setError(
            errorMessage(
              caught,
            ),
          );
        } finally {
          setLoading(
            false,
          );
        }
      },
      [
        useCase,
      ],
    );

  useEffect(
    () => {
      let cancelled =
        false;

      void useCase
        .execute()
        .then(
          (next) => {
            if (
              !cancelled
            ) {
              setSnapshot(
                next,
              );
            }
          },
        )
        .catch(
          (caught) => {
            if (
              !cancelled
            ) {
              setError(
                errorMessage(
                  caught,
                ),
              );
            }
          },
        )
        .finally(
          () => {
            if (
              !cancelled
            ) {
              setLoading(
                false,
              );
            }
          },
        );

      return () => {
        cancelled =
          true;
      };
    },
    [
      useCase,
    ],
  );

  return {
    snapshot,
    loading,
    error,
    refresh,
  };
}
