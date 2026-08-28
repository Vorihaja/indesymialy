import type { Database } from "@/infrastructure/supabase/database.types"

export type UserProfile =
  Database["public"]["Tables"]["profiles"]["Row"]