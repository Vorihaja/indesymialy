"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type { Fighter } from "@/modules/fighters/types";

import {
  makeSearchFightersUseCase,
} from "@/modules/fighters/factories";


import type {
  FighterSearchFilters,
} from "@/modules/fighters/repositories/fighter-search.repository";


export function useFighterSearch(
  filters: FighterSearchFilters
) {

  const [fighters,setFighters] =
    useState<Fighter[]>([]);

  const [loading,setLoading] =
    useState(true);

  const [error,setError] =
    useState<string | null>(null);



  const search = useCallback(async()=>{

    try {

      setLoading(true);
      setError(null);


      const useCase =
        makeSearchFightersUseCase();


      const result =
        await useCase.execute(filters);


      setFighters(result);


    } catch(error){

      setError(
        error instanceof Error
          ? error.message
          : "Erreur recherche combattants"
      );


    } finally {

      setLoading(false);

    }


  },[
    filters
  ]);



  useEffect(()=>{

    queueMicrotask(() => {
      void search();
    });

  },[search]);



  return {
    fighters,
    loading,
    error,
    refresh: search,
  };

}
