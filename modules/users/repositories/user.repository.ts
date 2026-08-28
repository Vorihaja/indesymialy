import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/infrastructure/supabase/database.types"
import type { UpdateUserProfile, UserProfile } from "../types"

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]

export class UserRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findById(id: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      throw error
    }

    return this.mapProfileRowToDomain(data)
  }

  async update(
    id: string,
    input: UpdateUserProfile
  ): Promise<UserProfile> {
    const { data, error } = await this.supabase
      .from("profiles")
      .update(this.mapUpdateInputToPersistence(input))
      .eq("id", id)
      .select("*")
      .single()

    if (error) throw error

    return this.mapProfileRowToDomain(data)
  }

  async getCurrentUser() {
    const { data, error } = await this.supabase.auth.getUser()

    if (error) throw error

    return data.user
  }

  private mapProfileRowToDomain(profile: ProfileRow): UserProfile {
    return {
      city_id: profile.city_id,
      created_at: profile.created_at,
      deactivated_at: profile.deactivated_at,
      deactivation_reason: profile.deactivation_reason,
      email: profile.email,
      full_name: profile.full_name,
      id: profile.id,
      is_verified: profile.is_verified,
      phone: profile.phone,
      photo_url: profile.photo_url,
      primary_role_id: profile.primary_role_id,
      region_id: profile.region_id,
      status: profile.status,
      username: profile.username,
    }
  }

  private mapUpdateInputToPersistence(
    input: UpdateUserProfile
  ): ProfileUpdate {
    const payload: ProfileUpdate = {}

    if (input.username !== undefined) payload.username = input.username
    if (input.full_name !== undefined) payload.full_name = input.full_name
    if (input.phone !== undefined) payload.phone = input.phone
    if (input.region_id !== undefined) payload.region_id = input.region_id
    if (input.city_id !== undefined) payload.city_id = input.city_id

    return payload
  }
}
