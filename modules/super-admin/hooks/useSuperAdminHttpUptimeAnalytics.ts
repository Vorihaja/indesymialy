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
  makeGetSuperAdminHttpUptimeAnalyticsUseCase,
} from "../factories/super-admin-http-uptime.factory";

import type {
  SuperAdminHttpUptimeAnalytics,
} from "../http-uptime.types";


export function useSuperAdminHttpUptimeAnalytics() {

  const {
    from,
    to,
    refreshToken,
  } =
    useSuperAdminPeriod();


  const useCase =
    useMemo(
      () =>
        makeGetSuperAdminHttpUptimeAnalyticsUseCase(),
      [],
    );


  const [
    data,
    setData,
  ] =
    useState<SuperAdminHttpUptimeAnalytics | null>(
      null,
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


        try {

          const result =
            await useCase.execute(
              from,
              to,
            );


          if (mounted) {
            setData(
              result,
            );
          }

        } catch (
          reason
        ) {

          if (mounted) {
            setError(
              reason instanceof Error
                ? reason.message
                : "Monitoring HTTP indisponible.",
            );
          }

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
        mounted =
          false;
      };

    },
    [
      from,
      refreshToken,
      to,
      useCase,
    ],
  );


  return {
    data,
    loading,
    error,
  };
}