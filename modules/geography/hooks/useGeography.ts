"use client";
import { useEffect, useMemo, useState } from "react";
import { createLoadGeographyUseCase } from "../geography.factory";
import type { GeographySnapshot } from "../types";
let cache: GeographySnapshot | null = null;
let pending: Promise<GeographySnapshot> | null = null;
export function useGeography() {
  const useCase = useMemo(() => createLoadGeographyUseCase(), []);
  const [data, setData] = useState<GeographySnapshot | null>(cache);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (!pending) pending = useCase.execute().then(result => (cache = result)).finally(() => { pending = null; });
    pending.then(result => { if (active) { setData(result); setLoading(false); } }).catch(reason => { if (active) { setError(reason instanceof Error ? reason.message : "Référentiel géographique indisponible"); setLoading(false); } });
    return () => { active = false; };
  }, [useCase]);
  return { data, loading, error };
}
