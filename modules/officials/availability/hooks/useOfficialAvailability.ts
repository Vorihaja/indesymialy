"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { createOfficialAvailabilityUseCase } from "../factories/official-availability.factory";
import type {
  OfficialAvailabilityItem,
  UpdateOfficialAvailabilityInput,
} from "../types";

function errorMessage(reason: unknown) {
  return reason instanceof Error
    ? reason.message
    : "Une erreur est survenue pendant le chargement des disponibilités.";
}

export function useOfficialAvailability() {
  const useCase = useMemo(() => createOfficialAvailabilityUseCase(), []);
  const [items, setItems] = useState<OfficialAvailabilityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    setError(null);

    try {
      setItems(await useCase.list());
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [useCase]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [load]);

  const update = useCallback(async (input: UpdateOfficialAvailabilityInput) => {
    setMutatingId(input.id);
    setError(null);

    try {
      await useCase.update(input);
      await load(true);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setMutatingId(null);
    }
  }, [load, useCase]);

  return {
    items,
    loading,
    error,
    mutatingId,
    refresh: () => load(false),
    update,
  };
}
