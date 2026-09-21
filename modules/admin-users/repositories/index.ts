import { supabase } from "@/lib/supabase";
import type { AdminDomainData } from "@/modules/admin-core";
import type { AdminUsersDomain } from "../types";

type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  status: string | null;
  created_at: string;
};

type ProfileRoleRow = {
  profile_id: string | null;
  role_id: string | null;
};

type RoleRow = {
  id: string;
  slug: string;
  label: string;
  is_organization: boolean | null;
};

type RoleRequestRow = {
  id: string;
  profile_id: string;
  role_id: string;
  status: string;
  submitted_at: string;
  decided_at: string | null;
  decision_reason: string | null;
};

type AdminPermissionRow = {
  id: string;
  code: string;
  description: string | null;
  created_at: string | null;
};

function message(
  scope: string,
  reason: { message?: string },
): Error {
  return new Error(
    `${scope}: ${reason.message ?? "erreur Supabase inconnue"}`,
  );
}

export class AdminUsersRepository {
  async list(
    domain: AdminUsersDomain,
  ): Promise<AdminDomainData> {
    if (domain === "users") {
      return this.listUsers();
    }

    if (domain === "roles") {
      return this.listRoles();
    }

    if (domain === "role-requests") {
      return this.listRoleRequests();
    }

    return this.listPermissions();
  }

  private async listUsers(): Promise<AdminDomainData> {
    const [
      profilesResult,
      profileRolesResult,
      rolesResult,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id,full_name,email,status,created_at",
        )
        .order(
          "created_at",
          { ascending: false },
        ),

      supabase
        .from("profile_roles")
        .select(
          "profile_id,role_id",
        ),

      supabase
        .from("roles")
        .select(
          "id,slug,label,is_organization",
        ),
    ]);

    if (profilesResult.error) {
      throw message(
        "Lecture des profils administratifs",
        profilesResult.error,
      );
    }

    if (profileRolesResult.error) {
      throw message(
        "Lecture des rôles métier des profils",
        profileRolesResult.error,
      );
    }

    if (rolesResult.error) {
      throw message(
        "Lecture du catalogue des rôles métier",
        rolesResult.error,
      );
    }

    const profiles =
      (profilesResult.data ?? []) as ProfileRow[];

    const profileRoles =
      (profileRolesResult.data ?? []) as ProfileRoleRow[];

    const roles =
      (rolesResult.data ?? []) as RoleRow[];

    const roleById = new Map(
      roles.map(
        (role) => [
          role.id,
          role.label,
        ],
      ),
    );

    const rolesByProfile =
      new Map<string, string[]>();

    for (const link of profileRoles) {
      if (
        !link.profile_id ||
        !link.role_id
      ) {
        continue;
      }

      const label =
        roleById.get(link.role_id);

      if (!label) {
        continue;
      }

      const current =
        rolesByProfile.get(
          link.profile_id,
        ) ?? [];

      current.push(label);

      rolesByProfile.set(
        link.profile_id,
        current,
      );
    }

    return {
      title: "Utilisateurs et profils",
      description:
        "Profils persistés et rôles métier enregistrés dans Supabase.",
      metrics: [],
      columns: [
        "Utilisateur",
        "E-mail",
        "Rôles métier",
        "Statut",
      ],
      rows: profiles.map(
        (profile) => {
          const roleLabels =
            rolesByProfile.get(
              profile.id,
            ) ?? [];

          const status =
            profile.status ??
            "non renseigné";

          return {
            id: profile.id,
            cells: [
              profile.full_name,
              profile.email,
              roleLabels.join(", ") ||
                "Aucun rôle métier",
              status,
            ],
            status:
              profile.status ??
              undefined,
          };
        },
      ),
      actions: [],
    };
  }

  private async listRoles(): Promise<AdminDomainData> {
    const {
      data,
      error,
    } = await supabase
      .from("roles")
      .select(
        "id,slug,label,is_organization",
      )
      .order(
        "label",
        { ascending: true },
      );

    if (error) {
      throw message(
        "Lecture du catalogue des rôles",
        error,
      );
    }

    const roles =
      (data ?? []) as RoleRow[];

    return {
      title: "Rôles métier",
      description:
        "Catalogue persistant des rôles métier configurés dans Indesy Mialy.",
      metrics: [],
      columns: [
        "Rôle",
        "Slug",
        "Portée",
      ],
      rows: roles.map(
        (role) => ({
          id: role.id,
          cells: [
            role.label,
            role.slug,
            role.is_organization
              ? "Organisation"
              : "Individuel",
          ],
        }),
      ),
      actions: [],
    };
  }

  private async listRoleRequests(): Promise<AdminDomainData> {
    const [
      requestsResult,
      profilesResult,
      rolesResult,
    ] = await Promise.all([
      supabase
        .from("role_requests")
        .select(
          "id,profile_id,role_id,status,submitted_at,decided_at,decision_reason",
        )
        .order(
          "submitted_at",
          { ascending: false },
        ),

      supabase
        .from("profiles")
        .select(
          "id,full_name,email,status,created_at",
        ),

      supabase
        .from("roles")
        .select(
          "id,slug,label,is_organization",
        ),
    ]);

    if (requestsResult.error) {
      throw message(
        "Lecture des demandes de rôles",
        requestsResult.error,
      );
    }

    if (profilesResult.error) {
      throw message(
        "Résolution des profils des demandes de rôles",
        profilesResult.error,
      );
    }

    if (rolesResult.error) {
      throw message(
        "Résolution des rôles demandés",
        rolesResult.error,
      );
    }

    const requests =
      (requestsResult.data ?? []) as RoleRequestRow[];

    const profiles =
      (profilesResult.data ?? []) as ProfileRow[];

    const roles =
      (rolesResult.data ?? []) as RoleRow[];

    const profileById = new Map(
      profiles.map(
        (profile) => [
          profile.id,
          profile.full_name,
        ],
      ),
    );

    const roleById = new Map(
      roles.map(
        (role) => [
          role.id,
          role.label,
        ],
      ),
    );

    return {
      title: "Demandes de rôles",
      description:
        "Demandes de rôles persistées et décisions enregistrées dans Supabase.",
      metrics: [],
      columns: [
        "Utilisateur",
        "Rôle demandé",
        "Soumise le",
        "Statut",
        "Décision",
      ],
      rows: requests.map(
        (request) => ({
          id: request.id,
          cells: [
            profileById.get(
              request.profile_id,
            ) ?? request.profile_id,
            roleById.get(
              request.role_id,
            ) ?? request.role_id,
            request.submitted_at,
            request.status,
            request.decision_reason ??
              "Aucune",
          ],
          status: request.status,
        }),
      ),
      actions: [],
    };
  }

  private async listPermissions(): Promise<AdminDomainData> {
    const {
      data,
      error,
    } = await supabase.rpc(
      "get_my_admin_permissions",
    );

    if (error) {
      throw message(
        "Lecture des permissions administratives effectives",
        error,
      );
    }

    const permissions =
      (data ?? []) as AdminPermissionRow[];

    return {
      title: "Mes permissions administratives",
      description:
        "Permissions effectives du compte administrateur connecté, calculées par l’autorité RBAC persistante.",
      metrics: [],
      columns: [
        "Permission",
        "Description",
      ],
      rows: permissions.map(
        (permission) => ({
          id: permission.id,
          cells: [
            permission.code,
            permission.description ??
              "Aucune description",
          ],
        }),
      ),
      actions: [],
    };
  }
}