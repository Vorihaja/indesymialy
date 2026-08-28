"use client";

import { useState } from "react";

import {
  OperationsCards,
  OperationsStats,
  OperationsTable,
  PublicSettingsView,
} from "../components";
import { useOperations } from "../hooks";
import {
  OPERATIONS_LABELS,
  type OperationsDomain,
  type OperationsStatus,
} from "../types";

export type OperationsView =
  | "list"
  | "faq"
  | "form"
  | "detail"
  | "admin"
  | "account"
  | "settings";

const fieldClassName =
  "h-11 w-full rounded-[2px] border border-[#303238] bg-[#0d0f12] px-3 text-[13px] text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 hover:border-[#454951] focus:border-[#3d92ff]";

export function OperationsFeature({
  domain,
  view = "list",
  detailId,
  createMode = false,
}: {
  domain: OperationsDomain;
  view?: OperationsView;
  detailId?: string;
  createMode?: boolean;
}) {
  const admin = view === "admin";
  const api = useOperations(domain, detailId, admin);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OperationsStatus | "all">("all");
  const [showForm, setShowForm] = useState(createMode || view === "form");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (api.state.loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-zinc-500">
        Chargement…
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 text-zinc-100 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#303238] pb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3d92ff]">
            {admin
              ? "Opérations plateforme"
              : view === "account"
                ? "Compte privé"
                : "Indesy Mialy"}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
            {OPERATIONS_LABELS[domain]}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
            {domain === "legal"
              ? "Contenu juridique provisoire en attente de validation professionnelle."
              : "Informations, assistance et opérations de la plateforme."}
          </p>
        </div>

        {(admin ||
          domain === "support" ||
          domain === "feedback" ||
          domain === "bug-reports" ||
          domain === "contact") &&
          view !== "detail" && (
            <button
              type="button"
              onClick={() => setShowForm((value) => !value)}
              className={
                showForm
                  ? "h-10 rounded-[2px] border border-[#303238] bg-[#151619] px-4 text-xs font-bold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                  : "h-10 rounded-[2px] border border-[#ff1638] bg-[#ff1638] px-4 text-xs font-bold text-white transition-colors hover:bg-[#d91d35]"
              }
            >
              {showForm ? "Fermer" : "Créer"}
            </button>
          )}
      </header>

      {api.error && (
        <p
          role="alert"
          className="rounded-[2px] border border-red-800/70 bg-red-950/30 p-3 text-sm text-red-300"
        >
          {api.error}
        </p>
      )}
      {message && (
        <p className="rounded-[2px] border border-emerald-800/70 bg-emerald-950/30 p-3 text-sm text-emerald-300">
          {message}
        </p>
      )}

      {admin && <OperationsStats metrics={api.state.metrics} />}

      {showForm && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (domain === "contact" && !consent) {
              setMessage("Le consentement est obligatoire.");
              return;
            }
            void api.create({ title, summary, content }).then(() => {
              setTitle("");
              setSummary("");
              setContent("");
              setShowForm(false);
              setMessage("Demande enregistrée dans le stockage provisoire.");
            });
          }}
          className="space-y-3 rounded-[2px] border border-[#303238] bg-[#151619] p-5"
        >
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Sujet ou titre"
            className={fieldClassName}
          />
          <input
            required
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="Résumé ou catégorie"
            className={fieldClassName}
          />
          <textarea
            required
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={
              domain === "bug-reports"
                ? "Description, étapes, résultat attendu et obtenu"
                : "Description détaillée"
            }
            rows={5}
            className={`${fieldClassName} h-auto min-h-32 py-3`}
          />
          {domain === "contact" && (
            <label className="flex items-start gap-2 text-sm text-zinc-400">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-0.5 accent-[#3d92ff]"
              />
              <span>
                J’accepte l’utilisation de mes coordonnées pour traiter cette
                demande.
              </span>
            </label>
          )}
          <label className="block rounded-[2px] border border-dashed border-[#3a3d44] bg-[#101114] p-3 text-sm text-zinc-500">
            Pièce jointe ou capture préparée
            <input
              type="file"
              className="mt-2 block w-full text-xs text-zinc-500 file:mr-3 file:rounded-[2px] file:border-0 file:bg-[#24272d] file:px-3 file:py-2 file:font-semibold file:text-zinc-200"
            />
          </label>
          <button className="h-10 rounded-[2px] border border-[#ff1638] bg-[#ff1638] px-4 text-xs font-bold text-white transition-colors hover:bg-[#d91d35]">
            Envoyer
          </button>
        </form>
      )}

      {view === "settings" ? (
        <PublicSettingsView settings={api.state.settings} />
      ) : admin ? (
        <>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                void api.search(event.target.value, status);
              }}
              placeholder="Rechercher…"
              className={fieldClassName}
            />
            <select
              value={status}
              onChange={(event) => {
                const next = event.target.value as OperationsStatus | "all";
                setStatus(next);
                void api.search(search, next);
              }}
              className={fieldClassName}
            >
              <option value="all">Tous</option>
              <option value="open">Ouvert</option>
              <option value="assigned">Assigné</option>
              <option value="resolved">Résolu</option>
              <option value="published">Publié</option>
              <option value="draft">Brouillon</option>
            </select>
          </div>
          <OperationsTable
            records={api.state.records}
            onRemove={(id) => {
              void api
                .remove(id)
                .then(() =>
                  setMessage("Élément supprimé du stockage provisoire."),
                );
            }}
          />
        </>
      ) : view === "detail" ? (
        <OperationsCards records={api.state.records} />
      ) : (
        <>
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              void api.search(event.target.value, status);
            }}
            placeholder="Rechercher…"
            className={fieldClassName}
          />
          <OperationsCards
            records={api.state.records}
            faq={view === "faq"}
            basePath={
              domain === "help-center"
                ? "/help/articles"
                : domain === "support"
                  ? "/support"
                  : domain === "platform-incidents"
                    ? "/status/incidents"
                    : undefined
            }
          />
        </>
      )}
    </main>
  );
}
