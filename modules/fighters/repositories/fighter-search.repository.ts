import { createClient } from "@/lib/client";
import type { Fighter } from "@/modules/fighters/types";

export interface FighterSearchFilters {
  query?: string;
  discipline?: string;
  category?: string;
  region?: string;
  clubId?: string;
  status?: string;
}

export class FighterSearchRepository {
  private readonly supabase = createClient();

  async search(filters: FighterSearchFilters): Promise<Fighter[]> {
    let query = this.supabase
      .from("fighters")
      .select("*")
      .order("first_name", {
        ascending: true,
      });

    if (filters.query) {
      query = query.or(
        `first_name.ilike.%${filters.query}%,last_name.ilike.%${filters.query}%,nickname.ilike.%${filters.query}%`
      );
    }

    if (filters.discipline) {
      query = query.eq(
        "discipline",
        filters.discipline
      );
    }

    if (filters.category) {
      query = query.eq(
        "category",
        filters.category
      );
    }

    if (filters.region) {
      query = query.eq(
        "region",
        filters.region
      );
    }

    if (filters.clubId) {
      query = query.eq(
        "club_id",
        filters.clubId
      );
    }

    if (filters.status) {
      query = query.eq(
        "status",
        filters.status
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as Fighter[];
  }
}