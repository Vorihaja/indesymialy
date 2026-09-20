import type { ErpStatistics } from "../types";

function statisticTone(label: string) {
  const normalized = label.toLocaleLowerCase("fr");

  if (normalized.includes("actif")) return "success";
  if (normalized.includes("brouillon") || normalized.includes("draft")) return "warning";
  if (normalized.includes("archiv")) return "neutral";

  return "info";
}

export function ErpStatisticsCards({
  statistics,
}: {
  statistics: ErpStatistics;
}) {
  return (
    <section className="grid grid-cols-2 gap-px overflow-hidden border border-[#303238] bg-[#303238] lg:grid-cols-4">
      {Object.entries(statistics).map(([label, value]) => (
        <article
          key={label}
          className="erp-semantic-kpi min-h-[76px] border-l-2 px-3 py-2"
          data-tone={statisticTone(label)}
        >
          <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-500">
            {label}
          </p>
          <p className="erp-semantic-kpi-value mt-1.5 truncate text-[18px] font-semibold tracking-[-0.03em]" data-kpi-value>
            {value}
          </p>
        </article>
      ))}
    </section>
  );
}
