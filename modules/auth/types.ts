/**
 * =====================================================
 * INDESY MIALY
 * AUTH / RBAC TYPES
 * =====================================================
 *
 * Séparation stricte :
 *
 * SYSTEM ACCESS
 *      admin
 *      super_admin
 *
 * BUSINESS ROLES
 *      fan
 *      fighter
 *      coach
 *      ...
 *
 * L'administration n'est jamais un rôle métier.
 *
 */



// =====================================================
// BUSINESS ROLES
// =====================================================

export type BusinessRole =

  | "fan"

  | "fighter"

  | "coach"

  | "judge"

  | "referee"

  | "club"

  | "organizer"

  | "federation"

  | "league"

  | "sponsor"

  | "seller"

  | "moderator";





// =====================================================
// SYSTEM ROLES
// =====================================================

export type SystemRole =

  | "admin"

  | "super_admin";





// =====================================================
// ROLE ENTITY
// (business roles)
// =====================================================

export interface Role {


  id: string;


  slug: BusinessRole;


  label: string;


  description?: string | null;


  is_organization?: boolean;


  created_at?: string;



}





// =====================================================
// SYSTEM ROLE ENTITY
// =====================================================

export interface SystemRoleEntity {


  id: string;


  code: SystemRole;


  label: string;


  description?: string | null;


  created_at?: string;



}





// =====================================================
// PERMISSION ENTITY
// =====================================================

export interface Permission {


  id: string;


  code: string;


  description?: string | null;


  created_at?: string;



}





// =====================================================
// ROLE PERMISSION RELATION
// =====================================================

export interface RolePermission {


  id?: string;


  role_id: string;


  permission_id: string;


  created_at?: string;



}





// =====================================================
// PROFILE BUSINESS ROLE ASSIGNMENT
// =====================================================

export interface UserRoleAssignment {


  id?: string;


  profile_id: string;


  role_id: string;


  created_at?: string;



}





// =====================================================
// PROFILE SYSTEM ROLE ASSIGNMENT
// =====================================================

export interface UserSystemRoleAssignment {


  id?: string;


  profile_id: string;


  system_role_id: string;


  created_at?: string;



}





// =====================================================
// RBAC HELPERS
// =====================================================

export type AnyRole =
  | BusinessRole
  | SystemRole;
