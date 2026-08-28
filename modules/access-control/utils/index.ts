export type AccessRoleStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "suspended";


export interface RoleRequest {

  id:string;

  user_id:string;

  requested_role:string;

  status:AccessRoleStatus;

  reason?:string;

  reviewed_by?:string;

  reviewed_at?:string;

  created_at:string;

}


export interface RoleRequestFilter {

  status?:AccessRoleStatus;

  role?:string;

  user_id?:string;

}


export interface RoleAssignment {

  id:string;

  user_id:string;

  role_id:string;

  assigned_by?:string;

  assigned_at:string;

}


export interface Permission {

  id:string;

  code:string;

  description?:string;

}


export interface AccessRole {

  id:string;

  slug:string;

  label:string;

  description?:string;

}