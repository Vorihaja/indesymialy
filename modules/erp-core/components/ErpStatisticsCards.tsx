import type { ErpStatistics } from "../types";

const tones = [
  "border-l-[#087cff]",
  "border-l-emerald-500",
  "border-l-amber-400",
  "border-l-[#ed1b2f]",
] as const;

export function ErpStatisticsCards({
  statistics,
}: {
  statistics: ErpStatistics;
}) {
  return (
    <section className="grid grid-cols-2 gap-px overflow-hidden border border-[#303238] bg-[#303238] lg:grid-cols-4">
      {Object.entries(statistics).map(([label, value], index) => (
        <article
          key={label}
          className={`min-h-[76px] border-l-2 bg-[#151619] px-3 py-2 ${tones[index % tones.length]}`}
        >
          <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-500">
            {label}
          </p>
          <p className="mt-1.5 truncate text-[18px] font-semibold tracking-[-0.03em] text-zinc-100">
            {value}
          </p>
        </article>
      ))}
    </section>
  );
}
