"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  makeGetSuperAdminPermissionGovernanceUseCase,
  makeSaveSuperAdminPermissionGovernanceUseCase,
} from "../factories/super-admin-permissions.factory";

import type {
  SuperAdminPermissionGovernanceSnapshot,
} from "../permission-governance.types";


export function useSuperAdminPermissions() {

  const loadUseCase =
    useMemo(
      () =>
        makeGetSuperAdminPermissionGovernanceUseCase(),
      [],
    );


  const saveUseCase =
    useMemo(
      () =>
        makeSaveSuperAdminPermissionGovernanceUseCase(),
      [],
    );


  const [
    data,
    setData,
  ] =
    useState<
      SuperAdminPermissionGovernanceSnapshot | null
    >(
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
    mutationLoading,
    setMutationLoading,
  ] =
    useState(
      false,
    );


  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );


  const [
    message,
    setMessage,
  ] =
    useState<string | null>(
      null,
    );


  const load =
    useCallback(
      async () => {

        setLoading(
          true,
        );

        setError(
          null,
        );


        try {

          setData(
            await loadUseCase.execute(),
          );

        } catch (
          reason
        ) {

          setError(
            reason instanceof Error
              ? reason.message
              : "Gouvernance des permissions indisponible.",
          );

        } finally {

          setLoading(
            false,
          );
        }

      },
      [
        loadUseCase,
      ],
    );


  useEffect(
    () => {

      void load();

    },
    [
      load,
    ],
  );


  const savePermissions =
    useCallback(
      async (
        profileId: string,
        permissionCodes: string[],
        reason: string,
      ) => {

        setMutationLoading(
          true,
        );

        setError(
          null,
        );

        setMessage(
          null,
        );


        try {

          await saveUseCase.execute(
            profileId,
            permissionCodes,
            reason,
          );


          setData(
            await loadUseCase.execute(),
          );


          setMessage(
            "Matrice des permissions mise à jour et décision enregistrée dans Access Logs.",
          );


          return true;

        } catch (
          reason
        ) {

          setError(
            reason instanceof Error
              ? reason.message
              : "Impossible d’enregistrer les permissions.",
          );


          return false;

        } finally {

          setMutationLoading(
            false,
          );
        }

      },
      [
        loadUseCase,
        saveUseCase,
      ],
    );


  return {
    data,
    loading,
    mutationLoading,
    error,
    message,
    reload:
      load,
    savePermissions,
  };
}