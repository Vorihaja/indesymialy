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
  makeGetSuperAdminPerformanceAnalyticsUseCase,
} from "../factories/super-admin-performance.factory";

import {
  makeCaptureSuperAdminPerformanceSnapshotUseCase,
  makeGetSuperAdminPerformanceHistoryUseCase,
} from "../factories/super-admin-performance-monitor.factory";

import type {
  SuperAdminPerformanceAnalytics,
} from "../performance.types";

import type {
  SuperAdminPerformanceSnapshot,
} from "../performance-monitoring.types";

export function useSuperAdminPerformanceMonitoring(
  current:
    SuperAdminPerformanceAnalytics | null,
) {

  const {
    days,
    from,
    to,
    refreshToken,
  } =
    useSuperAdminPeriod();


  const analyticsUseCase =
    useMemo(
      () =>
        makeGetSuperAdminPerformanceAnalyticsUseCase(),
      [],
    );


  const captureUseCase =
    useMemo(
      () =>
        makeCaptureSuperAdminPerformanceSnapshotUseCase(),
      [],
    );


  const historyUseCase =
    useMemo(
      () =>
        makeGetSuperAdminPerformanceHistoryUseCase(),
      [],
    );


  const [
    previous,
    setPrevious,
  ] =
    useState<SuperAdminPerformanceAnalytics | null>(
      null,
    );


  const [
    history,
    setHistory,
  ] =
    useState<SuperAdminPerformanceSnapshot[]>(
      [],
    );


  const [
    loading,
    setLoading,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );


  useEffect(() => {

    if (!current) {
      return;
    }


    let mounted = true;


    async function load() {

      setLoading(
        true,
      );

      setError(
        null,
      );


      try {

        const duration =
          to.getTime() -
          from.getTime();


        const previousTo =
          new Date(
            from,
          );


        const previousFrom =
          new Date(
            previousTo.getTime() -
            duration,
          );


        const previousData =
          await analyticsUseCase.execute(
            previousFrom,
            previousTo,
          );


        if (mounted) {
          setPrevious(
            previousData,
          );
        }


        await captureUseCase.execute(
          days,
        );


        const historyData =
          await historyUseCase.execute(
            days,
            12,
          );


        if (mounted) {
          setHistory(
            historyData,
          );
        }

      } catch (
        reason
      ) {

        if (!mounted) {
          return;
        }


        setError(
          reason instanceof Error
            ? reason.message
            : "Impossible de charger les tendances de performance.",
        );

      } finally {

        if (mounted) {
          setLoading(
            false,
          );
        }

      }
    }


    void load();


    return () => {
      mounted = false;
    };

  }, [
    analyticsUseCase,
    captureUseCase,
    current,
    days,
    from,
    historyUseCase,
    refreshToken,
    to,
  ]);


  return {
    previous,
    history,
    loading,
    error,
  };
}
