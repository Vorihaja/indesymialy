"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  makeGetSuperAdminAdministratorsUseCase,
  makeManageSuperAdminAdministratorUseCase,
  makeSearchSuperAdminAdministratorCandidatesUseCase,
} from "../factories/super-admin-administrators.factory";

import type {
  AdministratorGovernanceCandidate,
  AdministratorGovernancePermission,
  AdministratorGovernanceRecord,
} from "../administrator-governance.types";


export function useSuperAdminAdministrators() {

  const loadUseCase =
    useMemo(
      () =>
        makeGetSuperAdminAdministratorsUseCase(),
      [],
    );


  const searchUseCase =
    useMemo(
      () =>
        makeSearchSuperAdminAdministratorCandidatesUseCase(),
      [],
    );


  const manageUseCase =
    useMemo(
      () =>
        makeManageSuperAdminAdministratorUseCase(),
      [],
    );


  const [
    administrators,
    setAdministrators,
  ] =
    useState<
      AdministratorGovernanceRecord[]
    >(
      [],
    );


  const [
    permissions,
    setPermissions,
  ] =
    useState<
      AdministratorGovernancePermission[]
    >(
      [],
    );


  const [
    candidates,
    setCandidates,
  ] =
    useState<
      AdministratorGovernanceCandidate[]
    >(
      [],
    );


  const [
    lastQuery,
    setLastQuery,
  ] =
    useState(
      "",
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

          const result =
            await loadUseCase.execute();


          setAdministrators(
            result.administrators,
          );


          setPermissions(
            result.permissions,
          );

        } catch (
          reason
        ) {

          setError(
            reason instanceof Error
              ? reason.message
              : "Gouvernance des administrateurs indisponible.",
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


  const search =
    useCallback(
      async (
        query: string,
      ) => {

        const normalized =
          query.trim();


        setLastQuery(
          normalized,
        );

        setError(
          null,
        );


        if (
          normalized.length <
          2
        ) {

          setCandidates(
            [],
          );

          return;
        }


        try {

          setCandidates(
            await searchUseCase.execute(
              normalized,
            ),
          );

        } catch (
          reason
        ) {

          setError(
            reason instanceof Error
              ? reason.message
              : "Recherche impossible.",
          );
        }

      },
      [
        searchUseCase,
      ],
    );


  const refreshAfterMutation =
    useCallback(
      async () => {

        const result =
          await loadUseCase.execute();


        setAdministrators(
          result.administrators,
        );


        setPermissions(
          result.permissions,
        );


        if (
          lastQuery.length >=
          2
        ) {

          setCandidates(
            await searchUseCase.execute(
              lastQuery,
            ),
          );
        }

      },
      [
        lastQuery,
        loadUseCase,
        searchUseCase,
      ],
    );


  const mutate =
    useCallback(
      async (
        operation:
          () => Promise<unknown>,

        successMessage:
          string,
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

          await operation();

          await refreshAfterMutation();

          setMessage(
            successMessage,
          );

          return true;

        } catch (
          reason
        ) {

          setError(
            reason instanceof Error
              ? reason.message
              : "Modification de gouvernance impossible.",
          );

          return false;

        } finally {

          setMutationLoading(
            false,
          );
        }

      },
      [
        refreshAfterMutation,
      ],
    );


  const grant =
    useCallback(
      (
        profileId: string,
        reason: string,
      ) =>
        mutate(
          () =>
            manageUseCase.grant(
              profileId,
              reason,
            ),

          "Accès Administrateur accordé.",
        ),
      [
        manageUseCase,
        mutate,
      ],
    );


  const suspend =
    useCallback(
      (
        profileId: string,
        reason: string,
      ) =>
        mutate(
          () =>
            manageUseCase.suspend(
              profileId,
              reason,
            ),

          "Administrateur suspendu.",
        ),
      [
        manageUseCase,
        mutate,
      ],
    );


  const reactivate =
    useCallback(
      (
        profileId: string,
        reason: string,
      ) =>
        mutate(
          () =>
            manageUseCase.reactivate(
              profileId,
              reason,
            ),

          "Administrateur réactivé.",
        ),
      [
        manageUseCase,
        mutate,
      ],
    );


  const revoke =
    useCallback(
      (
        profileId: string,
        reason: string,
      ) =>
        mutate(
          () =>
            manageUseCase.revoke(
              profileId,
              reason,
            ),

          "Accès Administrateur révoqué.",
        ),
      [
        manageUseCase,
        mutate,
      ],
    );


  const savePermissions =
    useCallback(
      (
        profileId: string,
        permissionCodes: string[],
        reason: string,
      ) =>
        mutate(
          () =>
            manageUseCase.setPermissions(
              profileId,
              permissionCodes,
              reason,
            ),

          "Permissions Administrateur enregistrées.",
        ),
      [
        manageUseCase,
        mutate,
      ],
    );


  return {
    administrators,
    permissions,
    candidates,

    loading,
    mutationLoading,

    error,
    message,

    load,
    search,
    grant,
    suspend,
    reactivate,
    revoke,
    savePermissions,
  };
}