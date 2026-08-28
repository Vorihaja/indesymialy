"use client";

import {
  useCallback,
  useEffect,
  useState
} from "react";


import {
  makeFighterService
} from "@/modules/fighters/factories/fighter.factory";


import type {
  Fighter
} from "@/modules/fighters/types";





interface UseFightersResult {

  fighters: Fighter[];

  loading: boolean;

  error: Error | null;

  refresh: () => Promise<void>;

}







export function useFighters(): UseFightersResult {


  const [
    fighters,
    setFighters
  ] = useState<Fighter[]>([]);




  const [
    loading,
    setLoading
  ] = useState(true);




  const [
    error,
    setError
  ] = useState<Error | null>(null);






  const refresh =
    useCallback(
      async () => {


        try {


          setLoading(true);

          setError(null);




          const service =
            makeFighterService();




          const data =
            await service.getFighters();




          setFighters(
            data
          );



        } catch (err) {


          setError(

            err instanceof Error
              ? err
              : new Error(
                  "Unable to load fighters"
                )

          );



        } finally {


          setLoading(false);


        }


      },
      []
    );







  useEffect(() => { queueMicrotask(() => { void refresh(); }); }, [refresh]);







  return {

    fighters,

    loading,

    error,

    refresh

  };


}