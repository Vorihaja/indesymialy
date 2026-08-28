import type { Fighter } from "@/modules/fighters/types";

interface Props {
  fighter: Fighter;
}

export function FighterProfileDetails({
  fighter,
}: Props) {

  return (
    <section className="border border-neutral-800 bg-neutral-900 p-5">

      <h2 className="text-xs uppercase text-neutral-500">
        Informations physiques
      </h2>


      <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm text-neutral-300">

        <p>
          Taille : {fighter.height ?? "-"} cm
        </p>

        <p>
          Poids : {fighter.weight ?? "-"} kg
        </p>

        <p>
          Allonge : {fighter.reach ?? "-"} cm
        </p>


      </div>

    </section>
  );
}