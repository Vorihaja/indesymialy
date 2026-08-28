"use client";

import { useFighterProfile } from "@/modules/fighters/hooks/useFighterProfile";

import {
  FighterProfileHeader,
  FighterProfileOverview,
  FighterProfileDetails,
  FighterProfileActions,
} from "@/modules/fighters/features/FighterProfile";

interface Props {
  fighterId?: string | null;
}

export function FighterProfileView({
  fighterId,
}: Props) {

  const {
    fighter,
    loading,
    error,
  } = useFighterProfile(fighterId);



  if (loading) {
    return (
      <div className="text-sm text-neutral-400">
        Chargement du profil combattant...
      </div>
    );
  }



  if (error || !fighter) {
    return (
      <div className="text-sm text-red-400">
        Impossible de charger le profil combattant.
      </div>
    );
  }



  return (

    <div className="space-y-6">


      <FighterProfileHeader
        fighter={fighter}
      />


      <FighterProfileOverview
        fighter={fighter}
      />


      <FighterProfileDetails
        fighter={fighter}
      />


      <FighterProfileActions
        fighterId={fighter.id}
      />


    </div>

  );
}