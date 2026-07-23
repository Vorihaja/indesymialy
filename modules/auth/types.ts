export type UserRole =
  | "fan"
  | "fighter"
  | "coach"
  | "judge"
  | "referee"
  | "club"
  | "organizer"
  | "federation"
  | "sponsor"
  | "seller"
  | "moderator"
  | "admin";



export interface Role {

  id: string;

  slug: UserRole;

  name: UserRole;

  label: string;

  description?: string;

}



export interface Permission {

  id: string;

  code: string;

  description: string;

}



export interface RolePermission {

  role_id: string;

  permission_id: string;

}



export interface UserRoleAssignment {

  user_id: string;

  role_id: string;

}