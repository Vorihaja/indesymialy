import type { Database } from "@/infrastructure/supabase/database.types";

/**
 * ============================================================
 * INDESY MIALY
 * UNIVERSAL IDENTITY PROFILE CONTRACT
 * ============================================================
 *
 * Chaîne canonique :
 *
 * auth.users
 *      ↓
 * public.profiles
 *      ↓
 * modules/identity-core
 *      ↓
 * Site public / ERP / Korana / Marketplace
 *
 * Aucun produit Indesy ne doit créer une deuxième identité
 * humaine parallèle.
 */

type PublicTables =
  Database["public"]["Tables"];

type ProfileRow =
  PublicTables["profiles"]["Row"];


/**
 * ------------------------------------------------------------
 * SOURCES DE VERITE
 * ------------------------------------------------------------
 */

export const IDENTITY_SOURCE_CONTRACT = {
  authentication: "auth.users",
  humanIdentity: "public.profiles",
  applicationBoundary: "modules/identity-core",
  organizationIdentity: "public.organizations",
  socialProjection: "public.korana_actors",
} as const;


/**
 * ------------------------------------------------------------
 * PROFIL HUMAIN UNIVERSEL
 * ------------------------------------------------------------
 */

export const UNIVERSAL_PROFILE_COLUMNS = [
  "id",
  "full_name",
  "username",
  "email",
  "phone",
  "photo_url",
  "region_id",
  "city_id",
  "primary_role_id",
  "is_verified",
  "status",
  "deactivated_at",
  "deactivation_reason",
  "created_at",
] as const satisfies readonly (keyof ProfileRow)[];


export type UniversalProfileColumn =
  (typeof UNIVERSAL_PROFILE_COLUMNS)[number];


export type UniversalProfileRecord =
  Pick<
    ProfileRow,
    UniversalProfileColumn
  >;


/**
 * ------------------------------------------------------------
 * COLONNES CANONIQUES SPECIALES
 * ------------------------------------------------------------
 */

export const IDENTITY_USERNAME_COLUMN =
  "username" as const satisfies keyof ProfileRow;

export const IDENTITY_AVATAR_COLUMN =
  "photo_url" as const satisfies keyof ProfileRow;

export const IDENTITY_DISPLAY_NAME_COLUMN =
  "full_name" as const satisfies keyof ProfileRow;

export const IDENTITY_VERIFICATION_COLUMN =
  "is_verified" as const satisfies keyof ProfileRow;


/**
 * ------------------------------------------------------------
 * ETAT ASSOCIE
 * ------------------------------------------------------------
 */

export const IDENTITY_ASSOCIATED_TABLES = [
  "profile_roles",
  "profile_system_roles",
  "user_disciplines",
  "active_organizations",
  "account_preferences",
] as const satisfies readonly (keyof PublicTables)[];


export type IdentityAssociatedTable =
  (typeof IDENTITY_ASSOCIATED_TABLES)[number];


/**
 * ------------------------------------------------------------
 * PROJECTIONS
 * ------------------------------------------------------------
 */

export const IDENTITY_PROJECTIONS = {
  korana: {
    table: "korana_actors",
    profileForeignKey: "profile_id",
    displayNameFrom: "profiles.full_name",
    handleFrom: "profiles.username",
    avatarFrom: "profiles.photo_url",
    verificationFrom: "profiles.is_verified",
  },

  marketplaceBuyer: {
    source: "profiles",
  },

  marketplaceSeller: {
    source: "organizations",
  },

  erp: {
    source: "profiles",
    extensionsAreDomainOwned: true,
  },
} as const;


/**
 * ------------------------------------------------------------
 * EXTENSIONS METIER
 * ------------------------------------------------------------
 */

export const IDENTITY_DOMAIN_EXTENSION_RULE = {
  profileContainsOnlyUniversalIdentity: true,
  roleSpecificDataBelongsToDomainModules: true,
  domainModulesMayReadProfile: true,
  domainModulesMustNotCreateParallelProfile: true,
} as const;


/**
 * ------------------------------------------------------------
 * CHAMPS LEGACY NON CANONIQUES
 * ------------------------------------------------------------
 */

export const LEGACY_DRAFT_ONLY_PROFILE_FIELDS = [
  "birthDate",
  "gender",
  "experience",
  "availabilityPrepared",
] as const;


/**
 * ------------------------------------------------------------
 * PROFILS PARALLELES INTERDITS
 * ------------------------------------------------------------
 */

export const FORBIDDEN_PARALLEL_PROFILE_TABLES = [
  "korana_profiles",
  "marketplace_profiles",
  "erp_profiles",
] as const;


/**
 * ------------------------------------------------------------
 * REGLES D'ECRITURE
 * ------------------------------------------------------------
 */

export const IDENTITY_WRITE_POLICY = {
  authenticationMutations: "auth",
  universalProfileMutations: "identity-core",
  organizationMutations: "identity-core",
  roleMutations: "identity-core",
  disciplineMutations: "identity-core",
  domainMutations: "domain-module",
} as const;


/**
 * ------------------------------------------------------------
 * AVATAR UNIVERSEL
 * ------------------------------------------------------------
 *
 * Le bucket est public en lecture car l'avatar est une
 * identité visuelle destinée aux surfaces publiques.
 *
 * L'écriture Storage reste réservée au dossier auth.uid().
 *
 * profiles.photo_url reste la seule valeur canonique.
 */

export const IDENTITY_AVATAR_CONTRACT = {
  canonicalColumn: "profiles.photo_url",
  owner: "profile",

  storageBucket: "profile-avatars",
  storagePublic: true,

  maximumBytes: 5242880,

  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
  ],

  pathPattern: "{auth.uid()}/{uuid}.{extension}",

  socialProjection: "korana_actors.avatar_url",

  storageImplementation: "I0-B-1",
} as const;


/**
 * ------------------------------------------------------------
 * KORANA
 * ------------------------------------------------------------
 */

export const KORANA_IDENTITY_CONTRACT = {
  profileActorIsProjection: true,
  organizationActorIsProjection: true,
  independentHumanProfileForbidden: true,
  usernameMustDriveHandle: true,
  fullNameMustDriveDisplayName: true,
  photoUrlMustDriveAvatar: true,
  verificationMustPropagate: true,
} as const;


/**
 * ------------------------------------------------------------
 * VERSION
 * ------------------------------------------------------------
 */

export const UNIVERSAL_IDENTITY_CONTRACT_VERSION =
  "I0-B-1" as const;