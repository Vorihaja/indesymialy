import {
  normalizeWorkspaceTechnicalRole,
} from "@/modules/workspace-registry";

import type {
  NavigationItem,
} from "../config/navigation";

function normalizeRole(
  role?: string,
): string | undefined {
  if (!role) {
    return undefined;
  }

  return (
    normalizeWorkspaceTechnicalRole(role) ??
    role
  );
}

function scopeMatches(
  scope: string | undefined,
  activeRole: string | undefined,
) {
  if (!scope || !activeRole) {
    return true;
  }

  const normalizedScope =
    normalizeRole(scope);

  const normalizedActiveRole =
    normalizeRole(activeRole);

  if (
    normalizedScope ===
    normalizedActiveRole
  ) {
    return true;
  }

  // Le super administrateur peut consommer la navigation administrateur.
  return (
    normalizedActiveRole ===
      "super_admin" &&
    normalizedScope ===
      "admin"
  );
}

/**
 * Transforme utilisateur + rôles + permissions en navigation accessible.
 * Les comparaisons de rôles passent par le Workspace Registry afin que les
 * alias historiques ne deviennent jamais une deuxième source d’autorité.
 */
export function resolveNavigation(
  items: NavigationItem[],
  isLoggedIn: boolean,
  hasRole: (role: string) => boolean,
  hasSystemRole: (role: string) => boolean,
  can: (permission: string) => boolean,
  activeRole?: string,
): NavigationItem[] {
  if (!isLoggedIn) {
    return items.filter(
      (item) =>
        item.guard === "public",
    );
  }

  const normalizedActiveRole =
    normalizeRole(activeRole);

  return items.filter((item) => {
    if (
      normalizedActiveRole &&
      !scopeMatches(
        item.scope,
        normalizedActiveRole,
      )
    ) {
      return false;
    }

    if (
      !normalizedActiveRole &&
      item.scope &&
      item.scope !== "fan"
    ) {
      const normalizedScope =
        normalizeRole(item.scope) ??
        item.scope;

      if (
        !hasRole(normalizedScope) &&
        !hasSystemRole(
          normalizedScope,
        )
      ) {
        return false;
      }
    }

    if (item.guard === "public") {
      if (
        normalizedActiveRole ===
          "fan" &&
        (
          item.route ===
            "/annuaire" ||
          item.route ===
            "/marketplace"
        )
      ) {
        return false;
      }

      return true;
    }

    if (item.guard === "auth") {
      return true;
    }

    if (
      item.guard ===
        "system_role" &&
      item.role
    ) {
      const requiredRole =
        normalizeRole(item.role) ??
        item.role;

      return (
        hasSystemRole(
          requiredRole,
        ) ||
        (
          requiredRole ===
            "admin" &&
          hasSystemRole(
            "super_admin",
          )
        )
      );
    }

    if (
      item.guard ===
        "business_role" &&
      item.role
    ) {
      const requiredRole =
        normalizeRole(item.role) ??
        item.role;

      return hasRole(
        requiredRole,
      );
    }

    if (
      item.guard ===
        "permission" &&
      item.permission
    ) {
      return can(
        item.permission,
      );
    }

    return false;
  });
}
