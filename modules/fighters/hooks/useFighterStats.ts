"use client";

import { useCallback, useEffect, useState } from "react";
import { makeFighterService } from "@/modules/fighters/services";
import type { FighterStats } from "@/modules/fighters/types";

interface UseFighterStatsResult {
  stats: FighterStats | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useFighterStats(
  fighterId?: string | null
): UseFighterStatsResult {
  const [stats, setStats] = useState<FighterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!fighterId) {
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const service = makeFighterService();

      const data = await service.getStats(fighterId);

      setStats(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Unable to load fighter statistics")
      );
    } finally {
      setLoading(false);
    }
  }, [fighterId]);

  useEffect(() => { queueMicrotask(() => { void refresh(); }); }, [refresh]);

  return {
    stats,
    loading,
    error,
    refresh,
  };
}