import type { FighterStats } from "@/modules/fighters/types";

interface Props {
  stats: FighterStats;
}

export function FighterCareerStats({
  stats,
}: Props) {
  return (
    <div className="border border-neutral-800 bg-neutral-900 p-5 shadow-xl">
      <p className="text-xs uppercase text-neutral-500">
        Carrière
      </p>

      <div className="mt-4 space-y-2 text-sm text-neutral-300">
        <p>
          Victoires : {stats.wins}
        </p>

        <p>
          Défaites : {stats.losses}
        </p>

        <p>
          Nuls : {stats.draws}
        </p>

        <p>
          Série :
          {" "}
          {stats.win_streak}
        </p>
      </div>
    </div>
  );
}