import type {
  AdministratorGovernanceStatus,
} from "./administrator-governance.types";


export type AdminPermissionDomain =
  | "dashboard"
  | "users"
  | "organizations"
  | "sport"
  | "events"
  | "community"
  | "marketplace"
  | "finance"
  | "support"
  | "content"
  | "analytics";


export type AdminPermissionAction =
  | "view"
  | "manage"
  | "approve"
  | "export";


export type AdminPermissionSensitivity =
  | "standard"
  | "sensitive"
  | "critical";


export interface SuperAdminPermissionGovernanceItem {
  id: string;

  code: string;

  description: string | null;

  label: string;

  domain: AdminPermissionDomain;

  domainLabel: string;

  action: AdminPermissionAction;

  actionLabel: string;

  sensitivity:
    AdminPermissionSensitivity;

  displayOrder: number;

  isActive: boolean;

  assignedCount: number;
}


export interface SuperAdminPermissionAdministrator {
  profileId: string;

  fullName: string;

  email: string;

  governanceStatus:
    AdministratorGovernanceStatus;

  roleAssigned: boolean;

  effectiveAccess: boolean;

  consistent: boolean;

  permissions: string[];

  permissionSnapshot: string[];
}


export interface SuperAdminPermissionSummary {
  totalPermissions: number;

  standardPermissions: number;

  sensitivePermissions: number;

  criticalPermissions: number;

  activeAdministrators: number;

  activeAssignments: number;
}


export interface SuperAdminPermissionGovernanceSnapshot {
  summary:
    SuperAdminPermissionSummary;

  catalog:
    SuperAdminPermissionGovernanceItem[];

  administrators:
    SuperAdminPermissionAdministrator[];
}