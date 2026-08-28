"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  createProfileAvatarUseCase,
} from "../factories/profile-avatar.factory";


function readableAvatarError(
  reason: unknown,
) {

  const message =
    reason instanceof Error
      ? reason.message
      : "Impossible de modifier l’avatar.";


  const normalized =
    message.toLocaleLowerCase(
      "fr-FR",
    );


  if (
    normalized.includes(
      "session",
    ) ||
    normalized.includes(
      "unauthenticated",
    ) ||
    normalized.includes(
      "authentication",
    )
  ) {

    return "Votre session a expiré. Reconnectez-vous.";
  }


  if (
    normalized.includes(
      "row-level security",
    ) ||
    normalized.includes(
      "permission",
    ) ||
    normalized.includes(
      "forbidden",
    )
  ) {

    return "Vous n’êtes pas autorisé à modifier cet avatar.";
  }


  return message;
}


export function useProfileAvatar() {

  const useCase =
    useMemo(
      () =>
        createProfileAvatarUseCase(),
      [],
    );


  const [
    pending,
    setPending,
  ] =
    useState<
      "upload" |
      "remove" |
      null
    >(
      null,
    );


  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );


  async function upload(
    file: File,
  ) {

    if (
      pending
    ) {

      return null;
    }


    setPending(
      "upload",
    );

    setError(
      null,
    );


    try {

      return await useCase.upload(
        file,
      );

    } catch (
      reason
    ) {

      const message =
        readableAvatarError(
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
        null,
      );
    }
  }


  async function remove() {

    if (
      pending
    ) {

      return null;
    }


    setPending(
      "remove",
    );

    setError(
      null,
    );


    try {

      return await useCase.remove();

    } catch (
      reason
    ) {

      const message =
        readableAvatarError(
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
        null,
      );
    }
  }


  return {
    pending,
    error,
    upload,
    remove,
    clearError:
      () =>
        setError(
          null,
        ),
  };
}