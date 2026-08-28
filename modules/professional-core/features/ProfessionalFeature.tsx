"use client";

import { useState } from "react";
import {
  ComplianceAlerts,
  ProfessionalStats,
  ProfessionalTable,
} from "../components";
import { useProfessional } from "../hooks";
import {
  DOMAIN_LABELS,
  type ProfessionalDomain,
  type ProfessionalRole,
  type RecordStatus,
} from "../types";

const fieldClass =
  "min-h-10 border border-[#343840] bg-[#0e0f11] px-3 text-[11px] text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-[#087cff]";

export function ProfessionalFeature({
  domain,
  role,
  supervision = false,
}: {
  domain: ProfessionalDomain;
  role: ProfessionalRole;
  supervision?: boolean;
}) {
  const api = useProfessional(domain, role);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RecordStatus | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  if (api.state.loading) {
    return (
      <div className="border border-[#303238] bg-[#151619] p-6 text-[11px] text-zinc-400">
        Chargement des dossiers…
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <header className="flex flex-wrap items-end justify-between gap-4 border border-[#303238] bg-[#151619] p-4">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
            {supervision ? "Supervision administrative" : "Espace professionnel"}
          </p>
          <h2 className="mt-1 text-[15px] font-semibold text-zinc-100">
            {DOMAIN_LABELS[domain]}
          </h2>
          <p className="mt-1 max-w-2xl text-[11px] leading-5 text-zinc-400">
            Gestion typée, historique préparé et confidentialité appliquée. Les
            intégrations externes restent désactivées.
          </p>
        </div>
        <button
          onClick={() => setShowForm((value) => !value)}
          className="min-h-9 border border-[#ff1638] bg-[#ff1638] px-4 text-[9px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#d91d35]"
        >
          {showForm ? "Fermer" : "Nouveau dossier"}
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

      <ProfessionalStats
        finance={api.state.finance}
        alerts={api.state.alerts}
        count={api.state.records.length}
      />

      {showForm && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void api.create({ title, subtitle }).then(() => {
              setTitle("");
              setSubtitle("");
              setShowForm(false);
              setMessage("Dossier créé dans le stockage provisoire.");
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
            placeholder="Description"
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
            const next = event.target.value as RecordStatus | "all";
            setStatus(next);
            void api.search(search, next);
          }}
          className={fieldClass}
        >
          <option value="all">Tous les statuts</option>
          <option value="draft">Brouillon</option>
          <option value="pending">En attente</option>
          <option value="active">Actif</option>
          <option value="expired">Expiré</option>
          <option value="suspended">Suspendu</option>
          <option value="paid">Payé</option>
          <option value="unpaid">Impayé</option>
        </select>
      </div>

      <ProfessionalTable
        records={api.state.records}
        onRemove={(id) => {
          void api
            .remove(id)
            .then(() => setMessage("Dossier supprimé du stockage provisoire."));
        }}
      />
      <ComplianceAlerts alerts={api.state.alerts} />
    </div>
  );
}
