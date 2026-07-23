"use client";

import { useCallback, useEffect, useState } from "react";
import { getFighters } from "@/modules/fighters/services/fighters.service";
import type { Fighter } from "@/modules/fighters/types";

interface UseFightersResult {
  fighters: Fighter[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useFighters(): UseFightersResult {
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getFighters();
      setFighters(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    fighters,
    loading,
    error,
    refresh,
  };
}