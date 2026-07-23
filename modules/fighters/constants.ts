export const FIGHTER_STATUSES = [
  {
    value: "active",
    label: "Actif",
  },
  {
    value: "inactive",
    label: "Inactif",
  },
  {
    value: "suspended",
    label: "Suspendu",
  },
  {
    value: "pending",
    label: "En attente",
  },
] as const;



export const FIGHTER_GENDERS = [
  {
    value: "male",
    label: "Homme",
  },
  {
    value: "female",
    label: "Femme",
  },
] as const;



export const FIGHTER_GUARDS = [
  {
    value: "orthodox",
    label: "Orthodoxe",
  },
  {
    value: "southpaw",
    label: "Gaucher",
  },
  {
    value: "switch",
    label: "Switch",
  },
] as const;



export const FIGHTING_STYLES = [
  "MMA",
  "Boxe anglaise",
  "Kick Boxing",
  "Muay Thai",
  "Karaté",
  "Judo",
  "Jiu-Jitsu Brésilien",
  "Lutte",
  "Moraingy",
] as const;



export const WEIGHT_CATEGORIES = [
  "Poids mouche",
  "Coq",
  "Plume",
  "Léger",
  "Mi-moyen",
  "Moyen",
  "Mi-lourd",
  "Lourd",
  "Super lourd",
] as const;



export const FIGHT_RESULTS = [
  {
    value: "win",
    label: "Victoire",
  },
  {
    value: "loss",
    label: "Défaite",
  },
  {
    value: "draw",
    label: "Égalité",
  },
  {
    value: "no_contest",
    label: "Sans décision",
  },
] as const;



export const FIGHT_METHODS = [
  "KO",
  "TKO",
  "Soumission",
  "Décision",
] as const;