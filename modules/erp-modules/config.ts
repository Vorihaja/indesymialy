import type { ErpModuleDefinition } from "@/modules/erp-core";

export const ERP_MODULES = {
  coach: { key: "coach-students", label: "Coach", entityLabel: "Élève", entityLabelPlural: "Élèves", basePath: "/dashboard/coach", capabilities: ["Élèves", "Entraînements", "Planning", "Contrats", "Statistiques"] },
  fighter: { key: "fighter-career", label: "Combattant", entityLabel: "Étape de carrière", entityLabelPlural: "Étapes de carrière", basePath: "/dashboard/combattant", capabilities: ["Carrière", "Palmarès", "Contrats", "Sponsors", "Entraînements", "Documents", "Statistiques"] },
  organizer: { key: "organizer-events", label: "Organisateur", entityLabel: "Événement", entityLabelPlural: "Événements", basePath: "/dashboard/organisateur", capabilities: ["Événements", "Fight card", "Billetterie", "Sponsors", "Staff", "Checklists"] },
  official: { key: "official-assignments", label: "Officiel", entityLabel: "Désignation", entityLabelPlural: "Désignations", basePath: "/dashboard/officiel", capabilities: ["Désignations", "Combats", "Historique", "Rapports"] },
  referee: { key: "referee-assignments", label: "Arbitre", entityLabel: "Convocation", entityLabelPlural: "Convocations", basePath: "/dashboard/arbitre", capabilities: ["Convocations", "Combats", "Historique", "Rapports"] },
  judge: { key: "judge-sheets", label: "Juge", entityLabel: "Feuille", entityLabelPlural: "Feuilles", basePath: "/dashboard/juge", capabilities: ["Convocations", "Feuilles", "Scoring", "Historique"] },
  sponsor: { key: "sponsor-campaigns", label: "Sponsor", entityLabel: "Campagne", entityLabelPlural: "Campagnes", basePath: "/dashboard/sponsor", capabilities: ["Contrats", "Campagnes", "Événements", "Statistiques"] },
  seller: { key: "seller-products", label: "Vendeur", entityLabel: "Produit", entityLabelPlural: "Produits", basePath: "/dashboard/vendeur", capabilities: ["Produits", "Commandes", "Stock", "Revenus"] },
  fan: { key: "fan-favorites", label: "Fan", entityLabel: "Favori", entityLabelPlural: "Favoris", basePath: "/dashboard/fan", capabilities: ["Favoris", "Abonnements", "Billets", "Historique"] },
  federation: { key: "federation-clubs", label: "Fédération", entityLabel: "Club fédéré", entityLabelPlural: "Clubs fédérés", basePath: "/dashboard/federation", capabilities: ["Clubs", "Licences", "Classements", "Compétitions"] },
  league: { key: "league-clubs", label: "Ligue", entityLabel: "Club de ligue", entityLabelPlural: "Clubs de ligue", basePath: "/dashboard/ligue", capabilities: ["Clubs", "Événements", "Arbitrage", "Statistiques"] },
} as const satisfies Record<string, ErpModuleDefinition>;

export type ErpModuleKey = keyof typeof ERP_MODULES;
