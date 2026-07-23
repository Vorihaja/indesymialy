import type {
  Fighter,
  FighterStats,
} from "./types";



/**
 * Nom complet du combattant
 */
export function getFighterFullName(
  fighter: Fighter
): string {

  if (fighter.nickname) {
    return `${fighter.first_name} "${fighter.nickname}" ${fighter.last_name}`;
  }

  return `${fighter.first_name} ${fighter.last_name}`;

}





/**
 * Calcul âge
 */
export function calculateAge(
  birthDate?: string
): number | null {

  if (!birthDate) {
    return null;
  }


  const today = new Date();

  const birth = new Date(birthDate);


  let age =
    today.getFullYear()
    -
    birth.getFullYear();


  const monthDiff =
    today.getMonth()
    -
    birth.getMonth();


  if (
    monthDiff < 0 ||
    (
      monthDiff === 0 &&
      today.getDate() < birth.getDate()
    )
  ) {
    age--;
  }


  return age;

}





/**
 * Pourcentage de victoire
 */
export function calculateWinRate(
  stats: FighterStats
): number {


  if (!stats.fights) {
    return 0;
  }


  return Math.round(
    (
      stats.wins /
      stats.fights
    )
    *
    100
  );

}





/**
 * Résumé palmarès
 */
export function formatRecord(
  stats: FighterStats
): string {

  return `${stats.wins}-${stats.losses}-${stats.draws}`;

}





/**
 * Création slug profil public
 */
export function createFighterSlug(
  fighter: Fighter
): string {


  return [
    fighter.first_name,
    fighter.last_name,
    fighter.nickname,
  ]
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /(^-|-$)/g,
      "");

}