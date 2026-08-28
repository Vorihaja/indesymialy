"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ImagePlus,
  MapPin,
  Pencil,
  RefreshCw,
  Send,
  Swords,
  TicketCheck,
  Undo2,
  Users,
} from "lucide-react";
import { normalizeBackendError } from "@/shared/errors/backend-error";
import { createOrganizerEventWorkflowUseCase } from "../real-data/organizer-event-workflow.factory";
import type {
  OrganizerEventDetails,
  OrganizerEventListItem,
} from "../real-data/organizer-event-workflow.repository";
import {
  OrganizerDialog,
  organizerButtonClass,
  organizerPrimaryButtonClass,
} from "./OrganizerFeedback";

type DetailTab =
  | "Informations"
  | "Fight Card"
  | "Officiels"
  | "Équipe"
  | "Finances"
  | "Billetterie";

const tabs: DetailTab[] = [
  "Informations",
  "Fight Card",
  "Officiels",
  "Équipe",
  "Finances",
  "Billetterie",
];

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  published: "Publié",
  active: "Actif",
  live: "Live",
  completed: "Terminé",
  cancelled: "Annulé",
  archived: "Archivé",
  postponed: "Reporté",
  invited: "Invité",
  confirmed: "Confirmé",
  declined: "Refusé",
  assigned: "Affecté",
};

const roleLabels: Record<string, string> = {
  referee: "Arbitre",
  judge: "Juge",
  timekeeper: "Chronométreur",
  doctor: "Médecin",
  supervisor: "Superviseur",
  announcer: "Annonceur",
  official: "Officiel",
};

function humanStatus(value: string) {
  return statusLabels[value] ?? value;
}

function humanRole(value: string) {
  return roleLabels[value] ?? value;
}

