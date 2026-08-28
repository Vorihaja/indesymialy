import type {
  WorkspaceDefinition,
  WorkspaceNavigationItem,
  WorkspaceRole,
  WorkspaceSection,
} from "./types";

import {
  WORKSPACE_REGISTRY,
  resolveWorkspaceRoleFromPath,
} from "@/modules/workspace-registry";

/* =========================================================
   LABELS GÉNÉRIQUES
========================================================= */

const sectionLabels: Record<
  WorkspaceSection,
  string
> = {
  profile: "Profil",
  management: "Gestion",
  statistics: "Statistiques",
  documents: "Documents",
  calendar: "Calendrier",
  settings: "Paramètres",
  notifications: "Notifications",
};

/* =========================================================
   WORKSPACES
========================================================= */

const roles = Object.fromEntries(
  WORKSPACE_REGISTRY.map((entry) => [
    entry.workspaceRole,
    {
      role: entry.workspaceRole,
      label: entry.label,
      basePath: entry.basePath,
      description: entry.description,
    },
  ]),
) as Record<
  WorkspaceRole,
  Omit<WorkspaceDefinition, "navigation">
>;

/* =========================================================
   NAVIGATION PROFESSIONNELLE
========================================================= */

const professionalNavigation: Partial<
  Record<
    WorkspaceRole,
    ReadonlyArray<
      readonly [string, string]
    >
  >
> = {
  fighter: [
    ["licenses", "Licences"],
    ["medical", "Médical"],
    ["contracts", "Contrats"],
    ["sponsors", "Sponsors"],
    ["finance", "Finances"],
    ["subscription", "Abonnement"],
    ["compliance", "Conformité"],
  ],

  club: [
    ["licenses", "Licences"],
    ["memberships", "Adhésions"],
    ["contracts", "Contrats"],
    ["payments", "Paiements"],
    ["subscription", "Abonnement"],
    ["compliance", "Conformité"],
  ],

  coach: [
    ["licenses", "Licences"],
    ["contracts", "Contrats"],
    ["compliance", "Conformité"],
  ],

  referee: [
    ["licenses", "Licences"],
    ["contracts", "Contrats"],
    ["payments", "Paiements"],
  ],

  judge: [
    ["licenses", "Licences"],
    ["contracts", "Contrats"],
    ["payments", "Paiements"],
  ],

  sponsor: [
    ["contracts", "Contrats"],
    ["payments", "Paiements"],
    ["budget", "Budget"],
    ["compliance", "Conformité"],
  ],

  federation: [
    ["licenses", "Licences"],
    ["memberships", "Adhésions"],
    ["payments", "Paiements"],
    ["compliance", "Conformité"],
    ["reports", "Rapports financiers"],
  ],

  league: [
    ["licenses", "Licences"],
    ["memberships", "Adhésions"],
    ["payments", "Paiements"],
    ["compliance", "Conformité"],
    ["reports", "Rapports financiers"],
  ],
};

/* =========================================================
   NAVIGATION SPORTIVE
========================================================= */

const sportNavigation: Partial<
  Record<
    WorkspaceRole,
    ReadonlyArray<
      readonly [string, string]
    >
  >
