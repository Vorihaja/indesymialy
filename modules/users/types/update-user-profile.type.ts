import type { Database } from "@/infrastructure/supabase/database.types"

type ProfileUpdate =
  Database["public"]["Tables"]["profiles"]["Update"]

export type UpdateUserProfile = Pick<
  ProfileUpdate,
  "username" | "full_name" | "phone" | "region_id" | "city_id"
>