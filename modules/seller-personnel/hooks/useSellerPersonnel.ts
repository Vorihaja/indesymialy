"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createSellerPersonnelUseCase,
} from "../factories/seller-personnel.factory";

import type {
  PersonnelAssignmentInput,
  PersonnelDocumentInput,
  PersonnelLeaveInput,
  PersonnelProfileInput,
  SellerPersonnelSnapshot,
} from "../types";

export function useSellerPersonnel() {
  const useCase =
    useMemo(
      () =>
        createSellerPersonnelUseCase(),
      [],
    );

  const [
    data,
    setData,
  ] =
    useState<SellerPersonnelSnapshot | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    mutating,
    setMutating,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const refresh =
    useCallback(
      async () => {
        try {
          setLoading(true);

          setData(
            await useCase.execute(),
          );

          setError(null);
        }
        catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Personnel indisponible.",
          );
        }
        finally {
          setLoading(false);
        }
      },
      [
        useCase,
      ],
    );

  useEffect(
    () => {
      void refresh();
    },
    [
      refresh,
    ],
  );

  const run =
    useCallback(
      async (
        operation: () => Promise<void>,
      ) => {
        try {
          setMutating(true);
          setError(null);

          await operation();
          await refresh();
        }
        catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Opération impossible.",
          );

          throw cause;
        }
        finally {
          setMutating(false);
        }
      },
      [
        refresh,
      ],
    );

  return {
    data,
    loading,
    mutating,
    error,
    refresh,

    saveProfile:
      (
        input: PersonnelProfileInput,
      ) =>
        run(
          () =>
            useCase.saveProfile(
              input,
            ),
        ),

    setAccess:
      (
        profileId: string,
        active: boolean,
      ) =>
        run(
          () =>
            useCase.setAccess(
              profileId,
              active,
            ),
        ),

    invite:
      (
        identifier: string,
        role: string,
      ) =>
        run(
          () =>
            useCase.invite(
              identifier,
              role,
            ),
        ),

    revokeInvitation:
      (
        id: string,
      ) =>
        run(
          () =>
            useCase.revokeInvitation(
              id,
            ),
        ),

    saveInternalRole:
      (
        id: string | null,
        label: string,
        permissions: string[],
        active: boolean,
      ) =>
        run(
          () =>
            useCase.saveInternalRole(
              id,
              label,
              permissions,
              active,
            ),
        ),

    setInternalRoleMembers:
      (
        roleId: string,
        profileIds: string[],
      ) =>
        run(
          () =>
            useCase.setInternalRoleMembers(
              roleId,
              profileIds,
            ),
        ),

    saveAssignment:
      (
        input: PersonnelAssignmentInput,
      ) =>
        run(
          () =>
            useCase.saveAssignment(
              input,
            ),
        ),

    markAttendance:
      (
        profileId: string,
        workDate: string,
        action:
          | "check_in"
          | "check_out",
      ) =>
        run(
          () =>
            useCase.markAttendance(
              profileId,
              workDate,
              action,
            ),
        ),

    saveLeave:
      (
        input: PersonnelLeaveInput,
      ) =>
        run(
          () =>
            useCase.saveLeave(
              input,
            ),
        ),

    decideLeave:
      (
        id: string,
        status:
          | "approved"
          | "declined"
          | "cancelled",
      ) =>
        run(
          () =>
            useCase.decideLeave(
              id,
              status,
            ),
        ),

    addDocument:
      (
        input: PersonnelDocumentInput,
        file: File,
      ) => {
        if (!data) {
          return Promise.reject(
            new Error(
              "Organisation vendeuse introuvable.",
            ),
          );
        }

        return run(
          () =>
            useCase.addDocument(
              data.organizationId,
              input,
              file,
            ),
        );
      },

    documentUrl:
      (
        path: string,
      ) =>
        useCase.documentUrl(
          path,
        ),

    archiveDocument:
      (
        id: string,
      ) =>
        run(
          () =>
            useCase.archiveDocument(
              id,
            ),
        ),
  };
}