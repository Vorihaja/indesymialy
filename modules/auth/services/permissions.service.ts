import { supabase } from "@/lib/supabase";

import type {
  Permission,
  Role,
  UserRole,
} from "../types";

/**
 * Récupérer les rôles d'un utilisateur
 */
export async function getUserRoles(
  userId: string
): Promise<Role[]> {
  const {
    data,
    error
  } = await supabase
    .from("profile_roles")
    .select(`
      roles (
        id,
        slug,
        label,
        description,
        is_organization,
        created_at
      )
    `)
    .eq(
      "profile_id",
      userId
    );

  if (error) {
    console.error(
      "Erreur récupération rôles",
      error
    );
    return [];
  }

  return (
    data ?? []
  )
  .map(
    item => item.roles
  )
  .filter(Boolean) as unknown as Role[];
}

/**
 * Récupérer les permissions utilisateur
 */
export async function getUserPermissions(
  userId: string
): Promise<Permission[]> {
  const {
    data,
    error
  } = await supabase
    .from("profile_roles")
    .select(`
      roles (
        role_permissions (
          permissions (
            id,
            code,
            description
          )
        )
      )
    `)
    .eq(
      "profile_id",
      userId
    );

  if (error) {
    console.error(
      "Erreur récupération permissions",
      error
    );
    return [];
  }

  const permissions: Permission[] = [];

  data?.forEach(
    item => {
      const roles = item.roles;

      if (!roles) {
        return;
      }

      const roleList = Array.isArray(roles)
        ? roles
        : [roles];

      roleList.forEach(
        role => {
          // Utilisation d'un cast 'unknown' intermédiaire pour éviter l'erreur de type TS
          const typedRole = role as unknown as {
            role_permissions?: Array<{
              permissions?: Permission | null;
            }>;
          };

          if (!typedRole?.role_permissions) {
            return;
          }

          typedRole.role_permissions.forEach(
            rp => {
              if (rp.permissions) {
                permissions.push(
                  rp.permissions as Permission
                );
              }
            }
          );
        }
      );
    }
  );

  return permissions;
}

/**
 * Vérifier si un utilisateur possède un rôle
 */
export function hasRole(
  roles: Role[],
  role: UserRole
): boolean {
  return roles.some(
    item =>
      item.slug === role
  );
}

/**
 * Vérifier une permission
 */
export function hasPermission(
  permissions: Permission[],
  permission: string
): boolean {
  return permissions.some(
    item =>
      item.code === permission
  );
}