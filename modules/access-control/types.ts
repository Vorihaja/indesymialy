export type AccessRoleStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "suspended";



export interface RoleRequest {

  id: string;

  user_id: string;

  requested_role: string;

  status: AccessRoleStatus;

  reason?: string;

  reviewed_by?: string;

  reviewed_at?: string;

  created_at: string;

}




/**
 * Rôles métiers
 * Table Supabase : roles
 */
export interface BusinessRole {

  id: string;

  slug: string;

  label: string;

  description?: string;

  is_organization: boolean;

  created_at: string;

}





/**
 * Rôles système
 * Table Supabase : system_roles
 */
export interface SystemRole {

  id: string;

  code: string;

  label: string;

  description?: string;

  created_at: string;

}




export interface Permission {

  id: string;

  code: string;

  description?: string;

}





export interface RolePermission {

  id: string;

  role_id: string;

  permission_id: string;

  created_at: string;

}

export interface RoleRequestFilter {

  status?: AccessRoleStatus;

  role?: string;

  user_id?: string;

}