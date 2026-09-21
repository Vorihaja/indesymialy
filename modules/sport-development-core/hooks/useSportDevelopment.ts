"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSportUseCase } from "../factories";
import type { CreateSportRecord, SportDomain, SportQuery, SportRole, SportSnapshot, SportStatus } from "../types";

const empty: SportSnapshot = { records: [], metrics: { attendanceRate: 0, weeklyLoad: 0, progression: 0, elo: 0, objectiveCompletion: 0, availability: 0 }, timeline: [], loading: true };
const errorMessage = (reason: unknown) => reason instanceof Error ? reason.message : "Erreur inattendue";

export function useSportDevelopment(domain: SportDomain, role: SportRole, scopeId?: string) {
  const useCase = useMemo(() => createSportUseCase(), []);
  const query = useMemo<SportQuery>(() => ({ domain, role, scopeId }), [domain, role, scopeId]);
  const [state, setState] = useState(empty);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setState(await useCase.execute(query));
    } catch (reason) {
      setError(errorMessage(reason));
      setState((current) => ({ ...current, loading: false }));
    }
  }, [query, useCase]);

  const mutate = useCallback(async <T,>(operation: () => Promise<T>): Promise<T> => {
    setError(null);
    try {
      const result = await operation();
      await load();
      return result;
    } catch (reason) {
      setError(errorMessage(reason));
      throw reason;
    }
  }, [load]);

  useEffect(() => { queueMicrotask(() => { void load(); }); }, [load]);

  return {
    state,
    error,
    async search(search: string, status: SportStatus | "all") {
      const records = await useCase.search(query, search, status);
      setState((current) => ({ ...current, records }));
    },
    create: (input: CreateSportRecord) => mutate(() => useCase.create(query, input)),
    update: (id: string, input: Partial<CreateSportRecord>) => mutate(() => useCase.update(id, input)),
    remove: (id: string) => mutate(() => useCase.remove(id)),
    refresh: load,
  };
}
