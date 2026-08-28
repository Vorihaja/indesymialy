"use client";

import { useState } from "react";
import { ProgressChart, SportStats, SportTable } from "../components";
import { useSportDevelopment } from "../hooks";
import {
  SPORT_LABELS,
  type SportDomain,
  type SportRole,
  type SportStatus,
} from "../types";

const fieldClass =
  "min-h-10 border border-[#343840] bg-[#0e0f11] px-3 text-[11px] text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-[#087cff]";

export function SportDevelopmentFeature({
  domain,
  role,
  scopeId,
  createMode = false,
  supervision = false,
}: {
  domain: SportDomain;
  role: SportRole;
  scopeId?: string;
  createMode?: boolean;
  supervision?: boolean;
}) {
  const api = useSportDevelopment(domain, role, scopeId);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SportStatus | "all">("all");
  const [showForm, setShowForm] = useState(createMode);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  if (api.state.loading) {
    return (
      <div className="border border-[#303238] bg-[#151619] p-6 text-[11px] text-zinc-400">
        Chargement du suivi sportif…
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <header className="flex flex-wrap items-end justify-between gap-4 border border-[#303238] bg-[#151619] p-4">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
            {supervision
              ? "Supervision sportive"
              : scopeId
                ? "Fiche opérationnelle"
                : "Développement sportif"}
          </p>
          <h2 className="mt-1 text-[15px] font-semibold text-zinc-100">
            {SPORT_LABELS[domain]}
          </h2>
          <p className="mt-1 max-w-2xl text-[11px] leading-5 text-zinc-400">
            Planning, progression, historique et confidentialité intégrés. Aucun
            conseil médical ou nutritionnel automatisé.
          </p>
        </div>
        <button
          onClick={() => setShowForm((value) => !value)}
          className="min-h-9 border border-[#ff1638] bg-[#ff1638] px-4 text-[9px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#d91d35]"
        >
          {showForm ? "Fermer" : "Nouveau"}
        </button>
      </header>

      {api.error && (
        <p className="border border-[#5f1c28] bg-[#220d12] p-3 text-[11px] text-[#ff7a8b]">
          {api.error}
        </p>
      )}
      {message && (
        <p className="border border-[#1d5b43] bg-[#0d2119] p-3 text-[11px] text-emerald-300">
          {message}
        </p>
      )}

      <SportStats metrics={api.state.metrics} count={api.state.records.length} />

      {showForm && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void api.create({ title, subtitle }).then(() => {
              setTitle("");
              setSubtitle("");
              setShowForm(false);
              setMessage("Dossier sportif créé dans le stockage provisoire.");
            });
          }}
          className="grid gap-2 border border-[#303238] bg-[#151619] p-3 md:grid-cols-[1fr_1fr_auto]"
        >
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Titre"
            className={fieldClass}
          />
          <input
            required
            value={subtitle}
            onChange={(event) => setSubtitle(event.target.value)}
            placeholder="Objectif ou description"
            className={fieldClass}
          />
          <button className="min-h-10 border border-[#087cff] bg-[#087cff] px-4 text-[9px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#0069db]">
            Créer
          </button>
        </form>
      )}

      <div className="flex flex-wrap gap-2 border border-[#303238] bg-[#151619] p-3">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            void api.search(event.target.value, status);
          }}
          placeholder="Rechercher…"
          className={`min-w-64 flex-1 ${fieldClass}`}
        />
        <select
          value={status}
          onChange={(event) => {
            const next = event.target.value as SportStatus | "all";
            setStatus(next);
            void api.search(search, next);
          }}
          className={fieldClass}
        >
          <option value="all">Tous les statuts</option>
          <option value="planned">Planifié</option>
          <option value="active">Actif</option>
          <option value="completed">Terminé</option>
          <option value="shortlisted">Présélectionné</option>
          <option value="recruited">Recruté</option>
          <option value="archived">Archivé</option>
        </select>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <SportTable
          records={api.state.records}
          onRemove={(id) => {
            void api
              .remove(id)
              .then(() => setMessage("Dossier supprimé du stockage provisoire."));
          }}
        />
        <ProgressChart timeline={api.state.timeline} />
      </div>
    </div>
  );
}
