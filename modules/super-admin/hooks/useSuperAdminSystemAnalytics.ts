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
  makeCaptureSuperAdminSystemSnapshotUseCase,
  makeGetSuperAdminSystemAnalyticsUseCase,
  makeGetSuperAdminSystemHistoryUseCase,
} from "../factories/super-admin-system.factory";

import type {
  SuperAdminSystemAnalytics,
  SuperAdminSystemSnapshot,
} from "../system.types";

export function useSuperAdminSystemAnalytics() {

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
        makeGetSuperAdminSystemAnalyticsUseCase(),
      [],
    );


  const captureUseCase =
    useMemo(
      () =>
        makeCaptureSuperAdminSystemSnapshotUseCase(),
      [],
    );


  const historyUseCase =
    useMemo(
      () =>
        makeGetSuperAdminSystemHistoryUseCase(),
      [],
    );


  const [
    data,
    setData,
  ] =
    useState<SuperAdminSystemAnalytics | null>(
      null,
    );


  const [
    history,
    setHistory,
  ] =
    useState<SuperAdminSystemSnapshot[]>(
      [],
    );


  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );


  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );


  const [
    monitoringError,
    setMonitoringError,
  ] =
    useState<string | null>(
      null,
    );


  useEffect(
    () => {

      let mounted =
        true;


      async function load() {

        setLoading(
          true,
        );

        setError(
          null,
        );

        setMonitoringError(
          null,
        );


        try {

          const current =
            await analyticsUseCase.execute(
              from,
              to,
            );


          if (
            !mounted
          ) {
            return;
          }


          setData(
            current,
          );


          try {

            await captureUseCase.execute(
              days,
              current.rpcRoundTripMs,
            );


            const observations =
              await historyUseCase.execute(
                days,
                24,
              );


            if (
              mounted
            ) {

              setHistory(
                observations,
              );
            }

          } catch (
            reason
          ) {

            if (
              mounted
            ) {

              setMonitoringError(
                reason instanceof Error
                  ? reason.message
                  : "Impossible de conserver l’historique System Monitoring.",
              );
            }
          }

        } catch (
          reason
        ) {

          if (
            mounted
          ) {

            setError(
              reason instanceof Error
                ? reason.message
                : "Impossible de charger le System Monitoring.",
            );
          }

        } finally {

          if (
            mounted
          ) {

            setLoading(
              false,
            );
          }
        }
      }


      void load();


      return () => {

        mounted =
          false;
      };

    },
    [
      analyticsUseCase,
      captureUseCase,
      days,
      from,
      historyUseCase,
      refreshToken,
      to,
    ],
  );


  return {
    data,
    history,
    loading,
    error,
    monitoringError,
  };
}
