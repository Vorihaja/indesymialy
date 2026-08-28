"use client";

import {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  makeSaveSuperAdminPerformanceTargetsUseCase,
} from "../factories/super-admin-performance-target.factory";

import type {
  SuperAdminKpiTargetUpdate,
} from "../performance-target.types";

export function useSaveSuperAdminPerformanceTargets() {

  const useCase =
    useMemo(
      () =>
        makeSaveSuperAdminPerformanceTargetsUseCase(),
      [],
    );

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const save =
    useCallback(
      async (
        targets:
          SuperAdminKpiTargetUpdate[],
      ) => {

        setSaving(true);
        setError(null);

        try {

          return await useCase.execute(
            targets,
          );

        } catch (
          reason
        ) {

          const message =
            reason instanceof Error
              ? reason.message
              : "Impossible d’enregistrer les objectifs.";

          setError(
            message,
          );

          throw reason;

        } finally {

          setSaving(
            false,
          );

        }
      },
      [
        useCase,
      ],
    );

  return {
    save,
    saving,
    error,
  };
}
