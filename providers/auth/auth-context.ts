"use client";

import {
  createContext,
  useContext,
} from "react";

import type { User } from "@supabase/supabase-js";
import type { BusinessRole, SystemRole, Permission } from "@/modules/access-control/types";
import type { AuthProfile, AuthSnapshot } from "@/modules/auth/session";
import type { IdentityRole } from "@/modules/identity-core/types";

export type AuthContextType = {
  /** Supabase user object, null when not authenticated */
  user: User | null;

  profile: AuthProfile | null;

  primaryRole: IdentityRole | null;

  /** True while the initial auth check is in progress */
  loading: boolean;

  /** Shorthand for !!user */
  authenticated: boolean;

  /** Business roles assigned to the current user */
  roles: BusinessRole[];

  /** System roles assigned to the current user */
  systemRoles: SystemRole[];

  /** Permissions resolved for the current user */
  permissions: Permission[];

  /** Force a re-fetch of the user + roles + permissions */
  refreshUser: () => Promise<AuthSnapshot>;

  /** Check if the user has a specific business role by slug */
  hasRole: (roleSlug: string) => boolean;

  /** Check if the user has a specific system role by code */
  hasSystemRole: (roleCode: string) => boolean;

  /** Check if the user has a specific permission by code */
  can: (permissionCode: string) => boolean;
};

export const AuthContext =
  createContext<AuthContextType | undefined>(undefined);

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuthContext must be used inside AuthProvider"
    );
  }

  return context;
}
