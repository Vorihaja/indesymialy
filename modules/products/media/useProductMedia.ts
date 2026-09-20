"use client";

import {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  createProductMediaUseCase,
} from "./product-media.factory";

import type {
  ProductMediaAsset,
} from "./product-media.repository";


export function useProductMedia() {
  const useCase =
    useMemo(
      () =>
        createProductMediaUseCase(),
      [],
    );

  const [
    library,
    setLibrary,
  ] =
    useState<
      ProductMediaAsset[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

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
            await useCase.list();

          setLibrary(
            items,
          );

          return items;
        }
        catch (cause) {
          const message =
            cause instanceof Error
              ? cause.message
              : "Bibliothèque indisponible.";

          setError(
            message,
          );

          throw cause;
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


  const upload =
    useCallback(
      async (
        files: File[],
      ) => {
        setLoading(true);
        setError(null);

        try {
          const items =
            await useCase.upload(
              files,
            );

          setLibrary(
            (current) => [
              ...items,
              ...current,
            ],
          );

          return items;
        }
        catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Import impossible.",
          );

          throw cause;
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


  const remove =
    useCallback(
      async (
        path: string,
      ) => {
        setLoading(true);
        setError(null);

        try {
          await useCase.remove(
            path,
          );

          setLibrary(
            (current) =>
              current.filter(
                (item) =>
                  item.path !==
                  path,
              ),
          );
        }
        catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Suppression impossible.",
          );

          throw cause;
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


  return {
    library,
    loading,
    error,
    refresh,
    upload,
    remove,
  };
}