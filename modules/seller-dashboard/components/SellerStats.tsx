import type { SellerStatistics } from "../types";

type SellerStatTone =
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "neutral";

type SellerStat = {
  label: string;
  value: string | number;
  detail: string;
  tone: SellerStatTone;
};

const toneClass: Record<SellerStatTone, string> = {
  blue: "before:bg-[#087cff]",
  green: "before:bg-emerald-500",
  amber: "before:bg-amber-400",
  red: "before:bg-[#ed1b2f]",
  neutral: "before:bg-zinc-600",
};

export function SellerStats({
  statistics,
}: {
  statistics: SellerStatistics;
}) {
  const entries: SellerStat[] = [
    {
      label: "Revenus",
      value: `${statistics.revenue.toLocaleString("fr-FR")} Ar`,
      detail: "Volume commercial enregistré",
      tone: "green",
    },
    {
      label: "Commandes",
      value: statistics.orders,
      detail: "Commandes enregistrées",
      tone: "blue",
    },
    {
      label: "Produits",
      value: statistics.products,
      detail: "Références du catalogue",
      tone: "neutral",
    },
    {
      label: "Stock faible",
      value: statistics.lowStock,
      detail:
        statistics.lowStock > 0
          ? "Nécessite votre attention"
          : "Aucune alerte stock",
      tone: statistics.lowStock > 0 ? "amber" : "green",
    },
    {
      label: "Ventes",
      value: statistics.sales,
      detail: "Opérations de vente",
      tone: "green",
    },
    {
      label: "Locations",
      value: statistics.rentals,
      detail: "Opérations de location",
      tone: "blue",
    },
    {
      label: "Clients",
      value: statistics.customers,
      detail: "Clients enregistrés",
      tone: "neutral",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-px overflow-hidden border border-[#303238] bg-[#303238] md:grid-cols-4 xl:grid-cols-7">
      {entries.map((entry) => (
        <article
          key={entry.label}
          className={`relative min-h-[106px] bg-[#151619] px-3 py-3 before:absolute before:inset-x-0 before:top-0 before:h-[2px] ${toneClass[entry.tone]}`}
        >
          <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500">
            {entry.label}
          </p>

          <p className="mt-2 truncate text-[19px] font-semibold tracking-[-0.03em] text-zinc-100">
            {entry.value}
          </p>

          <p className="mt-2 text-[9px] leading-4 text-zinc-500">
            {entry.detail}
          </p>
        </article>
      ))}
    </section>
  );
}