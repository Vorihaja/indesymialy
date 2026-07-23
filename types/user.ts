export interface UserProfile {
  id: string;

  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;

  avatar_url?: string | null;

  email?: string | null;
  phone?: string | null;

  bio?: string | null;

  region_id?: string | null;
  city_id?: string | null;

  created_at?: string;
  updated_at?: string;
}


export interface UserRole {
  id: string;

  slug: string;

  label: string;

  is_organization: boolean;

  description?: string | null;

  created_at?: string;
}


export interface ProfileRole {
  id: string;

  profile_id: string;

  role_id: string;

  created_at?: string;

  role?: UserRole;
}


export interface UserWithRoles extends UserProfile {

  roles: UserRole[];

}