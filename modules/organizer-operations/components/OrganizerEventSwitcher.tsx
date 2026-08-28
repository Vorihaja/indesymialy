"use client";

import {
  CalendarDays,
  LoaderCircle,
} from "lucide-react";

import type {
  OrganizerEventBrief,
} from "../types";

export function OrganizerEventSwitcher({
  events,
  activeEventId,
  disabled,
  onChange,
}: {
  events: OrganizerEventBrief[];
  activeEventId:
    string | null;
  disabled: boolean;

  onChange: (
    eventId: string,
  ) => void;
}) {
  return (
    <div
      className="
        flex
        min-w-0
        items-center
        gap-3
        border
        border-[var(--ds-border)]
        bg-[var(--ds-bg)]
        px-3
        py-2
      "
    >
      <CalendarDays
        size={15}
        className="
          flex-none
          text-[var(--ds-primary)]
        "
        aria-hidden="true"
      />

      <div
        className="
          min-w-0
          flex-1
        "
      >
        <span
          className="
            block
            text-[7px]
            font-black
            uppercase
            tracking-[0.15em]
            text-[var(--ds-muted)]
          "
        >
          Événement actif
        </span>

        <select
          value={
            activeEventId ??
            ""
          }
          disabled={
            disabled ||
            !events.length
          }
          onChange={(
            event,
          ) => {
            const value =
              event.target
                .value;

            if (value) {
              onChange(
                value,
              );
            }
          }}
          className="
            mt-1
            w-full
            min-w-0
            border-0
            bg-transparent
            p-0
            text-[11px]
            font-black
            uppercase
            text-[var(--ds-text)]
            outline-none
          "
          aria-label="Sélectionner l’événement actif"
        >
          {!events.length && (
            <option value="">
              Aucun événement
            </option>
          )}

          {events.map(
            (event) => (
              <option
                key={
                  event.id
                }
                value={
                  event.id
                }
              >
                {
                  event.name
                }
              </option>
            ),
          )}
        </select>
      </div>

      {disabled && (
        <LoaderCircle
          size={14}
          className="
            flex-none
            animate-spin
            text-[var(--ds-primary)]
          "
          aria-label="Changement en cours"
        />
      )}
    </div>
  );
}