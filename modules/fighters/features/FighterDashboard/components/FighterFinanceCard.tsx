interface Props {
  contractsCount: number;
  documentsCount: number;
}

export function FighterFinanceCard({
  contractsCount,
  documentsCount,
}: Props) {

  return (
    <div className="border border-neutral-800 bg-neutral-900 p-5 shadow-xl">

      <p className="text-[10px] uppercase tracking-wider text-neutral-500">
        Gestion
      </p>

      <div className="mt-3 space-y-2 text-sm text-neutral-300">

        <p>
          Contrats :
          {" "}
          {contractsCount}
        </p>

        <p>
          Documents :
          {" "}
          {documentsCount}
        </p>

      </div>

    </div>
  );
}