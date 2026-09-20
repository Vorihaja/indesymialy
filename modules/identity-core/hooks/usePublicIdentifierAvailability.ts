"use client";


import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createPublicIdentifierAvailabilityUseCase,
} from "../factories/public-identifier.factory";

import {
  normalizePublicIdentifier,
  publicIdentifierMessage,
  type PublicIdentifierAvailability,
} from "../public-identifier.types";


export interface UsePublicIdentifierAvailabilityResult {

  normalizedIdentifier:
    string;

  checking:
    boolean;

  result:
    PublicIdentifierAvailability |
    null;

  message:
    string |
    null;

  available:
    boolean |
    null;

  error:
    string |
    null;

  check:
    (
      identifier?: string,
    ) =>
      Promise<
        PublicIdentifierAvailability |
        null
      >;
}


export function usePublicIdentifierAvailability(
  identifier: string,
  options?: {
    enabled?: boolean;
    debounceMs?: number;
  },
): UsePublicIdentifierAvailabilityResult {

  const enabled =
    options?.enabled ??
    true;

  const debounceMs =
    options?.debounceMs ??
    350;


  const useCase =
    useMemo(
      () =>
        createPublicIdentifierAvailabilityUseCase(),
      [],
    );


  const normalizedIdentifier =
    useMemo(
      () =>
        normalizePublicIdentifier(
          identifier,
        ),
      [
        identifier,
      ],
    );


  const [
    result,
    setResult,
  ] =
    useState<
      PublicIdentifierAvailability |
      null
    >(
      null,
    );


  const [
    checking,
    setChecking,
  ] =
    useState(
      false,
    );


  const [
    error,
    setError,
  ] =
    useState<
      string |
      null
    >(
      null,
    );


  const check =
    useCallback(
      async (
        requestedIdentifier?:
          string,
      ) => {

        const value =
          normalizePublicIdentifier(
            requestedIdentifier ??
            normalizedIdentifier,
          );


        if (
          !enabled ||
          !value
        ) {

          setResult(
            null,
          );

          setError(
            null,
          );

          setChecking(
            false,
          );

          return null;
        }


        setChecking(
          true,
        );

        setError(
          null,
        );


        try {

          const next =
            await useCase.execute(
              value,
            );


          setResult(
            next,
          );


          return next;

        } catch (reason) {

          const nextError =
            reason instanceof Error
              ? reason.message
              : "Impossible de vérifier cet identifiant.";


          setResult(
            null,
          );

          setError(
            nextError,
          );


          return null;

        } finally {

          setChecking(
            false,
          );
        }
      },
      [
        enabled,
        normalizedIdentifier,
        useCase,
      ],
    );


  useEffect(
    () => {

      if (
        !enabled ||
        !normalizedIdentifier
      ) {

        setResult(
          null,
        );

        setError(
          null,
        );

        setChecking(
          false,
        );

        return;
      }


      let active =
        true;


      setChecking(
        true,
      );


      const timer =
        window.setTimeout(
          () => {

            void useCase
              .execute(
                normalizedIdentifier,
              )
              .then(
                (next) => {

                  if (!active) {
                    return;
                  }


                  setResult(
                    next,
                  );

                  setError(
                    null,
                  );
                },
              )
              .catch(
                (reason: unknown) => {

                  if (!active) {
                    return;
                  }


                  setResult(
                    null,
                  );

                  setError(
                    reason instanceof Error
                      ? reason.message
                      : "Impossible de vérifier cet identifiant.",
                  );
                },
              )
              .finally(
                () => {

                  if (active) {

                    setChecking(
                      false,
                    );
                  }
                },
              );
          },
          debounceMs,
        );


      return () => {

        active =
          false;


        window.clearTimeout(
          timer,
        );
      };
    },
    [
      debounceMs,
      enabled,
      normalizedIdentifier,
      useCase,
    ],
  );


  return {
    normalizedIdentifier,

    checking,

    result,

    message:
      error ??
      publicIdentifierMessage(
        result,
      ),

    available:
      result
        ? result.available
        : null,

    error,

    check,
  };
}