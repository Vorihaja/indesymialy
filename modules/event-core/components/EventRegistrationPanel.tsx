"use client";

import { useMemo, useState } from "react";
import { Check, Clock3, Search, ShieldCheck, X } from "lucide-react";

import type {
  EventRegistration,
  RegistrationDecision,
  RegistrationDecisionStatus,
  RegistrationEligibilityStatus,
  RegistrationPaymentStatus,
  RegistrationStatus,
} from "../types";

const statusLabels: Record<RegistrationStatus, string> = {
  pending: "En attente",
  validated: "Validée",
  refused: "Refusée",
  waiting_list: "Liste d’attente",
  withdrawn: "Retirée",
};

const eligibilityLabels: Record<RegistrationEligibilityStatus, string> = {
  pending: "À contrôler",
  eligible: "Éligible",
  ineligible: "Inéligible",
  waiver_required: "Dérogation requise",
};

const paymentLabels: Record<RegistrationPaymentStatus, string> = {
  not_required: "Non requis",
  prepared: "Préparé",
  pending: "En attente",
  paid: "Payé",
  refunded: "Remboursé",
};

function allowedDecisions(status: RegistrationStatus): RegistrationDecisionStatus[] {
  if (status === "pending") {
    return ["validated", "waiting_list", "refused"];
  }
  if (status === "waiting_list") {
    return ["validated", "refused"];
  }
  return [];
}

