"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import {
  EMPTY_AUTH_SNAPSHOT,
  loadAuthSnapshot,
  type AuthSnapshot,
} from "@/modules/auth/session";
import { createIdentityUseCase } from "@/modules/identity-core/factories/identity.factory";
import { AuthContext } from "./auth-context";

type Props = {
  children: ReactNode;
};

export default function AuthProvider({
  children,
}: Props) {
  const supabase = useMemo(
    () => createSupabaseBrowserClient(),
    [],
  );
  const identityUseCase = useMemo(
    () => createIdentityUseCase(),
    [],
  );
  const [snapshot, setSnapshot] =
    useState<AuthSnapshot>(
      EMPTY_AUTH_SNAPSHOT,
    );
  const [loading, setLoading] =
    useState(true);
  const requestRef = useRef(0);
  const mountedRef = useRef(true);
  const refreshInFlightRef =
    useRef<Promise<AuthSnapshot> | null>(
      null,
    );
  const refreshQueuedRef =
    useRef(false);
  const synchronizationTimerRef =
    useRef<number | null>(null);

  const refreshUser = useCallback(
    (): Promise<AuthSnapshot> => {
      const inFlight =
        refreshInFlightRef.current;

      if (inFlight) {
        return inFlight;
      }

      const request =
        ++requestRef.current;

      if (mountedRef.current) {
        setLoading(true);
      }

      const operation =
        (async (): Promise<AuthSnapshot> => {
          try {
            let next =
              await loadAuthSnapshot(
                supabase,
              );

            if (
              next.user?.user_metadata
                ?.profile_setup_pending ===
              "true"
            ) {
              try {
                await identityUseCase
                  .resumeRegistration();

                next =
                  await loadAuthSnapshot(
                    supabase,
                  );
              } catch (error) {
                console.error(
                  "[Auth] Impossible de finaliser l’inscription. Une nouvelle tentative sera effectuée.",
                  error,
                );
              }
            }

            if (
              !mountedRef.current ||
              request !== requestRef.current
            ) {
              return next;
            }

            setSnapshot(next);

            return next;
          } catch (error) {
            if (
              !mountedRef.current ||
              request !== requestRef.current
            ) {
              return EMPTY_AUTH_SNAPSHOT;
            }

            setSnapshot(
              EMPTY_AUTH_SNAPSHOT,
            );

            throw error;
          } finally {
            if (
              mountedRef.current &&
              request === requestRef.current
            ) {
              setLoading(false);
            }
          }
        })();

      refreshInFlightRef.current =
        operation;

      const clearInFlight = () => {
        if (
          refreshInFlightRef.current ===
          operation
        ) {
          refreshInFlightRef.current =
            null;
        }
      };

      void operation.then(
        clearInFlight,
        clearInFlight,
      );

      return operation;
    },
    [identityUseCase, supabase],
  );

  useEffect(() => {
    mountedRef.current = true;

    const reportSynchronizationError = (
      error: unknown,
    ) => {
      if (!mountedRef.current) {
        return;
      }

      console.error(
        "[Auth] Impossible de synchroniser la session.",
        error,
      );
    };

    const runQueuedRefresh = () => {
      if (
        !mountedRef.current ||
        !refreshQueuedRef.current
      ) {
        return;
      }

      refreshQueuedRef.current = false;

      void refreshUser().catch(
        reportSynchronizationError,
      );
    };

    const synchronizeSession = () => {
      if (!mountedRef.current) {
        return;
      }

      const inFlight =
        refreshInFlightRef.current;

      if (inFlight) {
        refreshQueuedRef.current = true;

        void inFlight.then(
          runQueuedRefresh,
          runQueuedRefresh,
        );

        return;
      }

      void refreshUser().catch(
        reportSynchronizationError,
      );
    };

    const deferSynchronization = () => {
      if (
        synchronizationTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          synchronizationTimerRef.current,
        );
      }

      synchronizationTimerRef.current =
        window.setTimeout(() => {
          synchronizationTimerRef.current =
            null;

          synchronizeSession();
        }, 0);
    };

    const {
      data: {
        subscription,
      },
    } = supabase.auth
      .onAuthStateChange(
        (event, session) => {
          if (
            event === "SIGNED_OUT" ||
            session === null
          ) {
            requestRef.current += 1;
            refreshQueuedRef.current =
              false;

            if (
              synchronizationTimerRef.current !==
              null
            ) {
              window.clearTimeout(
                synchronizationTimerRef.current,
              );

              synchronizationTimerRef.current =
                null;
            }

            if (mountedRef.current) {
              setSnapshot(
                EMPTY_AUTH_SNAPSHOT,
              );
              setLoading(false);
            }

            return;
          }

          /*
           * INITIAL_SESSION, SIGNED_IN,
           * TOKEN_REFRESHED, USER_UPDATED,
           * PASSWORD_RECOVERY et les futurs
           * événements portant une session
           * passent par la même synchronisation.
           *
           * Le report hors du callback évite
           * d’appeler Supabase depuis son verrou
           * interne onAuthStateChange.
           */
          deferSynchronization();
        },
      );

    return () => {
      mountedRef.current = false;
      requestRef.current += 1;
      refreshQueuedRef.current = false;

      if (
        synchronizationTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          synchronizationTimerRef.current,
        );

        synchronizationTimerRef.current =
          null;
      }

      subscription.unsubscribe();
    };
  }, [refreshUser, supabase]);

  const hasRole = useCallback(
    (slug: string) => snapshot.roles.some((role) => role.slug === slug),
    [snapshot.roles],
  );
  const hasSystemRole = useCallback(
    (code: string) => snapshot.systemRoles.some((role) => role.code === code),
    [snapshot.systemRoles],
  );
  const can = useCallback(
    (code: string) => snapshot.permissions.some((permission) => permission.code === code),
    [snapshot.permissions],
  );

  const value = useMemo(() => ({
    ...snapshot,
    loading,
    authenticated: Boolean(snapshot.user),
    refreshUser,
    hasRole,
    hasSystemRole,
    can,
  }), [snapshot, loading, refreshUser, hasRole, hasSystemRole, can]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
