import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";
import { storageNotImplemented } from "../../../shared/errors/backend-error";
import { SportMemoryRepository } from "./sport-memory.repository";
import type {
  CreateSportRecord,
  SportMetrics,
  SportQuery,
  SportRecord,
} from "../types";

export class SportSupabaseRepository extends SportMemoryRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {
    super();
  }

  override async list(query: SportQuery): Promise<SportRecord[]> {
    try {
      const memoryRecords = await super.list(query);

      if (query.domain === "athlete-attendance") {
        const { data: dbAttendances } = await this.supabase
          .from("attendances")
          .select("*")
          .order("session_date", { ascending: false });

        if (dbAttendances && dbAttendances.length > 0) {
          const dbRecords: SportRecord[] = dbAttendances.map((a) => ({
            id: a.id,
            domain: "athlete-attendance",
            title: `Présence - ${a.discipline ?? "Entraînement"}`,
            subtitle: `${a.session_date} à ${a.session_time}`,
            status: "completed",
            visibility: "organization",
            discipline: a.discipline ?? "MMA",
            date: a.session_date,
            progress: a.status === "present" ? 100 : 0,
            score: a.status === "present" ? 100 : 0,
            details: {
              checkIn: a.check_in_at ?? "",
              checkOut: a.check_out_at ?? "",
              notes: a.notes ?? "",
            },
            createdAt: a.created_at ?? new Date().toISOString(),
            updatedAt: a.created_at ?? new Date().toISOString(),
          }));
          return [...dbRecords, ...memoryRecords.filter((m) => !dbRecords.some((d) => d.id === m.id))];
        }
      }

      return memoryRecords;
    } catch {
      return super.list(query);
    }
  }

  override async create(query: SportQuery, input: CreateSportRecord): Promise<SportRecord> {
    void input;
    throw storageNotImplemented(`création ${query.domain}`);
  }

  override async update(): Promise<SportRecord> {
    throw storageNotImplemented("mise à jour des dossiers sportifs");
  }

  override async remove(): Promise<void> {
    throw storageNotImplemented("suppression des dossiers sportifs");
  }

  override async metrics(query: SportQuery): Promise<SportMetrics> {
    return super.metrics(query);
  }
}
