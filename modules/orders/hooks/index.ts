"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createOrdersUseCase } from "../factories";
import type {
  CheckoutInput,
  MarketplaceOrder,
  OrderStatus,
} from "../types";

export function useOrders() {
  const useCase =
    useMemo(
      () => createOrdersUseCase(),
      []
    );

  const [orders, setOrders] =
    useState<MarketplaceOrder[]>([]);

  const [loading, setLoading] =
    useState(true);

  const refresh =
    useCallback(
      async () => {
        setLoading(true);

        try {
          setOrders(
            await useCase.list()
          );
        } finally {
          setLoading(false);
        }
      },
      [useCase]
    );

  useEffect(
    () => {
      queueMicrotask(
        () => {
          void refresh();
        }
      );
    },
    [refresh]
  );

  const checkout =
    useCallback(
      async (
        input: CheckoutInput
      ) => {
        const order =
          await useCase.checkout(input);

        await refresh();

        return order;
      },
      [
        refresh,
        useCase,
      ]
    );

  const updateStatus =
    useCallback(
      async (
        id: string,
        status: OrderStatus,
        reason?: string
      ) => {
        await useCase.updateStatus(
          id,
          status,
          reason
        );

        await refresh();
      },
      [
        refresh,
        useCase,
      ]
    );

  const confirmPaymentPaid =
    useCallback(
      async (
        paymentId: string,
        providerReference?: string,
        reason?: string
      ) => {
        const orderId =
          await useCase.confirmPaymentPaid(
            paymentId,
            providerReference,
            reason
          );

        await refresh();

        return orderId;
      },
      [
        refresh,
        useCase,
      ]
    );

  const remove =
    useCallback(
      async (
        id: string
      ) => {
        await useCase.remove(id);

        await refresh();
      },
      [
        refresh,
        useCase,
      ]
    );

  return {
    orders,
    loading,
    refresh,
    detail: useCase.detail.bind(useCase),
    checkout,
    updateStatus,
    confirmPaymentPaid,
    remove,
  };
}