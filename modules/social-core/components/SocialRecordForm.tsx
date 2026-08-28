"use client";

import { useState } from "react";

import { DisciplineSelect } from "@/modules/disciplines";

import type {
  SocialMediaType,
  SocialModuleDefinition,
  SocialRecord,
  SocialRecordInput,
  SocialStatus,
} from "../types";

const fieldClassName =
  "h-10 min-w-0 rounded-[2px] border border-[#303238] bg-[#0d0f12] px-3 text-xs text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 hover:border-[#454951] focus:border-[#3d92ff]";

export function SocialRecordForm({
  definition,
  initial,
  onSubmit,
  onCancel,
}: {
  definition: SocialModuleDefinition;
  initial?: SocialRecord;
  onSubmit: (input: SocialRecordInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Général");
  const [discipline, setDiscipline] = useState(initial?.discipline ?? "");
  const [region, setRegion] = useState(initial?.region ?? "");
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");
  const [mentions, setMentions] = useState(
    initial?.mentions.join(", ") ?? "",
  );
  const [mediaType, setMediaType] = useState<SocialMediaType | "">(
    initial?.mediaType ?? "",
  );
  const [mediaUrl, setMediaUrl] = useState(initial?.mediaUrl ?? "");
  const [status, setStatus] = useState<SocialStatus>(
    initial?.status ?? "published",
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await onSubmit({
      kind: definition.kind,
      title,
      content,
      author: initial?.author ?? "Utilisateur",
      category,
      discipline,
      region,
      tags: tags
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      mentions: mentions
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      mediaType: mediaType || undefined,
      mediaUrl: mediaUrl || undefined,
      parentId: initial?.parentId,
      status,
    });
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-3 rounded-[2px] border border-[#303238] bg-[#151619] p-5"
    >
      <header className="border-b border-[#303238] pb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3d92ff]">
          Publication sociale
        </p>
        <h2 className="mt-1 font-bold text-white">
          {initial ? "Modifier" : "Créer"}{" "}
          {definition.entityLabel.toLocaleLowerCase()}
        </h2>
      </header>
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Titre"
        className={fieldClassName}
      />
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Contenu"
        className={`${fieldClassName} h-auto min-h-32 py-3`}
      />
      <div className="grid gap-3 md:grid-cols-3">
        <input
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          placeholder="Catégorie"
          className={fieldClassName}
        />
        <DisciplineSelect
          value={discipline}
          onChange={(event) => setDiscipline(event.target.value)}
          className={fieldClassName}
        />
        <input
          value={region}
          onChange={(event) => setRegion(event.target.value)}
          placeholder="Région"
          className={fieldClassName}
        />
      </div>
      <input
        value={tags}
        onChange={(event) => setTags(event.target.value)}
        placeholder="Mots-clés séparés par des virgules"
        className={fieldClassName}
      />
      <input
        value={mentions}
        onChange={(event) => setMentions(event.target.value)}
        placeholder="Mentions séparées par des virgules"
        className={fieldClassName}
      />
      <div className="grid gap-3 md:grid-cols-3">
        <select
          value={mediaType}
          onChange={(event) =>
            setMediaType(event.target.value as SocialMediaType | "")
          }
          className={fieldClassName}
        >
          <option value="">Sans média</option>
          <option value="image">Photo</option>
          <option value="video">Vidéo</option>
          <option value="album">Album</option>
          <option value="gallery">Galerie</option>
        </select>
        <input
          value={mediaUrl}
          onChange={(event) => setMediaUrl(event.target.value)}
          placeholder="URL du média"
          className={fieldClassName}
        />
        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as SocialStatus)
          }
          className={fieldClassName}
        >
          <option value="published">Publié</option>
          <option value="draft">Brouillon</option>
          <option value="locked">Verrouillé</option>
          <option value="reported">Signalé</option>
          <option value="archived">Archivé</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="submit"
          className="h-10 rounded-[2px] border border-[#ff1638] bg-[#ff1638] px-4 text-xs font-bold text-white transition-colors hover:bg-[#d91d35]"
        >
          Enregistrer
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-[2px] border border-[#303238] bg-[#101114] px-4 text-xs font-bold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
