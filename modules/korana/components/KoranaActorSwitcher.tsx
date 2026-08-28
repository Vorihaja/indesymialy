"use client";

import {
  Building2,
  Check,
  ChevronDown,
  UserRound,
} from "lucide-react";

import type {
  KoranaFeedActor,
} from "../feed.types";


export function KoranaActorSwitcher({
  actors,
  activeActorId,
  onSelect,
}: {
  actors: KoranaFeedActor[];
  activeActorId: string | null;
  onSelect: (actorId: string) => void;
}) {

  if (
    actors.length === 0
  ) {

    return (
      <div className="flex h-9 items-center border border-[#465264]/55 bg-[#1b222c] px-2.5 text-[9px] font-semibold text-[#94a0b0]">
        Consultation publique
      </div>
    );
  }


  const activeActor =
    actors.find(
      (actor) =>
        actor.id ===
        activeActorId,
    ) ??
    actors[0];


  return (
    <label className="relative block">

      <span className="sr-only">
        Utiliser Korana en tant que
      </span>


      <div className="pointer-events-none absolute left-2.5 top-1/2 z-10 -translate-y-1/2 text-[#64a8ff]">

        {activeActor.type ===
        "organization" ? (
          <Building2 size={13} />
        ) : (
          <UserRound size={13} />
        )}

      </div>


      <select
        value={
          activeActor.id
        }
        onChange={(event) =>
          onSelect(
            event.target.value,
          )
        }
        className="korana-identity-select h-9 w-full appearance-none pl-8 pr-8 text-[9px] font-bold outline-none transition"
      >

        {actors.map(
          (actor) => (
            <option
              key={
                actor.id
              }
              value={
                actor.id
              }
            >
              {actor.displayName}
            </option>
          ),
        )}

      </select>


      <ChevronDown
        size={12}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#aab5c3]"
        aria-hidden="true"
      />


      {activeActor.status ===
      "active" ? (

        <Check
          size={10}
          className="pointer-events-none absolute -right-1 -top-1 bg-[#ff1638] p-[1px] text-white shadow-[0_0_12px_rgba(255,22,56,0.45)]"
          aria-hidden="true"
        />

      ) : null}

    </label>
  );
}