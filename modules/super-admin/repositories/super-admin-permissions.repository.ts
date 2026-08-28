import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  Database,
} from "@/infrastructure/supabase/database.types";

import type {
  AdministratorGovernanceStatus,
} from "../administrator-governance.types";

import type {
  AdminPermissionAction,
  AdminPermissionDomain,
  AdminPermissionSensitivity,
  SuperAdminPermissionAdministrator,
  SuperAdminPermissionGovernanceItem,
  SuperAdminPermissionGovernanceSnapshot,
  SuperAdminPermissionSummary,
} from "../permission-governance.types";


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


function number(
  value: unknown,
): number {

  if (
    typeof value ===
    "number" &&
    Number.isFinite(
      value,
    )
  ) {

    return value;
  }


  const parsed =
    Number(
      value,
    );


  return Number.isFinite(
    parsed,
  )
    ? parsed
    : 0;
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


function status(
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


function domain(
  value: unknown,
): AdminPermissionDomain {

  const domains:
    AdminPermissionDomain[] = [
      "dashboard",
      "users",
      "organizations",
      "sport",
      "events",
      "community",
      "marketplace",
      "finance",
      "support",
      "content",
      "analytics",
    ];


  return domains.includes(
    value as AdminPermissionDomain,
  )
    ? value as AdminPermissionDomain
    : "dashboard";
}


function action(
  value: unknown,
): AdminPermissionAction {

  if (
    value ===
      "manage" ||
    value ===
      "approve" ||
    value ===
      "export"
  ) {

    return value;
  }


  return "view";
}


function sensitivity(
  value: unknown,
): AdminPermissionSensitivity {

  if (
    value ===
      "sensitive" ||
    value ===
      "critical"
  ) {

    return value;
  }


  return "standard";
}


function permission(
  value: unknown,
): SuperAdminPermissionGovernanceItem {

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

    label:
      text(
        row.label,
        text(
          row.code,
        ),
      ),

    domain:
      domain(
        row.domain,
      ),

    domainLabel:
      text(
        row.domainLabel,
        "Autres",
      ),

    action:
      action(
        row.action,
      ),

    actionLabel:
      text(
        row.actionLabel,
        "Consultation",
      ),

    sensitivity:
      sensitivity(
        row.sensitivity,
      ),

    displayOrder:
      number(
        row.displayOrder,
      ),

    isActive:
      bool(
        row.isActive,
      ),

    assignedCount:
      number(
        row.assignedCount,
      ),
  };
}


function administrator(
  value: unknown,
): SuperAdminPermissionAdministrator {

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

    governanceStatus:
      status(
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


function summary(
  value: unknown,
): SuperAdminPermissionSummary {

  const row =
    record(
      value,
    );


  return {
    totalPermissions:
      number(
        row.totalPermissions,
      ),

    standardPermissions:
      number(
        row.standardPermissions,
      ),

    sensitivePermissions:
      number(
        row.sensitivePermissions,
      ),

    criticalPermissions:
      number(
        row.criticalPermissions,
      ),

    activeAdministrators:
      number(
        row.activeAdministrators,
      ),

    activeAssignments:
      number(
        row.activeAssignments,
      ),
  };
}


export class SuperAdminPermissionsRepository {

  constructor(
    private readonly supabase:
      SupabaseClient<Database>,
  ) {}


  async load():
    Promise<SuperAdminPermissionGovernanceSnapshot> {

    const {
      data,
      error,
    } =
      await this.supabase.rpc(
        "super_admin_permissions_governance_snapshot",
      );


    if (error) {

      throw new Error(
        error.message,
      );
    }


    const root =
      record(
        data,
      );


    return {
      summary:
        summary(
          root.summary,
        ),

      catalog:
        array(
          root.catalog,
        ).map(
          permission,
        ),

      administrators:
        array(
          root.administrators,
        ).map(
          administrator,
        ),
    };
  }


  async replaceAdministratorPermissions(
    profileId: string,
    permissionCodes: string[],
    reason: string,
  ): Promise<void> {

    const {
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
  }
}