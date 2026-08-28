"use client";

import { useAuthContext } from "@/providers/auth/auth-context";

export function usePermission() {
  const { permissions, loading, can } = useAuthContext();

  const canAny = (permissionCodes: string[]): boolean => {
    return permissionCodes.some((code) => can(code));
  };

  const canAll = (permissionCodes: string[]): boolean => {
    return permissionCodes.every((code) => can(code));
  };

  return {
    permissions,
    loading,
    error: null,
    can,
    canAny,
    canAll,
  };
}
