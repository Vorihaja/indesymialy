"use client";

import {
  useState,
} from "react";

import type {
  Fighter,
} from "@/modules/fighters/types";

import {
  ManageFighterUseCase,
} from "@/modules/fighters/use-cases";

import {
  makeFighterService,
} from "@/modules/fighters/services";



export function useManageFighter() {


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





  async function executeAction(
    fighterId: string,
    action:
      | "activate"
      | "suspend"
      | "deactivate"
  ) {


    try {


      setLoading(true);

      setError(null);



      const useCase =
        new ManageFighterUseCase(
          makeFighterService()
        );



      const result =
        await useCase.execute({

          fighterId,

          action,

        });



      setFighter(result);



      return result;



    } catch (err) {


      const message =
        err instanceof Error
          ? err.message
          : "Erreur de gestion du combattant";



      setError(message);



      return null;



    } finally {


      setLoading(false);


    }

  }





  return {


    fighter,


    loading,


    error,


    activateFighter:
      (fighterId: string) =>
        executeAction(
          fighterId,
          "activate"
        ),



    suspendFighter:
      (fighterId: string) =>
        executeAction(
          fighterId,
          "suspend"
        ),



    deactivateFighter:
      (fighterId: string) =>
        executeAction(
          fighterId,
          "deactivate"
        ),


  };


}