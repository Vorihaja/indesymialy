"use client";

import { useState } from "react";
import type {
  ErpModuleDefinition,
  ErpRecord,
  ErpRecordInput,
  ErpRecordStatus,
} from "../types";

const fieldClass =
  "min-h-10 w-full border border-[#343840] bg-[#0e0f11] px-3 text-[11px] text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-[#087cff]";

export function ErpRecordForm({
  definition,
  initial,
  onSubmit,
  onCancel,
}: {
  definition: ErpModuleDefinition;
  initial?: ErpRecord;
  onSubmit: (input: ErpRecordInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Général");
  const [status, setStatus] = useState<ErpRecordStatus>(
    initial?.status ?? "draft",
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      setSaving(true);
      await onSubmit({ title, category, status, description });
      if (!initial) {
        setTitle("");
        setDescription("");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-3 border border-[#303238] bg-[#151619]"
    >
      <header className="border-b border-[#303238] px-4 py-3">
        <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#3d92ff]">
          Saisie opérationnelle
        </p>
        <h3 className="mt-0.5 text-[11px] font-semibold text-zinc-100">
          {initial ? "Modifier" : "Créer"}{" "}
          {definition.entityLabel.toLocaleLowerCase()}
        </h3>
      </header>

      <div className="grid gap-2 px-4 sm:grid-cols-2">
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Titre"
          className={fieldClass}
        />
        <input
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          placeholder="Catégorie"
          className={fieldClass}
        />
        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as ErpRecordStatus)
          }
          className={`sm:col-span-2 ${fieldClass}`}
        >
          <option value="draft">Brouillon</option>
          <option value="active">Actif</option>
          <option value="archived">Archivé</option>
        </select>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description"
          className={`min-h-20 resize-y sm:col-span-2 ${fieldClass}`}
        />
      </div>

      <div className="flex gap-2 border-t border-[#303238] px-4 py-3">
        <button
          disabled={saving}
          className="min-h-9 border border-[#087cff] bg-[#087cff] px-4 text-[9px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#0069db] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-9 border border-[#454952] bg-[#111214] px-4 text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-300 transition-colors hover:border-[#686d78] hover:text-white"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
