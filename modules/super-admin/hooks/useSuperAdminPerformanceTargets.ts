"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useSuperAdminPeriod,
} from "../context/super-admin-period-context";

import {
  makeGetSuperAdminPerformanceTargetsUseCase,
} from "../factories/super-admin-performance-target.factory";

import type {
  SuperAdminKpiTargetConfiguration,
} from "../performance-target.types";

export function useSuperAdminPerformanceTargets() {

  const {
    refreshToken,
  } =
    useSuperAdminPeriod();

  const useCase =
    useMemo(
      () =>
        makeGetSuperAdminPerformanceTargetsUseCase(),
      [],
    );

  const [
    data,
    setData,
  ] =
    useState<SuperAdminKpiTargetConfiguration[]>(
      [],
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

  useEffect(() => {

    let mounted = true;

    setLoading(true);
    setError(null);

    void useCase
      .execute()
      .then(
        (result) => {

          if (mounted) {
            setData(
              result,
            );
          }
        },
      )
      .catch(
        (reason: unknown) => {

          if (!mounted) {
            return;
          }

          setError(
            reason instanceof Error
              ? reason.message
              : "Impossible de charger les objectifs KPI.",
          );
        },
      )
      .finally(
        () => {

          if (mounted) {
            setLoading(
              false,
            );
          }
        },
      );

    return () => {
      mounted = false;
    };

  }, [
    refreshToken,
    useCase,
  ]);

  return {
    data,
    loading,
    error,
  };
}
