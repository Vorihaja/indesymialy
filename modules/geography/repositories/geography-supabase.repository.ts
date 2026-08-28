import type { SupabaseClient } from "@supabase/supabase-js";
import type { GeographyRepository } from "./geography.repository";
import type { GeographySnapshot } from "../types";

type Row = Record<string, string | boolean | null>;

async function allRows(client: SupabaseClient, table: string, columns: string): Promise<Row[]> {
  const rows: Row[] = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await client.from(table).select(columns).eq("is_active", true).order("name").range(from, from + size - 1);
    if (error) throw error;
    const page = (data ?? []) as unknown as Row[];
    rows.push(...page);
    if (page.length < size) return rows;
  }
}

export class GeographySupabaseRepository implements GeographyRepository {
  constructor(private readonly client: SupabaseClient) {}
  async load(): Promise<GeographySnapshot> {
    const [regions, districts, cities, communes] = await Promise.all([
      allRows(this.client, "regions", "id,name,slug,is_active"),
      allRows(this.client, "districts", "id,region_id,name,slug,is_active"),
      allRows(this.client, "cities", "id,region_id,district_id,name,slug,is_active"),
      allRows(this.client, "communes", "id,region_id,district_id,city_id,name,slug,is_active"),
    ]);
    return {
      regions: regions.map(row => ({ id: String(row.id), name: String(row.name), slug: String(row.slug ?? "") })),
      districts: districts.map(row => ({ id: String(row.id), regionId: String(row.region_id), name: String(row.name), slug: String(row.slug) })),
      cities: cities.map(row => ({ id: String(row.id), regionId: String(row.region_id), districtId: row.district_id ? String(row.district_id) : null, name: String(row.name), slug: String(row.slug ?? "") })),
      communes: communes.map(row => ({ id: String(row.id), regionId: String(row.region_id), districtId: String(row.district_id), cityId: row.city_id ? String(row.city_id) : null, name: String(row.name), slug: String(row.slug) })),
    };
  }
}
