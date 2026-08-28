import type { SellerStatistics } from "../types";

type SellerStatTone = "blue" | "green" | "amber" | "red" | "neutral";

type SellerStat = {
  label: string;
  value: string | number;
  tone: SellerStatTone;
};

const toneClass: Record<SellerStatTone, string> = {
  blue: "border-l-[#087cff]",
  green: "border-l-emerald-500",
  amber: "border-l-amber-400",
  red: "border-l-[#ed1b2f]",
  neutral: "border-l-transparent",
};

export function SellerStats({
  statistics,
}: {
  statistics: SellerStatistics;
}) {
  const entries: SellerStat[] = [
    { label: "Produits", value: statistics.products, tone: "blue" },
    { label: "Ventes", value: statistics.sales, tone: "green" },
    { label: "Locations", value: statistics.rentals, tone: "blue" },
    { label: "Commandes", value: statistics.orders, tone: "neutral" },
    {
      label: "Revenus",
      value: `${statistics.revenue.toLocaleString("fr-FR")} Ar`,
      tone: "green",
    },
    { label: "Stock faible", value: statistics.lowStock, tone: "amber" },
    { label: "Clients", value: statistics.customers, tone: "neutral" },
  ];

  return (
    <section className="grid grid-cols-2 gap-px overflow-hidden border border-[#303238] bg-[#303238] md:grid-cols-3 xl:grid-cols-7">
      {entries.map(({ label, value, tone }) => (
        <article
          key={label}
          className={`min-h-[76px] border-l-2 bg-[#151619] px-3 py-2 ${toneClass[tone]}`}
        >
          <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-500">
            {label}
          </span>
          <strong className="mt-1.5 block truncate text-[18px] font-semibold tracking-[-0.03em] text-zinc-100">
            {value}
          </strong>
        </article>
      ))}
    </section>
  );
}
