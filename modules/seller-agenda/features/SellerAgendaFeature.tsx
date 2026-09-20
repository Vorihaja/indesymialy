"use client";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  CalendarClock,
  CalendarDays,
  Check,
  CirclePlay,
  Clock3,
  Edit3,
  MapPin,
  Plus,
  Search,
  X,
  Archive,
} from "lucide-react";

import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";

import {
  useSellerAgenda,
} from "../hooks/useSellerAgenda";

import type {
  AgendaItemKind,
  AgendaItemPriority,
  AgendaItemSource,
  AgendaManualStatus,
  SellerAgendaItem,
} from "../types";

type ViewMode =
  | "upcoming"
  | "week"
  | "month"
  | "all";

const SOURCE_LABELS:
  Record<
    AgendaItemSource,
    string
  > = {
    manual:
      "Agenda",

    promotion:
      "Promotion",

    bundle:
      "Bundle",

    partnership:
      "Partenariat",

    personnel_assignment:
      "Affectation",

    personnel_leave:
      "Congé",

    personnel_document:
      "Document",
  };

const KIND_LABELS:
  Record<
    AgendaItemKind,
    string
  > = {
    task:
      "Tâche",

    appointment:
      "Rendez-vous",

    operation:
      "Opération",

    note:
      "Note",
  };

function pad(
  value: number,
) {
  return String(
    value,
  ).padStart(
    2,
    "0",
  );
}

function toLocalInput(
  iso:
    string | null,
): string {
  if (!iso) {
    return "";
  }

  const date =
    new Date(iso);

  if (
    !Number.isFinite(
      date.getTime(),
    )
  ) {
    return "";
  }

  return (
    date.getFullYear() +
    "-" +
    pad(
      date.getMonth() +
        1,
    ) +
    "-" +
    pad(
      date.getDate(),
    ) +
    "T" +
    pad(
      date.getHours(),
    ) +
    ":" +
    pad(
      date.getMinutes(),
    )
  );
}

function defaultStart() {
  const date =
    new Date();

  date.setMinutes(
    Math.ceil(
      date.getMinutes() /
        15,
    ) *
      15,
    0,
    0,
  );

  return toLocalInput(
    date.toISOString(),
  );
}

function toIso(
  value: string,
): string {
  return new Date(
    value,
  ).toISOString();
}

function formatDate(
  item: SellerAgendaItem,
): string {
  const start =
    new Date(
      item.startsAt,
    );

  if (item.allDay) {
    return start.toLocaleDateString(
      "fr-FR",
      {
        weekday:
          "short",

        day:
          "2-digit",

        month:
          "short",

        year:
          "numeric",
      },
    );
  }

  return start.toLocaleString(
    "fr-FR",
    {
      weekday:
        "short",

      day:
        "2-digit",

      month:
        "short",

      hour:
        "2-digit",

      minute:
        "2-digit",
    },
  );
}

function statusLabel(
  status: string,
): string {
  switch (status) {
    case "planned":
      return "Planifié";

    case "in_progress":
      return "En cours";

    case "done":
      return "Terminé";

    case "cancelled":
    case "canceled":
      return "Annulé";

    case "active":
      return "Actif";

    case "paused":
      return "En pause";

    case "draft":
      return "Brouillon";

    case "approved":
      return "Approuvé";

    case "pending":
      return "En attente";

    default:
      return status || "—";
  }
}

function statusClass(
  status: string,
): string {
  if (
    status === "done" ||
    status === "active" ||
    status === "approved"
  ) {
    return "border-emerald-500/30 bg-emerald-500/5 text-emerald-400";
  }

  if (
    status === "cancelled" ||
    status === "canceled"
  ) {
    return "border-red-500/30 bg-red-500/5 text-red-400";
  }

  if (
    status === "in_progress" ||
    status === "pending"
  ) {
    return "border-[#3d92ff]/30 bg-[#3d92ff]/5 text-[#6aaeff]";
  }

  return "border-zinc-700 bg-zinc-900/50 text-zinc-500";
}

function withinDays(
  iso: string,
  days: number,
): boolean {
  const time =
    new Date(
      iso,
    ).getTime();

  const now =
    Date.now();

  const end =
    now +
    days *
      24 *
      60 *
      60 *
      1000;

  return (
    time >= now &&
    time <= end
  );
}

