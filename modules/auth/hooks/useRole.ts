"use client";

import { useAuthContext } from "@/providers/auth/auth-context";
import type { BusinessRole, SystemRole } from "@/modules/access-control/types";

export function useRole() {
  const { roles, systemRoles, loading, hasRole, hasSystemRole } = useAuthContext();

  return {
    roles: roles as BusinessRole[],
    systemRoles: systemRoles as SystemRole[],
    loading,
    hasRole,
    hasSystemRole,
  };
}
