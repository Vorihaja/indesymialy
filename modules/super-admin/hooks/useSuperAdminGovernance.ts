"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  makeSuperAdminGovernanceUseCase,
} from "../factories/super-admin.factory";

import type {
  SuperAdminAccessLog,
  SuperAdminAdministrator,
  SuperAdminPermission,
  SuperAdminProfileCandidate,
} from "../types";

export function useSuperAdminGovernance() {
  const useCase = useMemo(
    () => makeSuperAdminGovernanceUseCase(),
    [],
  );

  const [
    administrators,
    setAdministrators,
  ] = useState<SuperAdminAdministrator[]>([]);

  const [
    permissions,
    setPermissions,
  ] = useState<SuperAdminPermission[]>([]);

  const [
    logs,
    setLogs,
  ] = useState<SuperAdminAccessLog[]>([]);

  const [
    candidates,
    setCandidates,
  ] = useState<SuperAdminProfileCandidate[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    mutationLoading,
    setMutationLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        adminRows,
        permissionRows,
        logRows,
      ] = await Promise.all([
        useCase.listAdministrators(),
        useCase.listPermissionCatalog(),
        useCase.listAccessLogs(),
      ]);

      setAdministrators(adminRows);
      setPermissions(permissionRows);
      setLogs(logRows);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Erreur de gouvernance inconnue.",
      );
    } finally {
      setLoading(false);
    }
  }, [useCase]);

  useEffect(() => {
    void load();
  }, [load]);

  const searchProfiles = useCallback(
    async (query: string) => {
      try {
        setError(null);

        const rows =
          await useCase.searchProfiles(query);

        setCandidates(rows);
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "Recherche impossible.",
        );
      }
    },
    [useCase],
  );

  const setAdminRole = useCallback(
    async (
      profileId: string,
      enabled: boolean,
    ) => {
      try {
        setMutationLoading(true);
        setError(null);

        await useCase.setAdminRole(
          profileId,
          enabled,
        );

        await load();
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "Modification impossible.",
        );

        throw reason;
      } finally {
        setMutationLoading(false);
      }
    },
    [
      load,
      useCase,
    ],
  );

  const setAdminPermissions = useCallback(
    async (
      profileId: string,
      codes: string[],
    ) => {
      try {
        setMutationLoading(true);
        setError(null);

        await useCase.setAdminPermissions(
          profileId,
          codes,
        );

        await load();
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "Modification des permissions impossible.",
        );

        throw reason;
      } finally {
        setMutationLoading(false);
      }
    },
    [
      load,
      useCase,
    ],
  );

  return {
    administrators,
    permissions,
    logs,
    candidates,
    loading,
    mutationLoading,
    error,
    reload: load,
    searchProfiles,
    setAdminRole,
    setAdminPermissions,
  };
}
