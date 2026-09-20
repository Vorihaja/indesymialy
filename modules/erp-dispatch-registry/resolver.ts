import type { ErpCanonicalRole, ErpDispatchRegistryEntry } from "./types";
import { ERP_DISPATCH_REGISTRY } from "./registry";

const CANONICAL_ROLES: readonly ErpCanonicalRole[] = [
  "super-admin",
  "admin",
  "federation",
  "league",
  "club",
  "coach",
  "fighter",
  "organizer",
  "official",
  "sponsor",
  "seller",
  "fan",
];

export function resolveCanonicalErpRole(role?: string | null): ErpCanonicalRole | null {
  if (!role) return null;
  const canonicalRole = role === "referee" || role === "judge" ? "official" : role;
  return CANONICAL_ROLES.includes(canonicalRole as ErpCanonicalRole)
    ? canonicalRole as ErpCanonicalRole
    : null;
}

export function resolveErpModuleEntry(
  role?: string | null,
  moduleId?: string | null,
): ErpDispatchRegistryEntry | null {
  const canonicalRole = resolveCanonicalErpRole(role);
  if (!canonicalRole || !moduleId) return null;

  return ERP_DISPATCH_REGISTRY.find(
    (entry) => entry.canonicalRole === canonicalRole && entry.moduleId === moduleId,
  ) ?? null;
}

export function resolveErpDispatchEntry(
  role?: string | null,
  moduleId?: string | null,
): { entry: ErpDispatchRegistryEntry | null; missing: boolean } {
  const entry = resolveErpModuleEntry(role, moduleId);
  return { entry, missing: entry === null };
}