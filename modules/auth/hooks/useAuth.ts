"use client";

import { useAuthContext } from "@/providers/auth/auth-context";

/**
 * Hook providing the current authenticated user state.
 * Thin wrapper around the centralized AuthProvider context.
 *
 * Signature is backward-compatible with the previous standalone version.
 */
export function useAuth() {
  const {
    user,
    profile,
    primaryRole,
    loading,
    authenticated,
  } = useAuthContext();

  return {
    user,
    loading,
    authenticated,
  };
}
