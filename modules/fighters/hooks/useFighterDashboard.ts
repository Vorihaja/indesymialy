"use client";

import {
  useEffect,
  useState
} from "react";

import {
  makeFighterDashboardUseCase
} from "@/modules/fighters/factories";

import type {
  FighterDashboardData
} from "@/modules/fighters/types";



export function useFighterDashboard(
  userId?: string | null
) {


  const [
    data,
    setData
  ] = useState<FighterDashboardData | null>(null);



  const [
    loading,
    setLoading
  ] = useState(true);



  const [
    error,
    setError
  ] = useState<string | null>(null);




  useEffect(() => {


    if (!userId) {
      queueMicrotask(() => {
        setData(null);
        setLoading(false);
      });

      return;

    }


    const authenticatedUserId: string = userId;




    async function loadDashboard() {


      try {


        setLoading(true);

        setError(null);



        const useCase =
          makeFighterDashboardUseCase();



        const result =
          await useCase.execute(
            authenticatedUserId
          );



        setData(
          result
        );



      } catch (err) {


        setError(

          err instanceof Error
            ? err.message
            : "Erreur inconnue"

        );


      } finally {


        setLoading(false);


      }


    }




    void loadDashboard();



  }, [userId]);





  return {

    data,

    loading,

    error

  };


}
