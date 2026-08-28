import type {
  OrganizerOperationsRepository,
} from "./organizer-operations.repository";

import type {
  OrganizerDashboardSnapshot,
  OrganizerSection,
  OrganizerSectionSnapshot,
} from "../types";

const labels: Record<
  OrganizerSection,
  readonly [
    string,
    string,
    string,
  ]
> = {
  competitions: [
    "COMPÉTITION",
    "Compétitions",
    "Pilotez championnats, tournois, formats et règlements depuis une régie unique.",
  ],

  "fight-cards": [
    "PROGRAMMATION",
    "Fight Cards",
    "Composez le Main Event, le Co-Main Event et les préliminaires avec une lecture broadcast.",
  ],

  fights: [
    "SPORTIF",
    "Combats",
    "Suivez la programmation, les statuts, les remplacements et la connexion Fight Live.",
  ],

  fighters: [
    "ATHLÈTES",
    "Combattants",
    "Centralisez invitations, licences, poids, certificats, contrats et disponibilités.",
  ],

  clubs: [
    "RÉSEAU",
    "Clubs",
    "Coordonnez les clubs engagés, leurs délégations et leurs responsables.",
  ],

  registrations: [
    "ADMISSIONS",
    "Inscriptions",
    "Validez les dossiers sportifs et les pièces requises avant la clôture.",
  ],

  categories: [
    "RÈGLEMENT",
    "Catégories",
    "Structurez divisions, poids, âges et règles d’éligibilité de la compétition.",
  ],

  "weigh-in": [
    "CONTRÔLE",
    "Pesée",
    "Orchestrez convocations, passages, tolérances et décisions officielles.",
  ],

  ticketing: [
    "REVENUS",
    "Billetterie",
    "Préparez le plan de salle, les tarifs, coupons, QR codes et contrôles d’accès.",
  ],

  sponsors: [
    "BUSINESS",
    "Sponsors",
    "Pilotez prospection, pipeline, contrats, livrables, visibilité et règlements.",
  ],

  partners: [
    "ÉCOSYSTÈME",
    "Partenaires",
    "Coordonnez fournisseurs, diffuseurs, institutions et partenaires opérationnels.",
  ],

  officials: [
    "OFFICIELS",
    "Officiels",
    "Consolidez affectations, confirmations, documents et rémunérations.",
  ],

  referees: [
    "ARBITRAGE",
    "Arbitres",
    "Préparez disponibilités, désignations et rotations des arbitres.",
  ],

  judges: [
    "SCORING",
    "Juges",
    "Affectez les tables, vérifiez les confirmations et préparez le scoring.",
  ],

  staff: [
    "OPÉRATIONS",
    "Staff",
    "Planifiez missions, disponibilités, check-in, présence et paiements.",
  ],

  volunteers: [
    "ÉQUIPES",
    "Bénévoles",
    "Répartissez les bénévoles par zone, créneau et responsable.",
  ],

  planning: [
    "TIMELINE",
    "Planning",
    "Synchronisez les jalons sportifs, techniques, médias et accueil public.",
  ],

  checklists: [
    "READINESS",
    "Checklists",
    "Suivez les contrôles répartis sur tout le cycle de l’événement.",
  ],

  budget: [
    "PILOTAGE",
    "Budget",
    "Confrontez budget, engagé, réalisé et prévisions de clôture.",
  ],

  "event-marketplace": [
    "COMMERCE",
    "Marketplace événement",
    "Préparez produits, locations, stocks, points de vente et vendeurs agréés.",
  ],

  communication: [
    "MÉDIAS",
    "Communication",
    "Orchestrez campagnes, contenus, presse, annonces et diffusion partenaire.",
  ],

  results: [
    "APRÈS-COMBAT",
    "Résultats",
    "Validez décisions, palmarès, classements et publication des résultats.",
  ],

  reports: [
    "REPORTING",
    "Rapports",
    "Centralisez les rapports financier, sportif, médical, incidents, sponsors et officiels.",
  ],

  statistics: [
    "ANALYSE",
    "Statistiques",
    "Analysez remplissage, revenus, audience, performance sportive et efficacité opérationnelle.",
  ],

  settings: [
    "CONFIGURATION",
    "Paramètres",
    "Configurez les préférences de production, règles, notifications et identité organisateur.",
  ],
};

