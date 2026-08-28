"use client";

import Link from "next/link";

import type {
  OperationsMetrics,
  OperationsRecord,
  OperationsStatus,
  PublicSettings,
} from "../types";

const statusStyle: Record<OperationsStatus, string> = {
  draft: "border-zinc-700 bg-zinc-900 text-zinc-300",
  published: "border-emerald-800/70 bg-emerald-950/40 text-emerald-300",
  scheduled: "border-sky-800/70 bg-sky-950/40 text-sky-300",
  archived: "border-zinc-700 bg-zinc-900 text-zinc-400",
  open: "border-amber-800/70 bg-amber-950/40 text-amber-300",
  assigned: "border-indigo-800/70 bg-indigo-950/40 text-indigo-300",
  waiting_user: "border-orange-800/70 bg-orange-950/40 text-orange-300",
  waiting_internal: "border-orange-800/70 bg-orange-950/40 text-orange-300",
  resolved: "border-emerald-800/70 bg-emerald-950/40 text-emerald-300",
  closed: "border-zinc-700 bg-zinc-900 text-zinc-400",
  rejected: "border-red-800/70 bg-red-950/40 text-red-300",
  investigating: "border-red-800/70 bg-red-950/40 text-red-300",
  monitoring: "border-amber-800/70 bg-amber-950/40 text-amber-300",
  operational: "border-emerald-800/70 bg-emerald-950/40 text-emerald-300",
};

export function OperationsStats({ metrics }: { metrics: OperationsMetrics }) {
  const cards = [
    ["Tickets ouverts", metrics.openTickets],
    ["Urgents", metrics.urgentTickets],
    ["Réponse moyenne", `${metrics.averageResponseHours} h`],
    ["Satisfaction", `${metrics.satisfaction} %`],
    ["Incidents", metrics.openIncidents],
    ["Pages publiées", metrics.publishedPages],
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map(([label, value]) => (
        <article
          key={label}
          className="rounded-[2px] border border-[#303238] bg-[#151619] p-4"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            {label}
          </p>
          <p className="mt-2 text-xl font-black text-white">{value}</p>
        </article>
      ))}
    </div>
  );
}

export function OperationsCards({
  records,
  basePath,
  faq = false,
}: {
  records: OperationsRecord[];
  basePath?: string;
  faq?: boolean;
}) {
  if (!records.length) {
    return (
      <div className="rounded-[2px] border border-dashed border-[#303238] bg-[#101114] p-10 text-center text-sm text-zinc-500">
        Aucun contenu disponible.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {records.map((item) =>
        faq ? (
          <details
            key={item.id}
            className="group rounded-[2px] border border-[#303238] bg-[#151619] p-5 open:border-[#3d92ff]/60"
          >
            <summary className="cursor-pointer font-bold text-zinc-100 marker:text-[#3d92ff]">
              {item.title}
            </summary>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              {item.content}
            </p>
          </details>
        ) : (
          <article
            key={item.id}
            className="rounded-[2px] border border-[#303238] bg-[#151619] p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3d92ff]">
                  {item.category}
                </p>
                <h2 className="mt-1 text-lg font-black text-white">
                  {item.title}
                </h2>
              </div>
              <span
                className={`shrink-0 rounded-[2px] border px-2 py-1 text-[11px] font-semibold ${statusStyle[item.status]}`}
              >
                {item.status}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              {item.summary}
            </p>
            {basePath && (
              <Link
                href={`${basePath}/${item.slug ?? item.id}`}
                className="mt-4 inline-flex text-sm font-bold text-[#3d92ff] transition-colors hover:text-[#79b4ff]"
              >
                Consulter →
              </Link>
            )}
          </article>
        ),
      )}
    </div>
  );
}

export function OperationsTable({
  records,
  onRemove,
}: {
  records: OperationsRecord[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-[2px] border border-[#303238] bg-[#151619]">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead className="bg-[#101114] text-[10px] uppercase tracking-[0.1em] text-zinc-500">
          <tr>
            <th className="p-4">Élément</th>
            <th className="p-4">Catégorie</th>
            <th className="p-4">Priorité</th>
            <th className="p-4">Visibilité</th>
            <th className="p-4">Statut</th>
            <th className="p-4">Action</th>
          </tr>
        </thead>
        <tbody>
          {records.map((item) => (
            <tr
              key={item.id}
              className="border-t border-[#303238] text-zinc-300 transition-colors hover:bg-white/[0.02]"
            >
              <td className="p-4">
                <strong className="text-zinc-100">{item.title}</strong>
                <p className="text-xs text-zinc-500">
                  {item.updatedAt.slice(0, 10)}
                </p>
              </td>
              <td className="p-4">{item.category}</td>
              <td className="p-4">{item.priority}</td>
              <td className="p-4">{item.visibility}</td>
              <td className="p-4">
                <span
                  className={`rounded-[2px] border px-2 py-1 text-xs ${statusStyle[item.status]}`}
                >
                  {item.status}
                </span>
              </td>
              <td className="p-4">
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="text-xs font-semibold text-red-300 underline decoration-red-900 underline-offset-4 transition-colors hover:text-red-200"
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

export function PublicSettingsView({
  settings,
}: {
  settings: PublicSettings;
}) {
  const flags = [
    ["Inscriptions", settings.registrationsOpen],
    ["Marketplace", settings.marketplaceEnabled],
    ["Fight Live", settings.fightLiveEnabled],
    ["Social", settings.socialEnabled],
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-[2px] border border-[#303238] bg-[#151619] p-5">
        <h2 className="font-black text-white">{settings.platformName}</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          {settings.description}
        </p>
        <p className="mt-4 text-sm text-zinc-300">
          {settings.contactEmail} · {settings.timezone}
        </p>
      </section>
      <section className="rounded-[2px] border border-[#303238] bg-[#151619] p-5">
        <h2 className="font-black text-white">Services publics</h2>
        <ul className="mt-3 divide-y divide-[#303238]">
          {flags.map(([label, enabled]) => (
            <li
              key={String(label)}
              className="flex justify-between gap-4 py-2 text-sm"
            >
              <span className="text-zinc-400">{label}</span>
              <strong
                className={enabled ? "text-emerald-300" : "text-zinc-500"}
              >
                {enabled ? "Actif" : "Inactif"}
              </strong>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
