"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createProductsUseCase,
} from "../factories";

import type {
  MarketplaceProduct,
  ProductInput,
  ProductLifecycleTarget,
} from "../types";

export function useProducts() {
  const useCase =
    useMemo(
      () =>
        createProductsUseCase(),
      [],
    );

  const [
    products,
    setProducts,
  ] =
    useState<MarketplaceProduct[]>(
      [],
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const refresh =
    useCallback(
      async () => {
        try {
          setLoading(
            true,
          );

          setProducts(
            await useCase.list(),
          );
        }
        catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Erreur produits",
          );
        }
        finally {
          setLoading(
            false,
          );
        }
      },
      [
        useCase,
      ],
    );

  useEffect(
    () => {
      queueMicrotask(
        () => {
          void refresh();
        },
      );
    },
    [
      refresh,
    ],
  );

  const changeStatus =
    async (
      id: string,
      targetStatus: ProductLifecycleTarget,
    ) => {
      await useCase.status(
        id,
        targetStatus,
      );

      await refresh();
    };

  return {
    products,
    loading,
    error,
    refresh,

    create:
      async (
        input: ProductInput,
      ) => {
        await useCase.create(
          input,
        );

        await refresh();
      },

    update:
      async (
        id: string,
        input: ProductInput,
      ) => {
        await useCase.update(
          id,
          input,
        );

        await refresh();
      },

    publish:
      async (
        id: string,
      ) => {
        await changeStatus(
          id,
          "published",
        );
      },

    deactivate:
      async (
        id: string,
      ) => {
        await changeStatus(
          id,
          "inactive",
        );
      },

    reactivate:
      async (
        id: string,
      ) => {
        await changeStatus(
          id,
          "published",
        );
      },

    archive:
      async (
        id: string,
      ) => {
        await changeStatus(
          id,
          "archived",
        );
      },

    /*
     * Existing UI still calls data.remove(product.id).
     *
     * The runtime now converts that legacy path into archive.
     */
    remove:
      async (
        id: string,
      ) => {
        await useCase.remove(
          id,
        );

        await refresh();
      },

    detail:
      useCase.detail.bind(
        useCase,
      ),
  };
}