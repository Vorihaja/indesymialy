import type { Fighter } from "@/modules/fighters/types";

interface Props {
  fighter: Fighter;
}

export function FighterIdentityCard({
  fighter,
}: Props) {
  return (
    <div className="border border-neutral-800 bg-neutral-900 p-5 shadow-xl">
      <p className="text-xs uppercase text-neutral-500">
        Identité
      </p>

      <h2 className="mt-3 text-2xl font-black text-white">
        {fighter.first_name} {fighter.last_name}
      </h2>

      <p className="mt-2 text-sm text-neutral-400">
        {fighter.nickname ?? "Sans surnom"}
      </p>

      <p className="mt-2 text-sm text-neutral-400">
        Statut : {fighter.status}
      </p>
    </div>
  );
}