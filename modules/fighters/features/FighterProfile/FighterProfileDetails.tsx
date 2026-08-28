import type { Fighter } from "@/modules/fighters/types";

interface Props {
  fighter: Fighter;
}

export function FighterProfileDetails({
  fighter,
}: Props) {

  return (

    <div className="border border-neutral-800 bg-neutral-900 p-5 shadow-xl">

      <h2 className="text-sm uppercase tracking-wider text-neutral-500">
        Informations techniques
      </h2>


      <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm text-neutral-300">


        <p>
          Taille :
          {" "}
          {fighter.height ?? "-"} cm
        </p>


        <p>
          Poids :
          {" "}
          {fighter.weight ?? "-"} kg
        </p>


        <p>
          Allonge :
          {" "}
          {fighter.reach ?? "-"} cm
        </p>


        <p>
          Garde :
          {" "}
          {fighter.guard ?? "-"}
        </p>


      </div>

    </div>

  );
}