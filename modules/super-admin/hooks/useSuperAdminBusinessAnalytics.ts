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
  makeGetSuperAdminBusinessAnalyticsUseCase,
} from "../factories/super-admin-business.factory";

import type {
  SuperAdminBusinessAnalytics,
} from "../business.types";

export function useSuperAdminBusinessAnalytics() {

  const {
    from,
    to,
    refreshToken,
  } =
    useSuperAdminPeriod();

  const useCase =
    useMemo(
      () =>
        makeGetSuperAdminBusinessAnalyticsUseCase(),
      [],
    );

  const [
    data,
    setData,
  ] =
    useState<SuperAdminBusinessAnalytics | null>(
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

  useEffect(() => {

    let mounted = true;

    setLoading(true);
    setError(null);

    void useCase
      .execute(
        from,
        to,
      )
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
              : "Impossible de charger les Analytics Business.",
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
    from,
    refreshToken,
    to,
    useCase,
  ]);

  return {
    data,
    loading,
    error,
  };
}
