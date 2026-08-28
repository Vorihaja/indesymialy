interface Props {
  nextFight?: {
    date?: string | null;
    opponent?: string | null;
    event?: string | null;
  } | null;
}

export function FighterNextFightCard({
  nextFight,
}: Props) {

  return (
    <div className="border border-neutral-800 bg-neutral-900 p-5 shadow-xl">

      <p className="text-[10px] uppercase tracking-wider text-neutral-500">
        Prochain combat
      </p>

      {nextFight ? (
        <div className="mt-3 space-y-2 text-sm text-neutral-300">

          <p>
            Adversaire :
            {" "}
            {nextFight.opponent ?? "À définir"}
          </p>

          <p>
            Événement :
            {" "}
            {nextFight.event ?? "-"}
          </p>

          <p>
            Date :
            {" "}
            {nextFight.date
              ? new Date(nextFight.date).toLocaleDateString("fr-FR")
              : "-"
            }
          </p>

        </div>
      ) : (
        <p className="mt-3 text-sm text-neutral-400">
          Aucun combat programmé.
        </p>
      )}

    </div>
  );
}