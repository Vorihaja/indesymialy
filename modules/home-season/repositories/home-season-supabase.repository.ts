import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/infrastructure/supabase/database.types";
import { normalizeBackendError } from "@/shared/errors/backend-error";

import type { HomeSeasonRepository } from "./home-season.repository";
import type { HomeSeasonEvent } from "../types";

type PublicEventProjection = Pick<
  Database["public"]["Tables"]["events"]["Row"],
  "id" | "title" | "starts_at" | "ends_at" | "event_type" | "venue" | "status"
>;

function mapEvent(row: PublicEventProjection): HomeSeasonEvent | null {
  if (!row.starts_at) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    type: row.event_type,
    venue: row.venue,
    status: row.status,
  };
}

export class HomeSeasonSupabaseRepository implements HomeSeasonRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async listPublicEventsBetween(start: string, end: string) {
    const result = await this.supabase
      .from("events")
      .select("id,title,starts_at,ends_at,event_type,venue,status")
      .eq("visibility", "public")
      .not("published_at", "is", null)
      .is("archived_at", null)
      .gte("starts_at", start)
      .lt("starts_at", end)
      .order("starts_at", { ascending: true });

    if (result.error) {
      throw normalizeBackendError(result.error);
    }

    return (result.data ?? []).flatMap((row) => {
      const event = mapEvent(row);
      return event ? [event] : [];
    });
  }

  async findNextPublicEvent(after: string) {
    const result = await this.supabase
      .from("events")
      .select("id,title,starts_at,ends_at,event_type,venue,status")
      .eq("visibility", "public")
      .not("published_at", "is", null)
      .is("archived_at", null)
      .gte("starts_at", after)
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (result.error) {
      throw normalizeBackendError(result.error);
    }

    return result.data ? mapEvent(result.data) : null;
  }

  async countFightsForEvents(eventIds: string[]) {
    if (eventIds.length === 0) {
      return 0;
    }

    const result = await this.supabase
      .from("fights")
      .select("id", { count: "exact", head: true })
      .in("event_id", eventIds);

    if (result.error) {
      throw normalizeBackendError(result.error);
    }

    return result.count ?? 0;
  }
}
