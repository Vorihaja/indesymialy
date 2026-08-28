"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createErpUseCase } from "../factories/erp.factory";
import type { ErpFilters, ErpModuleDefinition, ErpRecord, ErpRecordInput, ErpStatistics } from "../types";

const emptyStatistics: ErpStatistics = { total: 0, active: 0, draft: 0, archived: 0 };

export function useErpCrud(definition: ErpModuleDefinition) {
  const useCase = useMemo(() => createErpUseCase(definition.key), [definition.key]);
  const [records, setRecords] = useState<ErpRecord[]>([]);
  const [statistics, setStatistics] = useState(emptyStatistics);
  const [filters, setFilters] = useState<ErpFilters>({ search: "", status: "all" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => { try { setLoading(true); setError(null); const [items, stats] = await Promise.all([useCase.list(filters), useCase.statistics()]); setRecords(items); setStatistics(stats); } catch (cause) { setError(cause instanceof Error ? cause.message : "Erreur ERP inattendue."); } finally { setLoading(false); } }, [filters, useCase]);
  useEffect(() => { queueMicrotask(() => { void refresh(); }); }, [refresh]);

  const create = useCallback(async (input: ErpRecordInput) => { await useCase.create(input); await refresh(); }, [refresh, useCase]);
  const update = useCallback(async (id: string, input: ErpRecordInput) => { await useCase.update(id, input); await refresh(); }, [refresh, useCase]);
  const remove = useCallback(async (id: string) => { await useCase.remove(id); await refresh(); }, [refresh, useCase]);

  return { records, statistics, filters, setFilters, loading, error, refresh, create, update, remove, detail: useCase.detail.bind(useCase) };
}