const capabilities: Record<
  OrganizerSection,
  string[]
> = {
  competitions: [
    "Création et duplication",
    "Formats gala, tournoi, championnat",
    "Règlements et timeline",
    "Publication, report et archivage",
  ],

  "fight-cards": [
    "Drag & Drop préparé",
    "Main Event et Co-Main Event",
    "Préliminaires et remplacements",
    "Pesée, statut et lien Fight Live",
  ],

  fights: [
    "Programmation",
    "Validation des oppositions",
    "Statuts et remplacements",
    "Synchronisation Fight Live",
  ],

  fighters: [
    "Invitations et validation",
    "Licence et poids",
    "Certificat médical et contrat",
    "Historique et disponibilités",
  ],

  clubs: [
    "Délégations engagées",
    "Responsables de club",
    "Documents et accréditations",
    "Historique de participation",
  ],

  registrations: [
    "Dossiers entrants",
    "Contrôle des pièces",
    "Éligibilité sportive",
    "Acceptation et liste d’attente",
  ],

  categories: [
    "Divisions de poids",
    "Classes d’âge",
    "Disciplines et règles",
    "Quotas et éligibilité",
  ],

  "weigh-in": [
    "Planning de passage",
    "Saisie des poids",
    "Tolérances et alertes",
    "Décisions officielles",
  ],

  ticketing: [
    "Plan de salle et tarifs",
    "Coupons et quotas",
    "QR Code et contrôle accès",
    "Statistiques et remboursements",
  ],

  sponsors: [
    "Prospection et pipeline",
    "Contrats et paiements",
    "Livrables et visibilité",
    "Historique partenaire",
  ],

  partners: [
    "Fournisseurs et institutions",
    "Diffuseurs et médias",
    "Engagements contractuels",
    "Contacts opérationnels",
  ],

  officials: [
    "Affectations et confirmations",
    "Documents obligatoires",
    "Rémunérations",
    "Historique des missions",
  ],

  referees: [
    "Disponibilités",
    "Désignations par combat",
    "Rotations et pauses",
    "Rapports d’arbitrage",
  ],

  judges: [
    "Tables de jugement",
    "Affectations par combat",
    "Confirmations",
    "Préparation du scoring",
  ],

  staff: [
    "Planning et disponibilités",
    "Missions et zones",
    "Check-in et présence",
    "Paiements",
  ],

  volunteers: [
    "Recrutement et validation",
    "Créneaux et postes",
    "Responsables de zone",
    "Présence et attestations",
  ],

  planning: [
    "Jalons de production",
    "Run of show",
    "Créneaux équipes",
    "Alertes de dépendance",
  ],

  checklists: [
    "Tâches opérationnelles",
    "Catégories métier",
    "Priorités critiques",
    "Progression globale",
  ],

  budget: [
    "Budget initial",
    "Engagé et réalisé",
    "Écarts et prévisions",
    "Clôture événement",
  ],

  "event-marketplace": [
    "Catalogue événement",
    "Vente, location, occasion",
    "Stocks et vendeurs",
    "Points de vente",
  ],

  communication: [
    "Calendrier éditorial",
    "Presse et accréditations",
    "Campagnes et annonces",
    "Contenus partenaires",
  ],

  results: [
    "Décisions officielles",
    "Palmarès et classements",
    "Validation post-combat",
    "Publication publique",
  ],

  reports: [
    "Financier et billetterie",
    "Sportif et Fight Live",
    "Incidents et médical",
    "Sponsors et officiels",
  ],

  statistics: [
    "Audience et remplissage",
    "Revenus et conversion",
    "Performance sportive",
    "Efficacité opérationnelle",
  ],

  settings: [
    "Identité organisateur",
    "Préférences de production",
    "Règles et notifications",
    "Configuration des accès",
  ],
};

