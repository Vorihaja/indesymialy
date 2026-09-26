"use client";

import {
  Check,
  X,
} from "lucide-react";

import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";
import {
  useEventCoorganizationRequests,
} from "@/modules/organizer-erp/real-data/useEventCoorganizationRequests";

function invitationDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      dateStyle: "medium",
    },
  ).format(date);
}

export function KoranaEventCoorganizationRequests() {
  const {
    items,
    loading,
    error,
    mutatingResponses,
    respond,
  } = useEventCoorganizationRequests();

  if (loading) {
    return (
      <div className="min-h-[160px]">
        <IndesyDualOrbitLoader
          variant="compact"
          label="Chargement des invitations de coorganisation"
        />
      </div>
    );
  }

  if (error) {
    return (
      <p
        role="alert"
        className="text-sm text-red-300"
      >
        {error}
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Aucune invitation de coorganisation en attente.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const busy =
          Boolean(
            mutatingResponses[item.id],
          );

        return (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 border border-white/[0.07] bg-[#0b0d10] p-3"
          >
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-zinc-100">
                {item.event_title}
              </h3>

              <p className="mt-1 text-xs text-zinc-400">
                {item.organization_name}
                {" · "}
                {item.role}
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Invitation reçue le{" "}
                {invitationDate(item.invited_at)}
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void respond(
                    item,
                    true,
                  ).catch(
                    () => undefined,
                  )
                }
                className="inline-flex h-8 items-center gap-1 border border-emerald-500/30 px-2 text-xs font-semibold text-emerald-300 disabled:opacity-50"
              >
                <Check
                  size={13}
                  aria-hidden="true"
                />
                Accepter
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void respond(
                    item,
                    false,
                  ).catch(
                    () => undefined,
                  )
                }
                className="inline-flex h-8 items-center gap-1 border border-red-500/30 px-2 text-xs font-semibold text-red-300 disabled:opacity-50"
              >
                <X
                  size={13}
                  aria-hidden="true"
                />
                Refuser
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}