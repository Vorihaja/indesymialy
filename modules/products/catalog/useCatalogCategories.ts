"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createListSellerCatalogCategoriesUseCase,
} from "./categories.factory";

import type {
  SellerCatalogCategory,
} from "./categories.repository";


export function useCatalogCategories() {
  const useCase =
    useMemo(
      () =>
        createListSellerCatalogCategoriesUseCase(),
      [],
    );

  const [
    categories,
    setCategories,
  ] =
    useState<
      SellerCatalogCategory[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

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
        setLoading(true);
        setError(null);

        try {
          const items =
            await useCase.execute();

          setCategories(
            items,
          );

          return items;
        }
        catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Catégories indisponibles.",
          );

          return [];
        }
        finally {
          setLoading(false);
        }
      },
      [
        useCase,
      ],
    );


  useEffect(
    () => {
      void refresh();
    },
    [
      refresh,
    ],
  );


  return {
    categories,
    loading,
    error,
    refresh,
  };
}