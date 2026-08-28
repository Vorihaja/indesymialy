"use client";

import { useAuthContext } from "@/providers/auth/auth-context";
import { PLATFORM_ROLES } from "@/constants/roles";

export function useSystemRole() {
  const { systemRoles, loading, hasSystemRole } = useAuthContext();

  const roles = systemRoles.map((r) => r.code);

  return {
    roles,
    loading,
    isModerator: hasSystemRole(PLATFORM_ROLES.MODERATOR),
    isAdmin: hasSystemRole(PLATFORM_ROLES.ADMIN) || hasSystemRole(PLATFORM_ROLES.SUPER_ADMIN),
    isSuperAdmin: hasSystemRole(PLATFORM_ROLES.SUPER_ADMIN),
    hasRole: (role: string) => hasSystemRole(role),
  };
}
