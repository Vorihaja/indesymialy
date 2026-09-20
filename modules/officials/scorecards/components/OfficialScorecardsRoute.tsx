"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";
import { RoleGuard } from "@/modules/auth/guards";
import {
  FightLiveListFeature,
  FightLiveWorkspaceFeature,
} from "@/modules/fight-live";
import { UniversalErpPrototype } from "@/modules/universal-erp";

import { useOfficialFunction } from "../../function-context";

function JudgeFunctionGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const {
    officialFunction,
    officialFunctionReady,
  } = useOfficialFunction();
  const allowed =
    officialFunctionReady && officialFunction === "judge";

  useEffect(() => {
    if (officialFunctionReady && !allowed) {
      router.replace("/dashboard/officiel");
    }
  }, [allowed, officialFunctionReady, router]);

  if (!allowed) {
    return (
      <IndesyDualOrbitLoader
        label="Vérification de l'espace juge"
        variant="data"
      />
    );
  }

  return children;
}

export function OfficialScorecardsRoute({
  fightId,
}: {
  fightId?: string;
}) {
  const basePath = fightId
    ? `/dashboard/officiel/scorecards/${fightId}`
    : "/dashboard/officiel/scorecards";

  const scorecards = fightId ? (
    <FightLiveWorkspaceFeature
      fightId={fightId}
      mode="judge"
      section="scorecard"
      basePath={basePath}
    />
  ) : (
    <FightLiveListFeature
      mode="judge"
      basePath={basePath}
    />
  );

  return (
    <RoleGuard role="official">
      <JudgeFunctionGuard>
        <UniversalErpPrototype
          role="official"
          initialModule="scorecards"
          routeContent={scorecards}
        />
      </JudgeFunctionGuard>
    </RoleGuard>
  );
}