> = {
  fighter: [
    ["training", "Entraînements"],
    ["programs", "Programmes"],
    ["attendance", "Présences"],
    ["assessments", "Évaluations"],
    ["objectives", "Objectifs"],
    [
      "fight-preparation",
      "Préparation combat",
    ],
    ["weight", "Poids"],
    ["career", "Carrière"],
    ["record", "Palmarès"],
    ["performance", "Performance"],
  ],

  coach: [
    ["athletes", "Athlètes"],
    ["training", "Entraînements"],
    ["programs", "Programmes"],
    ["attendance", "Présences"],
    ["assessments", "Évaluations"],
    ["objectives", "Objectifs"],
    [
      "fight-preparation",
      "Préparation combat",
    ],
    ["performance", "Performance"],
  ],

  club: [
    ["training", "Entraînements"],
    ["programs", "Programmes"],
    ["attendance", "Présences"],
    ["performance", "Performance"],
    ["talent-pool", "Talents"],
    ["scouting", "Détection"],
  ],

  federation: [
    ["talent-pool", "Vivier de talents"],
    ["scouting", "Détection"],
    [
      "performance",
      "Performance sportive",
    ],
    ["rankings", "Classements"],
    [
      "development-programs",
      "Programmes sportifs",
    ],
  ],

  league: [
    ["talent-pool", "Vivier de talents"],
    ["scouting", "Détection"],
    [
      "performance",
      "Performance sportive",
    ],
    ["rankings", "Classements"],
    [
      "development-programs",
      "Programmes sportifs",
    ],
  ],
};

/* =========================================================
   ADMIN
========================================================= */

const adminSportNavigation = [
  [
    "sport-performance",
    "Performance sportive",
  ],
  ["talent-pool", "Vivier de talents"],
  [
    "training-analytics",
    "Analyses des entraînements",
  ],
  [
    "career-integrity",
    "Intégrité carrières",
  ],
] as const;

const adminProfessionalNavigation = [
  ["licenses", "Licences"],
  [
    "medical-compliance",
    "Conformité médicale",
  ],
  ["contracts", "Contrats"],
  ["payments", "Paiements"],
  ["subscriptions", "Abonnements"],
  ["compliance", "Conformité"],
] as const;

const adminOperationsNavigation = [
  ["support", "Support"],
  ["feedback", "Feedback"],
  ["bug-reports", "Anomalies"],
  ["cms", "CMS"],
  ["announcements", "Annonces"],
  ["incidents", "Incidents"],
  ["maintenance", "Maintenance"],
  ["changelog", "Journal des modifications"],
  ["legal", "Pages légales"],
  ["consents", "Consentements"],
  [
    "public-settings",
    "Paramètres publics",
  ],
] as const;

/* =========================================================
   ORGANISATEUR — ROUTES EXISTANTES
========================================================= */

const organizerSections = [
  ["events", "Événements"],
  ["competitions", "Compétitions"],
  ["fight-cards", "Cartes des combats"],
  ["fights", "Combats"],
  ["fighters", "Combattants"],
  ["clubs", "Clubs"],
  ["registrations", "Inscriptions"],
  ["categories", "Catégories"],
  ["weigh-in", "Pesée"],
  ["ticketing", "Billetterie"],
  ["sponsors", "Sponsors"],
  ["partners", "Partenaires"],
  ["officials", "Officiels"],
  ["referees", "Arbitres"],
  ["judges", "Juges"],
  ["staff", "Personnel"],
  ["volunteers", "Bénévoles"],
  ["planning", "Planning"],
  ["checklists", "Checklists"],
  ["documents", "Documents"],
  ["contracts", "Contrats"],
  ["payments", "Paiements"],
  ["budget", "Budget"],
  ["finance", "Finance"],
  [
    "event-marketplace",
    "Marketplace de l’événement",
  ],
  [
    "communication",
    "Communication",
  ],
  ["messages", "Messages"],
  ["notifications", "Notifications"],
  ["fight-live", "Combat en direct"],
  ["results", "Résultats"],
  ["reports", "Rapports"],
  ["statistics", "Statistiques"],
  ["settings", "Paramètres"],
] as const;

/* =========================================================
   ORGANISATEUR — NOUVELLE ARCHITECTURE MÉTIER
========================================================= */

export type OrganizerWorkspaceArea = {
  id:
    | "overview"
    | "events"
    | "fight-center"
    | "ticketing"
    | "team"
    | "partners"
    | "operations"
    | "finance"
    | "performance";

  label: string;

  description: string;

  sections: readonly string[];

  capabilities:
    readonly string[];
};

