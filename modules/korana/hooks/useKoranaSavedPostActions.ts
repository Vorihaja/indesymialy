"use client";

import {
  useState,
} from "react";

import type {
  SetKoranaSavedPostInput,
} from "../saved-post.types";

import {
  createSetKoranaSavedPostUseCase,
} from "../factories/korana-saved-post.factory";


function readableError(
  reason: unknown,
) {

  const message =
    reason instanceof Error
      ? reason.message
      : "Impossible de modifier cet enregistrement.";


  if (
    message.includes(
      "AUTHENTICATION_REQUIRED",
    )
  ) {

    return "Connecte-toi pour enregistrer cette publication.";
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

    return "Cette publication n’est plus disponible.";
  }


  return message;
}


export function useKoranaSavedPostActions() {

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


  async function setSaved(
    input:
      SetKoranaSavedPostInput,
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
        createSetKoranaSavedPostUseCase();


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
    setSaved,
  };
}