/**
 * =====================================================
 * INDESY MIALY
 * ROLE MANAGEMENT SYSTEM
 * =====================================================
 *
 * Séparation stricte :
 *
 * 1. BUSINESS ROLES
 *    → rôles des acteurs de l'écosystème combat
 *
 * 2. PLATFORM ROLES
 *    → rôles internes de gestion de la plateforme
 *
 * Cette séparation évite de mélanger :
 * - ERP métier
 * - Administration système
 *
 */





// =====================================================
// BUSINESS ROLES
// =====================================================
//
// Utilisateurs de la plateforme
// liés aux activités sportives
//

export const BUSINESS_ROLES = {


  FAN: "fan",


  FIGHTER: "fighter",


  COACH: "coach",


  JUDGE: "judge",


  REFEREE: "referee",


  CLUB: "club",


  ORGANIZER: "organizer",


  FEDERATION: "federation",


  LEAGUE: "league",


  SPONSOR: "sponsor",


  SELLER: "seller",



} as const;








// =====================================================
// PLATFORM ROLES
// =====================================================
//
// Fonctions internes de gouvernance
//

export const PLATFORM_ROLES = {


  MODERATOR: "moderator",


  ADMIN: "admin",


  SUPER_ADMIN: "super_admin",



} as const;








// =====================================================
// TYPES
// =====================================================


export type BusinessRole =
  typeof BUSINESS_ROLES[
    keyof typeof BUSINESS_ROLES
  ];



export type PlatformRole =
  typeof PLATFORM_ROLES[
    keyof typeof PLATFORM_ROLES
  ];



export type AnyRole =
  | BusinessRole
  | PlatformRole;









// =====================================================
// ROLE LABELS
// =====================================================
//
// Centralisation des noms affichés
//

export const ROLE_LABELS = {


  fan:
    "Supporter",



  fighter:
    "Combattant",



  coach:
    "Entraîneur",



  judge:
    "Juge",



  referee:
    "Arbitre",



  club:
    "Club / Dojo",



  organizer:
    "Organisateur",



  federation:
    "Fédération",



  league:
    "Ligue",



  sponsor:
    "Sponsor",



  seller:
    "Vendeur",



  moderator:
    "Modérateur",



  admin:
    "Administrateur",



  super_admin:
    "Super Administrateur",



} as const;









// =====================================================
// HELPERS
// =====================================================


export const BUSINESS_ROLE_VALUES =
Object.values(
  BUSINESS_ROLES
);



export const PLATFORM_ROLE_VALUES =
Object.values(
  PLATFORM_ROLES
);





export function isBusinessRole(
role:string
):role is BusinessRole {


return BUSINESS_ROLE_VALUES.includes(
  role as BusinessRole
);


}





export function isPlatformRole(
role:string
):role is PlatformRole {


return PLATFORM_ROLE_VALUES.includes(
  role as PlatformRole
);


}
