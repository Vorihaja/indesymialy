"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createOperationsUseCase } from "../factories";
import type {
  CreateOperationsRecord,
  OperationsDomain,
  OperationsQuery,
  OperationsSnapshot,
  OperationsStatus,
} from "../types";

const empty: OperationsSnapshot = {
  records: [],
  metrics: { openTickets: 0, urgentTickets: 0, averageResponseHours: 0, satisfaction: 0, openIncidents: 0, publishedPages: 0 },
  settings: { platformName: "Indesy Mialy", description: "", contactEmail: "", socialLinks: [], maintenance: false, registrationsOpen: true, marketplaceEnabled: true, fightLiveEnabled: true, socialEnabled: true, languages: [], timezone: "Africa/Nairobi", legalLinks: [], platformVersion: "" },
  loading: true,
};

const errorMessage = (reason: unknown) => reason instanceof Error ? reason.message : "Erreur inattendue";

export function useOperations(domain: OperationsDomain, detailId?: string, admin = false) {
  const useCase = useMemo(() => createOperationsUseCase(), []);
  const query = useMemo<OperationsQuery>(() => ({ domain, detailId, admin }), [admin, detailId, domain]);
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
    async search(search: string, status: OperationsStatus | "all") {
      const records = await useCase.search(query, search, status);
      setState((current) => ({ ...current, records }));
    },
    create: (input: CreateOperationsRecord) => mutate(() => useCase.create(query, input)),
    update: (id: string, input: Partial<CreateOperationsRecord>) => mutate(() => useCase.update(id, input)),
    remove: (id: string) => mutate(() => useCase.remove(id)),
    refresh: load,
  };
}
