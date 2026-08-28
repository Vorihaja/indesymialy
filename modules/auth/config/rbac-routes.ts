import {
  WORKSPACE_REGISTRY,
} from "@/modules/workspace-registry";

export type RbacProtectionType =
  | "public"
  | "auth"
  | "system_role"
  | "business_role"
  | "permission";

export interface RbacRouteConfig {
  path: string;
  protection: RbacProtectionType;
  role?: string;
  permission?: string;
}

const workspaceRoutes: RbacRouteConfig[] =
  WORKSPACE_REGISTRY.map((entry) => ({
    path: entry.basePath,
    protection:
      entry.accessKind === "system"
        ? "system_role"
        : "business_role",
    role: entry.technicalRole,
  }));

const compatibilityRoutes: RbacRouteConfig[] = [
  {
    path: "/dashboard/moderator",
    protection: "system_role",
    role: "moderator",
  },
  {
    path: "/erp",
    protection: "auth",
  },
  {
    path: "/marketplace/manage",
    protection: "auth",
  },
];

export const RBAC_ROUTES: RbacRouteConfig[] = [
  ...workspaceRoutes,
  ...compatibilityRoutes,
  {
    path: "/dashboard",
    protection: "auth",
  },
];

/**
 * Résout toujours la route la plus spécifique.
 *
 * L’ancienne implémentation plaçait /dashboard avant ses sous-routes :
 * /dashboard/organisateur pouvait donc être résolu comme une simple route
 * authentifiée avant même de vérifier le rôle métier.
 */
export function getRbacRouteConfig(
  pathname: string,
): RbacRouteConfig | undefined {
  return [...RBAC_ROUTES]
    .sort(
      (left, right) =>
        right.path.length - left.path.length,
    )
    .find(
      (route) =>
        pathname === route.path ||
        pathname.startsWith(
          `${route.path}/`,
        ),
    );
}
