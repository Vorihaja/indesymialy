interface Props {
  count: number;
}

export function FighterSponsorsCard({
  count,
}: Props) {

  return (
    <div className="border border-neutral-800 bg-neutral-900 p-5 shadow-xl">

      <p className="text-[10px] uppercase tracking-wider text-neutral-500">
        Sponsors
      </p>

      <p className="mt-3 text-2xl font-black text-blue-400">
        {count}
      </p>

    </div>
  );
}