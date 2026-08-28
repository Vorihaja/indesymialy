"use client";

import { useClubEvents } from "../../hooks/useClubEvents";

const panelClass = "rounded-[2px] border border-[#303238] bg-[#151619] p-4";
const secondaryActionClass = "rounded-[2px] border border-[#3d92ff] bg-[#3d92ff]/10 px-4 py-2 text-sm font-semibold text-[#78b5ff] transition hover:bg-[#3d92ff]/20 hover:text-white";

export default function ClubEventsPage({ organizationId }: { organizationId: string }) {
  const { events, loading, error, refresh } = useClubEvents(organizationId);

  if (loading) return <p className={panelClass}>Chargement des événements...</p>;
  if (error) return <p role="alert" className="rounded-[2px] border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-300">{error}</p>;

  return (
    <section className="space-y-4 text-zinc-100">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#303238] pb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#3d92ff]">Espace club</p>
          <h1 className="mt-1 text-2xl font-bold">Événements</h1>
          <p className="mt-1 text-sm text-zinc-400">Événements réels du club.</p>
        </div>
        <button className={secondaryActionClass} onClick={refresh}>Actualiser</button>
      </div>
      {events.length === 0 ? (
        <p className="rounded-[2px] border border-dashed border-[#303238] bg-[#151619] p-4 text-sm text-zinc-500">Aucun événement pour ce club.</p>
      ) : (
        <ul className="space-y-2">
          {events.map((event) => (
            <li className="rounded-[2px] border border-[#303238] bg-[#151619] p-4" key={event.id}>
              <strong>{event.name}</strong>
              <p className="mt-1 text-sm text-zinc-300">{event.event_date}{event.venue_name ? ` · ${event.venue_name}` : ""}</p>
              {event.description && <p className="mt-1 text-sm text-zinc-500">{event.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
