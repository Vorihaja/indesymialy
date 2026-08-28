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
  makeGetSuperAdminMarketplaceAnalyticsUseCase,
} from "../factories/super-admin-marketplace.factory";

import type {
  SuperAdminMarketplaceAnalytics,
} from "../marketplace.types";

export function useSuperAdminMarketplaceAnalytics() {

  const {
    from,
    to,
    refreshToken,
  } = useSuperAdminPeriod();

  const useCase =
    useMemo(
      () =>
        makeGetSuperAdminMarketplaceAnalyticsUseCase(),
      [],
    );

  const [
    data,
    setData,
  ] =
    useState<SuperAdminMarketplaceAnalytics | null>(
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
              : "Impossible de charger les Analytics Marketplace.",
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
