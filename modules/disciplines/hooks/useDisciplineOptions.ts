"use client";
import { useEffect, useMemo, useState } from "react";
import { createListDisciplineOptionsUseCase } from "../factories/discipline-options.factory";
import type { DisciplineOption } from "../types/options";
let cache: DisciplineOption[] | null = null;
let pending: Promise<DisciplineOption[]> | null = null;
export function useDisciplineOptions() {
  const useCase = useMemo(() => createListDisciplineOptionsUseCase(), []);
  const [items, setItems] = useState<DisciplineOption[]>(cache ?? []);
  const [loading, setLoading] = useState(cache === null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    pending ??= useCase.execute().then(result => (cache = result)).finally(() => { pending = null; });
    void pending.then(result => { if (active) { setItems(result); setError(null); setLoading(false); } }).catch(reason => { if (active) { setError(reason instanceof Error ? reason.message : "Disciplines indisponibles"); setLoading(false); } });
    return () => { active = false; };
  }, [useCase]);
  return { items, loading, error };
}