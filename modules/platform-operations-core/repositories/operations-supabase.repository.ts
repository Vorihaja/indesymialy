import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";
import {
  BackendError,
  normalizeBackendError,
  storageNotImplemented,
} from "../../../shared/errors/backend-error";
import type { OperationsRepository } from "./operations.repository";
import type {
  CreateOperationsRecord,
  OperationsMetrics,
  OperationsQuery,
  OperationsRecord,
  PublicSettings,
} from "../types";

export class OperationsSupabaseRepository implements OperationsRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async list(query: OperationsQuery): Promise<OperationsRecord[]> {
    if (query.domain !== "platform-announcements") {
      throw storageNotImplemented(`lecture ${query.domain}`);
    }

    try {
      const { data: dbNews, error } = await this.supabase
        .from("breaking_news")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const records: OperationsRecord[] = (dbNews ?? []).map((news) => ({
        id: news.id,
        domain: "platform-announcements",
        title: news.text,
        summary: news.text,
        content: news.text,
        status: "published",
        priority: "normal",
        visibility: "public",
        category: "announcement",
        tags: ["announcement"],
        details: { banner: true },
        createdAt: news.created_at ?? new Date().toISOString(),
        updatedAt: news.created_at ?? new Date().toISOString(),
      }));

      const term = query.search?.trim().toLowerCase();

      return records.filter(
        (item) =>
          (!query.detailId ||
            item.id === query.detailId ||
            item.slug === query.detailId) &&
          (!term ||
            `${item.title} ${item.summary} ${item.tags.join(" ")}`
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
    query: OperationsQuery,
    input: CreateOperationsRecord,
  ): Promise<OperationsRecord> {
    if (query.domain !== "platform-announcements") {
      throw storageNotImplemented(`création ${query.domain}`);
    }

    try {
      const { data, error } = await this.supabase
        .from("breaking_news")
        .insert({ text: input.title })
        .select()
        .single();

      if (error) {
        throw error;
      }

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

  async update(): Promise<OperationsRecord> {
    throw storageNotImplemented("mise à jour des opérations plateforme");
  }

  async remove(): Promise<void> {
    throw storageNotImplemented("suppression des opérations plateforme");
  }

  async metrics(): Promise<OperationsMetrics> {
    throw storageNotImplemented("métriques des opérations plateforme");
  }

  async settings(): Promise<PublicSettings> {
    throw storageNotImplemented("configuration publique de la plateforme");
  }
}