import {
  getWorkspaceDashboardPath,
} from "@/modules/workspace-registry";

import type {
  WorkspaceTechnicalRole,
} from "@/modules/workspace-registry";

import type {
  RbacProtectionType,
} from "./rbac-routes";

export interface NavigationItem {
  label: string;
  route: string;
  icon?: string;
  guard: RbacProtectionType;
  role?: string;
  permission?: string;
  target: "topbar" | "sidebar" | "both";
  scope?: WorkspaceTechnicalRole | "moderator";
}

function workspaceRoute(
  role: WorkspaceTechnicalRole,
  suffix = "",
) {
  return `${getWorkspaceDashboardPath(role)}${suffix}`;
}

/**
 * Configuration de navigation historique.
 *
 * Les routes racines ERP proviennent désormais du Workspace Registry.
 * Ce fichier reste une façade de compatibilité pour les consommateurs
 * existants, notamment l’AdminSidebar.
 */
export const NAVIGATION_ITEMS: NavigationItem[] = [
  // Navigation publique
  {
    label: "Accueil",
    route: "/",
    icon: "Home",
    guard: "public",
    target: "topbar",
    scope: "fan",
  },
  {
    label: "Actualités",
    route: "/actualites",
    icon: "Newspaper",
    guard: "public",
    target: "topbar",
    scope: "fan",
  },
  {
    label: "Événements",
    route: "/events",
    icon: "Calendar",
    guard: "public",
    target: "topbar",
    scope: "fan",
  },
  {
    label: "Discussions",
    route: "/discussion",
    icon: "MessageSquareText",
    guard: "public",
    target: "topbar",
  },
  {
    label: "Classements",
    route: "/rankings",
    icon: "Trophy",
    guard: "public",
    target: "topbar",
  },
  {
    label: "Combattants",
    route: "/fighters",
    icon: "Swords",
    guard: "public",
    target: "topbar",
  },
  {
    label: "Clubs",
    route: "/clubs",
    icon: "Shield",
    guard: "public",
    target: "topbar",
  },
  {
    label: "Médias",
    route: "/media",
    icon: "Images",
    guard: "public",
    target: "topbar",
  },
  {
    label: "Recherche",
    route: "/search",
    icon: "Search",
    guard: "public",
    target: "topbar",
  },
  {
    label: "Annuaires",
    route: "/annuaire",
    icon: "FolderOpen",
    guard: "public",
    target: "topbar",
  },
  {
    label: "Marketplace",
    route: "/marketplace",
    icon: "ShoppingBag",
    guard: "public",
    target: "topbar",
  },
  {
    label: "Profil",
    route: "/dashboard",
    icon: "User",
    guard: "auth",
    target: "topbar",
    scope: "fan",
  },

  // Combattant — compatibilité de l’ancienne navigation
  {
    label: "Vue d’ensemble",
    route: workspaceRoute("fighter"),
    icon: "LayoutDashboard",
    guard: "business_role",
    role: "fighter",
    target: "sidebar",
    scope: "fighter",
  },
  {
    label: "Mon profil",
    route: workspaceRoute("fighter", "?module=profil"),
    icon: "User",
    guard: "business_role",
    role: "fighter",
    target: "sidebar",
    scope: "fighter",
  },
  {
    label: "Palmarès et statistiques",
    route: workspaceRoute("fighter", "?module=palmares"),
    icon: "Trophy",
    guard: "business_role",
    role: "fighter",
    target: "sidebar",
    scope: "fighter",
  },
  {
    label: "Mes combats",
    route: workspaceRoute("fighter", "?module=combats"),
    icon: "Swords",
    guard: "business_role",
    role: "fighter",
    target: "sidebar",
    scope: "fighter",
  },
  {
    label: "Invitations / Défis",
    route: workspaceRoute("fighter", "?module=invitations"),
    icon: "Mail",
    guard: "business_role",
    role: "fighter",
    target: "sidebar",
    scope: "fighter",
  },
  {
    label: "Entraînements",
    route: workspaceRoute("fighter", "?module=entrainements"),
    icon: "Dumbbell",
    guard: "business_role",
    role: "fighter",
    target: "sidebar",
    scope: "fighter",
  },
  {
    label: "Santé",
    route: workspaceRoute("fighter", "?module=medical"),
    icon: "HeartPulse",
    guard: "business_role",
    role: "fighter",
    target: "sidebar",
    scope: "fighter",
  },
  {
    label: "Suivi du poids",
    route: workspaceRoute("fighter", "?module=poids"),
    icon: "Scale",
    guard: "business_role",
    role: "fighter",
    target: "sidebar",
    scope: "fighter",
  },
  {
    label: "Finances",
    route: workspaceRoute("fighter", "?module=finances"),
    icon: "Wallet",
    guard: "business_role",
    role: "fighter",
    target: "sidebar",
    scope: "fighter",
  },
  {
    label: "Contrats et documents",
    route: workspaceRoute("fighter", "?module=documents"),
    icon: "FileText",
    guard: "business_role",
    role: "fighter",
    target: "sidebar",
    scope: "fighter",
  },

  // Entraîneur — compatibilité
  {
    label: "Vue d’ensemble",
    route: workspaceRoute("coach"),
    icon: "LayoutDashboard",
    guard: "business_role",
    role: "coach",
    target: "sidebar",
    scope: "coach",
  },
  {
    label: "Gestion des athlètes",
    route: workspaceRoute("coach", "?module=roster"),
    icon: "Users",
    guard: "business_role",
    role: "coach",
    target: "sidebar",
    scope: "coach",
  },
  {
    label: "Entraînements",
    route: workspaceRoute("coach", "?module=trainings"),
    icon: "Dumbbell",
    guard: "business_role",
    role: "coach",
    target: "sidebar",
    scope: "coach",
  },
  {
    label: "Planning",
    route: workspaceRoute("coach", "?module=camps"),
    icon: "Calendar",
    guard: "business_role",
    role: "coach",
    target: "sidebar",
    scope: "coach",
  },

  // Club — compatibilité
  {
    label: "Gestion du club",
    route: workspaceRoute("club", "/[orgId]"),
    icon: "LayoutDashboard",
    guard: "business_role",
    role: "club",
    target: "sidebar",
    scope: "club",
  },
  {
    label: "Équipe",
    route: workspaceRoute("club", "/[orgId]?module=MEMBRES"),
    icon: "Users",
    guard: "business_role",
    role: "club",
    target: "sidebar",
    scope: "club",
  },
  {
    label: "Événements",
    route: workspaceRoute("club", "/[orgId]?module=PLANNING"),
    icon: "Calendar",
    guard: "business_role",
    role: "club",
    target: "sidebar",
    scope: "club",
  },

  // Administration — route canonique /dashboard/admin
  {
    label: "Tableau de bord",
    route: workspaceRoute("admin"),
    icon: "LayoutDashboard",
    guard: "system_role",
    role: "admin",
    target: "sidebar",
    scope: "admin",
  },
  {
    label: "Utilisateurs",
    route: workspaceRoute("admin", "/users"),
    icon: "Users",
    guard: "system_role",
    role: "admin",
    target: "sidebar",
    scope: "admin",
  },
  {
    label: "Modération",
    route: workspaceRoute("admin", "/moderation"),
    icon: "ShieldAlert",
    guard: "system_role",
    role: "admin",
    target: "sidebar",
    scope: "admin",
  },
  {
    label: "Analyses",
    route: workspaceRoute("admin", "/analytics"),
    icon: "Activity",
    guard: "system_role",
    role: "admin",
    target: "sidebar",
    scope: "admin",
  },
  {
    label: "Paramètres",
    route: workspaceRoute("admin", "/settings"),
    icon: "Settings",
    guard: "system_role",
    role: "admin",
    target: "sidebar",
    scope: "admin",
  },
];
