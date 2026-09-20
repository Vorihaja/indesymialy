"use client";

import { useCallback, useEffect, useState } from "react";

import { createHomeSeasonUseCase } from "../factories/home-season.factory";
import type { HomeSeasonSnapshot } from "../types";

export function useHomeSeason() {
  const [snapshot, setSnapshot] = useState<HomeSeasonSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const useCase = createHomeSeasonUseCase();
      setSnapshot(await useCase.execute());
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Les données de saison sont momentanément indisponibles.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { snapshot, loading, error, refresh };
}
