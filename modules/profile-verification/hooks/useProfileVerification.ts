"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createProfileVerificationUseCase,
} from "../factories/profile-verification.factory";

import type {
  VerificationDetails,
  VerificationRequest,
} from "../types";

export function useProfileVerification(
  subjectType?: VerificationDetails["subjectType"],
  organizationId?: string | null,
) {
  const useCase =
    useMemo(
      () =>
        createProfileVerificationUseCase(),
      [],
    );

  const [
    data,
    setData,
  ] =
    useState<VerificationRequest | null>(
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

          const request =
            await useCase.execute(
              subjectType,
              organizationId,
            );

          setData(
            request,
          );

          setError(
            null,
          );
        }
        catch (reason) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Dossier indisponible.",
          );
        }
        finally {
          setLoading(false);
        }
      },
      [
        organizationId,
        subjectType,
        useCase,
      ],
    );

  useEffect(() => {
    void refresh();
  }, [
    refresh,
  ]);

  async function run<T>(
    action: () => Promise<T>,
  ) {
    setMutating(
      true,
    );

    setError(
      null,
    );

    try {
      const result =
        await action();

      await refresh();

      return result;
    }
    catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "L’opération a échoué.",
      );

      throw reason;
    }
    finally {
      setMutating(
        false,
      );
    }
  }

  return {
    data,
    loading,
    mutating,
    error,
    refresh,

    save:
      (
        details:
          VerificationDetails,
      ) =>
        run(
          () =>
            useCase.save(
              details,
            ),
        ),

    upload:
      (
        requestId: string,
        type: string,
        file: File,
        expiresAt?: string,
      ) =>
        run(
          () =>
            useCase.upload(
              requestId,
              type,
              file,
              expiresAt,
            ),
        ),

    submit:
      (
        requestId: string,
      ) =>
        run(
          () =>
            useCase.submit(
              requestId,
            ),
        ),
  };
}