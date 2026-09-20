import type { PrivateAccessKind } from "./types";

export const ADMIN_CANONICAL_DESTINATION = "/dashboard/admin";
export const SUPER_ADMIN_CANONICAL_DESTINATION = "/vh-teck";

function isSafeInternalPath(value: string): boolean {
  if (!value.startsWith("/") || value.startsWith("//")) return false;

  try {
    const parsed = new URL(value, "https://indesy.invalid");
    return parsed.origin === "https://indesy.invalid";
  } catch {
    return false;
  }
}

export function sanitizePrivateDestination(
  kind: PrivateAccessKind,
  requested: string | null | undefined,
): string {
  const fallback = kind === "admin"
    ? ADMIN_CANONICAL_DESTINATION
    : SUPER_ADMIN_CANONICAL_DESTINATION;

  if (!requested || !isSafeInternalPath(requested)) return fallback;

  const parsed = new URL(requested, "https://indesy.invalid");
  const allowedRoot = kind === "admin"
    ? ADMIN_CANONICAL_DESTINATION
    : SUPER_ADMIN_CANONICAL_DESTINATION;

  if (
    parsed.pathname !== allowedRoot &&
    !parsed.pathname.startsWith(`${allowedRoot}/`)
  ) {
    return fallback;
  }

  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

export function privateAuthRoute(kind: PrivateAccessKind): string {
  return kind === "admin" ? "/auth/admin" : "/auth/vh-teck";
}