export const organizerWorkspaceAreas:
  readonly OrganizerWorkspaceArea[] = [
    {
      id: "overview",
      label: "Vue d’ensemble",
      description:
        "Pilotage instantané de l’activité organisateur.",
      sections: ["dashboard"],
      capabilities: [
        "Tableau de bord",
        "KPI",
        "Alertes",
        "Activité récente",
        "Prochains événements",
      ],
    },

    {
      id: "events",
      label: "Événements",
      description:
        "Préparation et gestion complète des événements et compétitions.",
      sections: [
        "events",
        "competitions",
        "registrations",
        "categories",
        "clubs",
      ],
      capabilities: [
        "Événements",
        "Compétitions",
        "Inscriptions",
        "Catégories",
        "Clubs engagés",
      ],
    },

    {
      id: "fight-center",
      label: "Centre des combats",
      description:
        "Centre opérationnel des combats et du combat en direct.",
      sections: [
        "fight-cards",
        "fights",
        "fighters",
        "weigh-in",
        "fight-live",
      ],
      capabilities: [
        "Cartes des combats",
        "Combats",
        "Combattants",
        "Pesée",
        "Remplacements",
        "Combat en direct",
      ],
    },

    {
      id: "ticketing",
      label: "Billetterie",
      description:
        "Pilotage commercial et opérationnel des billets et accès.",
      sections: [
        "ticketing",
      ],
      capabilities: [
        "Types de billets",
        "Ventes",
        "Quotas",
        "Accès",
        "Remboursements",
        "Remplissage",
      ],
    },

    {
      id: "team",
      label: "Équipe",
      description:
        "Gestion des personnes mobilisées pour l’événement.",
      sections: [
        "staff",
        "volunteers",
        "referees",
        "judges",
        "officials",
      ],
      capabilities: [
        "Personnel",
        "Bénévoles",
        "Arbitres",
        "Juges",
        "Officiels",
        "Affectations",
      ],
    },

    {
      id: "partners",
      label: "Partenaires",
      description:
        "Gestion commerciale des sponsors et partenaires.",
      sections: [
        "sponsors",
        "partners",
        "contracts",
      ],
      capabilities: [
        "Sponsors",
        "Partenaires",
        "Contrats",
        "Visibilité",
        "Activations",
      ],
    },

    {
      id: "operations",
      label: "Opérations",
      description:
        "Coordination opérationnelle et logistique de l’événement.",
      sections: [
        "planning",
        "checklists",
        "documents",
        "communication",
      ],
      capabilities: [
        "Planning",
        "Checklists",
        "Logistique",
        "Documents",
        "Communication",
      ],
    },

    {
      id: "finance",
      label: "Finances",
      description:
        "Pilotage financier, budgétaire et transactionnel.",
      sections: [
        "budget",
        "finance",
        "payments",
        "event-marketplace",
      ],
      capabilities: [
        "Budget",
        "Revenus",
        "Dépenses",
        "Paiements",
        "Transactions",
      ],
    },

    {
      id: "performance",
      label: "Performance",
      description:
        "Analyse des résultats et de la performance événementielle.",
      sections: [
        "results",
        "statistics",
        "reports",
      ],
      capabilities: [
        "Résultats",
        "Statistiques",
        "Rapports",
        "Analyses",
      ],
    },
  ];

/* =========================================================
   WORKSPACE DEFINITION
========================================================= */

