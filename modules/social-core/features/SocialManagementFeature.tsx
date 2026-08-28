"use client";

import Link from "next/link";
import { useState } from "react";

import { SocialFiltersPanel as SocialFilters } from "../components/SocialFilters";
import { SocialRecordForm } from "../components/SocialRecordForm";
import { useSocialCrud } from "../hooks/useSocialCrud";
import type {
  SocialMediaType,
  SocialModuleDefinition,
  SocialRecord,
  SocialStatus,
} from "../types";

const statusLabels: Record<SocialStatus, string> = {
  draft: "Brouillon",
  published: "Publié",
  locked: "Verrouillé",
  reported: "Signalé",
  archived: "Archivé",
};

const statusStyles: Record<SocialStatus, string> = {
  draft: "border-zinc-700 bg-zinc-900 text-zinc-300",
  published: "border-emerald-800/70 bg-emerald-950/40 text-emerald-300",
  locked: "border-amber-800/70 bg-amber-950/40 text-amber-300",
  reported: "border-red-800/70 bg-red-950/40 text-red-300",
  archived: "border-zinc-700 bg-zinc-900 text-zinc-400",
};

const statisticLabels: Record<string, string> = {
  total: "Total",
  published: "Publiés",
  interactions: "Interactions",
  reported: "Signalés",
};

const capabilityLabels: Record<string, string> = {
  Likes: "Mentions J’aime",
  Tags: "Mots-clés",
  CRUD: "Création, consultation, modification et suppression",
  Hashtags: "Mots-dièse",
};

const mediaLabels: Record<SocialMediaType, string> = {
  image: "photo",
  video: "vidéo",
  album: "album",
  gallery: "galerie",
};

export function SocialManagementFeature({
  definition,
  mode = "list",
  recordId,
}: {
  definition: SocialModuleDefinition;
  mode?: "list" | "create" | "detail";
  recordId?: string;
}) {
  const crud = useSocialCrud(definition);
  const [editing, setEditing] = useState<SocialRecord | null>(null);
  const selected = crud.records.find((item) => item.id === recordId);

  if (crud.loading) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="rounded-[2px] border border-[#303238] bg-[#151619] p-5 text-sm text-zinc-500">
          Chargement…
        </p>
      </section>
    );
  }

  if (crud.error) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p
          role="alert"
          className="rounded-[2px] border border-red-800/70 bg-red-950/30 p-4 text-sm text-red-300"
        >
          {crud.error}
        </p>
      </section>
    );
  }

  if (mode === "create") {
    return (
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <SocialRecordForm definition={definition} onSubmit={crud.create} />
      </section>
    );
  }

  if (mode === "detail") {
    return selected ? (
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <article className="space-y-4 rounded-[2px] border border-[#303238] bg-[#151619] p-5 sm:p-6">
          <Link
            href={definition.basePath}
            className="text-xs font-bold text-[#3d92ff] transition-colors hover:text-[#79b4ff]"
          >
            ← Retour
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
              {selected.category} · {selected.discipline} · {selected.region}
            </p>
            <span
              className={`rounded-[2px] border px-2 py-1 text-[10px] font-semibold ${statusStyles[selected.status]}`}
            >
              {statusLabels[selected.status]}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            {selected.title}
          </h1>
          <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-300">
            {selected.content}
          </p>
          {selected.mediaUrl && (
            <a
              href={selected.mediaUrl}
              className="text-sm font-bold text-[#3d92ff] transition-colors hover:text-[#79b4ff]"
            >
              Ouvrir le{" "}
              {selected.mediaType ? mediaLabels[selected.mediaType] : "média"}
            </a>
          )}
          <p className="border-t border-[#303238] pt-4 text-xs text-zinc-500">
            #{selected.tags.join(" #")} · {selected.likes} mentions J’aime ·{" "}
            {selected.shares} partages
          </p>
        </article>
      </section>
    ) : (
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="rounded-[2px] border border-[#303238] bg-[#151619] p-5 text-sm text-zinc-500">
          Contenu introuvable.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[#303238] pb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3d92ff]">
            Plateforme sociale
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
            {definition.label}
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            {definition.capabilities
              .map((capability) => capabilityLabels[capability] ?? capability)
              .join(" · ")}
          </p>
        </div>
        <Link
          href={`${definition.basePath}/new`}
          className="inline-flex h-10 items-center rounded-[2px] border border-[#ff1638] bg-[#ff1638] px-4 text-xs font-bold text-white transition-colors hover:bg-[#d91d35]"
        >
          Créer
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Object.entries(crud.statistics).map(([label, value]) => (
          <div
            key={label}
            className="rounded-[2px] border border-[#303238] bg-[#151619] p-4"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              {statisticLabels[label] ?? label}
            </p>
            <p className="mt-2 text-2xl font-black text-white">{value}</p>
          </div>
        ))}
      </div>

      <SocialFilters filters={crud.filters} onChange={crud.setFilters} />

      {editing && (
        <SocialRecordForm
          definition={definition}
          initial={editing}
          onSubmit={(input) =>
            crud.update(editing.id, input).then(() => setEditing(null))
          }
          onCancel={() => setEditing(null)}
        />
      )}

      <div className="space-y-3">
        {crud.records.map((item) => (
          <article
            key={item.id}
            className="rounded-[2px] border border-[#303238] bg-[#151619] p-5"
          >
            <div className="flex justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                    {item.category}
                  </p>
                  <span
                    className={`rounded-[2px] border px-2 py-1 text-[10px] font-semibold ${statusStyles[item.status]}`}
                  >
                    {statusLabels[item.status]}
                  </span>
                </div>
                <Link
                  href={`${definition.basePath}/${item.id}`}
                  className="mt-2 block text-lg font-bold text-white transition-colors hover:text-[#3d92ff]"
                >
                  {item.title || item.content.slice(0, 80)}
                </Link>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">
                  {item.content}
                </p>
              </div>
              <div className="flex shrink-0 items-start gap-1">
                <button
                  type="button"
                  onClick={() => void crud.react(item.id)}
                  className="rounded-[2px] border border-[#303238] bg-[#101114] px-2 py-1 text-xs text-zinc-400 transition-colors hover:border-[#3d92ff] hover:text-white"
                >
                  ♥ {item.likes}
                </button>
                <button
                  type="button"
                  onClick={() => void crud.share(item.id)}
                  className="rounded-[2px] border border-[#303238] bg-[#101114] px-2 py-1 text-xs text-zinc-400 transition-colors hover:border-[#3d92ff] hover:text-white"
                >
                  ↗ {item.shares}
                </button>
              </div>
            </div>
            <div className="mt-4 flex gap-3 border-t border-[#303238] pt-3 text-xs">
              <button
                type="button"
                onClick={() => setEditing(item)}
                className="font-semibold text-[#3d92ff] transition-colors hover:text-[#79b4ff]"
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={() => void crud.remove(item.id)}
                className="font-semibold text-red-300 transition-colors hover:text-red-200"
              >
                Supprimer
              </button>
            </div>
          </article>
        ))}
        {crud.records.length === 0 && (
          <p className="rounded-[2px] border border-dashed border-[#303238] bg-[#101114] p-8 text-center text-sm text-zinc-500">
            Aucun contenu. Utilisez Créer pour commencer.
          </p>
        )}
      </div>
    </section>
  );
}
