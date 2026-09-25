"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createCatalogUseCase } from "../factories";
import type { CatalogResult, MarketplaceProduct, ProductFilters } from "../types";

const initialFilters: ProductFilters = {
  search: "", type: "all", category: "", condition: "all", location: "",
  sort: "recent", page: 1, pageSize: 12,
};
const emptyResult: CatalogResult = {
  items: [], total: 0, page: 1, pageCount: 1, recommended: [], recent: [], popular: [],
};
const errorMessage = (cause: unknown) =>
  cause instanceof Error ? cause.message : "Erreur catalogue";

export function useCatalog(initial: Partial<ProductFilters> = {}) {
  const useCase = useMemo(() => createCatalogUseCase(), []);
  const [filters, setFilters] = useState<ProductFilters>({ ...initialFilters, ...initial });
  const [result, setResult] = useState<CatalogResult>(emptyResult);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, ids, persistedFavorites] = await Promise.all([
        useCase.execute(filters), useCase.favorites(), useCase.favoriteProducts(),
      ]);
      setResult(data);
      setFavorites(ids);
      setFavoriteItems(persistedFavorites);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [filters, useCase]);

  useEffect(() => { queueMicrotask(() => { void refresh(); }); }, [refresh]);

  const toggleFavorite = async (id: string) => {
    try {
      setError(null);
      await useCase.toggleFavorite(id);
      await refresh();
    } catch (cause) {
      setError(errorMessage(cause));
      throw cause;
    }
  };

  return {
    filters, setFilters, result, favorites, favoriteItems, loading, error, refresh,
    toggleFavorite,
    detail: useCase.detail.bind(useCase),
  };
}
