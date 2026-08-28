import type { OrganizerModuleId } from "../types";

const MODULE_LABELS: Record<OrganizerModuleId, string> = {
  overview: "Vue d’ensemble",
  events: "Événements",
  "fight-center": "Centre des combats",
  ticketing: "Billetterie",
  team: "Équipe & Officiels",
  operations: "Opérations",
  partners: "Partenaires",
  finance: "Finances",
  performance: "Performance",
  marketplace: "Marketplace",
  calendar: "Agenda",
  settings: "Paramètres",
  personnel: "Personnel",
  "control-room": "Jour J / Poste de contrôle",
};

const TAB_LABELS: Readonly<Record<string, string>> = {
  "Fight Card": "Carte des combats",
  Matchmaking: "Matchmaking",
  "Fight Live": "Combat en direct",
  Staff: "Personnel",
  Packages: "Forfaits",
  "Vue business": "Vue économique",
};

export function getOrganizerModuleDisplayLabel(
  moduleId: OrganizerModuleId,
  fallbackLabel: string,
): string {
  return MODULE_LABELS[moduleId] ?? fallbackLabel;
}

export function getOrganizerTabDisplayLabel(tab: string): string {
  // Exceptions permanentes de la plateforme : Marketplace, Feedback et
  // Checklists restent en anglais. Les valeurs techniques ne sont jamais
  // modifiées ici ; seule leur représentation à l’écran est traduite.
  return TAB_LABELS[tab] ?? tab;
}
