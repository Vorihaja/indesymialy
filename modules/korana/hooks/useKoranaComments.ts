"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  CreateKoranaCommentInput,
  KoranaCommentsSnapshot,
  UpdateKoranaCommentInput,
} from "../comment.types";

import {
  createKoranaCommentUseCases,
} from "../factories/korana-comment.factory";


function friendlyError(
  reason: unknown,
) {

  const message =
    reason instanceof Error
      ? reason.message
      : "Une erreur est survenue.";


  if (
    message.includes(
      "authentication_required",
    ) ||
    message.includes(
      "AUTHENTICATION_REQUIRED",
    )
  ) {

    return "Connecte-toi pour participer à la discussion.";
  }


  if (
    message.includes(
      "followers_only",
    )
  ) {

    return "Seuls les abonnés de l’auteur peuvent répondre à cette publication.";
  }


  if (
    message.includes(
      "mentioned_only",
    )
  ) {

    return "Seules les identités mentionnées dans la publication peuvent répondre.";
  }


  if (
    message.includes(
      "KORANA_COMMENT_CONTENT_INVALID",
    )
  ) {

    return "Le commentaire doit contenir entre 1 et 5 000 caractères.";
  }


  if (
    message.includes(
      "KORANA_COMMENT_PARENT_NOT_FOUND",
    )
  ) {

    return "Le commentaire auquel tu réponds n’est plus disponible.";
  }


  if (
    message.includes(
      "KORANA_COMMENT_FORBIDDEN",
    ) ||
    message.includes(
      "KORANA_COMMENT_ACTOR_FORBIDDEN",
    )
  ) {

    return "Cette action n’est pas autorisée avec l’identité sélectionnée.";
  }


  return message;
}


export function useKoranaComments(
  postId: string,
  actorId:
    string | null,
) {

  const useCases =
    useMemo(
      () =>
        createKoranaCommentUseCases(),
      [],
    );


  const [
    snapshot,
    setSnapshot,
  ] =
    useState<KoranaCommentsSnapshot | null>(
      null,
    );


  const [
    loaded,
    setLoaded,
  ] =
    useState(false);


  const [
    loading,
    setLoading,
  ] =
    useState(false);


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


  useEffect(
    () => {

      setSnapshot(
        null,
      );

      setLoaded(
        false,
      );

      setError(
        null,
      );

    },
    [
      postId,
      actorId,
    ],
  );


  const load =
    useCallback(
      async () => {

        setLoading(
          true,
        );

        setError(
          null,
        );


        try {

          const result =
            await useCases.get.execute(
              {
                postId,

                actorId,
              },
            );


          setSnapshot(
            result,
          );

          setLoaded(
            true,
          );


          return result;

        } catch (
          reason
        ) {

          const message =
            friendlyError(
              reason,
            );


          setError(
            message,
          );


          throw reason;

        } finally {

          setLoading(
            false,
          );
        }

      },
      [
        actorId,
        postId,
        useCases,
      ],
    );


  const create =
    useCallback(
      async (
        input:
          CreateKoranaCommentInput,
      ) => {

        setPending(
          true,
        );

        setError(
          null,
        );


        try {

          const result =
            await useCases.create.execute(
              input,
            );


          await load();


          return result;

        } catch (
          reason
        ) {

          setError(
            friendlyError(
              reason,
            ),
          );


          throw reason;

        } finally {

          setPending(
            false,
          );
        }

      },
      [
        load,
        useCases,
      ],
    );


  const update =
    useCallback(
      async (
        input:
          UpdateKoranaCommentInput,
      ) => {

        setPending(
          true,
        );

        setError(
          null,
        );


        try {

          const result =
            await useCases.update.execute(
              input,
            );


          await load();


          return result;

        } catch (
          reason
        ) {

          setError(
            friendlyError(
              reason,
            ),
          );


          throw reason;

        } finally {

          setPending(
            false,
          );
        }

      },
      [
        load,
        useCases,
      ],
    );


  const remove =
    useCallback(
      async (
        commentId:
          string,
      ) => {

        setPending(
          true,
        );

        setError(
          null,
        );


        try {

          const result =
            await useCases.remove.execute(
              commentId,
            );


          await load();


          return result;

        } catch (
          reason
        ) {

          setError(
            friendlyError(
              reason,
            ),
          );


          throw reason;

        } finally {

          setPending(
            false,
          );
        }

      },
      [
        load,
        useCases,
      ],
    );


  return {

    snapshot,

    loaded,

    loading,

    pending,

    error,

    load,

    create,

    update,

    remove,

    clearError:
      () =>
        setError(
          null,
        ),

  };
}