import type { FighterStats } from "@/modules/fighters/types";

interface Props {
  stats: FighterStats;
}

export function FighterProfileStats({
  stats,
}: Props) {

  return (
    <section className="border border-neutral-800 bg-neutral-900 p-5">

      <h2 className="text-xs uppercase text-neutral-500">
        Statistiques
      </h2>


      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">

        <Stat label="Victoires" value={stats.wins}/>
        <Stat label="Défaites" value={stats.losses}/>
        <Stat label="Nuls" value={stats.draws}/>
        <Stat label="Série" value={stats.win_streak}/>

      </div>

    </section>
  );
}


function Stat({
  label,
  value,
}: {
  label:string;
  value:number;
}) {

  return (
    <div>

      <p className="text-xs text-neutral-500">
        {label}
      </p>

      <p className="text-2xl font-black text-white">
        {value}
      </p>

    </div>
  );
}