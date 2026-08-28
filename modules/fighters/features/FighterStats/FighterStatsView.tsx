"use client";

import { useFighterStats } from "@/modules/fighters/hooks/useFighterStats";

import {
  StatBox,
  WinRateCard,
} from "@/modules/fighters/features/FighterStats";


interface Props {
  fighterId?: string | null;
}


export function FighterStatsView({
  fighterId,
}: Props) {


  const {
    stats,
    loading,
    error,
  } = useFighterStats(fighterId);



  if (loading) {
    return (
      <div className="text-sm text-neutral-400">
        Chargement des statistiques...
      </div>
    );
  }



  if (error || !stats) {
    return (
      <div className="text-sm text-red-400">
        Impossible de charger les statistiques.
      </div>
    );
  }



  const totalFights =
    stats.wins +
    stats.losses +
    stats.draws;



  const winRate =
    totalFights > 0
      ? Math.round(
          (stats.wins / totalFights) * 100
        )
      : 0;



  return (

    <div className="space-y-6">


      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">


        <StatBox
          label="Victoires"
          value={stats.wins}
          accent="text-emerald-400"
        />


        <StatBox
          label="Défaites"
          value={stats.losses}
          accent="text-red-400"
        />


        <StatBox
          label="Nuls"
          value={stats.draws}
          accent="text-yellow-400"
        />


        <StatBox
          label="Série"
          value={stats.win_streak}
          accent="text-blue-400"
        />


      </div>



      <WinRateCard
        percentage={winRate}
        total={totalFights}
      />


    </div>

  );
}