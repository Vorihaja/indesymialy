"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  makeGetSuperAdminAnalyticsUseCase,
} from "../factories/super-admin.factory";

import {
  useSuperAdminPeriod,
} from "../context/super-admin-period-context";

import type {
  SuperAdminAnalyticsSnapshot,
} from "../types";

export function useSuperAdminAnalytics() {
  const {
    from,
    to,
    refreshToken,
  } = useSuperAdminPeriod();

  const useCase = useMemo(
    () => makeGetSuperAdminAnalyticsUseCase(),
    [],
  );

  const [
    data,
    setData,
  ] = useState<SuperAdminAnalyticsSnapshot | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);

    void useCase
      .execute(from, to)
      .then((result) => {
        if (active) {
          setData(result);
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Erreur Analytics inconnue.",
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [
    from,
    to,
    refreshToken,
    useCase,
  ]);

  return {
    data,
    loading,
    error,
  };
}
