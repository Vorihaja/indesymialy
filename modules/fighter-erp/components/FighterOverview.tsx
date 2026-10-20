"use client";

import { RealModuleDataView } from "@/modules/organizer-erp/components/RealModuleDataView";

export function FighterOverview() {
  return (
    <RealModuleDataView
      role="fighter"
      moduleId="overview"
      moduleLabel="Vue d’ensemble"
      tab="overview"
    />
  );
}
