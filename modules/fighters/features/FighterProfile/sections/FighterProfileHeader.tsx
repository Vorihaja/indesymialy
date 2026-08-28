import type { Fighter } from "@/modules/fighters/types";

interface Props {
  fighter: Fighter;
}

export function FighterProfileHeader({
  fighter,
}: Props) {
  return (
    <section className="border border-neutral-800 bg-neutral-900 p-6 shadow-xl">

      <p className="text-xs uppercase tracking-wider text-neutral-500">
        Combattant
      </p>

      <h1 className="mt-3 text-3xl font-black text-white">
        {fighter.first_name} {fighter.last_name}
      </h1>

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-neutral-400">

        <span>
          Catégorie : {fighter.category ?? "-"}
        </span>

        <span>
          Statut : {fighter.status}
        </span>

      </div>

    </section>
  );
}