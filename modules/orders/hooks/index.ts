"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createOrdersUseCase } from "../factories";
import type { CheckoutInput, MarketplaceOrder, OrderStatus } from "../types";

const explain = (cause: unknown) =>
  cause instanceof Error ? cause.message : "L'opération sur la commande a échoué.";

export function useOrders(seller = false) {
  const useCase = useMemo(() => createOrdersUseCase(seller), [seller]);
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setOrders(await useCase.list());
    } catch (cause) {
      setError(explain(cause));
    } finally {
      setLoading(false);
    }
  }, [useCase]);

  useEffect(() => { queueMicrotask(() => { void refresh(); }); }, [refresh]);

  const detail = useCallback(async (id: string) => {
    try {
      setError(null);
      return await useCase.detail(id);
    } catch (cause) {
      setError(explain(cause));
      throw cause;
    }
  }, [useCase]);

  const mutate = useCallback(async <T,>(operation: () => Promise<T>) => {
    try {
      setActing(true);
      setError(null);
      const result = await operation();
      await refresh();
      return result;
    } catch (cause) {
      setError(explain(cause));
      throw cause;
    } finally {
      setActing(false);
    }
  }, [refresh]);

  return {
    orders, loading, acting, error, refresh, detail,
    checkout: (input: CheckoutInput) => mutate(() => useCase.checkout(input)),
    updateStatus: (id: string, status: OrderStatus, reason?: string) =>
      mutate(() => useCase.updateStatus(id, status, reason)),
    confirmPaymentPaid: (paymentId: string, providerReference?: string, reason?: string) =>
      mutate(() => useCase.confirmPaymentPaid(paymentId, providerReference, reason)),
    remove: (id: string) => mutate(() => useCase.remove(id)),
  };
}
