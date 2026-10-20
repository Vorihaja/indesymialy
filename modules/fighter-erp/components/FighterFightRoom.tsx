"use client";

import { useState } from "react";
import { FightLiveWorkspaceFeature } from "@/modules/fight-live/features/FightLiveWorkspaceFeature";
import { useFightLiveList } from "@/modules/fight-live/hooks/useFightLiveWorkspace";

export function FighterFightRoom() {
  const [fightId, setFightId] = useState<string | null>(null);
  const { fights, loading, error } = useFightLiveList("fighter");

  if (fightId) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setFightId(null)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-bold dark:border-neutral-700"
        >
          Retour aux combats
        </button>
        <FightLiveWorkspaceFeature
          fightId={fightId}
          mode="fighter"
          section="overview"
          basePath="/dashboard/combattant"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <p className="rounded-xl border p-6 text-sm">
        Chargement des combats affectés…
      </p>
    );
  }

  if (error) {
    return (
      <p className="rounded-xl border border-red-500/30 p-6 text-red-500">
        {error}
      </p>
    );
  }

  return (
    <section className="space-y-4">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-amber-500">
          Fight Live
        </p>
        <h1 className="mt-2 text-2xl font-black">Combats affectés</h1>
      </header>

      {fights.length === 0 ? (
        <p className="rounded-xl border p-8 text-center text-neutral-500">
          Aucun combat affecté.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {fights.map((fight) => (
            <article
              key={fight.fightId}
              className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800"
            >
              <p className="text-xs uppercase text-neutral-500">
                {fight.eventName}
              </p>
              <h2 className="mt-1 font-bold">
                {fight.fightOrder ? `Combat ${fight.fightOrder} · ` : ""}
                {fight.redFighter.name} vs {fight.blueFighter.name}
              </h2>
              <p className="mt-2 text-sm text-neutral-500">
                {fight.disciplineName}
                {fight.weightCategory ? ` · ${fight.weightCategory}` : ""}
                {` · ${fight.status}`}
              </p>
              <button
                type="button"
                onClick={() => setFightId(fight.fightId)}
                className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-black"
              >
                Ouvrir le combat
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
