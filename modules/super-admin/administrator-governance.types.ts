export type AdministratorGovernanceStatus =
  | "active"
  | "suspended"
  | "revoked";


export interface AdministratorGovernanceRecord {
  profileId: string;

  fullName: string;

  email: string;

  profileStatus: string | null;

  verified: boolean;

  governanceStatus:
    AdministratorGovernanceStatus;

  roleAssigned: boolean;

  effectiveAccess: boolean;

  consistent: boolean;

  adminSince: string | null;

  suspendedAt: string | null;

  revokedAt: string | null;

  reactivatedAt: string | null;

  lastReason: string | null;

  updatedAt: string;

  changedByProfileId: string | null;

  changedByName: string | null;

  permissions: string[];

  permissionSnapshot: string[];
}


export interface AdministratorGovernanceCandidate {
  profileId: string;

  fullName: string;

  email: string;

  profileStatus: string | null;

  verified: boolean;

  isAdmin: boolean;

  isSuperAdmin: boolean;

  governanceStatus:
    AdministratorGovernanceStatus | null;

  effectiveAccess: boolean;
}


export interface AdministratorGovernancePermission {
  id: string;

  code: string;

  description: string | null;
}


export interface AdministratorGovernanceDashboard {
  administrators:
    AdministratorGovernanceRecord[];

  permissions:
    AdministratorGovernancePermission[];
}


export interface AdministratorGovernanceMutationResult {
  changed: boolean;

  status?: string;

  permissions?: string[];

  restoredPermissions?: string[];

  droppedPermissions?: string[];

  permissionSnapshot?: string[];
}