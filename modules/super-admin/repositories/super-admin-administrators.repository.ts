import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  Database,
} from "@/infrastructure/supabase/database.types";

import type {
  AdministratorGovernanceCandidate,
  AdministratorGovernanceDashboard,
  AdministratorGovernanceMutationResult,
  AdministratorGovernancePermission,
  AdministratorGovernanceRecord,
  AdministratorGovernanceStatus,
} from "../administrator-governance.types";


type JsonRecord =
  Record<string, unknown>;


function record(
  value: unknown,
): JsonRecord {

  return (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value,
    )
  )
    ? value as JsonRecord
    : {};
}


function array(
  value: unknown,
): unknown[] {

  return Array.isArray(
    value,
  )
    ? value
    : [];
}


function text(
  value: unknown,
  fallback = "",
): string {

  return typeof value ===
    "string"
    ? value
    : fallback;
}


function nullableText(
  value: unknown,
): string | null {

  return typeof value ===
    "string"
    ? value
    : null;
}


function bool(
  value: unknown,
): boolean {

  return value ===
    true;
}


function strings(
  value: unknown,
): string[] {

  return array(
    value,
  ).filter(
    (
      item,
    ): item is string =>
      typeof item ===
      "string",
  );
}


function governanceStatus(
  value: unknown,
): AdministratorGovernanceStatus {

  if (
    value ===
      "suspended" ||
    value ===
      "revoked"
  ) {

    return value;
  }


  return "active";
}


function nullableGovernanceStatus(
  value: unknown,
): AdministratorGovernanceStatus | null {

  if (
    value ===
      "active" ||
    value ===
      "suspended" ||
    value ===
      "revoked"
  ) {

    return value;
  }


  return null;
}


function administrator(
  value: unknown,
): AdministratorGovernanceRecord {

  const row =
    record(
      value,
    );


  return {
    profileId:
      text(
        row.profileId,
      ),

    fullName:
      text(
        row.fullName,
        "Sans nom",
      ),

    email:
      text(
        row.email,
      ),

    profileStatus:
      nullableText(
        row.profileStatus,
      ),

    verified:
      bool(
        row.verified,
      ),

    governanceStatus:
      governanceStatus(
        row.governanceStatus,
      ),

    roleAssigned:
      bool(
        row.roleAssigned,
      ),

    effectiveAccess:
      bool(
        row.effectiveAccess,
      ),

    consistent:
      bool(
        row.consistent,
      ),

    adminSince:
      nullableText(
        row.adminSince,
      ),

    suspendedAt:
      nullableText(
        row.suspendedAt,
      ),

    revokedAt:
      nullableText(
        row.revokedAt,
      ),

    reactivatedAt:
      nullableText(
        row.reactivatedAt,
      ),

    lastReason:
      nullableText(
        row.lastReason,
      ),

    updatedAt:
      text(
        row.updatedAt,
      ),

    changedByProfileId:
      nullableText(
        row.changedByProfileId,
      ),

    changedByName:
      nullableText(
        row.changedByName,
      ),

    permissions:
      strings(
        row.permissions,
      ),

    permissionSnapshot:
      strings(
        row.permissionSnapshot,
      ),
  };
}


function candidate(
  value: unknown,
): AdministratorGovernanceCandidate {

  const row =
    record(
      value,
    );


  return {
    profileId:
      text(
        row.profileId,
      ),

    fullName:
      text(
        row.fullName,
        "Sans nom",
      ),

    email:
      text(
        row.email,
      ),

    profileStatus:
      nullableText(
        row.profileStatus,
      ),

    verified:
      bool(
        row.verified,
      ),

    isAdmin:
      bool(
        row.isAdmin,
      ),

    isSuperAdmin:
      bool(
        row.isSuperAdmin,
      ),

    governanceStatus:
      nullableGovernanceStatus(
        row.governanceStatus,
      ),

    effectiveAccess:
      bool(
        row.effectiveAccess,
      ),
  };
}


function permission(
  value: unknown,
): AdministratorGovernancePermission {

  const row =
    record(
      value,
    );


  return {
    id:
      text(
        row.id,
      ),

    code:
      text(
        row.code,
      ),

    description:
      nullableText(
        row.description,
      ),
  };
}


