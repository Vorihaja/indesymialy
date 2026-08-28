import type { FighterDashboardData } from "@/modules/fighters/types";

import { FighterStatsCards } from "../components/FighterStatsCards";
import { FighterNextFightCard } from "../components/FighterNextFightCard";
import { FighterFinanceCard } from "../components/FighterFinanceCard";
import { FighterSponsorsCard } from "../components/FighterSponsorsCard";
import { FighterDocumentsCard } from "../components/FighterDocumentsCard";

interface Props {
  data: FighterDashboardData;
}

export function FighterDashboardOverview({
  data,
}: Props) {

  return (
    <div className="space-y-6">

      <FighterStatsCards
        stats={data.stats}
      />


      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        <FighterNextFightCard
          nextFight={data.nextFight}
        />

        <FighterFinanceCard
          contractsCount={data.contractsCount}
          documentsCount={data.documentsCount}
        />

      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        <FighterSponsorsCard
          count={data.sponsorsCount}
        />


        <FighterDocumentsCard
          count={data.documentsCount}
        />

      </div>

    </div>
  );
}