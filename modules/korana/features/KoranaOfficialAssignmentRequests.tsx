"use client";

import { Check, X } from "lucide-react";
import { useRefereeAssignments } from "@/modules/referees/assignments/hooks/useRefereeAssignments";
import type { RefereeAssignmentItem } from "@/modules/referees/assignments/types";

const pendingStatuses = new Set([
  "invited",
  "assigned",
  "pending",
]);

function isPending(item: RefereeAssignmentItem) {
  return pendingStatuses.has(item.status.trim().toLocaleLowerCase("fr-FR"));
}

export function KoranaOfficialAssignmentRequests() {
  const { items, loading, error, mutatingResponses, respond } =
    useRefereeAssignments();
  const requests = items.filter(isPending);

  if (loading) {
    return <p className="text-sm text-zinc-500">Chargement des désignations…</p>;
  }

  if (error) {
    return <p role="alert" className="text-sm text-red-300">{error}</p>;
  }

  if (requests.length === 0) {
    return <p className="text-sm text-zinc-500">Aucune désignation en attente.</p>;
  }

  return (
    <ul className="space-y-2">
      {requests.map((item) => {
        const busy = Boolean(mutatingResponses[item.key]);

        return (
          <li
            key={item.key}
            className="flex flex-wrap items-center justify-between gap-3 border border-white/[0.07] bg-[#0b0d10] p-3"
          >
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-zinc-100">
                {item.eventTitle}
              </h3>
              <p className="mt-1 text-xs text-zinc-400">
                {item.assignmentLabel} · {item.role}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {item.startsAt ?? "Date à confirmer"}
                {item.venue ? ` · ${item.venue}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void respond(item, "confirmed")}
                className="inline-flex h-8 items-center gap-1 border border-emerald-500/30 px-2 text-xs font-semibold text-emerald-300 disabled:opacity-50"
              >
                <Check size={13} aria-hidden="true" />
                Confirmer
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void respond(item, "declined")}
                className="inline-flex h-8 items-center gap-1 border border-red-500/30 px-2 text-xs font-semibold text-red-300 disabled:opacity-50"
              >
                <X size={13} aria-hidden="true" />
                Refuser
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}