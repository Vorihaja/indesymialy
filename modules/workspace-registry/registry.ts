import type {
  WorkspaceRegistryEntry,
  WorkspaceRouteRole,
  WorkspaceTechnicalRole,
} from "./types";

export const WORKSPACE_REGISTRY = [
  {
    technicalRole: "super_admin",
    workspaceRole: "super-admin",
    label: "Super administrateur",
    basePath: "/vh-teck",
    description: "Gouvernance globale de la plateforme",
    accessKind: "system",
    aliases: ["super-admin", "super admin", "super_administrateur"],
  },
  {
    technicalRole: "admin",
    workspaceRole: "admin",
    label: "Administrateur",
    basePath: "/dashboard/admin",
    description: "Administration opÃ©rationnelle",
    accessKind: "system",
    aliases: ["administrateur"],
  },
  {
    technicalRole: "federation",
    workspaceRole: "federation",
    label: "FÃ©dÃ©ration",
    basePath: "/dashboard/federation",
    description: "Pilotage fÃ©dÃ©ral des disciplines",
    accessKind: "business",
    aliases: ["fÃ©dÃ©ration"],
  },
  {
    technicalRole: "league",
    workspaceRole: "league",
    label: "Ligue",
    basePath: "/dashboard/ligue",
    description: "Coordination rÃ©gionale des clubs",
    accessKind: "business",
    aliases: ["ligue"],
  },
  {
    technicalRole: "club",
    workspaceRole: "club",
    label: "Club",
    basePath: "/dashboard/club",
    description: "Gestion et activitÃ© du club",
    accessKind: "business",
    aliases: ["dojo"],
  },
  {
    technicalRole: "coach",
    workspaceRole: "coach",
    label: "EntraÃ®neur",
    basePath: "/dashboard/coach",
    description: "Encadrement sportif et suivi des athlÃ¨tes",
    accessKind: "business",
    aliases: ["entraineur", "entraÃ®neur"],
  },
  {
    technicalRole: "fighter",
    workspaceRole: "fighter",
    label: "Combattant",
    basePath: "/dashboard/combattant",
    description: "CarriÃ¨re, entraÃ®nement et compÃ©titions",
    accessKind: "business",
    aliases: ["combattant"],
  },
  {
    technicalRole: "organizer",
    workspaceRole: "organizer",
    label: "Organisateur",
    basePath: "/dashboard/organisateur",
    description: "RÃ©gie complÃ¨te des Ã©vÃ©nements de combat",
    accessKind: "business",
    aliases: ["organisateur"],
  },
  {
    technicalRole: "referee",
    workspaceRole: "referee",
    label: "Arbitre",
    basePath: "/dashboard/arbitre",
    description: "DÃ©signations et rapports dâ€™arbitrage",
    accessKind: "business",
    aliases: ["arbitre"],
  },
  {
    technicalRole: "judge",
    workspaceRole: "judge",
    label: "Juge",
    basePath: "/dashboard/juge",
    description: "Jugement, pointage et Ã©valuations",
    accessKind: "business",
    aliases: ["juge"],
  },
  {
    technicalRole: "sponsor",
    workspaceRole: "sponsor",
    label: "Sponsor",
    basePath: "/dashboard/sponsor",
    description: "Partenariats et suivi des campagnes",
    accessKind: "business",
    aliases: ["partenaire"],
  },
  {
    technicalRole: "seller",
    workspaceRole: "seller",
    label: "Vendeur",
    basePath: "/dashboard/vendeur",
    description: "Gestion commerciale du vendeur",
    accessKind: "business",
    aliases: ["vendeur"],
  },
  {
    technicalRole: "fan",
    workspaceRole: "fan",
    label: "Supporter",
    basePath: "/dashboard/fan",
    description: "ExpÃ©rience et prÃ©fÃ©rences du supporter",
    accessKind: "business",
    aliases: ["supporter"],
  },
] as const satisfies readonly WorkspaceRegistryEntry[];

function normalizeRoleKey(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

const entryByTechnicalRole = new Map<
  WorkspaceTechnicalRole,
  WorkspaceRegistryEntry
>(
  WORKSPACE_REGISTRY.map((entry) => [
    entry.technicalRole,
    entry,
  ]),
);

const technicalRoleByAlias = new Map<
  string,
  WorkspaceTechnicalRole
>();

for (const entry of WORKSPACE_REGISTRY) {
  technicalRoleByAlias.set(
    normalizeRoleKey(entry.technicalRole),
    entry.technicalRole,
  );

  technicalRoleByAlias.set(
    normalizeRoleKey(entry.workspaceRole),
    entry.technicalRole,
  );

  technicalRoleByAlias.set(
    normalizeRoleKey(entry.label),
    entry.technicalRole,
  );

  for (const alias of entry.aliases) {
    technicalRoleByAlias.set(
      normalizeRoleKey(alias),
      entry.technicalRole,
    );
  }
}

function findWorkspaceEntryFromPath(
  pathname: string,
): WorkspaceRegistryEntry | null {
  const match = [...WORKSPACE_REGISTRY]
    .sort(
      (left, right) =>
        right.basePath.length - left.basePath.length,
    )
    .find(
      (entry) =>
        pathname === entry.basePath ||
        pathname.startsWith(`${entry.basePath}/`),
    );

  return match ?? null;
}

export function normalizeWorkspaceTechnicalRole(
  role?: string | null,
): WorkspaceTechnicalRole | null {
  if (!role) {
    return null;
  }

  return (
    technicalRoleByAlias.get(
      normalizeRoleKey(role),
    ) ?? null
  );
}

export function getWorkspaceRegistryEntry(
  role?: string | null,
): WorkspaceRegistryEntry | null {
  const technicalRole =
    normalizeWorkspaceTechnicalRole(role);

  return technicalRole
    ? entryByTechnicalRole.get(technicalRole) ?? null
    : null;
}

export function getWorkspaceDashboardPath(
  role?: string | null,
): string {
  return (
    getWorkspaceRegistryEntry(role)?.basePath ??
    "/dashboard"
  );
}

export function getWorkspaceLabel(
  role?: string | null,
): string | null {
  return (
    getWorkspaceRegistryEntry(role)?.label ??
    null
  );
}

export function resolveWorkspaceRoleFromPath(
  pathname: string,
): WorkspaceRouteRole | null {
  return (
    findWorkspaceEntryFromPath(pathname)
      ?.workspaceRole ?? null
  );
}

export function resolveWorkspaceTechnicalRoleFromPath(
  pathname: string,
): WorkspaceTechnicalRole | null {
  return (
    findWorkspaceEntryFromPath(pathname)
      ?.technicalRole ?? null
  );
}

export const WORKSPACE_TECHNICAL_DASHBOARD_PATHS =
  Object.fromEntries(
    WORKSPACE_REGISTRY.map((entry) => [
      entry.technicalRole,
      entry.basePath,
    ]),
  ) as Record<WorkspaceTechnicalRole, string>;

export const WORKSPACE_DASHBOARD_PATHS: Record<
  string,
  string
> = (() => {
  const paths: Record<string, string> = {};

  for (const entry of WORKSPACE_REGISTRY) {
    paths[entry.technicalRole] = entry.basePath;
    paths[entry.workspaceRole] = entry.basePath;

    for (const alias of entry.aliases) {
      paths[alias] = entry.basePath;
      paths[normalizeRoleKey(alias)] = entry.basePath;
    }
  }

  return paths;
})();
