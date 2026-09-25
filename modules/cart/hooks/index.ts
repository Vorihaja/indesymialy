"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createCartUseCase } from "../factories";
import type { CartItem } from "../types";

const explain = (cause: unknown) =>
  cause instanceof Error ? cause.message : "Le panier n'a pas pu être mis à jour.";

export function useCart() {
  const useCase = useMemo(() => createCartUseCase(), []);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setItems(await useCase.list());
    } catch (cause) {
      setError(explain(cause));
    } finally {
      setLoading(false);
    }
  }, [useCase]);

  useEffect(() => { queueMicrotask(() => { void refresh(); }); }, [refresh]);

  const mutate = async (operation: () => Promise<unknown>) => {
    try {
      setActing(true);
      setError(null);
      await operation();
      await refresh();
    } catch (cause) {
      setError(explain(cause));
      throw cause;
    } finally {
      setActing(false);
    }
  };

  return {
    items,
    loading,
    acting,
    error,
    summary: useCase.summary(items),
    refresh,
    update: (item: CartItem, quantity: number) => mutate(() => useCase.update(item, quantity)),
    remove: (id: string) => mutate(() => useCase.remove(id)),
    clear: () => mutate(() => useCase.clear()),
  };
}
