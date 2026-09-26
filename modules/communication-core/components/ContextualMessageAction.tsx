"use client";

import { MessageCircle } from "lucide-react";
import { useContextualMessage } from "../hooks/useContextualMessage";

export function ContextualMessageAction({
  recipientProfileId,
}: {
  recipientProfileId: string;
}) {
  const {
    openPrivateConversation,
    opening,
    error,
  } = useContextualMessage();

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={opening}
        onClick={() => void openPrivateConversation(recipientProfileId)}
        className="inline-flex min-h-8 items-center gap-1.5 border border-[#3d92ff]/40 bg-[#3d92ff]/10 px-3 py-1.5 text-xs font-semibold text-[#9ccaff] transition hover:bg-[#3d92ff]/20 disabled:cursor-wait disabled:opacity-60"
      >
        <MessageCircle size={14} aria-hidden="true" />
        {opening ? "Ouverture…" : "Message"}
      </button>
      {error && (
        <span role="alert" className="max-w-48 text-xs text-red-300">
          {error}
        </span>
      )}
    </span>
  );
}