"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createCommunicationUseCase } from "../factories/communication.factory";

export function useContextualMessage() {
  const router = useRouter();
  const useCase = useMemo(
    () => createCommunicationUseCase(),
    [],
  );
  const openingRef = useRef(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPrivateConversation = useCallback(
    async (profileId: string) => {
      if (openingRef.current) return;

      openingRef.current = true;
      setOpening(true);
      setError(null);

      try {
        const conversation = await useCase.openPrivateConversationForProfile(
          profileId,
        );
        router.push(
          `/korana/messages/${encodeURIComponent(conversation.id)}`,
        );
      } catch (cause: unknown) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Impossible d’ouvrir cette conversation.",
        );
      } finally {
        openingRef.current = false;
        setOpening(false);
      }
    },
    [router, useCase],
  );

  return {
    openPrivateConversation,
    opening,
    error,
  };
}