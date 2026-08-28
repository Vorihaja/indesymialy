"use client";

import {
  useMemo,
  useState,
} from "react";

import type {
  KoranaMediaUploadInput,
} from "../media.types";

import {
  makeDeleteKoranaPostMediaUseCase,
  makeUploadKoranaPostMediaUseCase,
} from "../factories/korana-media.factory";


export function useKoranaMediaActions() {

  const uploadUseCase =
    useMemo(
      () =>
        makeUploadKoranaPostMediaUseCase(),
      [],
    );


  const deleteUseCase =
    useMemo(
      () =>
        makeDeleteKoranaPostMediaUseCase(),
      [],
    );


  const [
    pending,
    setPending,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );


  async function run<T>(
    action:
      () => Promise<T>,
  ) {

    setPending(
      true,
    );

    setError(
      null,
    );


    try {

      return await action();

    } catch (
      reason
    ) {

      const message =
        reason instanceof Error
          ? reason.message
          : "Une erreur média Korana est survenue.";


      setError(
        message,
      );


      throw reason;

    } finally {

      setPending(
        false,
      );
    }
  }


  return {

    pending,

    error,


    clearError:
      () =>
        setError(
          null,
        ),


    uploadMany:
      (
        inputs:
          KoranaMediaUploadInput[],
      ) =>
        run(
          () =>
            uploadUseCase.execute(
              inputs,
            ),
        ),


    remove:
      (
        mediaId:
          string,
      ) =>
        run(
          () =>
            deleteUseCase.execute(
              mediaId,
            ),
        ),
  };
}