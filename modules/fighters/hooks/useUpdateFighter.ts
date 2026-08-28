"use client";

import {
  useState,
} from "react";

import type {
  Fighter,
} from "@/modules/fighters/types";

import {
  UpdateFighterProfileUseCase,
} from "@/modules/fighters/use-cases";

import {
  makeFighterService,
} from "@/modules/fighters/services";



export function useUpdateFighter() {


  const [
    loading,
    setLoading,
  ] = useState(false);



  const [
    error,
    setError,
  ] = useState<string | null>(null);



  const [
    fighter,
    setFighter,
  ] = useState<Fighter | null>(null);




  async function updateFighter(
    fighterId: string,
    updates: Partial<Fighter>
  ): Promise<Fighter | null> {


    try {


      setLoading(true);

      setError(null);



      const service =
        makeFighterService();



      const useCase =
        new UpdateFighterProfileUseCase(
          service
        );



      const result =
        await useCase.execute(
          fighterId,
          updates
        );



      setFighter(result);



      return result;



    } catch (err) {


      const message =
        err instanceof Error
          ? err.message
          : "Impossible de mettre à jour le combattant";



      setError(message);



      return null;



    } finally {


      setLoading(false);


    }

  }




  return {

    updateFighter,

    fighter,

    loading,

    error,

  };


}