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
  makeGetSuperAdminAuthObservabilityUseCase,
} from "../factories/super-admin-auth-observability.factory";

import type {
  SuperAdminAuthObservability,
} from "../auth-observability.types";


export function useSuperAdminAuthObservability() {

  const {
    from,
    to,
    refreshToken,
  } =
    useSuperAdminPeriod();


  const useCase =
    useMemo(
      () =>
        makeGetSuperAdminAuthObservabilityUseCase(),
      [],
    );


  const [
    data,
    setData,
  ] =
    useState<SuperAdminAuthObservability | null>(
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
                : "Auth Observability indisponible.",
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