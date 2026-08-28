"use client";

import {
  useMemo,
  useState,
} from "react";

import type {
  CreateKoranaPostInput,
  KoranaPostMutationResult,
  UpdateKoranaPostInput,
} from "../post.types";

import {
  makeCreateKoranaPostUseCase,
  makeDeleteKoranaPostUseCase,
  makeUpdateKoranaPostUseCase,
} from "../factories/korana-post.factory";


export function useKoranaPostActions() {

  const createUseCase =
    useMemo(
      () =>
        makeCreateKoranaPostUseCase(),
      [],
    );


  const updateUseCase =
    useMemo(
      () =>
        makeUpdateKoranaPostUseCase(),
      [],
    );


  const deleteUseCase =
    useMemo(
      () =>
        makeDeleteKoranaPostUseCase(),
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


  async function run(
    action:
      () =>
        Promise<KoranaPostMutationResult>,
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
          : "Une erreur Korana est survenue.";


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


    create:
      (
        input:
          CreateKoranaPostInput,
      ) =>
        run(
          () =>
            createUseCase.execute(
              input,
            ),
        ),


    update:
      (
        input:
          UpdateKoranaPostInput,
      ) =>
        run(
          () =>
            updateUseCase.execute(
              input,
            ),
        ),


    remove:
      (
        postId:
          string,
      ) =>
        run(
          () =>
            deleteUseCase.execute(
              postId,
            ),
        ),
  };
}