function mutation(
  value: unknown,
): AdministratorGovernanceMutationResult {

  const row =
    record(
      value,
    );


  return {
    changed:
      bool(
        row.changed,
      ),

    status:
      nullableText(
        row.status,
      ) ??
      undefined,

    permissions:
      row.permissions ===
      undefined
        ? undefined
        : strings(
            row.permissions,
          ),

    restoredPermissions:
      row.restoredPermissions ===
      undefined
        ? undefined
        : strings(
            row.restoredPermissions,
          ),

    droppedPermissions:
      row.droppedPermissions ===
      undefined
        ? undefined
        : strings(
            row.droppedPermissions,
          ),

    permissionSnapshot:
      row.permissionSnapshot ===
      undefined
        ? undefined
        : strings(
            row.permissionSnapshot,
          ),
  };
}


export class SuperAdminAdministratorsRepository {

  constructor(
    private readonly supabase:
      SupabaseClient<Database>,
  ) {}


  async load():
    Promise<AdministratorGovernanceDashboard> {

    const [
      administratorsResult,
      permissionsResult,
    ] =
      await Promise.all([

        this.supabase.rpc(
          "super_admin_list_administrator_governance",
        ),

        this.supabase.rpc(
          "super_admin_list_permission_catalog",
        ),

      ]);


    if (
      administratorsResult.error
    ) {

      throw new Error(
        administratorsResult.error.message,
      );
    }


    if (
      permissionsResult.error
    ) {

      throw new Error(
        permissionsResult.error.message,
      );
    }


    return {
      administrators:
        array(
          administratorsResult.data,
        ).map(
          administrator,
        ),

      permissions:
        array(
          permissionsResult.data,
        ).map(
          permission,
        ),
    };
  }


  async search(
    query: string,
  ): Promise<
    AdministratorGovernanceCandidate[]
  > {

    const {
      data,
      error,
    } =
      await this.supabase.rpc(
        "super_admin_search_administrator_candidates",
        {
          p_query:
            query,

          p_limit:
            25,
        },
      );


    if (error) {

      throw new Error(
        error.message,
      );
    }


    return array(
      data,
    ).map(
      candidate,
    );
  }


  async grant(
    profileId: string,
    reason: string,
  ) {

    const {
      data,
      error,
    } =
      await this.supabase.rpc(
        "super_admin_grant_administrator",
        {
          p_profile_id:
            profileId,

          p_reason:
            reason,
        },
      );


    if (error) {

      throw new Error(
        error.message,
      );
    }


    return mutation(
      data,
    );
  }


  async suspend(
    profileId: string,
    reason: string,
  ) {

    const {
      data,
      error,
    } =
      await this.supabase.rpc(
        "super_admin_suspend_administrator",
        {
          p_profile_id:
            profileId,

          p_reason:
            reason,
        },
      );


    if (error) {

      throw new Error(
        error.message,
      );
    }


    return mutation(
      data,
    );
  }


  async reactivate(
    profileId: string,
    reason: string,
  ) {

    const {
      data,
      error,
    } =
      await this.supabase.rpc(
        "super_admin_reactivate_administrator",
        {
          p_profile_id:
            profileId,

          p_reason:
            reason,
        },
      );


    if (error) {

      throw new Error(
        error.message,
      );
    }


    return mutation(
      data,
    );
  }


  async revoke(
    profileId: string,
    reason: string,
  ) {

    const {
      data,
      error,
    } =
      await this.supabase.rpc(
        "super_admin_revoke_administrator",
        {
          p_profile_id:
            profileId,

          p_reason:
            reason,
        },
      );


    if (error) {

      throw new Error(
        error.message,
      );
    }


    return mutation(
      data,
    );
  }


  async setPermissions(
    profileId: string,
    permissionCodes: string[],
    reason: string,
  ) {

    const {
      data,
      error,
    } =
      await this.supabase.rpc(
        "super_admin_set_administrator_permissions",
        {
          p_profile_id:
            profileId,

          p_permission_codes:
            permissionCodes,

          p_reason:
            reason,
        },
      );


    if (error) {

      throw new Error(
        error.message,
      );
    }


    return mutation(
      data,
    );
  }
}