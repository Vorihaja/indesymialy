import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";
import {
  BackendError,
  normalizeBackendError,
  storageNotImplemented,
} from "../../../shared/errors/backend-error";
import { OperationsMemoryRepository } from "./operations-memory.repository";
import type {
  CreateOperationsRecord,
  OperationsMetrics,
  OperationsQuery,
  OperationsRecord,
  PublicSettings,
} from "../types";

export class OperationsSupabaseRepository extends OperationsMemoryRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {
    super();
  }

  override async list(query: OperationsQuery): Promise<OperationsRecord[]> {
    try {
      const memoryRecords = await super.list(query);

      if (query.domain === "platform-announcements") {
        const { data: dbNews } = await this.supabase
          .from("breaking_news")
          .select("*")
          .order("created_at", { ascending: false });

        if (dbNews && dbNews.length > 0) {
          const dbRecords: OperationsRecord[] = dbNews.map((n) => ({
            id: n.id,
            domain: "platform-announcements",
            title: n.text,
            summary: n.text,
            content: n.text,
            status: "published",
            priority: "normal",
            visibility: "public",
            category: "announcement",
            tags: ["announcement"],
            details: { banner: true },
            createdAt: n.created_at ?? new Date().toISOString(),
            updatedAt: n.created_at ?? new Date().toISOString(),
          }));
          return [...dbRecords, ...memoryRecords.filter((m) => !dbRecords.some((d) => d.id === m.id))];
        }
      }

      return memoryRecords;
    } catch {
      return super.list(query);
    }
  }

  override async create(query: OperationsQuery, input: CreateOperationsRecord): Promise<OperationsRecord> {
    if (query.domain !== "platform-announcements") {
      throw storageNotImplemented(`création ${query.domain}`);
    }

    try {
      const { data, error } = await this.supabase
        .from("breaking_news")
        .insert({ text: input.title })
        .select()
        .single();
      if (error) throw error;
      if (!data) {
        throw new BackendError(
          "UNKNOWN_ERROR",
          "L’annonce n’a pas été confirmée par le stockage distant.",
        );
      }

      return {
        id: data.id,
        domain: "platform-announcements",
        title: data.text,
        summary: data.text,
        content: data.text,
        status: "published",
        priority: input.priority ?? "normal",
        visibility: "public",
        category: input.category ?? "announcement",
        tags: [],
        details: { banner: true },
        createdAt: data.created_at ?? new Date().toISOString(),
        updatedAt: data.created_at ?? new Date().toISOString(),
      };
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  override async update(): Promise<OperationsRecord> {
    throw storageNotImplemented("mise à jour des opérations plateforme");
  }

  override async remove(): Promise<void> {
    throw storageNotImplemented("suppression des opérations plateforme");
  }

  override async metrics(): Promise<OperationsMetrics> {
    const memoryMetrics = await super.metrics();
    try {
      const { count: newsCount } = await this.supabase
        .from("breaking_news")
        .select("*", { count: "exact", head: true });

      return {
        ...memoryMetrics,
        publishedPages: (newsCount ?? 0) + memoryMetrics.publishedPages,
      };
    } catch {
      return memoryMetrics;
    }
  }

  override async settings(): Promise<PublicSettings> {
    return super.settings();
  }
}