function dateGroup(
  iso: string,
): string {
  return new Date(
    iso,
  ).toLocaleDateString(
    "fr-FR",
    {
      weekday:
        "long",

      day:
        "2-digit",

      month:
        "long",

      year:
        "numeric",
    },
  );
}

function manualKind(
  value: string,
): AgendaItemKind {
  return (
    value === "task" ||
    value === "appointment" ||
    value === "operation" ||
    value === "note"
  )
    ? value
    : "task";
}

function manualPriority(
  value: string,
): AgendaItemPriority {
  return (
    value === "low" ||
    value === "normal" ||
    value === "high" ||
    value === "urgent"
  )
    ? value
    : "normal";
}

function manualStatus(
  value: string,
): AgendaManualStatus {
  return (
    value === "planned" ||
    value === "in_progress" ||
    value === "done" ||
    value === "cancelled" ||
    value === "archived"
  )
    ? value
    : "planned";
}

export function SellerAgendaFeature() {
  const agenda =
    useSellerAgenda();

  const [
    mode,
    setMode,
  ] =
    useState<ViewMode>(
      "upcoming",
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    editorOpen,
    setEditorOpen,
  ] =
    useState(false);

  const [
    editing,
    setEditing,
  ] =
    useState<SellerAgendaItem | null>(
      null,
    );

  const [
    title,
    setTitle,
  ] =
    useState("");

  const [
    description,
    setDescription,
  ] =
    useState("");

  const [
    kind,
    setKind,
  ] =
    useState<AgendaItemKind>(
      "task",
    );

  const [
    startsAt,
    setStartsAt,
  ] =
    useState(
      defaultStart(),
    );

  const [
    endsAt,
    setEndsAt,
  ] =
    useState("");

  const [
    allDay,
    setAllDay,
  ] =
    useState(false);

  const [
    priority,
    setPriority,
  ] =
    useState<AgendaItemPriority>(
      "normal",
    );

  const [
    location,
    setLocation,
  ] =
    useState("");

  const [
    status,
    setStatus,
  ] =
    useState<AgendaManualStatus>(
      "planned",
    );

  const [
    formError,
    setFormError,
  ] =
    useState<string | null>(
      null,
    );

  const items =
    useMemo(
      () => {
        const needle =
          search
            .trim()
            .toLocaleLowerCase(
              "fr",
            );

        const now =
          Date.now();

        return agenda.items
          .filter(
            (item) => {
              const start =
                new Date(
                  item.startsAt,
                ).getTime();

              const end =
                item.endsAt
                  ? new Date(
                      item.endsAt,
                    ).getTime()
                  : start;

              if (
                mode ===
                  "upcoming" &&
                end < now
              ) {
                return false;
              }

              if (
                mode ===
                  "week" &&
                !withinDays(
                  item.startsAt,
                  7,
                )
              ) {
                return false;
              }

              if (
                mode ===
                  "month" &&
                !withinDays(
                  item.startsAt,
                  30,
                )
              ) {
                return false;
              }

              if (!needle) {
                return true;
              }

              return [
                item.title,
                item.description ?? "",
                item.location ?? "",
                SOURCE_LABELS[
                  item.source
                ],
                item.status,
              ]
                .join(" ")
                .toLocaleLowerCase(
                  "fr",
                )
                .includes(
                  needle,
                );
            },
          )
          .sort(
            (
              a,
              b,
            ) =>
              new Date(
                a.startsAt,
              ).getTime() -
              new Date(
                b.startsAt,
              ).getTime(),
          );
      },
      [
        agenda.items,
        mode,
        search,
      ],
    );

  const grouped =
    useMemo(
      () => {
        const groups =
          new Map<
            string,
            SellerAgendaItem[]
          >();

        for (
          const item of
          items
        ) {
          const key =
            dateGroup(
              item.startsAt,
            );

          const current =
            groups.get(
              key,
            ) ?? [];

          current.push(
            item,
          );

          groups.set(
            key,
            current,
          );
        }

        return Array.from(
          groups.entries(),
        );
      },
      [items],
    );

  const manualCount =
    agenda.items.filter(
      (item) =>
        item.source ===
        "manual",
    ).length;

  const derivedCount =
    agenda.items.length -
    manualCount;

  const nextSevenDays =
    agenda.items.filter(
      (item) =>
        withinDays(
          item.startsAt,
          7,
        ),
    ).length;

  function closeEditor() {
    setEditorOpen(
      false,
    );

    setEditing(
      null,
    );

    setFormError(
      null,
    );
  }

  function openCreate() {
    setEditing(
      null,
    );

    setTitle(
      "",
    );

    setDescription(
      "",
    );

    setKind(
      "task",
    );

    setStartsAt(
      defaultStart(),
    );

    setEndsAt(
      "",
    );

    setAllDay(
      false,
    );

    setPriority(
      "normal",
    );

    setLocation(
      "",
    );

    setStatus(
      "planned",
    );

    setFormError(
      null,
    );

    setEditorOpen(
      true,
    );
  }

  function openEdit(
    item: SellerAgendaItem,
  ) {
    if (
      !item.editable ||
      item.source !==
        "manual"
    ) {
      return;
    }

    setEditing(
      item,
    );

    setTitle(
      item.title,
    );

    setDescription(
      item.description ??
        "",
    );

    setKind(
      manualKind(
        item.kind,
      ),
    );

    setStartsAt(
      toLocalInput(
        item.startsAt,
      ),
    );

    setEndsAt(
      toLocalInput(
        item.endsAt,
      ),
    );

    setAllDay(
      item.allDay,
    );

    setPriority(
      manualPriority(
        item.priority,
      ),
    );

    setLocation(
      item.location ??
        "",
    );

    setStatus(
      manualStatus(
        item.status,
      ),
    );

    setFormError(
      null,
    );

    setEditorOpen(
      true,
    );
  }

  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setFormError(
      null,
    );

    try {
      if (!startsAt) {
        throw new Error(
          "La date de début est obligatoire.",
        );
      }

      await agenda.save({
        id:
          editing?.sourceId ??
          null,

        title,

        description,

        kind,

        startsAt:
          toIso(
            startsAt,
          ),

        endsAt:
          endsAt
            ? toIso(
                endsAt,
              )
            : null,

        allDay,

        priority,

        location,

        status,
      });

      closeEditor();
    }
    catch (cause) {
      setFormError(
        cause instanceof Error
          ? cause.message
          : "Enregistrement impossible.",
      );
    }
  }

  async function changeStatus(
    item: SellerAgendaItem,
    next:
      AgendaManualStatus,
  ) {
    if (
      !item.editable ||
      item.source !==
        "manual"
    ) {
      return;
    }

    await agenda
      .setStatus(
        item.sourceId,
        next,
      )
      .catch(
        () => undefined,
      );
  }

  if (
    agenda.loading &&
    !agenda.snapshot
  ) {
    return (
      <div className="grid min-h-[420px] place-items-center">
        <IndesyDualOrbitLoader
          variant="section"
          label="Chargement de l’Agenda"
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <header className="flex flex-wrap items-start justify-between gap-4 border border-[#303238] bg-[#111214] p-4">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
            Planning transversal
          </p>

          <h1 className="mt-1 text-[17px] font-semibold text-zinc-100">
            Agenda
          </h1>

          <p className="mt-1 max-w-2xl text-[9px] leading-5 text-zinc-600">
            Vos tâches et rendez-vous, complétés automatiquement par les échéances réelles de Promotions et Personnel.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-9 items-center gap-2 border border-[#ed1b2f] bg-[#ed1b2f] px-4 text-[9px] font-semibold text-white hover:bg-[#ff3045]"
        >
          <Plus size={12} />
          Nouvelle entrée
        </button>
      </header>

      <section className="grid grid-cols-2 gap-px border border-[#303238] bg-[#303238] lg:grid-cols-4">
        <article className="bg-[#151619] p-4">
          <CalendarClock
            size={14}
            className="text-[#3d92ff]"
          />

          <span className="mt-2 block text-[8px] uppercase tracking-[0.1em] text-zinc-600">
            Total
          </span>

          <strong className="mt-1 block text-[21px] text-zinc-100">
            {agenda.items.length}
          </strong>
        </article>

        <article className="bg-[#151619] p-4">
          <Check
            size={14}
            className="text-emerald-400"
          />

          <span className="mt-2 block text-[8px] uppercase tracking-[0.1em] text-zinc-600">
            Entrées manuelles
          </span>

          <strong className="mt-1 block text-[21px] text-emerald-400">
            {manualCount}
          </strong>
        </article>

        <article className="bg-[#151619] p-4">
          <CalendarDays
            size={14}
            className="text-amber-400"
          />

          <span className="mt-2 block text-[8px] uppercase tracking-[0.1em] text-zinc-600">
            Échéances liées
          </span>

          <strong className="mt-1 block text-[21px] text-amber-400">
            {derivedCount}
          </strong>
        </article>

        <article className="bg-[#151619] p-4">
          <Clock3
            size={14}
            className="text-[#ed1b2f]"
          />

          <span className="mt-2 block text-[8px] uppercase tracking-[0.1em] text-zinc-600">
            7 prochains jours
          </span>

          <strong className="mt-1 block text-[21px] text-[#ed1b2f]">
            {nextSevenDays}
          </strong>
        </article>
      </section>

      {agenda.error ? (
        <p
          role="alert"
          className="border border-red-500/30 bg-red-500/5 px-3 py-2 text-[9px] text-red-400"
        >
          {agenda.error}
        </p>
      ) : null}

      {editorOpen ? (
        <section className="border border-[#3d92ff]/30 bg-[#11151a]">
          <header className="flex items-center justify-between border-b border-[#303238] px-4 py-3">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#3d92ff]">
                {editing
                  ? "Modification"
                  : "Création"}
              </p>

              <h2 className="mt-1 text-[12px] font-semibold text-zinc-100">
                {editing
                  ? editing.title
                  : "Nouvelle entrée Agenda"}
              </h2>
            </div>

            <button
              type="button"
              onClick={closeEditor}
              className="grid size-7 place-items-center text-zinc-600 hover:text-white"
            >
              <X size={14} />
            </button>
          </header>

          <form
            onSubmit={submit}
            className="grid gap-4 p-4"
          >
            <div className="grid gap-3 lg:grid-cols-2">
              <label className="grid gap-1.5 lg:col-span-2">
                <span className="text-[8px] font-bold uppercase tracking-[0.08em] text-zinc-600">
                  Titre
                </span>

                <input
                  required
                  value={title}
                  onChange={
                    (event) =>
                      setTitle(
                        event.target.value,
                      )
                  }
                  className="h-9 border border-[#303238] bg-[#0d0f12] px-3 text-[10px] text-zinc-200 outline-none focus:border-[#3d92ff]"
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-[8px] font-bold uppercase tracking-[0.08em] text-zinc-600">
                  Type
                </span>

                <select
                  value={kind}
                  onChange={
                    (event) =>
                      setKind(
                        event.target.value as AgendaItemKind,
                      )
                  }
                  className="h-9 border border-[#303238] bg-[#0d0f12] px-3 text-[10px] text-zinc-300 outline-none"
                >
                  {Object.entries(
                    KIND_LABELS,
                  ).map(
                    ([value, label]) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className="text-[8px] font-bold uppercase tracking-[0.08em] text-zinc-600">
                  Priorité
                </span>

                <select
                  value={priority}
                  onChange={
                    (event) =>
                      setPriority(
                        event.target.value as AgendaItemPriority,
                      )
                  }
                  className="h-9 border border-[#303238] bg-[#0d0f12] px-3 text-[10px] text-zinc-300 outline-none"
                >
                  <option value="low">
                    Faible
                  </option>

                  <option value="normal">
                    Normale
                  </option>

                  <option value="high">
                    Haute
                  </option>

                  <option value="urgent">
                    Urgente
                  </option>
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className="text-[8px] font-bold uppercase tracking-[0.08em] text-zinc-600">
                  Début
                </span>

                <input
                  required
                  type="datetime-local"
                  value={startsAt}
                  onChange={
                    (event) =>
                      setStartsAt(
                        event.target.value,
                      )
                  }
                  className="h-9 border border-[#303238] bg-[#0d0f12] px-3 text-[10px] text-zinc-300 outline-none"
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-[8px] font-bold uppercase tracking-[0.08em] text-zinc-600">
                  Fin
                </span>

                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={
                    (event) =>
                      setEndsAt(
                        event.target.value,
                      )
                  }
                  className="h-9 border border-[#303238] bg-[#0d0f12] px-3 text-[10px] text-zinc-300 outline-none"
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-[8px] font-bold uppercase tracking-[0.08em] text-zinc-600">
                  Lieu
                </span>

                <input
                  value={location}
                  onChange={
                    (event) =>
                      setLocation(
                        event.target.value,
                      )
                  }
                  placeholder="Boutique, entrepôt, adresse..."
                  className="h-9 border border-[#303238] bg-[#0d0f12] px-3 text-[10px] text-zinc-300 outline-none"
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-[8px] font-bold uppercase tracking-[0.08em] text-zinc-600">
                  Statut
                </span>

                <select
                  value={status}
                  onChange={
                    (event) =>
                      setStatus(
                        event.target.value as AgendaManualStatus,
                      )
                  }
                  className="h-9 border border-[#303238] bg-[#0d0f12] px-3 text-[10px] text-zinc-300 outline-none"
                >
                  <option value="planned">
                    Planifié
                  </option>

                  <option value="in_progress">
                    En cours
                  </option>

                  <option value="done">
                    Terminé
                  </option>

                  <option value="cancelled">
                    Annulé
                  </option>
                </select>
              </label>

              <label className="flex items-center gap-2 text-[9px] text-zinc-500">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={
                    (event) =>
                      setAllDay(
                        event.target.checked,
                      )
                  }
                />

                Journée entière
              </label>

              <label className="grid gap-1.5 lg:col-span-2">
                <span className="text-[8px] font-bold uppercase tracking-[0.08em] text-zinc-600">
                  Description
                </span>

                <textarea
                  rows={3}
                  value={description}
                  onChange={
                    (event) =>
                      setDescription(
                        event.target.value,
                      )
                  }
                  className="border border-[#303238] bg-[#0d0f12] p-3 text-[10px] text-zinc-300 outline-none"
                />
              </label>
            </div>

            {formError ? (
              <p className="border border-red-500/30 bg-red-500/5 px-3 py-2 text-[9px] text-red-400">
                {formError}
              </p>
            ) : null}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEditor}
                className="h-8 border border-[#303238] px-3 text-[9px] font-semibold text-zinc-500 hover:text-white"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={agenda.mutating}
                className="h-8 border border-[#ed1b2f] bg-[#ed1b2f] px-4 text-[9px] font-semibold text-white disabled:opacity-40"
              >
                {agenda.mutating
                  ? "Enregistrement…"
                  : editing
                    ? "Enregistrer"
                    : "Créer"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="border border-[#303238] bg-[#111214]">
        <div className="grid gap-2 border-b border-[#303238] p-3 lg:grid-cols-[1fr_auto]">
          <label className="relative">
            <Search
              size={12}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
            />

            <input
              value={search}
              onChange={
                (event) =>
                  setSearch(
                    event.target.value,
                  )
              }
              placeholder="Rechercher dans l’Agenda..."
              className="h-9 w-full border border-[#303238] bg-[#0d0f12] pl-8 pr-3 text-[10px] text-zinc-300 outline-none"
            />
          </label>

          <div className="flex flex-wrap gap-1">
            {(
              [
                [
                  "upcoming",
                  "À venir",
                ],
                [
                  "week",
                  "7 jours",
                ],
                [
                  "month",
                  "30 jours",
                ],
                [
                  "all",
                  "Tous",
                ],
              ] as const
            ).map(
              ([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={
                    () =>
                      setMode(
                        value,
                      )
                  }
                  className={`h-9 border px-3 text-[8px] font-semibold ${
                    mode === value
                      ? "border-[#3d92ff] bg-[#3d92ff]/10 text-[#6aaeff]"
                      : "border-[#303238] text-zinc-600 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ),
            )}
          </div>
        </div>

        {grouped.length ? (
          <div>
            {grouped.map(
              ([group, entries]) => (
                <section
                  key={group}
                  className="border-b border-[#292c31] last:border-b-0"
                >
                  <header className="bg-[#151619] px-4 py-2">
                    <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                      {group}
                    </span>
                  </header>

                  <div className="divide-y divide-[#292c31]">
                    {entries.map(
                      (item) => (
                        <article
                          key={item.id}
                          className="grid gap-3 p-4 hover:bg-[#151619] lg:grid-cols-[120px_1fr_auto]"
                        >
                          <div>
                            <p className="text-[9px] font-semibold text-zinc-400">
                              {formatDate(
                                item,
                              )}
                            </p>

                            <span className="mt-2 inline-flex border border-[#303238] px-2 py-1 text-[7px] font-bold uppercase text-zinc-600">
                              {SOURCE_LABELS[
                                item.source
                              ]}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-[11px] font-semibold text-zinc-200">
                                {item.title}
                              </h3>

                              <span
                                className={`border px-2 py-0.5 text-[7px] font-bold uppercase ${statusClass(
                                  item.status,
                                )}`}
                              >
                                {statusLabel(
                                  item.status,
                                )}
                              </span>

                              {!item.editable ? (
                                <span className="border border-[#3d92ff]/20 px-2 py-0.5 text-[7px] uppercase text-[#3d92ff]">
                                  Synchronisé
                                </span>
                              ) : null}
                            </div>

                            {item.description ? (
                              <p className="mt-1 text-[8px] leading-4 text-zinc-600">
                                {item.description}
                              </p>
                            ) : null}

                            {item.location ? (
                              <p className="mt-2 flex items-center gap-1 text-[8px] text-zinc-600">
                                <MapPin size={9} />
                                {item.location}
                              </p>
                            ) : null}
                          </div>

                          {item.editable ? (
                            <div className="flex flex-wrap items-start justify-end gap-1">
                              <button
                                type="button"
                                title="Modifier"
                                onClick={
                                  () =>
                                    openEdit(
                                      item,
                                    )
                                }
                                className="grid size-7 place-items-center border border-[#303238] text-zinc-600 hover:text-[#3d92ff]"
                              >
                                <Edit3 size={10} />
                              </button>

                              {item.status ===
                              "planned" ? (
                                <button
                                  type="button"
                                  title="Démarrer"
                                  disabled={agenda.mutating}
                                  onClick={
                                    () =>
                                      void changeStatus(
                                        item,
                                        "in_progress",
                                      )
                                  }
                                  className="grid size-7 place-items-center border border-[#3d92ff]/30 text-[#3d92ff]"
                                >
                                  <CirclePlay size={10} />
                                </button>
                              ) : null}

                              {item.status !==
                                "done" &&
                              item.status !==
                                "cancelled" ? (
                                <button
                                  type="button"
                                  title="Terminer"
                                  disabled={agenda.mutating}
                                  onClick={
                                    () =>
                                      void changeStatus(
                                        item,
                                        "done",
                                      )
                                  }
                                  className="grid size-7 place-items-center border border-emerald-500/30 text-emerald-400"
                                >
                                  <Check size={10} />
                                </button>
                              ) : null}

                              {item.status !==
                              "cancelled" ? (
                                <button
                                  type="button"
                                  title="Annuler"
                                  disabled={agenda.mutating}
                                  onClick={
                                    () =>
                                      void changeStatus(
                                        item,
                                        "cancelled",
                                      )
                                  }
                                  className="grid size-7 place-items-center border border-red-500/30 text-red-400"
                                >
                                  <X size={10} />
                                </button>
                              ) : null}

                              <button
                                type="button"
                                title="Archiver"
                                disabled={agenda.mutating}
                                onClick={
                                  () =>
                                    void changeStatus(
                                      item,
                                      "archived",
                                    )
                                }
                                className="grid size-7 place-items-center border border-[#303238] text-zinc-600"
                              >
                                <Archive size={10} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end text-[8px] text-zinc-700">
                              Lecture seule
                            </div>
                          )}
                        </article>
                      ),
                    )}
                  </div>
                </section>
              ),
            )}
          </div>
        ) : (
          <div className="grid min-h-[260px] place-items-center p-6 text-center">
            <div>
              <CalendarDays
                size={25}
                className="mx-auto text-zinc-700"
              />

              <p className="mt-3 text-[10px] font-semibold text-zinc-400">
                Aucun élément pour cette période
              </p>

              <p className="mt-1 text-[8px] text-zinc-700">
                Ajoutez une tâche ou modifiez les filtres.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}