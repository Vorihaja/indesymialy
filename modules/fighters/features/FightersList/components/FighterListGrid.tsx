import type { Fighter } from "@/modules/fighters/types";

import {
  FighterListCard,
} from "@/modules/fighters/features/FightersList";


interface Props {

  fighters: Fighter[];

}



export function FighterListGrid({
  fighters,
}: Props) {


  return (

    <div
      className="
        grid
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-3
        gap-5
      "
    >

      {fighters.map((fighter) => (

        <FighterListCard
          key={fighter.id}
          fighter={fighter}
        />

      ))}


    </div>

  );
}