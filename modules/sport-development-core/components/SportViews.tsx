"use client";

import type { SportMetrics, SportRecord, SportStatus } from "../types";

const badge: Record<SportStatus, string> = {
  draft: "border-[#454952] bg-[#202226] text-zinc-300",
  planned: "border-[#24557f] bg-[#0d1d2b] text-sky-300",
  active: "border-[#1d5b43] bg-[#0d2119] text-emerald-300",
  completed: "border-[#4e3973] bg-[#1b1329] text-violet-300",
  cancelled: "border-[#5f1c28] bg-[#220d12] text-[#ff7a8b]",
  archived: "border-[#454952] bg-[#202226] text-zinc-300",
  observed: "border-[#24557f] bg-[#0d1d2b] text-sky-300",
  shortlisted: "border-[#71581b] bg-[#241d0c] text-amber-300",
  contacted: "border-[#334b86] bg-[#111b35] text-indigo-300",
  invited: "border-[#4e3973] bg-[#1b1329] text-violet-300",
  recruited: "border-[#1d5b43] bg-[#0d2119] text-emerald-300",
  rejected: "border-[#5f1c28] bg-[#220d12] text-[#ff7a8b]",
};

export function SportStats({
  metrics,
  count,
}: {
  metrics: SportMetrics;
  count: number;
}) {
  const cards = [
    ["Dossiers", String(count), "border-l-[#087cff]"],
    ["Assiduité", metrics.attendanceRate + " %", "border-l-emerald-500"],
    ["Progression", metrics.progression + " %", "border-l-[#087cff]"],
    ["Disponibilité", metrics.availability + " %", "border-l-emerald-500"],
    ["Charge hebdo", String(metrics.weeklyLoad), "border-l-amber-400"],
    ["ELO", String(metrics.elo), "border-l-[#ed1b2f]"],
  ];

  return (
    <section className="grid gap-px overflow-hidden border border-[#303238] bg-[#303238] sm:grid-cols-2 xl:grid-cols-6">
      {cards.map(([label, value, tone]) => (
        <article
          key={label}
          className={`min-h-[76px] border-l-2 bg-[#151619] px-3 py-2 ${tone}`}
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

export function ProgressChart({
  timeline,
}: {
  timeline: Array<{ label: string; value: number }>;
}) {
  const max = Math.max(...timeline.map((item) => item.value), 1);

  return (
    <section className="border border-[#303238] bg-[#151619]">
      <header className="border-b border-[#303238] px-3 py-2">
        <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#3d92ff]">
          Pilotage
        </p>
        <h3 className="mt-0.5 text-[11px] font-semibold text-zinc-100">
          Tendance temporelle
        </h3>
      </header>
      <div className="flex h-44 items-end gap-3 p-4">
        {timeline.map((item) => (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-[9px] text-zinc-400">{item.value}</span>
            <div
              style={{ height: `${Math.max(8, (item.value / max) * 100)}%` }}
              className="w-full max-w-20 border-t border-[#3d92ff] bg-[#087cff]"
            />
            <span className="text-[8px] uppercase text-zinc-500">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SportTable({
  records,
  onRemove,
}: {
  records: SportRecord[];
  onRemove: (id: string) => void;
}) {
  if (!records.length) {
    return (
      <div className="border border-dashed border-[#454952] bg-[#111214] p-8 text-center text-[10px] text-zinc-500">
        Aucune donnée sportive pour ces filtres.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-[#303238] bg-[#151619]">
      <table className="w-full min-w-[760px] text-left text-[10px]">
        <thead className="bg-[#111214] text-[8px] uppercase tracking-[0.08em] text-zinc-500">
          <tr>
            <th className="p-3">Dossier</th>
            <th className="p-3">Discipline/date</th>
            <th className="p-3">Progression</th>
            <th className="p-3">Confidentialité</th>
            <th className="p-3">Statut</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {records.map((item) => (
            <tr key={item.id} className="border-t border-[#292c31]">
              <td className="p-3">
                <strong className="font-semibold text-zinc-200">{item.title}</strong>
                <p className="mt-0.5 text-[9px] text-zinc-500">{item.subtitle}</p>
              </td>
              <td className="p-3 text-zinc-400">
                {item.discipline ?? "—"}
                <p className="mt-0.5 text-[9px] text-zinc-500">
                  {item.date ?? "Planning continu"}
                </p>
              </td>
              <td className="p-3">
                <div className="h-1.5 w-28 bg-[#292c31]">
                  <div
                    className="h-full bg-[#087cff]"
                    style={{ width: `${Math.min(100, item.progress)}%` }}
                  />
                </div>
                <span className="mt-1 block text-[8px] text-zinc-500">
                  {item.progress}%
                </span>
              </td>
              <td className="p-3">
                <span className="border border-[#343840] bg-[#111214] px-2 py-1 text-[8px] uppercase text-zinc-400">
                  {item.visibility}
                </span>
              </td>
              <td className="p-3">
                <span
                  className={`inline-flex border px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] ${badge[item.status]}`}
                >
                  {item.status}
                </span>
              </td>
              <td className="p-3">
                <button
                  onClick={() => onRemove(item.id)}
                  className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#ff596d] hover:text-[#ff7a8b]"
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
