import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";
import {
  normalizeBackendError,
  storageNotImplemented,
} from "../../../shared/errors/backend-error";
import type { SportRepository } from "./sport.repository";
import type {
  CreateSportRecord,
  SportMetrics,
  SportQuery,
  SportRecord,
} from "../types";

export class SportSupabaseRepository implements SportRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async list(query: SportQuery): Promise<SportRecord[]> {
    if (query.domain !== "athlete-attendance") {
      throw storageNotImplemented(`lecture ${query.domain}`);
    }

    try {
      const { data: dbAttendances, error } = await this.supabase
        .from("attendances")
        .select("*")
        .order("session_date", { ascending: false });

      if (error) {
        throw error;
      }

      const records: SportRecord[] = (dbAttendances ?? []).map(
        (attendance) => ({
          id: attendance.id,
          domain: "athlete-attendance",
          title: `Présence - ${attendance.discipline ?? "Entraînement"}`,
          subtitle: `${attendance.session_date} à ${attendance.session_time}`,
          status: "completed",
          visibility: "organization",
          discipline: attendance.discipline ?? "MMA",
          date: attendance.session_date,
          progress:
            attendance.status === "present" ? 100 : 0,
          score:
            attendance.status === "present" ? 100 : 0,
          details: {
            attendanceStatus: attendance.status ?? "unknown",
            checkIn: attendance.check_in_at ?? "",
            checkOut: attendance.check_out_at ?? "",
            notes: attendance.notes ?? "",
          },
          createdAt:
            attendance.created_at ??
            new Date().toISOString(),
          updatedAt:
            attendance.created_at ??
            new Date().toISOString(),
        }),
      );

      const term = query.search?.trim().toLowerCase();

      return records.filter(
        (item) =>
          (!term ||
            `${item.title} ${item.subtitle} ${item.discipline ?? ""}`
              .toLowerCase()
              .includes(term)) &&
          (!query.status ||
            query.status === "all" ||
            item.status === query.status),
      );
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  async create(
    query: SportQuery,
    input: CreateSportRecord,
  ): Promise<SportRecord> {
    void input;
    throw storageNotImplemented(`création ${query.domain}`);
  }

  async update(): Promise<SportRecord> {
    throw storageNotImplemented(
      "mise à jour des dossiers sportifs",
    );
  }

  async remove(): Promise<void> {
    throw storageNotImplemented(
      "suppression des dossiers sportifs",
    );
  }

  async metrics(
    query: SportQuery,
  ): Promise<SportMetrics> {
    void query;
    throw storageNotImplemented(
      "métriques de développement sportif",
    );
  }

  async timeline(
    query: SportQuery,
  ): Promise<Array<{ label: string; value: number }>> {
    void query;
    throw storageNotImplemented(
      "historique de développement sportif",
    );
  }
}