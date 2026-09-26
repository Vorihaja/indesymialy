"use client";

import {
  Check,
  X,
} from "lucide-react";

import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";
import {
  useStaffAssignments,
} from "@/modules/event-core/staff-assignments/hooks/useStaffAssignments";

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "À confirmer";
  }

  const date =
    new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "À confirmer";
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

export function KoranaStaffAssignmentRequests() {
  const {
    items,
    loading,
    error,
    mutatingResponses,
    respond,
  } = useStaffAssignments();

  if (loading) {
    return (
      <div className="min-h-[160px]">
        <IndesyDualOrbitLoader
          variant="compact"
          label="Chargement des affectations"
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
        Aucune affectation en attente.
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
                {item.eventTitle}
              </h3>

              <p className="mt-1 text-xs text-zinc-400">
                {item.role}
                {item.zone
                  ? ` · ${item.zone}`
                  : ""}
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Affectation :{" "}
                {formatDate(
                  item.startsAt ??
                    item.eventStartsAt,
                )}
              </p>

              {item.eventVenue ? (
                <p className="mt-1 text-xs text-zinc-500">
                  {item.eventVenue}
                </p>
              ) : null}
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
                Confirmer
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