"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

export const GLOBAL_SEARCH_PARAM_KEYS = ["search", "region", "ville", "dateFrom", "dateTo", "disciplines"] as const;

export interface GlobalSearchFilters {
  query: string;
  region: string;
  city: string;
  dateFrom: string;
  dateTo: string;
  disciplines: string[];
}

export function normalizeSearchValue(value: unknown) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").trim();
}

export function includesSearchValue(values: unknown[], query: string) {
  const normalizedQuery = normalizeSearchValue(query);
  return !normalizedQuery || values.some((value) => normalizeSearchValue(value).includes(normalizedQuery));
}

export function matchesGlobalFilters(
  values: unknown[],
  filters: GlobalSearchFilters,
  metadata: { region?: string; city?: string; disciplines?: string[]; date?: string | null } = {},
) {
  if (!includesSearchValue(values, filters.query)) return false;
  if (filters.region && normalizeSearchValue(metadata.region) !== normalizeSearchValue(filters.region)) return false;
  if (filters.city && normalizeSearchValue(metadata.city) !== normalizeSearchValue(filters.city)) return false;
  if (filters.disciplines.length) {
    const itemDisciplines = (metadata.disciplines ?? []).map(normalizeSearchValue);
    if (!filters.disciplines.some((discipline) => itemDisciplines.includes(normalizeSearchValue(discipline)))) return false;
  }
  if ((filters.dateFrom || filters.dateTo) && metadata.date) {
    const date = metadata.date.slice(0, 10);
    if (filters.dateFrom && date < filters.dateFrom) return false;
    if (filters.dateTo && date > filters.dateTo) return false;
  }
  return true;
}

export function useGlobalSearchFilters(): GlobalSearchFilters {
  const searchParams = useSearchParams();
  return useMemo(() => ({
    query: searchParams.get("search") ?? "",
    region: searchParams.get("region") ?? "",
    city: searchParams.get("ville") ?? "",
    dateFrom: searchParams.get("dateFrom") ?? "",
    dateTo: searchParams.get("dateTo") ?? "",
    disciplines: (searchParams.get("disciplines") ?? "").split(",").map((value) => value.trim()).filter(Boolean),
  }), [searchParams]);
}

export function hasGlobalFilters(filters: GlobalSearchFilters) {
  return Boolean(filters.query || filters.region || filters.city || filters.dateFrom || filters.dateTo || filters.disciplines.length);
}
