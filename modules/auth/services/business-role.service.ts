import { supabase } from "@/lib/supabase";

import type { BusinessRole } from "@/modules/access-control/types";

export class BusinessRoleService {
  /**
   * Récupérer les rôles métiers d'un utilisateur
   */
  async getUserBusinessRoles(userId: string): Promise<BusinessRole[]> {
    const [{ data, error }, { data: profile, error: profileError }] =
      await Promise.all([
        supabase.from("profile_roles").select(
          `
  roles (
    id,
    slug,
    label,
    description,
    is_organization,
    created_at
  )
`,
        ).eq("profile_id", userId),
        supabase
          .from("profiles")
          .select("primary_role_id")
          .eq("id", userId)
          .maybeSingle(),
      ]);

    if (error || profileError) {
      console.error("Erreur récupération rôles métiers", error);

      return [];
    }

    const roles = (data ?? [])
      .flatMap((item) => item.roles ?? [])
      .filter(Boolean) as BusinessRole[];

    return roles
      .filter((role) => role.slug !== "fan" || role.id === profile?.primary_role_id)
      .sort((left, right) => {
        const primaryDifference =
          Number(right.id === profile?.primary_role_id) -
          Number(left.id === profile?.primary_role_id);
        if (primaryDifference) return primaryDifference;
        return left.label.localeCompare(right.label, "fr");
      });
  }

  /**
   * Vérifier si un utilisateur possède un rôle métier
   */
  async hasBusinessRole(userId: string, roleSlug: string): Promise<boolean> {
    const roles = await this.getUserBusinessRoles(userId);

    return roles.some((role) => role.slug === roleSlug);
  }
}
