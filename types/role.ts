export type UserRole =
  | "fan"
  | "combattant"
  | "coach"
  | "arbitre"
  | "juge"
  | "organisateur"
  | "club"
  | "federation"
  | "sponsor"
  | "vendeur"
  | "admin";


export interface Role {
  id: string;
  role_name: UserRole;
}