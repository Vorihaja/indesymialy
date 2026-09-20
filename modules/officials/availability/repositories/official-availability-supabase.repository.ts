import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/infrastructure/supabase/database.types";

import type {
  OfficialAvailabilityItem,
  OfficialAvailabilityStatus,
  UpdateOfficialAvailabilityInput,
} from "../types";

type EventRow = Pick<
  Database["public"]["Tables"]["events"]["Row"],
  "id" | "title" | "starts_at" | "ends_at" | "venue"
>;

function canonicalStatus(value: string): OfficialAvailabilityStatus {
  if (
    value === "pending" ||
    value === "available" ||
    value === "unavailable" ||
    value === "tentative"
  ) {
    return value;
  }

  throw new Error(`Statut de disponibilité inconnu : ${value}`);
}

export class OfficialAvailabilitySupabaseRepository {
  constructor(
    private readonly supabase: SupabaseClient<Database>,
  ) {}

  private async currentProfileId() {
    const { data, error } = await this.supabase.auth.getUser();

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error("Session Officiel introuvable.");
    }

    return data.user.id;
  }

  async list(): Promise<OfficialAvailabilityItem[]> {
    const profileId = await this.currentProfileId();
    const assignmentsResult = await this.supabase
      .from("event_official_assignments")
      .select("event_id,profile_id")
      .eq("profile_id", profileId);

    if (assignmentsResult.error) {
      throw assignmentsResult.error;
    }

    const assignedEventIds = Array.from(
      new Set((assignmentsResult.data ?? []).map((row) => row.event_id)),
    );

    if (assignedEventIds.length === 0) {
      return [];
    }

    const availabilityResult = await this.supabase
      .from("official_availability")
      .select(
        "id,event_id,official_profile_id,availability_status,available_from,available_until,notes,responded_at,updated_at",
      )
      .eq("official_profile_id", profileId)
      .in("event_id", assignedEventIds)
      .order("updated_at", { ascending: false });

    if (availabilityResult.error) {
      throw availabilityResult.error;
    }

    const rows = availabilityResult.data ?? [];
    const eventIds = Array.from(new Set(rows.map((row) => row.event_id)));
    let events: EventRow[] = [];

    if (eventIds.length > 0) {
      const eventResult = await this.supabase
        .from("events")
        .select("id,title,starts_at,ends_at,venue")
        .in("id", eventIds);

      if (eventResult.error) {
        throw eventResult.error;
      }

      events = eventResult.data ?? [];
    }

    const eventById = new Map(events.map((event) => [event.id, event]));

    return rows.map((row) => {
      const event = eventById.get(row.event_id);

      return {
        id: row.id,
        eventId: row.event_id,
        eventTitle: event?.title ?? "Événement",
        eventStartsAt: event?.starts_at ?? null,
        eventEndsAt: event?.ends_at ?? null,
        venue: event?.venue ?? null,
        status: canonicalStatus(row.availability_status),
        availableFrom: row.available_from,
        availableUntil: row.available_until,
        notes: row.notes,
        respondedAt: row.responded_at,
        updatedAt: row.updated_at,
      };
    });
  }

  async update(input: UpdateOfficialAvailabilityInput): Promise<void> {
    const profileId = await this.currentProfileId();
    const now = new Date().toISOString();
    const result = await this.supabase
      .from("official_availability")
      .update({
        availability_status: input.status,
        available_from: input.availableFrom,
        available_until: input.availableUntil,
        notes: input.notes,
        responded_at: now,
        updated_at: now,
      })
      .eq("id", input.id)
      .eq("official_profile_id", profileId)
      .select("id")
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    if (!result.data) {
      throw new Error("Cette demande de disponibilité est introuvable.");
    }
  }
}
