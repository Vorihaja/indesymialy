"use client";
import { useEffect, useMemo, useState } from "react";
import type { AdminSettingsData, AdminSettingsDomain } from "../types";
import { createAdminSettingsUseCase } from "../factories";
export function useAdminSettings(domain: AdminSettingsDomain = "settings") { const useCase = useMemo(() => createAdminSettingsUseCase(), []); const [data, setData] = useState<AdminSettingsData | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); useEffect(() => { let active = true; queueMicrotask(() => { if (active) setLoading(true); }); void useCase.execute(domain).then((result) => { if (active) setData(result); }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Erreur inattendue"); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [domain, useCase]); return { data, loading, error }; }
