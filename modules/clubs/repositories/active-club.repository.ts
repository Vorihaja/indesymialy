import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";
import type { Club } from "../types";
const select = "id, profile_id, organization_id, name, logo_url, description, address, region_id, is_official_federated, created_at";
export class ActiveClubRepository { constructor(private readonly supabase: SupabaseClient<Database>) {} async findByProfileId(profileId: string): Promise<Club[]> { const { data, error } = await this.supabase.from("clubs").select(select).eq("profile_id", profileId).order("created_at", { ascending: true }); if (error) throw error; return data; } }