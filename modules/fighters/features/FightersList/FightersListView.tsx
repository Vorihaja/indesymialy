"use client";

import type { Fighter } from "@/modules/fighters/types";

import {
  FighterListGrid,
  FighterListEmpty,
} from "@/modules/fighters/features/FightersList";


interface Props {

  fighters: Fighter[];

}



export function FightersListView({
  fighters,
}: Props) {


  if (!fighters || fighters.length === 0) {

    return (
      <FighterListEmpty />
    );

  }



  return (

    <FighterListGrid
      fighters={fighters}
    />

  );
}