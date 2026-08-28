import type { FighterStats } from "@/modules/fighters/types";

interface Props {
  stats: FighterStats;
}

function Card({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="border border-neutral-800 bg-neutral-900 p-5 shadow-xl">
      <p className="text-[10px] uppercase tracking-wider text-neutral-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

export function FighterStatsCards({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card label="Victoires" value={stats.wins} />
      <Card label="Défaites" value={stats.losses} />
      <Card label="Nuls" value={stats.draws} />
      <Card label="Série" value={stats.win_streak} />
    </div>
  );
}