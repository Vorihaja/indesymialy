import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/infrastructure/supabase/database.types";

import type {
  RefereeAssignmentItem,
  RefereeAssignmentResponse,
  RefereeAssignmentSource,
} from "../types";

type EventRow = Pick<
  Database["public"]["Tables"]["events"]["Row"],
  "id" | "title" | "venue" | "starts_at" | "ends_at" | "status"
>;

type FightRow = Pick<
  Database["public"]["Tables"]["fights"]["Row"],
  "id" | "event_id" | "fight_order" | "weight_category" | "status"
>;

function normalizeRole(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const EVENT_OFFICIAL_FUNCTIONS = new Set([
  "referee",
  "arbitre",
  "arbitre central",
  "judge",
  "juge",
  "timekeeper",
  "chronometreur",
  "chronometre",
  "doctor",
  "medecin",
  "supervisor",
  "superviseur",
  "announcer",
  "annonceur",
]);

const FIGHT_OFFICIAL_FUNCTIONS = new Set([
  "referee",
  "arbitre",
  "arbitre central",
  "judge",
  "juge",
  "timekeeper",
  "chronometreur",
  "chronometre",
  "doctor",
  "medecin",
  "supervisor",
  "superviseur",
]);

function isSupportedOfficialFunction(
  value: string | null | undefined,
  source: RefereeAssignmentSource,
) {
  const role = normalizeRole(value);

  return source === "event"
    ? EVENT_OFFICIAL_FUNCTIONS.has(role)
    : FIGHT_OFFICIAL_FUNCTIONS.has(role);
}

export class RefereeAssignmentsSupabaseRepository {
  constructor(
    private readonly supabase: SupabaseClient<Database>,
  ) {}

  private async currentUserId() {
    const { data, error } =
      await this.supabase.auth.getUser();

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error("Session Officiel introuvable.");
    }

    return data.user.id;
  }

  async list(): Promise<RefereeAssignmentItem[]> {
    const userId = await this.currentUserId();

    const [
      eventAssignmentsResult,
      fightAssignmentsResult,
    ] = await Promise.all([
      this.supabase
        .from("event_official_assignments")
        .select(
          "id,event_id,profile_id,mention,role,status,created_at",
        )
        .eq("profile_id", userId)
        .order("created_at", {
          ascending: false,
        }),

      this.supabase
        .from("fight_official_assignments")
        .select(
          "id,fight_id,user_id,role,status,position,assigned_at",
        )
        .eq("user_id", userId)
        .order("assigned_at", {
          ascending: false,
        }),
    ]);

    const authorityError =
      eventAssignmentsResult.error ??
      fightAssignmentsResult.error;

    if (authorityError) {
      throw authorityError;
    }

    const eventAssignments =
      (eventAssignmentsResult.data ?? [])
        .filter((row) =>
          isSupportedOfficialFunction(
            row.role,
            "event",
          ),
        );

    const fightAssignments =
      (fightAssignmentsResult.data ?? [])
        .filter((row) =>
          isSupportedOfficialFunction(
            row.role,
            "fight",
          ),
        );

    const fightIds =
      Array.from(
        new Set(
          fightAssignments.map(
            (row) => row.fight_id,
          ),
        ),
      );

    let fights: FightRow[] = [];

    if (fightIds.length > 0) {
      const result =
        await this.supabase
          .from("fights")
          .select(
            "id,event_id,fight_order,weight_category,status",
          )
          .in("id", fightIds);

      if (result.error) {
        throw result.error;
      }

      fights = result.data ?? [];
    }

    const fightMap =
      new Map(
        fights.map(
          (fight) => [
            fight.id,
            fight,
          ],
        ),
      );

    const eventIds =
      Array.from(
        new Set([
          ...eventAssignments.map(
            (row) => row.event_id,
          ),
          ...fights
            .map((fight) => fight.event_id)
            .filter(
              (eventId):
                eventId is string =>
                  Boolean(eventId),
            ),
        ]),
      );

    let events: EventRow[] = [];

    if (eventIds.length > 0) {
      const result =
        await this.supabase
          .from("events")
          .select(
            "id,title,venue,starts_at,ends_at,status",
          )
          .in("id", eventIds);

      if (result.error) {
        throw result.error;
      }

      events = result.data ?? [];
    }

    const eventMap =
      new Map(
        events.map(
          (event) => [
            event.id,
            event,
          ],
        ),
      );

    const availability =
      new Map<string, string>();

    if (eventIds.length > 0) {
      const availabilityResult =
        await this.supabase
          .from("official_availability")
          .select(
            "event_id,official_profile_id,availability_status",
          )
          .eq(
            "official_profile_id",
            userId,
          )
          .in(
            "event_id",
            eventIds,
          );

      if (!availabilityResult.error) {
        for (
          const row of
          availabilityResult.data ?? []
        ) {
          availability.set(
            row.event_id,
            row.availability_status,
          );
        }
      }
    }

    const eventItems:
      RefereeAssignmentItem[] =
      eventAssignments.map((row) => {
        const event =
          eventMap.get(row.event_id);

        return {
          key: `event:${row.id}`,
          source: "event",
          sourceId: row.id,
          eventId: row.event_id,
          fightId: null,
          eventTitle:
            event?.title ??
            "Événement",
          assignmentLabel:
            "Désignation événement",
          startsAt:
            event?.starts_at ?? null,
          endsAt:
            event?.ends_at ?? null,
          venue:
            event?.venue ?? null,
          role: row.role,
          status: row.status,
          availability:
            availability.get(
              row.event_id,
            ) ?? null,
          assignedAt: row.created_at,
        };
      });

    const fightItems:
      RefereeAssignmentItem[] =
      fightAssignments.map((row) => {
        const fight =
          fightMap.get(row.fight_id);

        const event =
          fight?.event_id
            ? eventMap.get(
                fight.event_id,
              )
            : undefined;

        const order =
          fight?.fight_order ??
          "?";

        const category =
          fight?.weight_category
            ? ` · ${fight.weight_category}`
            : "";

        return {
          key: `fight:${row.id}`,
          source: "fight",
          sourceId: row.id,
          eventId:
            fight?.event_id ?? "",
          fightId: row.fight_id,
          eventTitle:
            event?.title ??
            "Événement",
          assignmentLabel:
            `Combat #${order}${category}`,
          startsAt:
            event?.starts_at ?? null,
          endsAt:
            event?.ends_at ?? null,
          venue:
            event?.venue ?? null,
          role: row.role,
          status:
            row.status ??
            "assigned",
          availability:
            fight?.event_id
              ? availability.get(
                  fight.event_id,
                ) ?? null
              : null,
          assignedAt:
            row.assigned_at ?? null,
        };
      });

    return [
      ...eventItems,
      ...fightItems,
    ].sort((left, right) => {
      const leftTime =
        Date.parse(
          left.startsAt ??
            left.assignedAt ??
            "",
        );

      const rightTime =
        Date.parse(
          right.startsAt ??
            right.assignedAt ??
            "",
        );

      const leftValue =
        Number.isNaN(leftTime)
          ? Number.MAX_SAFE_INTEGER
          : leftTime;

      const rightValue =
        Number.isNaN(rightTime)
          ? Number.MAX_SAFE_INTEGER
          : rightTime;

      return leftValue - rightValue;
    });
  }

  async respond(
    source: RefereeAssignmentSource,
    sourceId: string,
    status: RefereeAssignmentResponse,
  ): Promise<void> {
    const userId =
      await this.currentUserId();

    if (source === "event") {
      const current =
        await this.supabase
          .from("event_official_assignments")
          .select(
            "id,profile_id,role,status",
          )
          .eq("id", sourceId)
          .eq("profile_id", userId)
          .maybeSingle();

      if (current.error) {
        throw current.error;
      }

      if (
        !current.data ||
        !isSupportedOfficialFunction(
          current.data.role,
          "event",
        )
      ) {
        throw new Error(
          "Cette désignation officielle est introuvable.",
        );
      }

      const result =
        await this.supabase
          .from("event_official_assignments")
          .update({ status })
          .eq(
            "id",
            current.data.id,
          )
          .eq(
            "profile_id",
            userId,
          )
          .select("id,status")
          .maybeSingle();

      if (result.error) {
        throw result.error;
      }

      if (!result.data) {
        throw new Error(
          "La réponse à cette désignation n'a pas été enregistrée.",
        );
      }

      return;
    }

    const current =
      await this.supabase
        .from("fight_official_assignments")
        .select(
          "id,user_id,role,status",
        )
        .eq("id", sourceId)
        .eq("user_id", userId)
        .maybeSingle();

    if (current.error) {
      throw current.error;
    }

    if (
      !current.data ||
      !isSupportedOfficialFunction(
        current.data.role,
        "fight",
      )
    ) {
      throw new Error(
        "Cette affectation de combat est introuvable.",
      );
    }

    const result =
      await this.supabase
        .from("fight_official_assignments")
        .update({ status })
        .eq(
          "id",
          current.data.id,
        )
        .eq(
          "user_id",
          userId,
        )
        .select("id,status")
        .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    if (!result.data) {
      throw new Error(
        "La réponse à cette affectation de combat n'a pas été enregistrée.",
      );
    }
  }
}
