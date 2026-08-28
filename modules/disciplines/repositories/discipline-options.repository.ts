import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";
import type { DisciplineOption } from "../types/options";
export class DisciplineOptionsRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}
  async list(): Promise<DisciplineOption[]> {
    const { data, error } = await this.client.from("disciplines").select("id,name,slug").eq("is_active", true).is("archived_at", null).order("name");
    if (error) throw error;
    return data ?? [];
  }
}