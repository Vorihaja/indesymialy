import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";
import { DiscoveryMemoryRepository } from "./discovery-memory.repository";
import type {
  DirectoryEntry,
  DiscoveryFilters,
  DiscoveryResult,
  DiscoverySnapshot,
  PublicClub,
  PublicFighter,
} from "../types";

export class DiscoverySupabaseRepository extends DiscoveryMemoryRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {
    super();
  }

  override async snapshot(): Promise<DiscoverySnapshot> {
    const memorySnapshot = await super.snapshot();
    try {
      const [fightersRes, clubsRes, newsRes] = await Promise.all([
        this.supabase.from("fighters").select("id, full_name, nickname, weight_class, status").limit(10),
        this.supabase.from("clubs").select("id, name, region_id, is_official_federated").limit(10),
        this.supabase.from("breaking_news").select("text").limit(5),
      ]);

      const breakingNews = newsRes.data?.length
        ? newsRes.data.map((n) => n.text)
        : memorySnapshot.breakingNews;

      return {
        ...memorySnapshot,
        breakingNews,
      };
    } catch {
      return memorySnapshot;
    }
  }

  override async directory(filters: DiscoveryFilters): Promise<{ items: DirectoryEntry[]; total: number }> {
    try {
      const memoryResult = await super.directory(filters);
      if (filters.role === "fighter" || !filters.role) {
        const { data: dbFighters } = await this.supabase
          .from("fighters")
          .select("id, full_name, nickname, weight_class, status")
          .limit(filters.pageSize);

        if (dbFighters && dbFighters.length > 0) {
          const dbEntries: DirectoryEntry[] = dbFighters.map((f) => ({
            id: f.id,
            name: f.nickname ? `${f.full_name} "${f.nickname}"` : f.full_name,
            role: "fighter" as const,
            discipline: "MMA",
            region: "Analamanga",
            city: "Antananarivo",
            status: (f.status as any) || "active",
            verified: true,
            gender: "female" as const,
            weightCategory: f.weight_class ?? undefined,
            availabilityPrepared: true,
            href: `/fighters/${f.id}`,
          }));

          const merged = [...dbEntries, ...memoryResult.items.filter((m) => !dbEntries.some((d) => d.id === m.id))];
          return {
            items: merged.slice(0, filters.pageSize),
            total: Math.max(merged.length, memoryResult.total),
          };
        }
      }
      return memoryResult;
    } catch {
      return super.directory(filters);
    }
  }

  override async fighter(id: string): Promise<PublicFighter | null> {
    try {
      const { data } = await this.supabase
        .from("fighters")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (data) {
        const memoryItem = await super.fighter(id);
        return {
          id: data.id,
          name: data.full_name,
          nickname: data.nickname ?? undefined,
          club: memoryItem?.club ?? "Club officiel",
          coach: memoryItem?.coach ?? "Entraîneur principal",
          disciplines: memoryItem?.disciplines ?? ["MMA"],
          weightCategory: data.weight_class ?? "Welterweight",
          record: {
            wins: memoryItem?.record.wins ?? 0,
            losses: memoryItem?.record.losses ?? 0,
            draws: memoryItem?.record.draws ?? 0,
          },
          ranking: memoryItem?.ranking ?? 1,
          elo: memoryItem?.elo ?? 1500,
          progression: memoryItem?.progression ?? 0,
          biography: data.biography ?? memoryItem?.biography ?? "Combattant enregistré sur la plateforme Indesy Mialy.",
          recentFights: memoryItem?.recentFights ?? [],
          upcomingFights: memoryItem?.upcomingFights ?? [],
          achievements: memoryItem?.achievements ?? [],
          highlights: memoryItem?.highlights ?? [],
          mediaIds: memoryItem?.mediaIds ?? [],
          publicSponsors: memoryItem?.publicSponsors ?? [],
          news: memoryItem?.news ?? [],
          favoritePrepared: memoryItem?.favoritePrepared ?? false,
        };
      }
      return super.fighter(id);
    } catch {
      return super.fighter(id);
    }
  }

  override async club(id: string): Promise<PublicClub | null> {
    try {
      const { data } = await this.supabase
        .from("clubs")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (data) {
        const memoryItem = await super.club(id);
        return {
          id: data.id,
          name: data.name,
          description: memoryItem?.description ?? "Club de sports de combat.",
          region: memoryItem?.region ?? "Analamanga",
          city: memoryItem?.city ?? "Antananarivo",
          disciplines: memoryItem?.disciplines ?? ["MMA"],
          coaches: memoryItem?.coaches ?? [],
          fighters: memoryItem?.fighters ?? [],
          results: memoryItem?.results ?? [],
          events: memoryItem?.events ?? [],
          mediaIds: memoryItem?.mediaIds ?? [],
          news: memoryItem?.news ?? [],
          statistics: memoryItem?.statistics ?? { members: 50, fighters: 10, wins: 20, events: 5 },
          publicContact: memoryItem?.publicContact ?? "contact@indesy-mialy.mg",
          official: Boolean(data.is_official_federated),
          followPrepared: memoryItem?.followPrepared ?? false,
        };
      }
      return super.club(id);
    } catch {
      return super.club(id);
    }
  }

  override async search(query: string): Promise<DiscoveryResult[]> {
    const memoryResults = await super.search(query);
    try {
      const q = query.trim().toLowerCase();
      if (!q) return memoryResults;

      const { data: fighters } = await this.supabase
        .from("fighters")
        .select("id, full_name, nickname")
        .ilike("full_name", `%${q}%`)
        .limit(5);

      if (fighters && fighters.length > 0) {
        const dbResults: DiscoveryResult[] = fighters.map((f) => ({
          id: f.id,
          kind: "fighter" as const,
          title: f.nickname ? `${f.full_name} "${f.nickname}"` : f.full_name,
          description: "Combattant enregistré",
          href: `/fighters/${f.id}`,
          popularity: 85,
          tags: ["fighter", "official"],
        }));
        return [...dbResults, ...memoryResults.filter((m) => !dbResults.some((d) => d.id === m.id))];
      }
      return memoryResults;
    } catch {
      return memoryResults;
    }
  }
}
