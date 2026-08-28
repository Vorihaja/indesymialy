"use client";

import { RoleGuard } from "@/modules/auth/guards";
import { FighterErpPrototype } from "@/modules/fighter-erp/features/FighterErpPrototype";

export default function CombattantDashboardPage() {
  return (
    <RoleGuard role="fighter">
      <FighterErpPrototype />
    </RoleGuard>
  );
}
