type PresentationalFinanceViewProps = {
  title: string;
  description: string;
};

export function PresentationalFinanceView({
  title,
  description,
}: PresentationalFinanceViewProps) {
  return (
    <section
      aria-label={title}
      data-finance-authority="core-ledger"
      data-finance-domain-view="presentational"
      className="border-y border-white/10 bg-[#151619] px-5 py-6 sm:px-6"
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.7fr)] lg:items-start">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c5c7cc]">
            Vue complémentaire
          </p>
          <h2 className="text-xl font-semibold text-white">
            {title}
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-zinc-400">
            {description}
          </p>
        </div>

        <div className="border-l-2 border-[#c1121f] pl-4">
          <p className="text-sm font-semibold text-zinc-100">
            Source financière officielle
          </p>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            Les soldes, opérations et catégories autoritatifs restent ceux
            des onglets du cœur Indesy Finance. Cette vue ne crée aucun
            registre comptable parallèle.
          </p>
        </div>
      </div>
    </section>
  );
}
