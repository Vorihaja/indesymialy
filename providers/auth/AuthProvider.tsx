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

type Props = { children: ReactNode };

export default function AuthProvider({ children }: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const identityUseCase = useMemo(() => createIdentityUseCase(), []);
  const [snapshot, setSnapshot] = useState<AuthSnapshot>(EMPTY_AUTH_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const requestRef = useRef(0);
  const mountedRef = useRef(true);

  const refreshUser = useCallback(async () => {
    const request = ++requestRef.current;
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user.user_metadata?.profile_setup_pending === "true") {
        try {
          await identityUseCase.resumeRegistration();
        } catch {
          console.error("[Auth] Impossible de finaliser l’inscription. Une nouvelle tentative sera effectuée.");
        }
      }
      const next = await loadAuthSnapshot(supabase);
      if (mountedRef.current && request === requestRef.current) setSnapshot(next);
      return next;
    } catch (reason) {
      if (mountedRef.current && request === requestRef.current) {
        setSnapshot(EMPTY_AUTH_SNAPSHOT);
      }
      throw reason;
    } finally {
      if (mountedRef.current && request === requestRef.current) setLoading(false);
    }
  }, [identityUseCase, supabase]);

  useEffect(() => {
    mountedRef.current = true;
    const initializationTimer = window.setTimeout(() => {
      void refreshUser().catch(() => {
        console.error("[Auth] Impossible de charger la session.");
      });
    }, 0);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => {
        if (mountedRef.current) {
          void refreshUser().catch(() => {
            console.error("[Auth] Impossible de synchroniser la session.");
          });
        }
      }, 0);
    });

    return () => {
      mountedRef.current = false;
      window.clearTimeout(initializationTimer);
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
