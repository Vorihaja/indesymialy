import { isAuthApiError, type SupabaseClient, type User } from "@supabase/supabase-js";

import type { Database, Json } from "@/infrastructure/supabase/database.types";
import type { BusinessRole, Permission, SystemRole } from "@/modules/access-control/types";
import type { IdentityRole } from "@/modules/identity-core/types";

export type AuthProfile = {
  id: string;
  fullName: string;
  email: string;
  photoUrl: string | null;
  status: string;
};

export type AuthSnapshot = {
  user: User | null;
  profile: AuthProfile | null;
  primaryRole: IdentityRole | null;
  roles: BusinessRole[];
  systemRoles: SystemRole[];
  permissions: Permission[];
};

export const EMPTY_AUTH_SNAPSHOT: AuthSnapshot = {
  user: null,
  profile: null,
  primaryRole: null,
  roles: [],
  systemRoles: [],
  permissions: [],
};

const businessRoles = new Set<IdentityRole>([
  "federation", "league", "club", "coach", "fighter", "organizer",
  "referee", "judge", "sponsor", "seller", "fan",
]);

function record(value: Json | undefined): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, Json | undefined>
    : {};
}

function array<T>(value: Json | undefined): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

export async function loadAuthSnapshot(
  supabase: SupabaseClient<Database>,
  knownUser?: User | null,
): Promise<AuthSnapshot> {
  let user = knownUser;
  if (user === undefined) {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (isAuthApiError(error) && [401, 403, 404].includes(error.status)) {
        await supabase.auth.signOut({ scope: "local" });
        return EMPTY_AUTH_SNAPSHOT;
      }
      throw error;
    }
    user = data.user;
  }

  if (!user) return EMPTY_AUTH_SNAPSHOT;

  const [
    authContextResult,
    profilePhotoResult,
  ] = await Promise.all([
    supabase.rpc("get_my_auth_context"),

    supabase
      .from("profiles")
      .select("photo_url")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (authContextResult.error) {
    throw new Error(
      authContextResult.error.message,
    );
  }

  const data =
    authContextResult.data;

  const value =
    record(data);
  const profileValue = record(value.profile);
  const primaryRoleValue = typeof value.primaryRole === "string" ? value.primaryRole : null;
  const primaryRole = primaryRoleValue && businessRoles.has(primaryRoleValue as IdentityRole)
    ? primaryRoleValue as IdentityRole
    : null;

  return {
    user,
    profile: typeof profileValue.id === "string"
      ? {
          id: profileValue.id,
          fullName: typeof profileValue.fullName === "string" ? profileValue.fullName : "",
          email: typeof profileValue.email === "string" ? profileValue.email : user.email ?? "",

          photoUrl:
            typeof profileValue.photoUrl === "string"
              ? profileValue.photoUrl
              : profilePhotoResult.error
                ? null
                : profilePhotoResult.data?.photo_url ?? null,

          status: typeof profileValue.status === "string" ? profileValue.status : "active",
        }
      : null,
    primaryRole,
    roles: array<BusinessRole>(value.roles),
    systemRoles: array<SystemRole>(value.systemRoles),
    permissions: array<Permission>(value.permissions),
  };
}
