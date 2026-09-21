"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createProfessionalUseCase } from "../factories";
import type { CreateProfessionalRecord, ProfessionalDomain, ProfessionalQuery, ProfessionalRole, ProfessionalSnapshot, RecordStatus } from "../types";

const empty: ProfessionalSnapshot = { records: [], finance: { income: 0, expense: 0, balance: 0, budget: 0, currency: "MGA" }, alerts: [], loading: true };
const errorMessage = (reason: unknown) => reason instanceof Error ? reason.message : "Erreur inattendue";

export function useProfessional(domain: ProfessionalDomain, role: ProfessionalRole) {
  const useCase = useMemo(() => createProfessionalUseCase(), []);
  const query = useMemo<ProfessionalQuery>(() => ({ domain, role }), [domain, role]);
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
    async search(search: string, status: RecordStatus | "all") {
      const records = await useCase.search(query, search, status);
      setState((current) => ({ ...current, records }));
    },
    create: (input: CreateProfessionalRecord) => mutate(() => useCase.create(query, input)),
    update: (id: string, input: Partial<CreateProfessionalRecord>) => mutate(() => useCase.update(id, input)),
    remove: (id: string) => mutate(() => useCase.remove(id)),
    refresh: load,
  };
}
