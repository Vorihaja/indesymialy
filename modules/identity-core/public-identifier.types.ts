export type PublicIdentifierAvailabilityReason =
  | "required"
  | "not_canonical"
  | "invalid_format"
  | "reserved"
  | "taken"
  | "available";


export interface PublicIdentifierAvailability {
  available: boolean;

  identifier:
    string |
    null;

  reason:
    PublicIdentifierAvailabilityReason;
}


export const PUBLIC_IDENTIFIER_PATTERN =
  /^[a-z0-9][a-z0-9._-]{2,49}$/;


export function normalizePublicIdentifier(
  value: string,
): string {

  return value
    .trim()
    .toLowerCase();
}


export function publicIdentifierMessage(
  result:
    PublicIdentifierAvailability |
    null,
): string | null {

  if (!result) {
    return null;
  }


  switch (result.reason) {

    case "available":

      return "Cet identifiant est disponible.";


    case "taken":

      return "Cet identifiant est déjà pris.";


    case "reserved":

      return "Cet identifiant est réservé par Indesy Mialy.";


    case "invalid_format":

      return "Utilisez 3 à 50 caractères : lettres minuscules, chiffres, point, tiret ou underscore.";


    case "not_canonical":

      return "L’identifiant doit être écrit en minuscules.";


    case "required":

      return "Choisissez un identifiant.";


    default:

      return null;
  }
}