export function EventRegistrationPanel({
  registrations,
  canManage,
  onDecide,
}: {
  registrations: EventRegistration[];
  canManage: boolean;
  onDecide: (id: string, decision: RegistrationDecision) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<RegistrationStatus | "">("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<RegistrationEligibilityStatus>("pending");
  const [payment, setPayment] = useState<RegistrationPaymentStatus>("not_required");
  const [reason, setReason] = useState("");
  const [waitlistPosition, setWaitlistPosition] = useState("");
  const [submitting, setSubmitting] = useState<RegistrationDecisionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fr");
    return registrations.filter((registration) =>
      (!status || registration.status === status) &&
      (!normalized || [
        registration.applicantName,
        registration.category,
        registration.licenceNumber ?? "",
      ].some((value) => value.toLocaleLowerCase("fr").includes(normalized))),
    );
  }, [query, registrations, status]);

  const selected = registrations.find((registration) => registration.id === selectedId);

  const selectRegistration = (registration: EventRegistration) => {
    setSelectedId(registration.id);
    setEligibility(registration.eligibilityStatus);
    setPayment(registration.paymentStatus);
    setReason(registration.decisionReason ?? "");
    setWaitlistPosition(registration.waitlistPosition?.toString() ?? "");
    setError(null);
  };

  const decide = async (nextStatus: RegistrationDecisionStatus) => {
    if (!selected) return;
    if (nextStatus === "validated" && eligibility !== "eligible") {
      setError("Confirmez d’abord l’éligibilité de l’inscription.");
      return;
    }
    if (nextStatus === "refused" && !reason.trim()) {
      setError("Le motif du refus est requis.");
      return;
    }
    const position = Number(waitlistPosition);
    if (nextStatus === "waiting_list" && (!Number.isInteger(position) || position < 1)) {
      setError("Saisissez une position valide sur la liste d’attente.");
      return;
    }

    setSubmitting(nextStatus);
    setError(null);
    try {
      await onDecide(selected.id, {
        status: nextStatus,
        eligibilityStatus: eligibility,
        paymentStatus: payment,
        reason: reason.trim() || undefined,
        waitlistPosition: nextStatus === "waiting_list" ? position : undefined,
      });
      setSelectedId(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "La décision n’a pas pu être enregistrée.");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950 sm:flex-row">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-neutral-200 px-3 dark:border-neutral-800">
          <Search size={16} className="text-neutral-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nom, catégorie ou licence"
            className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as RegistrationStatus | "")}
          className="h-10 rounded-xl border border-neutral-200 bg-transparent px-3 text-sm dark:border-neutral-800"
          aria-label="Filtrer les inscriptions par statut"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {!filtered.length ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700">
          Aucune inscription ne correspond aux filtres.
        </p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((registration) => (
            <button
              key={registration.id}
              type="button"
              onClick={() => selectRegistration(registration)}
              className="grid gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-left transition hover:border-amber-500 dark:border-neutral-800 dark:bg-neutral-950 sm:grid-cols-[minmax(0,1fr)_auto]"
            >
              <span className="min-w-0">
                <span className="block truncate font-bold">{registration.applicantName || "Candidat"}</span>
                <span className="mt-1 block text-sm text-neutral-500">
                  {registration.applicantType === "club" ? "Club" : "Combattant"}
                  {registration.category ? ` · ${registration.category}` : ""}
                  {registration.licenceNumber ? ` · licence ${registration.licenceNumber}` : ""}
                </span>
              </span>
              <span className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border px-2 py-1">{eligibilityLabels[registration.eligibilityStatus]}</span>
                <span className="rounded-full border px-2 py-1 font-semibold">{statusLabels[registration.status]}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {selected ? (
        <div className="rounded-2xl border border-amber-500/40 bg-white p-5 dark:bg-neutral-950">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Détail de l’inscription</p>
              <h3 className="mt-1 text-xl font-black">{selected.applicantName || "Candidat"}</h3>
            </div>
            <button type="button" onClick={() => setSelectedId(null)} aria-label="Fermer le détail" className="rounded-lg border p-2">
              <X size={16} />
            </button>
          </div>

          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div><dt className="text-neutral-500">Catégorie</dt><dd className="font-semibold">{selected.category || "Non renseignée"}</dd></div>
            <div><dt className="text-neutral-500">Poids</dt><dd className="font-semibold">{selected.weightKg ? `${selected.weightKg} kg` : "Non renseigné"}</dd></div>
            <div><dt className="text-neutral-500">Certificat médical</dt><dd className="font-semibold">{selected.medicalCertificate ? "Déposé" : "Non déposé"}</dd></div>
            <div><dt className="text-neutral-500">Documents</dt><dd className="font-semibold">{selected.documents.length}</dd></div>
            <div><dt className="text-neutral-500">Paiement</dt><dd className="font-semibold">{paymentLabels[selected.paymentStatus]}</dd></div>
            <div><dt className="text-neutral-500">Soumise le</dt><dd className="font-semibold">{new Intl.DateTimeFormat("fr-MG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(selected.submittedAt))}</dd></div>
            {selected.waitlistPosition ? <div><dt className="text-neutral-500">Position d’attente</dt><dd className="font-semibold">{selected.waitlistPosition}</dd></div> : null}
            {selected.reviewedAt ? <div><dt className="text-neutral-500">Examinée le</dt><dd className="font-semibold">{new Intl.DateTimeFormat("fr-MG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(selected.reviewedAt))}</dd></div> : null}
          </dl>

          {canManage && allowedDecisions(selected.status).length ? (
            <div className="mt-6 grid gap-4 border-t border-neutral-200 pt-5 dark:border-neutral-800 lg:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold">
                Éligibilité
                <select value={eligibility} onChange={(event) => setEligibility(event.target.value as RegistrationEligibilityStatus)} className="h-10 rounded-lg border bg-transparent px-3 font-normal dark:border-neutral-700">
                  {Object.entries(eligibilityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Paiement
                <select value={payment} onChange={(event) => setPayment(event.target.value as RegistrationPaymentStatus)} className="h-10 rounded-lg border bg-transparent px-3 font-normal dark:border-neutral-700">
                  {Object.entries(paymentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-semibold lg:col-span-2">
                Motif de décision
                <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="rounded-lg border bg-transparent p-3 font-normal dark:border-neutral-700" placeholder="Obligatoire en cas de refus" />
              </label>
              {selected.status === "pending" ? (
                <label className="grid gap-1 text-sm font-semibold">
                  Position sur liste d’attente
                  <input type="number" min={1} step={1} value={waitlistPosition} onChange={(event) => setWaitlistPosition(event.target.value)} className="h-10 rounded-lg border bg-transparent px-3 font-normal dark:border-neutral-700" />
                </label>
              ) : null}
              {error ? <p role="alert" className="text-sm font-semibold text-red-600 lg:col-span-2">{error}</p> : null}
              <div className="flex flex-wrap gap-2 lg:col-span-2">
                {allowedDecisions(selected.status).includes("validated") ? <button type="button" disabled={Boolean(submitting)} onClick={() => void decide("validated")} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><Check size={16} />Valider</button> : null}
                {allowedDecisions(selected.status).includes("waiting_list") ? <button type="button" disabled={Boolean(submitting)} onClick={() => void decide("waiting_list")} className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-black disabled:opacity-50"><Clock3 size={16} />Mettre en attente</button> : null}
                {allowedDecisions(selected.status).includes("refused") ? <button type="button" disabled={Boolean(submitting)} onClick={() => void decide("refused")} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><X size={16} />Refuser</button> : null}
              </div>
            </div>
          ) : null}

          <div className="mt-6 border-t border-neutral-200 pt-5 dark:border-neutral-800">
            <h4 className="flex items-center gap-2 font-bold"><ShieldCheck size={16} />Historique persistant</h4>
            {!selected.history.length ? <p className="mt-2 text-sm text-neutral-500">Aucun changement de statut enregistré.</p> : (
              <ol className="mt-3 space-y-2">
                {selected.history.map((entry) => (
                  <li key={entry.id} className="rounded-lg bg-neutral-100 p-3 text-sm dark:bg-neutral-900">
                    <span className="font-semibold">{entry.fromStatus ? statusLabels[entry.fromStatus] : "Création"} → {statusLabels[entry.toStatus]}</span>
                    <span className="ml-2 text-neutral-500">{new Intl.DateTimeFormat("fr-MG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.createdAt))}</span>
                    {entry.reason ? <p className="mt-1 text-neutral-600 dark:text-neutral-400">{entry.reason}</p> : null}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
