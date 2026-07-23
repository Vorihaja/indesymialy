export const ROLE_DASHBOARD_PATHS: Record<string, string> = {
  arbitre: "/dashboard/arbitre",
  coach: "/dashboard/coach",
  club: "/dashboard/club",
  combattant: "/dashboard/combattant",
  fan: "/dashboard/fan",
  juge: "/dashboard/arbitre",
  organisateur: "/dashboard/organisateur",
  sponsor: "/dashboard/sponsor",
  super_admin: "/admin",
  vendeur: "/dashboard/vendeur",
};

export function getRoleDashboardPath(roleSlug?: string | null) {
  return ROLE_DASHBOARD_PATHS[roleSlug ?? ""] ?? "/dashboard";
}
