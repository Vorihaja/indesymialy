interface Props {
  fighterId: string;
}

export function FighterProfileActions({
  fighterId,
}: Props) {

  return (
    <div className="flex gap-3">

      <button
        className="bg-blue-600 px-5 py-2 text-sm font-bold uppercase text-white hover:bg-red-600"
        type="button"
      >
        Modifier
      </button>


      <button
        className="border border-neutral-700 px-5 py-2 text-sm font-bold uppercase text-neutral-300"
        type="button"
      >
        Partager
      </button>

    </div>
  );
}