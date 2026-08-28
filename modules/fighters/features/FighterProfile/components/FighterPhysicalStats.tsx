import type { Fighter } from "@/modules/fighters/types";

interface Props {
  fighter: Fighter;
}

export function FighterPhysicalStats({
  fighter,
}: Props) {
  return (
    <div className="border border-neutral-800 bg-neutral-900 p-5 shadow-xl">
      <p className="text-xs uppercase text-neutral-500">
        Caractéristiques physiques
      </p>

      <div className="mt-4 space-y-2 text-sm text-neutral-300">
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
      </div>
    </div>
  );
}