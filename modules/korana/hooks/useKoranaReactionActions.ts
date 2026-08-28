"use client";

import {
  useMemo,
  useState,
} from "react";

import type {
  KoranaSetPostReactionInput,
} from "../reaction.types";

import {
  makeSetKoranaPostReactionUseCase,
} from "../factories/korana-reaction.factory";


export function useKoranaReactionActions() {

  const useCase =
    useMemo(
      () =>
        makeSetKoranaPostReactionUseCase(),
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


  async function setReaction(
    input:
      KoranaSetPostReactionInput,
  ) {

    if (pending) {

      return null;
    }


    setPending(
      true,
    );

    setError(
      null,
    );


    try {

      return await useCase.execute(
        input,
      );

    } catch (
      reason
    ) {

      const message =
        reason instanceof Error
          ? reason.message
          : "Impossible d'enregistrer la réaction Korana.";


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


    setReaction,
  };
}