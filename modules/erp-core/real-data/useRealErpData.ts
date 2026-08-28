"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createRealErpDataUseCase } from "./real-erp-data.factory";
import type { RealErpData, RealErpMutation, RealErpQuery } from "./types";
import { normalizeBackendError } from "@/shared/errors/backend-error";

export function useRealErpData(query: RealErpQuery) {
  const useCase = useMemo(() => createRealErpDataUseCase(), []);
  const [data, setData] = useState<RealErpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setData(await useCase.execute(query));
      setError(null);
    } catch (reason) {
      setData(null);
      setError(reason instanceof Error ? reason.message : normalizeBackendError(reason).message);
    } finally {
      setLoading(false);
    }
  }, [query.moduleId, query.moduleLabel, query.role, query.tab, useCase]);

  useEffect(() => { void refresh(); }, [refresh]);

  const runMutation = useCallback(async (operation: () => Promise<unknown>) => {
    setMutating(true);
    try {
      await operation();
      await refresh();
    } catch (reason) {
      throw reason instanceof Error ? reason : normalizeBackendError(reason);
    } finally {
      setMutating(false);
    }
  }, [refresh]);

  const create = useCallback((mutation: RealErpMutation) => runMutation(() => useCase.create(mutation)), [runMutation, useCase]);
  const update = useCallback((id: string, mutation: RealErpMutation) => runMutation(() => useCase.update(id, mutation)), [runMutation, useCase]);
  const remove = useCallback((entity: RealErpMutation["entity"], id: string) => runMutation(() => useCase.remove(entity, id)), [runMutation, useCase]);

  return { data, loading, mutating, error, refresh, create, update, remove };
}
