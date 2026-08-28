import type { FighterStats } from "@/modules/fighters/types";

interface Props {
  stats: FighterStats;
}

export function FighterProfileStats({
  stats,
}: Props) {

  return (
    <div className="border border-neutral-800 bg-neutral-900 p-5 shadow-xl">

      <h2 className="text-sm uppercase tracking-wider text-neutral-500">
        Statistiques carrière
      </h2>


      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">


        <div>
          <p className="text-xs text-neutral-500">
            Victoires
          </p>

          <p className="text-2xl font-black text-white">
            {stats.wins}
          </p>
        </div>



        <div>
          <p className="text-xs text-neutral-500">
            Défaites
          </p>

          <p className="text-2xl font-black text-white">
            {stats.losses}
          </p>
        </div>



        <div>
          <p className="text-xs text-neutral-500">
            Nuls
          </p>

          <p className="text-2xl font-black text-white">
            {stats.draws}
          </p>
        </div>



        <div>
          <p className="text-xs text-neutral-500">
            Série
          </p>

          <p className="text-2xl font-black text-white">
            {stats.win_streak}
          </p>
        </div>


      </div>

    </div>
  );
}