"use client";

import { useMemo, useState } from "react";

import type {
  Fighter,
  FighterSearchFilters,
} from "@/modules/fighters/types";

import {
  FighterSearchBar,
  FighterFilterPanel,
  FighterSearchResultCard,
} from "@/modules/fighters/features/FighterSearch";


interface Props {
  fighters: Fighter[];
}


export function FighterSearchView({
  fighters,
}: Props) {


  const [filters, setFilters] =
    useState<FighterSearchFilters>({});


  const filteredFighters = useMemo(() => {

    return fighters.filter((fighter) => {

      const search =
        filters.search?.toLowerCase() ?? "";


      const fullName =
        `${fighter.first_name} ${fighter.last_name}`
          .toLowerCase();


      const nickname =
        fighter.nickname?.toLowerCase() ?? "";


      const matchesSearch =
        !search ||
        fullName.includes(search) ||
        nickname.includes(search);



      const matchesCategory =
        !filters.category ||
        fighter.category === filters.category;



      const matchesStatus =
        !filters.status ||
        fighter.status === filters.status;



      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );

    });


  }, [fighters, filters]);



  return (

    <div className="space-y-6">


      <FighterSearchBar
        value={filters.search ?? ""}
        onChange={(search) =>
          setFilters((prev) => ({
            ...prev,
            search,
          }))
        }
      />


      <FighterFilterPanel
        filters={filters}
        onChange={setFilters}
      />


      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">


        {filteredFighters.map((fighter) => (

          <FighterSearchResultCard
            key={fighter.id}
            fighter={fighter}
          />

        ))}


      </div>


    </div>

  );
}