function formatDateTime(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatMoney(value: number, currencyCode = "MGA") {
  const suffix = currencyCode === "MGA" ? "Ar" : currencyCode;
  return `${new Intl.NumberFormat("fr-FR").format(value)} ${suffix}`;
}

function InfoCell({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="min-h-[72px] border-b border-[#292c31] p-3 sm:odd:border-r">
      <dt className="text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-600">
        {label}
      </dt>
      <dd className="mt-1 text-[10px] font-semibold leading-5 text-zinc-200">
        {value === null || value === undefined || value === "" ? "—" : value}
      </dd>
    </div>
  );
}

function EmptyState({ children }: { children: string }) {
  return (
    <div className="grid min-h-28 place-items-center border border-dashed border-[#303238] bg-[#101114] p-4 text-center text-[9px] text-zinc-600">
      {children}
    </div>
  );
}

export function OrganizerEventDetailsModal({
  open,
  event,
  onClose,
  onEdit,
  onPoster,
  onTogglePublished,
}: {
  open: boolean;
  event: OrganizerEventListItem | null;
  onClose: () => void;
  onEdit: (eventId: string) => void | Promise<void>;
  onPoster: (event: OrganizerEventListItem) => void;
  onTogglePublished: (event: OrganizerEventListItem) => void;
}) {
  const router = useRouter();
  const useCase = useMemo(
    () => createOrganizerEventWorkflowUseCase(),
    [],
  );

  const [details, setDetails] = useState<OrganizerEventDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>("Informations");

  useEffect(() => {
    let active = true;

    if (!open || !event) {
      setDetails(null);
      setError(null);
      setLoading(false);
      setActiveTab("Informations");
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError(null);
    setActiveTab("Informations");

    void useCase
      .loadDetails(event.id)
      .then((result) => {
        if (!active) return;
        setDetails(result);
      })
      .catch((reason) => {
        if (!active) return;
        setError(normalizeBackendError(reason).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [event, open, useCase]);

  if (!event) return null;

  const currentStatus = details?.event.status ?? event.status;
  const posterUrl = details?.posterUrl ?? event.posterUrl;
  const canTogglePublication =
    currentStatus === "draft" || currentStatus === "published";

  const footer = (
    <>
      <button type="button" onClick={onClose} className={organizerButtonClass}>
        Fermer
      </button>

      <button
        type="button"
        onClick={() => {
          onClose();
          void onEdit(event.id);
        }}
        className={organizerButtonClass}
      >
        <Pencil size={12} />
        Modifier
      </button>

      <button
        type="button"
        onClick={() => {
          onClose();
          onPoster(event);
        }}
        className={organizerButtonClass}
      >
        <ImagePlus size={12} />
        {posterUrl ? "Remplacer l’affiche" : "Ajouter l’affiche"}
      </button>

      {canTogglePublication && (
        <button
          type="button"
          onClick={() => {
            onClose();
            onTogglePublished({
              ...event,
              status: currentStatus,
              posterUrl,
            });
          }}
          className={
            currentStatus === "published"
              ? organizerButtonClass
              : organizerPrimaryButtonClass
          }
        >
          {currentStatus === "published" ? (
            <Undo2 size={12} />
          ) : (
            <Send size={12} />
          )}
          {currentStatus === "published" ? "Dépublier" : "Publier"}
        </button>
      )}

      <button
        type="button"
        onClick={() =>
          router.push(`/dashboard/organisateur/events/${event.id}/fight-card`)
        }
        className={organizerButtonClass}
      >
        <Swords size={12} />
        Fight Center
      </button>

      <button
        type="button"
        onClick={() => router.push(`/dashboard/organisateur/events/${event.id}`)}
        className={organizerPrimaryButtonClass}
      >
        Ouvrir l’espace événement
      </button>
    </>
  );

  return (
    <OrganizerDialog
      open={open}
      eyebrow="Détails de l’événement"
      title={details?.event.title ?? event.title}
      description={
        details
          ? `${formatDateTime(details.event.startsAt)} · ${
              details.event.venue ?? "Lieu non renseigné"
            }`
          : "Chargement de la fiche événement…"
      }
      wide
      onClose={onClose}
      footer={footer}
    >
      {loading && (
        <div className="grid min-h-72 place-items-center">
          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <RefreshCw size={14} className="animate-spin text-[#3d92ff]" />
            Chargement des données réelles…
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="border border-red-500/30 bg-red-500/5 p-4">
          <strong className="text-[10px] text-red-300">
            Impossible de charger la fiche complète.
          </strong>
          <p className="mt-1 text-[9px] leading-5 text-zinc-500">{error}</p>
        </div>
      )}

      {!loading && !error && details && (
        <div className="grid gap-4">
          <section className="grid gap-4 border border-[#303238] bg-[#111214] p-3 md:grid-cols-[190px_1fr]">
            <div
              className="relative min-h-[250px] border border-[#343840] bg-[#090a0c] bg-contain bg-center bg-no-repeat"
              style={
                posterUrl
                  ? { backgroundImage: `url("${posterUrl}")` }
                  : undefined
              }
            >
              {!posterUrl && (
                <div className="absolute inset-0 grid place-items-center text-center">
                  <div>
                    <ImagePlus size={22} className="mx-auto text-zinc-700" />
                    <span className="mt-2 block text-[8px] uppercase tracking-[0.1em] text-zinc-700">
                      Aucune affiche
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#3d92ff]">
                    {details.event.eventType ?? "Événement"}
                  </span>
                  <h3 className="mt-1 text-[22px] font-semibold tracking-[-0.04em] text-white">
                    {details.event.title}
                  </h3>
                </div>

                <span className="border border-[#3a3d43] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-300">
                  {humanStatus(details.event.status)}
                </span>
              </div>

              <div className="mt-4 grid gap-2 text-[9px] text-zinc-500 sm:grid-cols-2">
                <span className="flex items-center gap-2">
                  <CalendarDays size={13} />
                  {formatDateTime(details.event.startsAt)}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin size={13} />
                  {details.event.venue ?? "Lieu non renseigné"}
                </span>
                <span className="flex items-center gap-2">
                  <Users size={13} />
                  {details.event.organizerName ?? "Organisation non renseignée"}
                </span>
                <span className="flex items-center gap-2">
                  <TicketCheck size={13} />
                  {details.ticketing.soldQuantity} / {details.ticketing.capacity} billets
                </span>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  <span>Préparation</span>
                  <span className="font-mono text-zinc-300">
                    {details.event.readinessPercent} %
                  </span>
                </div>
                <div className="h-1.5 bg-[#292c31]">
                  <div
                    className="h-full bg-[#ff1638]"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, details.event.readinessPercent),
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          <nav className="flex overflow-x-auto border border-[#303238] bg-[#101114]">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`min-h-10 flex-none border-r border-[#303238] px-4 text-[8px] font-bold uppercase tracking-[0.09em] transition ${
                  activeTab === tab
                    ? "bg-[#1a1c20] text-white shadow-[inset_0_-2px_0_#ff1638]"
                    : "text-zinc-600 hover:text-zinc-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          {activeTab === "Informations" && (
            <div className="grid gap-3">
              <dl className="grid border border-[#303238] sm:grid-cols-2">
                <InfoCell label="Nom" value={details.event.title} />
                <InfoCell label="Type" value={details.event.eventType} />
                <InfoCell label="Statut" value={humanStatus(details.event.status)} />
                <InfoCell label="Visibilité" value={details.event.visibility} />
                <InfoCell label="Début" value={formatDateTime(details.event.startsAt)} />
                <InfoCell label="Fin" value={formatDateTime(details.event.endsAt)} />
                <InfoCell label="Lieu" value={details.event.venue} />
                <InfoCell label="Adresse" value={details.event.address} />
                <InfoCell label="Commune" value={details.event.communeName} />
                <InfoCell label="Ville" value={details.event.cityName} />
                <InfoCell label="District" value={details.event.districtName} />
                <InfoCell label="Région" value={details.event.regionName} />
                <InfoCell label="Capacité" value={details.event.capacity} />
                <InfoCell label="Fuseau horaire" value={details.event.timezoneName} />
                <InfoCell label="Organisation principale" value={details.event.organizerName} />
                <InfoCell label="Préparation" value={`${details.event.readinessPercent} %`} />
                <InfoCell label="Publié le" value={formatDateTime(details.event.publishedAt)} />
                <InfoCell label="Dernière mise à jour" value={formatDateTime(details.event.updatedAt)} />
              </dl>

              <section className="border border-[#303238]">
                <header className="border-b border-[#303238] bg-[#101114] px-3 py-2">
                  <strong className="text-[9px] font-semibold text-zinc-200">
                    Coorganisations
                  </strong>
                </header>

                {details.coorganizers.length ? (
                  <div className="divide-y divide-[#292c31]">
                    {details.coorganizers.map((item) => (
                      <div
                        key={item.organizationId}
                        className="grid gap-2 px-3 py-2.5 text-[9px] sm:grid-cols-[1fr_160px_120px]"
                      >
                        <strong>{item.name}</strong>
                        <span className="text-zinc-500">{item.role}</span>
                        <span className="text-zinc-500">
                          {humanStatus(item.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-[9px] text-zinc-600">
                    Aucun coorganisateur enregistré.
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === "Fight Card" && (
            <div className="grid gap-2">
              {details.fightCards.length ? (
                details.fightCards.map((fight) => (
                  <article
                    key={fight.id}
                    className="grid gap-3 border border-[#303238] bg-[#111214] p-3 md:grid-cols-[120px_1fr_70px_1fr_110px] md:items-center"
                  >
                    <div>
                      <span className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                        {fight.segment}
                      </span>
                      <strong className="mt-1 block text-[9px] text-[#3d92ff]">
                        {fight.discipline}
                      </strong>
                    </div>

                    <strong className="text-[11px] text-[#ff4058]">
                      {fight.red}
                    </strong>

                    <span className="text-center text-[8px] font-bold text-zinc-700">
                      VS
                    </span>

                    <strong className="text-right text-[11px] text-[#3d92ff]">
                      {fight.blue}
                    </strong>

                    <span className="text-right text-[8px] uppercase text-zinc-500">
                      {humanStatus(fight.status)}
                    </span>
                  </article>
                ))
              ) : (
                <EmptyState>Aucun combat préparé pour cet événement.</EmptyState>
              )}
            </div>
          )}

          {activeTab === "Officiels" && (
            <div className="overflow-x-auto border border-[#303238]">
              <table className="w-full min-w-[620px] text-left text-[9px]">
                <thead className="bg-[#101114] text-[8px] uppercase text-zinc-600">
                  <tr>
                    <th className="px-3 py-2">Officiel</th>
                    <th className="px-3 py-2">Fonction</th>
                    <th className="px-3 py-2">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#292c31]">
                  {details.officials.map((official) => (
                    <tr key={official.id}>
                      <td className="px-3 py-2.5 font-semibold text-zinc-200">
                        {official.name}
                      </td>
                      <td className="px-3 py-2.5 text-zinc-500">
                        {humanRole(official.role)}
                      </td>
                      <td className="px-3 py-2.5 text-zinc-500">
                        {humanStatus(official.status)}
                      </td>
                    </tr>
                  ))}
                  {!details.officials.length && (
                    <tr>
                      <td colSpan={3} className="h-24 text-center text-zinc-600">
                        Aucun officiel affecté.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "Équipe" && (
            <div className="overflow-x-auto border border-[#303238]">
              <table className="w-full min-w-[900px] text-left text-[9px]">
                <thead className="bg-[#101114] text-[8px] uppercase text-zinc-600">
                  <tr>
                    <th className="px-3 py-2">Personne</th>
                    <th className="px-3 py-2">Rôle</th>
                    <th className="px-3 py-2">Zone</th>
                    <th className="px-3 py-2">Disponibilité</th>
                    <th className="px-3 py-2">Horaires</th>
                    <th className="px-3 py-2">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#292c31]">
                  {details.team.map((member) => (
                    <tr key={member.id}>
                      <td className="px-3 py-2.5 font-semibold text-zinc-200">
                        {member.name}
                      </td>
                      <td className="px-3 py-2.5 text-zinc-500">
                        {member.role}
                      </td>
                      <td className="px-3 py-2.5 text-zinc-500">
                        {member.zone ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-zinc-500">
                        {member.availability}
                      </td>
                      <td className="px-3 py-2.5 text-zinc-500">
                        {member.startsAt || member.endsAt
                          ? `${formatDateTime(member.startsAt)} → ${formatDateTime(
                              member.endsAt,
                            )}`
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-zinc-500">
                        {humanStatus(member.status)}
                      </td>
                    </tr>
                  ))}
                  {!details.team.length && (
                    <tr>
                      <td colSpan={6} className="h-24 text-center text-zinc-600">
                        Aucun membre d’équipe enregistré.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "Finances" && (
            <div className="grid gap-3">
              <section className="grid gap-px border border-[#303238] bg-[#303238] sm:grid-cols-2 xl:grid-cols-5">
                {[
                  [
                    "Budget prévisionnel",
                    formatMoney(
                      details.finance.plannedBudget,
                      details.finance.currencyCode,
                    ),
                  ],
                  [
                    "Revenus prévus",
                    formatMoney(
                      details.finance.forecastRevenue,
                      details.finance.currencyCode,
                    ),
                  ],
                  [
                    "Dépenses prévues",
                    formatMoney(
                      details.finance.forecastExpenses,
                      details.finance.currencyCode,
                    ),
                  ],
                  [
                    "Dépenses engagées",
                    formatMoney(
                      details.finance.committedExpenses,
                      details.finance.currencyCode,
                    ),
                  ],
                  [
                    "Dépenses payées",
                    formatMoney(
                      details.finance.paidExpenses,
                      details.finance.currencyCode,
                    ),
                  ],
                ].map(([label, value]) => (
                  <article key={label} className="bg-[#111214] p-3">
                    <span className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                      {label}
                    </span>
                    <strong className="mt-2 block text-[14px] text-white">
                      {value}
                    </strong>
                  </article>
                ))}
              </section>

              <div className="overflow-x-auto border border-[#303238]">
                <table className="w-full min-w-[820px] text-left text-[9px]">
                  <thead className="bg-[#101114] text-[8px] uppercase text-zinc-600">
                    <tr>
                      <th className="px-3 py-2">Ligne</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Prévu</th>
                      <th className="px-3 py-2">Engagé</th>
                      <th className="px-3 py-2">Réel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#292c31]">
                    {details.finance.lines.map((line) => (
                      <tr key={line.id}>
                        <td className="px-3 py-2.5 font-semibold text-zinc-200">
                          {line.label}
                        </td>
                        <td className="px-3 py-2.5 text-zinc-500">
                          {line.type} · {line.category}
                        </td>
                        <td className="px-3 py-2.5 text-zinc-500">
                          {formatMoney(line.forecast, details.finance.currencyCode)}
                        </td>
                        <td className="px-3 py-2.5 text-zinc-500">
                          {formatMoney(line.committed, details.finance.currencyCode)}
                        </td>
                        <td className="px-3 py-2.5 text-zinc-500">
                          {formatMoney(line.actual, details.finance.currencyCode)}
                        </td>
                      </tr>
                    ))}
                    {!details.finance.lines.length && (
                      <tr>
                        <td colSpan={5} className="h-24 text-center text-zinc-600">
                          Aucune ligne budgétaire enregistrée.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "Billetterie" && (
            <div className="grid gap-3">
              <section className="grid gap-px border border-[#303238] bg-[#303238] sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Capacité", String(details.ticketing.capacity)],
                  ["Billets vendus", String(details.ticketing.soldQuantity)],
                  ["Disponibles", String(details.ticketing.availableQuantity)],
                  ["CA payé", formatMoney(details.ticketing.paidRevenue, "MGA")],
                ].map(([label, value]) => (
                  <article key={label} className="bg-[#111214] p-3">
                    <span className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                      {label}
                    </span>
                    <strong className="mt-2 block text-[16px] text-white">
                      {value}
                    </strong>
                  </article>
                ))}
              </section>

              <div className="overflow-x-auto border border-[#303238]">
                <table className="w-full min-w-[980px] text-left text-[9px]">
                  <thead className="bg-[#101114] text-[8px] uppercase text-zinc-600">
                    <tr>
                      <th className="px-3 py-2">Billet</th>
                      <th className="px-3 py-2">Catégorie</th>
                      <th className="px-3 py-2">Zone</th>
                      <th className="px-3 py-2">Prix</th>
                      <th className="px-3 py-2">Vendus</th>
                      <th className="px-3 py-2">Quota</th>
                      <th className="px-3 py-2">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#292c31]">
                    {details.ticketing.types.map((ticket) => (
                      <tr key={ticket.id}>
                        <td className="px-3 py-2.5">
                          <strong className="block text-zinc-200">
                            {ticket.name}
                          </strong>
                          <span className="text-[8px] text-zinc-600">
                            {ticket.code ?? "Sans code"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-zinc-500">
                          {ticket.category}
                        </td>
                        <td className="px-3 py-2.5 text-zinc-500">
                          {ticket.zone ?? "—"}
                        </td>
                        <td className="px-3 py-2.5 text-zinc-500">
                          {formatMoney(ticket.price, ticket.currencyCode)}
                        </td>
                        <td className="px-3 py-2.5 text-zinc-500">
                          {ticket.soldQuantity}
                        </td>
                        <td className="px-3 py-2.5 text-zinc-500">
                          {ticket.totalQuantity}
                        </td>
                        <td className="px-3 py-2.5 text-zinc-500">
                          {humanStatus(ticket.status)}
                        </td>
                      </tr>
                    ))}
                    {!details.ticketing.types.length && (
                      <tr>
                        <td colSpan={7} className="h-24 text-center text-zinc-600">
                          Aucun type de billet enregistré.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </OrganizerDialog>
  );
}
