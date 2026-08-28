"use client";

import { useCallback, useEffect, useState } from "react";
import { makeFighterService } from "@/modules/fighters/services";
import type { Fighter } from "@/modules/fighters/types";

interface UseFighterProfileResult {
  fighter: Fighter | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useFighterProfile(
  fighterId?: string | null
): UseFighterProfileResult {
  const [fighter, setFighter] = useState<Fighter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!fighterId) {
      setFighter(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const service = makeFighterService();

      const data = await service.getFighterById(fighterId);

      setFighter(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Unable to load fighter profile")
      );
    } finally {
      setLoading(false);
    }
  }, [fighterId]);

  useEffect(() => { queueMicrotask(() => { void refresh(); }); }, [refresh]);

  return {
    fighter,
    loading,
    error,
    refresh,
  };
}