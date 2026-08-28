import type { Fighter } from "@/modules/fighters/types";

interface Props {
  fighter: Fighter;
}

export function FighterDashboardHeader({
  fighter,
}: Props) {
  return (
    <div className="border border-neutral-800 bg-neutral-900 p-6 shadow-xl">

      <p className="text-[10px] uppercase tracking-wider text-neutral-500">
        Espace combattant
      </p>

      <h1 className="mt-3 text-3xl font-black uppercase tracking-wider text-white">
        {fighter.first_name} {fighter.last_name}
      </h1>

      <div className="mt-3 flex flex-wrap gap-4 text-sm text-neutral-400">

        <span>
          Catégorie :
          {" "}
          {fighter.category ?? "À définir"}
        </span>

        <span>
          Statut :
          {" "}
          {fighter.status}
        </span>

        <span>
          Style :
          {" "}
          {fighter.fighting_style ?? "-"}
        </span>

      </div>

    </div>
  );
}