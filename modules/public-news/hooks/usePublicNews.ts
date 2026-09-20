'use client';
import { useEffect, useMemo, useState } from 'react';
import { createPublicNewsUseCase } from '../factory';
import type { PublicNewsFilters, PublicNewsPage } from '../types';
const initial: PublicNewsFilters = { query: '', page: 1, pageSize: 9 };
export function usePublicNews() { const useCase = useMemo(() => createPublicNewsUseCase(), []); const [filters, setFilters] = useState(initial); const [result, setResult] = useState<PublicNewsPage>({ items: [], total: 0 }); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); useEffect(() => { let active = true; queueMicrotask(async () => { try { setLoading(true); const next = await useCase.execute(filters); if (active) { setResult(next); setError(null); } } catch (reason) { if (active) setError(reason instanceof Error ? reason.message : 'Erreur inattendue'); } finally { if (active) setLoading(false); } }); return () => { active = false; }; }, [filters, useCase]); return { filters, setFilters, result, loading, error }; }
