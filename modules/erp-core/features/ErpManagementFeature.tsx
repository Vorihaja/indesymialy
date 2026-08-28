"use client";

import Link from "next/link";
import { useState } from "react";
import { ErpRecordForm } from "../components/ErpRecordForm";
import { ErpStatisticsCards } from "../components/ErpStatisticsCards";
import { useErpCrud } from "../hooks/useErpCrud";
import type { ErpModuleDefinition, ErpRecord } from "../types";

const fieldClass =
  "min-h-10 border border-[#343840] bg-[#0e0f11] px-3 text-[11px] text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-[#087cff]";

const statusClass = {
  draft: "border-[#71581b] bg-[#241d0c] text-amber-300",
  active: "border-[#1d5b43] bg-[#0d2119] text-emerald-300",
  archived: "border-[#454952] bg-[#202226] text-zinc-300",
} as const;

export function ErpManagementFeature({
  definition,
  mode = "list",
  recordId,
}: {
  definition: ErpModuleDefinition;
  mode?: "list" | "create" | "detail";
  recordId?: string;
}) {
  const crud = useErpCrud(definition);
  const [editing, setEditing] = useState<ErpRecord | null>(null);
  const selected = recordId
    ? crud.records.find((item) => item.id === recordId)
    : undefined;

  if (crud.loading) {
    return (
      <p className="border border-[#303238] bg-[#151619] p-6 text-[11px] text-zinc-400">
        Chargement…
      </p>
    );
  }
  if (crud.error) {
    return (
      <p
        role="alert"
        className="border border-[#5f1c28] bg-[#220d12] p-3 text-[11px] text-[#ff7a8b]"
      >
        {crud.error}
      </p>
    );
  }

  if (mode === "create") {
    return <ErpRecordForm definition={definition} onSubmit={crud.create} />;
  }

  if (mode === "detail") {
    return selected ? (
      <div className="grid gap-3">
        <Link
          href={`${definition.basePath}/management`}
          className="w-fit text-[9px] font-bold uppercase tracking-[0.1em] text-[#3d92ff] hover:text-[#72b2ff]"
        >
          ← Retour
        </Link>
        <article className="border border-[#303238] bg-[#151619]">
          <header className="border-b border-[#303238] px-4 py-3">
            <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#3d92ff]">
              {selected.category} · {selected.status}
            </p>
            <h2 className="mt-1 text-[15px] font-semibold text-zinc-100">
              {selected.title}
            </h2>
          </header>
          <p className="p-4 text-[11px] leading-5 text-zinc-400">
            {selected.description || "Aucune description."}
          </p>
        </article>
      </div>
    ) : (
      <p className="border border-[#303238] bg-[#151619] p-6 text-[11px] text-zinc-400">
        Fiche introuvable.
      </p>
    );
  }

  return (
    <section className="grid gap-3">
      <header className="border border-[#303238] bg-[#151619] p-4">
        <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
          Registre métier
        </p>
        <h1 className="mt-1 text-[15px] font-semibold text-zinc-100">
          {definition.entityLabelPlural}
        </h1>
      </header>

      <ErpStatisticsCards statistics={crud.statistics} />

      <div className="flex flex-wrap gap-2 border border-[#303238] bg-[#151619] p-3">
        <input
          value={crud.filters.search}
          onChange={(event) =>
            crud.setFilters({ ...crud.filters, search: event.target.value })
          }
          placeholder={`Rechercher dans ${definition.entityLabelPlural.toLocaleLowerCase()}`}
          className={`min-w-64 flex-1 ${fieldClass}`}
        />
        <select
          value={crud.filters.status}
          onChange={(event) =>
            crud.setFilters({
              ...crud.filters,
              status: event.target.value as typeof crud.filters.status,
            })
          }
          className={fieldClass}
        >
          <option value="all">Tous les statuts</option>
          <option value="draft">Brouillons</option>
          <option value="active">Actifs</option>
          <option value="archived">Archivés</option>
        </select>
        <Link
          href={`${definition.basePath}/management/new`}
          className="inline-flex min-h-10 items-center border border-[#ff1638] bg-[#ff1638] px-4 text-[9px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#d91d35]"
        >
          Créer
        </Link>
      </div>

      {editing && (
        <ErpRecordForm
          definition={definition}
          initial={editing}
          onSubmit={(input) =>
            crud.update(editing.id, input).then(() => setEditing(null))
          }
          onCancel={() => setEditing(null)}
        />
      )}

      <div className="overflow-x-auto border border-[#303238] bg-[#151619]">
        <table className="w-full min-w-[640px] text-left text-[10px]">
          <thead className="bg-[#111214] text-[8px] uppercase tracking-[0.08em] text-zinc-500">
            <tr>
              <th className="p-3">Titre</th>
              <th className="p-3">Catégorie</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {crud.records.map((item) => (
              <tr key={item.id} className="border-t border-[#292c31]">
                <td className="p-3 font-medium">
                  <Link
                    href={`${definition.basePath}/management/${item.id}`}
                    className="text-zinc-200 hover:text-[#3d92ff]"
                  >
                    {item.title}
                  </Link>
                </td>
                <td className="p-3 text-zinc-400">{item.category}</td>
                <td className="p-3">
                  <span
                    className={`inline-flex border px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] ${statusClass[item.status]}`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setEditing(item)}
                      className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#3d92ff] hover:text-[#72b2ff]"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => void crud.remove(item.id)}
                      className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#ff596d] hover:text-[#ff7a8b]"
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {crud.records.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-[10px] text-zinc-500">
                  Aucun élément. Utilisez Créer pour commencer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border border-[#303238] bg-[#151619] p-3">
        <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#3d92ff]">
          Fonctionnalités du module
        </p>
        <p className="mt-1.5 text-[10px] leading-5 text-zinc-400">
          {definition.capabilities.join(" · ")}
        </p>
      </div>
    </section>
  );
}
