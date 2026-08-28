"use client";
import { useEffect, useMemo, useState } from "react";
import type { AdminOrganizationsData, AdminOrganizationsDomain } from "../types";
import { createAdminOrganizationsUseCase } from "../factories";
export function useAdminOrganizations(domain: AdminOrganizationsDomain = "organizations") { const useCase = useMemo(() => createAdminOrganizationsUseCase(), []); const [data, setData] = useState<AdminOrganizationsData | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); useEffect(() => { let active = true; queueMicrotask(() => { if (active) setLoading(true); }); void useCase.execute(domain).then((result) => { if (active) setData(result); }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Erreur inattendue"); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [domain, useCase]); return { data, loading, error }; }
