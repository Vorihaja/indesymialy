"use client";

import { useMemo } from "react";

import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useFighterDashboard } from "@/modules/fighters/hooks/useFighterDashboard";

import { FighterDashboardHeader } from "./sections/FighterDashboardHeader";
import { FighterDashboardOverview } from "./sections/FighterDashboardOverview";
import { FighterDashboardAlerts } from "./sections/FighterDashboardAlerts";


export function FighterDashboardView() {

  const {
    user,
    loading: authLoading,
  } = useAuth();


  const {
    data,
    loading,
    error,
  } = useFighterDashboard(user?.id);



  const alerts = useMemo(() => {

    if (!data) {
      return [];
    }


    const result: string[] = [];


    if (!data.nextFight) {
      result.push(
        "Aucun combat programmé."
      );
    }


    if (
      data.documentsCount === 0
    ) {
      result.push(
        "Aucun document sportif enregistré."
      );
    }


    if (
      data.contractsCount === 0
    ) {
      result.push(
        "Aucun contrat actif."
      );
    }


    return result;

  }, [data]);



  if (
    authLoading ||
    loading
  ) {
    return (
      <div className="text-sm text-neutral-400">
        Chargement du tableau de bord...
      </div>
    );
  }



  if (
    error ||
    !data
  ) {
    return (
      <div className="text-sm text-red-400">
        Impossible de charger le tableau de bord combattant.
      </div>
    );
  }



  return (

    <div className="space-y-6">


      <FighterDashboardHeader
        fighter={data.fighter}
      />


      <FighterDashboardOverview
        data={data}
      />


      <FighterDashboardAlerts
        alerts={alerts}
      />


    </div>

  );
}