interface Props {
  fighterId:string;
}

export function FighterProfileActions({
  fighterId,
}:Props) {

  return (
    <div className="flex gap-3">

      <button
        type="button"
        data-fighter={fighterId}
        className="bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-600"
      >
        Modifier
      </button>


      <button
        type="button"
        className="border border-neutral-700 px-5 py-2 text-sm text-neutral-300"
      >
        Partager
      </button>

    </div>
  );
}