export function getWorkspaceDefinition(
  role: WorkspaceRole,
): WorkspaceDefinition {
  const definition =
    roles[role];

  if (role === "organizer") {
    return {
      ...definition,

      navigation: [
        {
          href:
            definition.basePath,
          label:
            "Tableau de bord",
          section:
            "dashboard",
        },

        ...organizerSections.map(
          ([section, label]) => ({
            href:
              `${definition.basePath}/${section}`,
            label,
            section,
          }),
        ),
      ],
    };
  }

  if (
    role === "admin" ||
    role === "super-admin"
  ) {
    const adminSections = [
      ["users", "Utilisateurs"],
      ["roles", "Rôles"],
      [
        "role-requests",
        "Demandes de rôles",
      ],
      [
        "permissions",
        "Permissions",
      ],
      [
        "organizations",
        "Organisations",
      ],
      ["clubs", "Clubs"],
      ["fighters", "Combattants"],
      ["events", "Événements"],
      ["ticketing", "Billetterie"],
      [
        "event-reports",
        "Rapports événements",
      ],
      [
        "moderation",
        "Modération",
      ],
      ["social", "Social"],
      [
        "marketplace",
        "Marketplace",
      ],
      [
        "reports",
        "Signalements",
      ],
      ["analytics", "Analyses"],
      [
        "audit-log",
        "Journal d’activité",
      ],
      [
        "platform-health",
        "Santé plateforme",
      ],
      ["settings", "Paramètres"],
    ] as const;

    return {
      ...definition,

      navigation: [
        {
          href:
            definition.basePath,
          label:
            "Tableau de bord",
          section:
            "dashboard",
        },

        ...adminProfessionalNavigation.map(
          ([section, label]) => ({
            href:
              `${definition.basePath}/${section}`,
            label,
            section,
          }),
        ),

        ...adminSportNavigation.map(
          ([section, label]) => ({
            href:
              `${definition.basePath}/${section}`,
            label,
            section,
          }),
        ),

        ...adminOperationsNavigation.map(
          ([section, label]) => ({
            href:
              `${definition.basePath}/${section}`,
            label,
            section,
          }),
        ),

        ...adminSections.map(
          ([section, label]) => ({
            href:
              `${definition.basePath}/${section}`,
            label,
            section,
          }),
        ),
      ],
    };
  }

  const navigation:
    WorkspaceNavigationItem[] = [
      {
        href:
          definition.basePath,
        label:
          "Tableau de bord",
        section:
          "dashboard",
      },

      {
        href:
          `${definition.basePath}/messages`,
        label:
          "Messages",
        section:
          "messages",
      },

      ...(role === "club"
        ? [
            {
              href:
                `${definition.basePath}/competitions`,
              label:
                "Compétitions",
              section:
                "competitions",
            },

            {
              href:
                `${definition.basePath}/registrations`,
              label:
                "Inscriptions",
              section:
                "registrations",
            },
          ]
        : []),

      ...(role === "fighter"
        ? [
            {
              href:
                `${definition.basePath}/events`,
              label:
                "Événements",
              section:
                "events",
            },

            {
              href:
                `${definition.basePath}/registrations`,
              label:
                "Inscriptions",
              section:
                "registrations",
            },
          ]
        : []),

      ...(role === "referee" ||
      role === "judge"
        ? [
            {
              href:
                `${definition.basePath}/assignments`,
              label:
                "Affectations",
              section:
                "assignments",
            },

            {
              href:
                `${definition.basePath}/fight-live`,
              label:
                "Combat en direct",
              section:
                "fight-live",
            },
          ]
        : []),

      ...(
        professionalNavigation[
          role
        ] ?? []
      ).map(
        ([section, label]) => ({
          href:
            `${definition.basePath}/${section}`,
          label,
          section,
        }),
      ),

      ...(
        sportNavigation[
          role
        ] ?? []
      ).map(
        ([section, label]) => ({
          href:
            `${definition.basePath}/${section}`,
          label,
          section,
        }),
      ),

      ...Object.entries(
        sectionLabels,
      ).map(
        ([section, label]) => ({
          href:
            `${definition.basePath}/${section}`,
          label,
          section:
            section as WorkspaceSection,
        }),
      ),
    ];

  return {
    ...definition,
    navigation,
  };
}

/* =========================================================
   HELPERS
========================================================= */

export function getWorkspaceSectionLabel(
  section: WorkspaceSection,
): string {
  return sectionLabels[
    section
  ];
}

export function resolveWorkspaceRole(
  pathname: string,
): WorkspaceRole | null {
  return resolveWorkspaceRoleFromPath(pathname);
}
