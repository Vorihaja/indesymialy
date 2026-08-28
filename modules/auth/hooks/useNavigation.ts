"use client";

import {
  useMemo,
} from "react";

import {
  usePathname,
} from "next/navigation";

import {
  normalizeWorkspaceTechnicalRole,
  resolveWorkspaceTechnicalRoleFromPath,
} from "@/modules/workspace-registry";

import {
  NAVIGATION_ITEMS,
  type NavigationItem,
} from "../config/navigation";

import {
  resolveNavigation,
} from "../navigation/navigation-resolver";

import {
  useAuth,
} from "./useAuth";

import {
  usePermission,
} from "./usePermission";

import {
  useRole,
} from "./useRole";

interface UseNavigationResult {
  navigation: NavigationItem[];
  loading: boolean;
}

export function useNavigation(
  activeRoleOverride?: string,
): UseNavigationResult {
  const {
    loading: authLoading,
    authenticated,
  } = useAuth();

  const {
    loading: roleLoading,
    hasRole,
    hasSystemRole,
  } = useRole();

  const {
    loading: permissionLoading,
    can,
  } = usePermission();

  const pathname =
    usePathname();

  const loading =
    authLoading ||
    roleLoading ||
    permissionLoading;

  const activeRole =
    useMemo(() => {
      if (activeRoleOverride) {
        return (
          normalizeWorkspaceTechnicalRole(
            activeRoleOverride,
          ) ??
          activeRoleOverride
        );
      }

      if (!pathname) {
        return undefined;
      }

      const workspaceRole =
        resolveWorkspaceTechnicalRoleFromPath(
          pathname,
        );

      if (workspaceRole) {
        return workspaceRole;
      }

      // Compatibilité temporaire avec l’ancien espace /admin.
      if (
        pathname === "/admin" ||
        pathname.startsWith(
          "/admin/",
        )
      ) {
        return "admin";
      }

      return undefined;
    }, [
      activeRoleOverride,
      pathname,
    ]);

  const navigation =
    useMemo(
      () =>
        loading
          ? []
          : resolveNavigation(
              NAVIGATION_ITEMS,
              authenticated,
              hasRole,
              hasSystemRole,
              can,
              activeRole,
            ),
      [
        activeRole,
        authenticated,
        can,
        hasRole,
        hasSystemRole,
        loading,
      ],
    );

  return {
    navigation,
    loading,
  };
}
