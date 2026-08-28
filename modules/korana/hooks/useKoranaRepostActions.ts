"use client";

import {
  useState,
} from "react";

import type {
  SetKoranaRepostInput,
} from "../repost.types";

import {
  createSetKoranaRepostUseCase,
} from "../factories/korana-repost.factory";


function readableError(
  reason: unknown,
) {

  const message =
    reason instanceof Error
      ? reason.message
      : "Impossible de modifier la republication.";


  if (
    message.includes(
      "AUTHENTICATION_REQUIRED",
    )
  ) {

    return "Connecte-toi pour republier.";
  }


  if (
    message.includes(
      "KORANA_ACTOR_REQUIRED",
    )
  ) {

    return "Sélectionne une identité Korana.";
  }


  if (
    message.includes(
      "KORANA_ACTOR_FORBIDDEN",
    )
  ) {

    return "Cette identité ne peut pas effectuer cette action.";
  }


  if (
    message.includes(
      "KORANA_POST_UNAVAILABLE",
    )
  ) {

    return "Cette publication n’est plus disponible pour une republication.";
  }


  return message;
}


export function useKoranaRepostActions() {

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


  function clearError() {

    setError(
      null,
    );
  }


  async function setRepost(
    input:
      SetKoranaRepostInput,
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

      const useCase =
        createSetKoranaRepostUseCase();


      return await useCase.execute(
        input,
      );

    } catch (
      reason
    ) {

      const message =
        readableError(
          reason,
        );


      setError(
        message,
      );


      throw new Error(
        message,
      );

    } finally {

      setPending(
        false,
      );
    }
  }


  return {
    pending,
    error,
    clearError,
    setRepost,
  };
}