const checklistTemplates = [
  [
    "admin",
    "Administration",
    12,
  ],

  [
    "sport",
    "Sportif",
    19,
  ],

  [
    "tech",
    "Technique",
    13,
  ],

  [
    "comms",
    "Communication",
    11,
  ],

  [
    "security",
    "Sécurité",
    10,
  ],

  [
    "medical",
    "Médical",
    9,
  ],

  [
    "tickets",
    "Billetterie",
    10,
  ],

  [
    "sponsors",
    "Sponsors",
    9,
  ],

  [
    "stream",
    "Streaming",
    8,
  ],

  [
    "live",
    "Fight Live",
    9,
  ],

  [
    "awards",
    "Remises de prix",
    6,
  ],

  [
    "post",
    "Post Event",
    8,
  ],
] as const;

const dashboard:
  OrganizerDashboardSnapshot = {
  generatedAt:
    "Templates mémoire uniquement",

  eventName:
    "Aucun événement mémoire",

  eventCountdown:
    "N/C",

  activeEvent: null,

  readiness: 0,

  readinessDomains: [],

  operationalStatus: [],

  quickActions: [
    {
      id: "new-event",
      label:
        "Créer un événement",
      detail:
        "Démarrer une nouvelle production.",
      href:
        "/dashboard/organisateur/events/new",
      tone: "primary",
    },

    {
      id: "events",
      label:
        "Événements",
      detail:
        "Ouvrir le portefeuille événementiel.",
      href:
        "/dashboard/organisateur/events",
      tone: "neutral",
    },

    {
      id: "fight-card",
      label:
        "Fight Center",
      detail:
        "Préparer combats et Fight Cards.",
      href:
        "/dashboard/organisateur/fight-cards",
      tone: "neutral",
    },

    {
      id: "tickets",
      label:
        "Billetterie",
      detail:
        "Piloter ventes et remplissage.",
      href:
        "/dashboard/organisateur/ticketing",
      tone: "neutral",
    },

    {
      id: "checklists",
      label:
        "Checklists",
      detail:
        "Traiter les tâches opérationnelles.",
      href:
        "/dashboard/organisateur/checklists",
      tone: "neutral",
    },

    {
      id: "live",
      label:
        "Fight Live",
      detail:
        "Accéder à la régie sportive.",
      href:
        "/dashboard/organisateur/fight-live",
      tone: "danger",
    },
  ],

  metrics: [],

  events: [],

  alerts: [],

  activities: [],

  checklist:
    checklistTemplates.map(
      (
        [
          id,
          label,
          total,
        ],
      ) => ({
        id,
        label,
        total,
        completed: 0,
        critical: 0,
      }),
    ),

  weather: {
    status:
      "Prévision non persistée",
    temperature: "N/C",
    wind: "N/C",
    confidence:
      "Connexion météo future",
  },

  liveReady: false,
};

export class OrganizerOperationsMemoryRepository
  implements OrganizerOperationsRepository
{
  async getDashboard() {
    return dashboard;
  }

  async setActiveEvent() {
    return dashboard;
  }

  async getSection(
    section: OrganizerSection,
  ): Promise<OrganizerSectionSnapshot> {
    const [
      eyebrow,
      title,
      description,
    ] = labels[section];

    return {
      section,
      eyebrow,
      title,
      description,

      readiness: 0,

      metrics: [
        {
          id: "storage",
          label: "Stockage",
          value: "N/C",
          detail:
            "Capacité sans table compatible.",
          connected: false,
          source:
            "Template mémoire",
        },

        {
          id: "runtime",
          label: "Runtime",
          value: "N/C",
          detail:
            "Connexion future requise.",
          connected: false,
          source:
            "Template mémoire",
        },
      ],

      workflow: [
        {
          id: "prepare",
          label:
            "Préparation et collecte",
          owner: "À définir",
          due: "Non persisté",
          status: "planned",
        },

        {
          id: "validate",
          label:
            "Contrôle et validation",
          owner: "À définir",
          due: "Non persisté",
          status: "planned",
        },

        {
          id: "confirm",
          label:
            "Confirmations externes",
          owner: "À définir",
          due: "Non persisté",
          status: "planned",
        },

        {
          id: "publish",
          label:
            "Publication et diffusion",
          owner: "À définir",
          due: "Non persisté",
          status: "planned",
        },
      ],

      alerts: [],

      primaryAction:
        section === "reports"
          ? "Préparer un rapport"
          : section ===
              "checklists"
            ? "Préparer une tâche"
            : "Configurer un événement",

      capabilities:
        capabilities[section],
    };
  }
}