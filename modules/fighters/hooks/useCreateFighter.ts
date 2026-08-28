import { useState } from "react";

import type {
  Fighter,
} from "@/modules/fighters/types";

import {
  createFighterUseCase,
} from "@/modules/fighters/use-cases";



export function useCreateFighter() {


  const [loading, setLoading] =
    useState(false);


  const [error, setError] =
    useState<string | null>(null);



  const [fighter, setFighter] =
    useState<Fighter | null>(null);




  async function createFighter(
    data: Partial<Fighter>
  ): Promise<Fighter | null> {


    try {

      setLoading(true);

      setError(null);



      const result =
        await createFighterUseCase({

          data,

        });



      setFighter(result);



      return result;



    } catch (err) {


      const message =
        err instanceof Error
          ? err.message
          : "Impossible de créer le combattant";



      setError(message);



      return null;



    } finally {


      setLoading(false);


    }

  }




  return {

    createFighter,

    fighter,

    loading,

    error,

  };

}