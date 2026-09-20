import type { IdentityRole, RoleRequestStatus } from "./types";

export const FLEXIBLE_IDENTITY_ROLES = [
  "fan",
  "fighter",
  "coach",
  "club",
  "organizer",
  "referee",
  "judge",
  "sponsor",
  "seller",
] as const satisfies readonly IdentityRole[];

export const CONTROLLED_IDENTITY_ROLES = [
  "federation",
  "league",
] as const satisfies readonly IdentityRole[];

export const PUBLIC_IDENTITY_ROLES = [
  ...FLEXIBLE_IDENTITY_ROLES,
  ...CONTROLLED_IDENTITY_ROLES,
] as const satisfies readonly IdentityRole[];

export type FlexibleIdentityRole = (typeof FLEXIBLE_IDENTITY_ROLES)[number];
export type ControlledIdentityRole = (typeof CONTROLLED_IDENTITY_ROLES)[number];
export type PublicIdentityRole = (typeof PUBLIC_IDENTITY_ROLES)[number];

export const IDENTITY_ROLE_LABELS: Record<PublicIdentityRole, string> = {
  fan: "Fan",
  fighter: "Combattant",
  coach: "Coach",
  club: "Club",
  organizer: "Organisateur",
  referee: "Arbitre",
  judge: "Juge",
  sponsor: "Sponsor",
  seller: "Vendeur",
  federation: "Fédération",
  league: "Ligue",
};

export const ROLE_REQUEST_STATUS_LABELS: Record<RoleRequestStatus, string> = {
  pending: "En attente",
  approved: "Approuvée",
  rejected: "Refusée",
  suspended: "Suspendue",
  withdrawn: "Retirée",
};

const SYSTEM_IDENTITY_ROLE_LABELS: Record<Extract<IdentityRole, "admin" | "super_admin">, string> = {
  admin: "Administrateur",
  super_admin: "Super administrateur",
};

export function isFlexibleIdentityRole(role: IdentityRole): role is FlexibleIdentityRole {
  return (FLEXIBLE_IDENTITY_ROLES as readonly IdentityRole[]).includes(role);
}

export function isControlledIdentityRole(role: IdentityRole): role is ControlledIdentityRole {
  return (CONTROLLED_IDENTITY_ROLES as readonly IdentityRole[]).includes(role);
}

export function isPublicIdentityRole(value: string): value is PublicIdentityRole {
  return (PUBLIC_IDENTITY_ROLES as readonly string[]).includes(value);
}

export function getIdentityRoleLabel(role: IdentityRole | null | undefined): string {
  if (!role) return "Aucun";
  if (isPublicIdentityRole(role)) return IDENTITY_ROLE_LABELS[role];
  if (role === "official") return "Officiel";
  return SYSTEM_IDENTITY_ROLE_LABELS[role];
}

export function getAccountIdentityRoleLabel(
  role: IdentityRole | null | undefined,
): string {
  if (role === "official" || role === "referee") {
    return "Officiel";
  }

  return getIdentityRoleLabel(role);
}
