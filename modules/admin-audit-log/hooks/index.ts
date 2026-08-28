"use client";
import { useEffect, useMemo, useState } from "react";
import type { AdminAuditLogData, AdminAuditLogDomain } from "../types";
import { createAdminAuditLogUseCase } from "../factories";
export function useAdminAuditLog(domain: AdminAuditLogDomain = "audit-log") { const useCase = useMemo(() => createAdminAuditLogUseCase(), []); const [data, setData] = useState<AdminAuditLogData | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); useEffect(() => { let active = true; queueMicrotask(() => { if (active) setLoading(true); }); void useCase.execute(domain).then((result) => { if (active) setData(result); }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Erreur inattendue"); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [domain, useCase]); return { data, loading, error }; }
