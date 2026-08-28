"use client";
import { useEffect, useMemo, useState } from "react";
import { createAdminDomainUseCase } from "../factories/admin-core.factory";
import type { AdminDomain, AdminDomainData } from "../types";
export function useAdminDomain(domain: AdminDomain) { const useCase = useMemo(() => createAdminDomainUseCase(), []); const [data, setData] = useState<AdminDomainData | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); useEffect(() => { let active = true; queueMicrotask(() => { if (active) { setLoading(true); setError(null); } }); void useCase.execute(domain).then((result) => { if (active) setData(result); }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Erreur inattendue"); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [domain, useCase]); return { data, loading, error }; }
