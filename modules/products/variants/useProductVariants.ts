"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createProductVariantsUseCase,
} from "./product-variants.factory";

import type {
  ProductVariant,
  ProductVariantInput,
} from "./types";

export function useProductVariants() {
  const useCase =
    useMemo(
      () =>
        createProductVariantsUseCase(),
      [],
    );

  const [
    variants,
    setVariants,
  ] =
    useState<ProductVariant[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    mutating,
    setMutating,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(null);

  const refresh =
    useCallback(
      async () => {
        setLoading(true);
        setError(null);

        try {
          const items =
            await useCase.list();

          setVariants(items);

          return items;
        }
        catch (cause) {
          const message =
            cause instanceof Error
              ? cause.message
              : "Variantes indisponibles.";

          setError(message);

          throw cause;
        }
        finally {
          setLoading(false);
        }
      },
      [useCase],
    );

  useEffect(() => {
    void refresh().catch(
      () => undefined,
    );
  }, [refresh]);

  async function run(
    action: () => Promise<unknown>,
  ) {
    setMutating(true);
    setError(null);

    try {
      await action();
      await refresh();
    }
    catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Opération impossible.",
      );

      throw cause;
    }
    finally {
      setMutating(false);
    }
  }

  return {
    variants,
    loading,
    mutating,
    error,
    refresh,

    create:
      (input: ProductVariantInput) =>
        run(
          () =>
            useCase.create(input),
        ),

    update:
      (
        id: string,
        input: ProductVariantInput,
      ) =>
        run(
          () =>
            useCase.update(
              id,
              input,
            ),
        ),

    setActive:
      (
        id: string,
        isActive: boolean,
      ) =>
        run(
          () =>
            useCase.setActive(
              id,
              isActive,
            ),
        ),
  };
}