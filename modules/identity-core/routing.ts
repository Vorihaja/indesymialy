
import type {
  IdentityRole,
} from "./types";

import {
  WORKSPACE_TECHNICAL_DASHBOARD_PATHS,
  getWorkspaceDashboardPath,
} from "@/modules/workspace-registry";

export const IDENTITY_DASHBOARD_PATHS:
  Record<IdentityRole, string> = {
    ...WORKSPACE_TECHNICAL_DASHBOARD_PATHS,
  };

export function getIdentityDashboard(
  role?: string | null,
) {
  return getWorkspaceDashboardPath(role);
}

export function getPrimaryIdentityRole(
  roles: readonly string[],
  preferredRole?: string | null,
): IdentityRole | null {
  const assignedRoles = roles.filter(
    (role): role is IdentityRole =>
      role in IDENTITY_DASHBOARD_PATHS,
  );

  const preferred =
    preferredRole &&
    assignedRoles.includes(
      preferredRole as IdentityRole,
    )
      ? (preferredRole as IdentityRole)
      : null;

  if (preferred) {
    return preferred;
  }

  return (
    assignedRoles.find(
      (role) => role !== "fan",
    ) ??
    (assignedRoles.includes("fan")
      ? "fan"
      : null)
  );
}
