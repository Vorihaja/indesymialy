"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowDownToLine,
  ImagePlus,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import type { RealErpData } from "@/modules/erp-core/real-data";
import { normalizeBackendError } from "@/shared/errors/backend-error";
import { createOrganizerEventWorkflowUseCase } from "../real-data/organizer-event-workflow.factory";
import type { OrganizerEventListItem } from "../real-data/organizer-event-workflow.repository";
import {
  OrganizerDialog,
  OrganizerToast,
  organizerButtonClass,
  organizerPrimaryButtonClass,
  type OrganizerToastState,
} from "./OrganizerFeedback";
import { OrganizerEventDetailsModal } from "./OrganizerEventDetailsModal";

type Props = {
  eventIds: string[];
  kpis: RealErpData["kpis"];
  mutating: boolean;
  onCreate: () => void;
  onEdit: (id: string) => void | Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onChanged: () => Promise<unknown>;
};

type PublicationConfirmation = {
  event: OrganizerEventListItem;
  publish: boolean;
} | null;

const kpiBorders: Record<string, string> = {
  red: "border-l-[#ff1638]",
  blue: "border-l-[#087cff]",
  green: "border-l-emerald-500",
  amber: "border-l-amber-500",
};

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  published: "Publié",
  active: "Actif",
  live: "Live",
  completed: "Terminé",
  cancelled: "Annulé",
  archived: "Archivé",
  postponed: "Reporté",
};

const statusStyles: Record<string, string> = {
  draft: "border-zinc-600/60 bg-zinc-500/10 text-zinc-300",
  published:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  active: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  live: "border-red-500/40 bg-red-500/10 text-red-400",
  completed:
    "border-zinc-500/40 bg-zinc-500/10 text-zinc-400",
  cancelled: "border-red-500/30 bg-red-500/10 text-red-400",
  archived: "border-zinc-700 bg-zinc-900 text-zinc-500",
  postponed:
    "border-amber-500/30 bg-amber-500/10 text-amber-400",
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  const datePart = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);

  const timePart = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);

  return `${datePart} · ${timePart}`;
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function Poster({
  event,
  onOpenDetails,
}: {
  event: OrganizerEventListItem;
  onOpenDetails: (event: OrganizerEventListItem) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpenDetails(event)}
      className="group relative block h-[76px] w-[54px] overflow-hidden border border-[#343840] bg-[#0d0e10]"
      aria-label={`Voir les détails de ${event.title}`}
      title="Voir les détails"
    >
      {event.posterUrl ? (
        <span
          role="img"
          aria-label={`Affiche de ${event.title}`}
          className="absolute inset-0 bg-cover bg-center transition-transform duration-200 group-hover:scale-105"
          style={{
            backgroundImage: `url("${event.posterUrl}")`,
          }}
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center">
          <ImagePlus size={16} className="text-zinc-700" />
        </span>
      )}

      <span className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/90 via-black/20 to-transparent px-1 pb-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <span className="text-center text-[6px] font-bold uppercase tracking-[0.08em] text-white">
          Voir détails
        </span>
      </span>
    </button>
  );
}

