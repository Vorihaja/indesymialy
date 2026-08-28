/**
 * Constantes de compatibilité du contrôle d’accès.
 *
 * Les noms de propriétés historiques restent en français pour ne pas casser
 * les imports existants, mais leurs valeurs sont désormais les identifiants
 * techniques canoniques utilisés par l’authentification et le Workspace Registry.
 */
export const BUSINESS_ROLES = {
  FAN: "fan",
  COMBATTANT: "fighter",
  COACH: "coach",
  CLUB: "club",
  FEDERATION: "federation",
  LIGUE: "league",
  ORGANISATEUR: "organizer",
  SPONSOR: "sponsor",
  VENDEUR: "seller",
  ARBITRE: "referee",
  JUGE: "judge",
} as const;

export const SYSTEM_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MODERATOR: "moderator",
  SUPPORT: "support",
} as const;
