"use client";

import Link from "next/link";

import { useAdminDomain, type AdminAccessLevel, type AdminDomain } from "@/modules/admin-core";

const domains = new Set<AdminDomain>([
  "users",
  "organizations",
  "clubs",
  "fighters",
  "events",
  "moderation",
  "audit-log",
]);

const stateClass = "border border-[#303238] bg-[#151619] p-6 text-sm text-zinc-500";

export function AdminDetailFeature({
  section,
  id,
  access,
}: {
  section: string;
  id: string;
  access: AdminAccessLevel;
}) {
  const domain = domains.has(section as AdminDomain) ? (section as AdminDomain) : "users";
  const valid = domains.has(section as AdminDomain);
  const { data, loading, error } = useAdminDomain(domain);

  if (!valid) {
    return <p className={stateClass}>Ressource inconnue.</p>;
  }

  if (loading) {
    return <p className={stateClass}>Chargement…</p>;
  }

  if (error) {
    return <p className="border border-red-500/30 bg-red-500/5 p-6 text-sm text-red-400">{error}</p>;
  }

  const row = data?.rows.find((item) => item.id === id);

  return (
    <section className="border border-[#303238] bg-[#151619]">
      <header className="border-b border-[#303238] p-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#3d92ff]">Fiche détaillée</p>
        <h2 className="mt-1 text-xl font-black">{row?.cells[0] ?? id}</h2>
        <p className="mt-1 text-[10px] text-zinc-500">Identifiant : {id}</p>
      </header>
      <div className="p-4">
        {row ? (
          <dl className="grid gap-2 md:grid-cols-2">
            {row.cells.map((cell, index) => (
              <div key={id + "-" + data?.columns[index]} className="border border-[#303238] bg-[#101114] p-3">
                <dt className="text-[9px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  {data?.columns[index]}
                </dt>
                <dd className="mt-1 text-xs font-semibold text-zinc-200">{cell}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="border border-dashed border-[#343840] bg-[#101114] p-5 text-xs text-zinc-500">
            Cette ressource n’existe pas dans le stockage provisoire.
          </p>
        )}
      </div>
      <footer className="flex flex-wrap gap-2 border-t border-[#303238] bg-[#101114] p-4">
        <button
          className="inline-flex h-9 items-center border border-[#d8273f] bg-[#c82335] px-4 text-[10px] font-bold text-white hover:bg-[#df2a43]"
          type="button"
        >
          Mettre à jour
        </button>
        <button
          className="inline-flex h-9 items-center border border-red-500/40 bg-red-500/5 px-4 text-[10px] font-semibold text-red-300"
          type="button"
        >
          Suspendre
        </button>
        <Link
          href={"/dashboard/" + access + "/" + section}
          className="inline-flex h-9 items-center border border-[#343840] px-4 text-[10px] font-semibold text-zinc-300 hover:border-[#2588ff]"
        >
          Retour à la liste
        </Link>
      </footer>
    </section>
  );
}