export function OrganizerEventsTable({
  eventIds,
  kpis,
  mutating,
  onCreate,
  onEdit,
  onDelete,
  onChanged,
}: Props) {
  const useCase = useMemo(
    () => createOrganizerEventWorkflowUseCase(),
    [],
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<OrganizerEventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<OrganizerToastState>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [posterTarget, setPosterTarget] =
    useState<OrganizerEventListItem | null>(null);
  const [detailsEvent, setDetailsEvent] =
    useState<OrganizerEventListItem | null>(null);
  const [publicationConfirmation, setPublicationConfirmation] =
    useState<PublicationConfirmation>(null);
  const [deleteConfirmation, setDeleteConfirmation] =
    useState<OrganizerEventListItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const result = await useCase.listEvents(eventIds);
      setItems(result);
      setError(null);
    } catch (reason) {
      setError(normalizeBackendError(reason).message);
    } finally {
      setLoading(false);
    }
  }, [eventIds, useCase]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("fr");

    if (!normalizedQuery) return items;

    return items.filter((event) =>
      [
        event.title,
        event.venue ?? "",
        event.cityName ?? "",
        event.regionName ?? "",
        statusLabels[event.status] ?? event.status,
        formatDateTime(event.startsAt),
      ].some((value) =>
        value.toLocaleLowerCase("fr").includes(normalizedQuery),
      ),
    );
  }, [items, query]);

  const choosePoster = (event: OrganizerEventListItem) => {
    if (mutating || busyId) return;

    setPosterTarget(event);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const uploadPoster = async (file: File) => {
    if (!posterTarget) return;

    const target = posterTarget;
    setBusyId(target.id);

    try {
      await useCase.uploadPoster(target.id, file);
      await onChanged();
      await load();

      setToast({
        message: target.posterUrl
          ? "Affiche remplacée avec succès."
          : "Affiche ajoutée avec succès.",
        tone: "success",
      });
    } catch (reason) {
      setToast({
        message: normalizeBackendError(reason).message,
        tone: "error",
      });
    } finally {
      setBusyId(null);
      setPosterTarget(null);
    }
  };

  const confirmPublication = async () => {
    if (!publicationConfirmation) return;

    const { event, publish } = publicationConfirmation;
    setBusyId(event.id);

    try {
      await useCase.setPublished(event.id, publish);
      setPublicationConfirmation(null);
      await onChanged();
      await load();

      setToast({
        message: publish
          ? "Événement publié avec succès."
          : "Événement dépublié avec succès.",
        tone: publish ? "success" : "info",
      });
    } catch (reason) {
      setToast({
        message: normalizeBackendError(reason).message,
        tone: "error",
      });
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    const event = deleteConfirmation;
    setBusyId(event.id);

    try {
      await onDelete(event.id);
      setItems((current) =>
        current.filter((item) => item.id !== event.id),
      );
      setDeleteConfirmation(null);

      setToast({
        message: "Événement supprimé.",
        tone: "warning",
      });
    } catch (reason) {
      setToast({
        message: normalizeBackendError(reason).message,
        tone: "error",
      });
    } finally {
      setBusyId(null);
    }
  };

  const exportCsv = () => {
    const headers = [
      "Affiche",
      "Événement",
      "Date & heure",
      "Lieu",
      "Ville",
      "Région",
      "Statut",
    ];

    const rows = filteredItems.map((event) => [
      event.posterUrl ?? "",
      event.title,
      formatDateTime(event.startsAt),
      event.venue ?? "",
      event.cityName ?? "",
      event.regionName ?? "",
      statusLabels[event.status] ?? event.status,
    ]);

    const content = [headers, ...rows]
      .map((row) => row.map(csvCell).join(";"))
      .join("\n");

    const blob = new Blob([`\uFEFF${content}`], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "evenements-organisateur.csv";
    anchor.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-3">
      <OrganizerToast toast={toast} onClose={() => setToast(null)} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(input) => {
          const file = input.target.files?.[0];
          if (file) void uploadPoster(file);
        }}
      />

      {!!kpis.length && (
        <section className="grid gap-px border border-[#303238] bg-[#303238] sm:grid-cols-2 xl:grid-cols-3">
          {kpis.map((kpi) => (
            <article
              key={kpi.label}
              className={`min-h-[88px] border-l-2 bg-[#151619] p-3 ${
                kpiBorders[kpi.tone ?? ""] ?? "border-l-[#3a3d43]"
              }`}
            >
              <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-500">
                {kpi.label}
              </span>
              <strong className="mt-2 block text-[20px] font-semibold tracking-[-0.03em] text-zinc-100">
                {kpi.value}
              </strong>
              <span className="mt-1 block text-[8px] text-zinc-600">
                {kpi.detail}
              </span>
            </article>
          ))}
        </section>
      )}

      <section className="border border-[#303238] bg-[#151619]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#303238] bg-[#111214] p-3">
          <div className="relative min-w-[220px] flex-1 md:max-w-[360px]">
            <Search
              size={13}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
            />
            <input
              type="search"
              value={query}
              onChange={(input) => setQuery(input.target.value)}
              placeholder="Rechercher un événement…"
              className="h-8 w-full border border-[#343840] bg-[#0e0f11] pl-9 pr-3 text-[9px] text-white outline-none transition focus:border-[#087cff]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[8px] text-zinc-600">
              {filteredItems.length} événement
              {filteredItems.length > 1 ? "s" : ""}
            </span>

            <button
              type="button"
              onClick={() => void load()}
              disabled={loading || !!busyId}
              className={organizerButtonClass}
            >
              <RefreshCw
                size={12}
                className={loading ? "animate-spin" : ""}
              />
              Actualiser
            </button>

            <button
              type="button"
              onClick={exportCsv}
              disabled={!filteredItems.length || loading}
              className={organizerButtonClass}
            >
              <ArrowDownToLine size={12} />
              Exporter
            </button>

            <button
              type="button"
              onClick={onCreate}
              disabled={mutating || !!busyId}
              className={organizerPrimaryButtonClass}
            >
              <Plus size={12} />
              Créer un événement
            </button>
          </div>
        </header>

        {error && (
          <div className="border-b border-red-500/20 bg-red-500/5 px-3 py-2 text-[10px] text-red-300">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1270px] text-left text-[10px]">
            <thead className="bg-[#0e0f11]">
              <tr className="border-b border-[#292c31] text-[8px] font-bold uppercase tracking-[0.09em] text-zinc-500">
                <th className="w-[86px] px-3 py-3">Affiche</th>
                <th className="min-w-[190px] px-3 py-3">Événement</th>
                <th className="min-w-[170px] px-3 py-3">Date &amp; heure</th>
                <th className="min-w-[150px] px-3 py-3">Lieu</th>
                <th className="min-w-[130px] px-3 py-3">Ville</th>
                <th className="min-w-[130px] px-3 py-3">Région</th>
                <th className="min-w-[105px] px-3 py-3">Statut</th>
                <th className="min-w-[280px] px-3 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#292c31]">
              {loading && (
                <tr>
                  <td
                    colSpan={8}
                    className="h-36 text-center text-[10px] text-zinc-500"
                  >
                    <span className="inline-flex items-center gap-2">
                      <RefreshCw
                        size={14}
                        className="animate-spin text-[#3d92ff]"
                      />
                      Chargement des événements…
                    </span>
                  </td>
                </tr>
              )}

              {!loading &&
                filteredItems.map((event) => {
                  const isPublished = event.status === "published";
                  const canTogglePublication =
                    event.status === "draft" ||
                    event.status === "published";
                  const eventBusy = mutating || busyId === event.id;

                  return (
                    <tr
                      key={event.id}
                      className="transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-3 py-2.5">
                        <Poster
                          event={event}
                          onOpenDetails={setDetailsEvent}
                        />
                      </td>

                      <td className="px-3 py-2.5">
                        <strong className="block text-[11px] font-semibold text-zinc-100">
                          {event.title}
                        </strong>
                        <span className="mt-1 block text-[8px] text-zinc-600">
                          ID · {event.id.slice(0, 8)}
                        </span>
                      </td>

                      <td className="px-3 py-2.5">
                        <span className="font-medium text-zinc-300">
                          {formatDateTime(event.startsAt)}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-zinc-400">
                        {event.venue ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-zinc-400">
                        {event.cityName ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-zinc-400">
                        {event.regionName ?? "—"}
                      </td>

                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex min-h-6 items-center border px-2 text-[8px] font-bold uppercase tracking-[0.07em] ${
                            statusStyles[event.status] ??
                            "border-[#3a3d43] text-zinc-400"
                          }`}
                        >
                          {statusLabels[event.status] ?? event.status}
                        </span>
                      </td>

                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => void onEdit(event.id)}
                            disabled={eventBusy}
                            className="grid h-8 w-8 place-items-center border border-[#343840] text-zinc-500 transition hover:bg-white/[0.04] hover:text-[#3d92ff] disabled:opacity-40"
                            title="Modifier"
                            aria-label={`Modifier ${event.title}`}
                          >
                            <Pencil size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => choosePoster(event)}
                            disabled={eventBusy}
                            className={organizerButtonClass}
                          >
                            <ImagePlus size={12} />
                            {busyId === event.id
                              ? "Envoi…"
                              : event.posterUrl
                                ? "Remplacer l’affiche"
                                : "Ajouter l’affiche"}
                          </button>

                          {canTogglePublication && (
                            <button
                              type="button"
                              onClick={() =>
                                setPublicationConfirmation({
                                  event,
                                  publish: !isPublished,
                                })
                              }
                              disabled={eventBusy}
                              className={
                                isPublished
                                  ? organizerButtonClass
                                  : organizerPrimaryButtonClass
                              }
                            >
                              {isPublished ? (
                                <Undo2 size={12} />
                              ) : (
                                <Send size={12} />
                              )}
                              {isPublished ? "Dépublier" : "Publier"}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmation(event)}
                            disabled={eventBusy}
                            className="grid h-8 w-8 place-items-center border border-[#4b3034] text-zinc-600 transition hover:border-[#ff1638] hover:bg-[#ff1638]/10 hover:text-[#ff4058] disabled:opacity-40"
                            title="Supprimer"
                            aria-label={`Supprimer ${event.title}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {!loading && !filteredItems.length && (
                <tr>
                  <td
                    colSpan={8}
                    className="h-36 text-center text-[10px] text-zinc-600"
                  >
                    {query.trim()
                      ? "Aucun événement ne correspond à cette recherche."
                      : "Aucun événement disponible."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <OrganizerEventDetailsModal
        open={!!detailsEvent}
        event={detailsEvent}
        onClose={() => setDetailsEvent(null)}
        onEdit={(eventId) => onEdit(eventId)}
        onPoster={(selectedEvent) => choosePoster(selectedEvent)}
        onTogglePublished={(selectedEvent) =>
          setPublicationConfirmation({
            event: selectedEvent,
            publish: selectedEvent.status !== "published",
          })
        }
      />

      <OrganizerDialog
        open={!!publicationConfirmation}
        eyebrow="Publication"
        title={
          publicationConfirmation?.publish
            ? "Publier cet événement ?"
            : "Dépublier cet événement ?"
        }
        description={publicationConfirmation?.event.title}
        onClose={() => {
          if (!busyId) setPublicationConfirmation(null);
        }}
        footer={
          <>
            <button
              type="button"
              onClick={() => setPublicationConfirmation(null)}
              disabled={!!busyId}
              className={organizerButtonClass}
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={() => void confirmPublication()}
              disabled={!!busyId}
              className={
                publicationConfirmation?.publish
                  ? organizerPrimaryButtonClass
                  : organizerButtonClass
              }
            >
              {publicationConfirmation?.publish ? (
                <Send size={12} />
              ) : (
                <Undo2 size={12} />
              )}
              {busyId
                ? "Traitement…"
                : publicationConfirmation?.publish
                  ? "Publier l’événement"
                  : "Dépublier l’événement"}
            </button>
          </>
        }
      >
        <p className="text-[10px] leading-5 text-zinc-400">
          {publicationConfirmation?.publish
            ? "L’événement deviendra visible comme événement publié. La date de publication sera enregistrée automatiquement."
            : "L’événement repassera en brouillon et sa date de publication sera supprimée."}
        </p>
      </OrganizerDialog>

      <OrganizerDialog
        open={!!deleteConfirmation}
        eyebrow="Confirmation"
        title="Supprimer définitivement cet événement ?"
        description={deleteConfirmation?.title}
        onClose={() => {
          if (!busyId) setDeleteConfirmation(null);
        }}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteConfirmation(null)}
              disabled={!!busyId}
              className={organizerButtonClass}
            >
              Conserver
            </button>

            <button
              type="button"
              onClick={() => void confirmDelete()}
              disabled={!!busyId}
              className={organizerPrimaryButtonClass}
            >
              <Trash2 size={12} />
              {busyId ? "Suppression…" : "Supprimer"}
            </button>
          </>
        }
      >
        <div className="border-l-2 border-[#ff1638] bg-[#111214] p-3 text-[10px] leading-5 text-zinc-400">
          Cette action supprimera l&apos;événement si les règles Supabase et ses
          relations le permettent. Les ressources métier rattachées peuvent
          empêcher sa suppression.
        </div>
      </OrganizerDialog>
    </div>
  );
}
