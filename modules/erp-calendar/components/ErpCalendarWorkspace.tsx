"use client";

import {
  useMemo,
  useRef,
  useState,
} from "react";

import FullCalendar, {
  type CalendarRef,
} from "@fullcalendar/react";
import classicThemePlugin from "@fullcalendar/react/themes/classic";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import listPlugin from "@fullcalendar/react/list";
import interactionPlugin from "@fullcalendar/react/interaction";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";
import "@fullcalendar/react/themes/classic/palette.css";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  MapPin,
  Pencil,
  Plus,
  Search,
  Settings2,
  Trash2,
  X,
} from "lucide-react";

import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";

import { useErpCalendar } from "../hooks/useErpCalendar";

import {
  ERP_CALENDAR_EVENT_TYPES,
} from "../types";

import type {
  ErpCalendarEventType,
  ErpCalendarItem,
  ErpCalendarRole,
  ErpCalendarStatus,
} from "../types";

import styles from "./ErpCalendarWorkspace.module.css";

type CalendarView =
  | "dayGridMonth"
  | "timeGridWeek"
  | "timeGridDay"
  | "listWeek";

type FormState = {
  title: string;
  description: string;
  startsLocal: string;
  endsLocal: string;
  allDay: boolean;
  type: ErpCalendarEventType;
  status: ErpCalendarStatus;
  location: string;
};

const typeLabels: Record<
  ErpCalendarEventType,
  string
> = {
  sport: "Sport",
  meeting: "Réunion",
  deadline: "Échéance",
  travel: "Déplacement",
  medical: "Médical",
  commercial: "Business",
  personal: "Personnel",
};

const typeColors: Record<
  ErpCalendarEventType,
  string
> = {
  sport: "#ef233c",
  meeting: "#3b82f6",
  deadline: "#f59e0b",
  travel: "#8792a2",
  medical: "#22c55e",
  commercial: "#287bd8",
  personal: "#a855f7",
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function localInput(date: Date): string {
  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
  ].join("");
}

function initialForm(dateSeed?: string): FormState {
  const start = dateSeed
    ? new Date(`${dateSeed}T09:00:00`)
    : new Date();

  start.setSeconds(0, 0);

  const end = new Date(
    start.getTime() + 60 * 60 * 1000,
  );

  return {
    title: "",
    description: "",
    startsLocal: localInput(start),
    endsLocal: localInput(end),
    allDay: false,
    type: "meeting",
    status: "confirmed",
    location: "",
  };
}

function formForItem(
  item: ErpCalendarItem,
): FormState {
  return {
    title: item.title,
    description: item.description ?? "",
    startsLocal: localInput(
      new Date(item.startsAt),
    ),
    endsLocal: localInput(
      new Date(item.endsAt),
    ),
    allDay: item.allDay,
    type: item.type,
    status: item.status,
    location: item.location ?? "",
  };
}

export function ErpCalendarWorkspace({
  role,
}: {
  role: ErpCalendarRole;
}) {
  return (
    <CalendarRuntime role={role} />
  );
}
function CalendarRuntime({
  role,
}: {
  role: ErpCalendarRole;
}) {
  const model = useErpCalendar();

  const manualCreationAllowed =
    role !== "seller" &&
    role !== "vendeur";

  const calendarRef =
    useRef<CalendarRef | null>(null);

  const [view, setView] =
    useState<CalendarView>("dayGridMonth");

  const [periodTitle, setPeriodTitle] =
    useState("");

  const [query, setQuery] =
    useState("");

  const [typeFilter, setTypeFilter] =
    useState<"all" | ErpCalendarEventType>(
      "all",
    );

  const [statusFilter, setStatusFilter] =
    useState<"all" | ErpCalendarStatus>(
      "all",
    );

  const [formOpen, setFormOpen] =
    useState(false);

  const [editing, setEditing] =
    useState<ErpCalendarItem | null>(null);

  const [selected, setSelected] =
    useState<ErpCalendarItem | null>(null);

  const [form, setForm] =
    useState<FormState>(initialForm());

  const filtered = useMemo(() => {
    const search =
      query.trim().toLowerCase();

    return model.items.filter((item) => {
      if (
        typeFilter !== "all" &&
        item.type !== typeFilter
      ) {
        return false;
      }

      if (
        statusFilter !== "all" &&
        item.status !== statusFilter
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        item.title,
        item.description,
        item.location,
        typeLabels[item.type],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }, [
    model.items,
    query,
    typeFilter,
    statusFilter,
  ]);

  const events = useMemo(
    () =>
      filtered.map((item) => ({
        id: item.calendarKey,
        title: item.title,
        start: item.startsAt,
        end: item.endsAt,
        allDay: item.allDay,
        editable: item.editable,
        backgroundColor:
          typeColors[item.type],
        borderColor:
          typeColors[item.type],
        extendedProps: {
          item,
        },
      })),
    [filtered],
  );

  function api() {
    return calendarRef.current?.getApi();
  }

  function changeView(
    nextView: CalendarView,
  ) {
    api()?.changeView(nextView);
    setView(nextView);
  }

  function createForm(
    dateSeed?: string,
  ) {
    setEditing(null);
    setForm(initialForm(dateSeed));
    setFormOpen(true);
  }

  function editItem(
    item: ErpCalendarItem,
  ) {
    setEditing(item);
    setForm(formForItem(item));
    setFormOpen(true);
  }

  async function save() {
    const payload = {
      title: form.title,
      description:
        form.description || null,
      startsAt: new Date(
        form.startsLocal,
      ).toISOString(),
      endsAt: new Date(
        form.endsLocal,
      ).toISOString(),
      allDay: form.allDay,
      type: form.type,
      status: form.status,
      location:
        form.location || null,
      contextRole: String(role),
    };

    if (editing) {
      await model.update({
        ...payload,
        id: editing.sourceId,
      });
    } else {
      await model.create(payload);
    }

    setEditing(null);
    setFormOpen(false);
  }

  return (
    <section className={styles.workspace}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            Agenda universel
          </span>

          <h1>Mon agenda</h1>

          <p>
            Événements personnels et métier liés à votre compte
          </p>
        </div>

                {manualCreationAllowed && (
          <button
          type="button"
          className={styles.primary}
          onClick={() => createForm()}
          >
          <Plus size={14} />
          Ajouter
          </button>
        )}
      </header>

      <div className={styles.googleNotice}>
        <CalendarDays size={17} />

        <div>
          <strong>
            Google Calendar
          </strong>

          <p>
            Configuration requise — aucune
            connexion simulée.
          </p>
        </div>

        <span>
          <Settings2 size={13} />
          U-CAL-2
        </span>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.nav}>
          <button
            type="button"
            onClick={() => api()?.prev()}
          >
            <ChevronLeft size={15} />
          </button>

          <button
            type="button"
            onClick={() => api()?.today()}
          >
            Aujourd’hui
          </button>

          <button
            type="button"
            onClick={() => api()?.next()}
          >
            <ChevronRight size={15} />
          </button>

          <strong>
            {periodTitle}
          </strong>
        </div>

        <div className={styles.views}>
          {[
            ["dayGridMonth", "Mois"],
            ["timeGridWeek", "Semaine"],
            ["timeGridDay", "Jour"],
            ["listWeek", "Planning"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              data-active={view === value}
              onClick={() =>
                changeView(
                  value as CalendarView,
                )
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.filters}>
        <label>
          <Search size={13} />

          <input
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Rechercher"
          />
        </label>

        <label>
          <Filter size={13} />

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(
                event.target.value as
                  | "all"
                  | ErpCalendarEventType,
              )
            }
          >
            <option value="all">
              Tous les types
            </option>

            {ERP_CALENDAR_EVENT_TYPES.map(
              (type) => (
                <option
                  key={type}
                  value={type}
                >
                  {typeLabels[type]}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          <Clock3 size={13} />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | "all"
                  | ErpCalendarStatus,
              )
            }
          >
            <option value="all">
              Tous les statuts
            </option>

            <option value="confirmed">
              Confirmé
            </option>

            <option value="tentative">
              À confirmer
            </option>

            <option value="cancelled">
              Annulé
            </option>
          </select>
        </label>
      </div>

      {model.error && (
        <div className={styles.error}>
          {model.error}
        </div>
      )}

      <div className={styles.calendar}>
        {model.isLoading && (
          <div className={styles.loader}>
            <IndesyDualOrbitLoader />
          </div>
        )}

        <FullCalendar
          ref={calendarRef}
          plugins={[
            classicThemePlugin,
            dayGridPlugin,
            timeGridPlugin,
            listPlugin,
            interactionPlugin,
          ]}
          initialView="dayGridMonth"
          headerToolbar={false}
          firstDay={1}
          nowIndicator
          allDaySlot
          selectable
          editable
          eventStartEditable
          eventDurationEditable
          dayMaxEvents={4}
          height="auto"
          slotMinTime="05:00:00"
          slotMaxTime="24:00:00"
          events={events}
          datesSet={(info) => {
            setPeriodTitle(info.view.title);

            setView(
              info.view.type as CalendarView,
            );

            void model.load(
              info.start.toISOString(),
              info.end.toISOString(),
            );
          }}
          dateClick={(info) => {
            if (!manualCreationAllowed) {
              return;
            }

            createForm(
              info.dateStr.slice(0, 10),
            );
          }}          eventClick={(info) => {
            const item =
              info.event.extendedProps
                .item as ErpCalendarItem;

            setSelected(item);
          }}
          eventDrop={(info) => {
            const item =
              info.event.extendedProps
                .item as ErpCalendarItem;

            const start =
              info.event.start;

            if (!start || !item.editable) {
              info.revert();
              return;
            }

            const end =
              info.event.end ??
              new Date(
                start.getTime() +
                  60 * 60 * 1000,
              );

            void model
              .update({
                id: item.calendarKey,
                title: item.title,
                description:
                  item.description,
                startsAt:
                  start.toISOString(),
                endsAt:
                  end.toISOString(),
                allDay:
                  info.event.allDay,
                type: item.type,
                status: item.status,
                location:
                  item.location,
                contextRole:
                  item.contextRole,
              })
              .catch(() =>
                info.revert(),
              );
          }}
          eventResize={(info) => {
            const item =
              info.event.extendedProps
                .item as ErpCalendarItem;

            if (
              !item.editable ||
              !info.event.start ||
              !info.event.end
            ) {
              info.revert();
              return;
            }

            void model
              .update({
                id: item.calendarKey,
                title: item.title,
                description:
                  item.description,
                startsAt:
                  info.event.start
                    .toISOString(),
                endsAt:
                  info.event.end
                    .toISOString(),
                allDay:
                  info.event.allDay,
                type: item.type,
                status: item.status,
                location:
                  item.location,
                contextRole:
                  item.contextRole,
              })
              .catch(() =>
                info.revert(),
              );
          }}
        />
      </div>

      {selected && (
        <div
          className={styles.overlay}
          onMouseDown={(event) => {
            if (
              event.currentTarget ===
              event.target
            ) {
              setSelected(null);
            }
          }}
        >
          <aside className={styles.panel}>
            <header>
              <div>
                <span className={styles.eyebrow}>
                  Agenda personnel
                </span>

                <h2>
                  {selected.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelected(null)
                }
              >
                <X size={16} />
              </button>
            </header>

            <div className={styles.details}>
              <p>
                <Clock3 size={14} />
                {new Date(
                  selected.startsAt,
                ).toLocaleString("fr-FR")}
              </p>

              {selected.location && (
                <p>
                  <MapPin size={14} />
                  {selected.location}
                </p>
              )}

              <p>
                <CalendarDays size={14} />
                {selected.sourceLabel}
              </p>
              {selected.description && (
                <p>
                  {selected.description}
                </p>
              )}
            </div>

                        {selected.editable && (
              <footer>
              <button
              type="button"
              onClick={() => {
              editItem(selected);
              setSelected(null);
              }}
              >
              <Pencil size={14} />
              Modifier
              </button>

              <button
              type="button"
              disabled={model.isMutating}
              onClick={() => {
              void model
              .archive(selected.sourceId)
              .then(() =>
              setSelected(null),
              );
              }}
              >
              <Trash2 size={14} />
              Archiver
              </button>
              </footer>
            )}
          </aside>
        </div>
      )}

      {formOpen && (
        <div
          className={styles.overlay}
          onMouseDown={(event) => {
            if (
              event.currentTarget ===
              event.target
            ) {
              setFormOpen(false);
            }
          }}
        >
          <aside className={styles.panel}>
            <header>
              <div>
                <span className={styles.eyebrow}>
                  {editing
                    ? "Modification"
                    : "Nouvelle entrée"}
                </span>

                <h2>
                  {editing
                    ? "Modifier"
                    : "Ajouter à mon agenda"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setFormOpen(false)
                }
              >
                <X size={16} />
              </button>
            </header>

            <div className={styles.form}>
              <label>
                Titre
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      title:
                        event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Début
                <input
                  type="datetime-local"
                  value={form.startsLocal}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      startsLocal:
                        event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Fin
                <input
                  type="datetime-local"
                  value={form.endsLocal}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      endsLocal:
                        event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Type
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      type:
                        event.target
                          .value as
                          ErpCalendarEventType,
                    })
                  }
                >
                  {ERP_CALENDAR_EVENT_TYPES.map(
                    (type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {typeLabels[type]}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                Statut
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status:
                        event.target
                          .value as
                          ErpCalendarStatus,
                    })
                  }
                >
                  <option value="confirmed">
                    Confirmé
                  </option>

                  <option value="tentative">
                    À confirmer
                  </option>

                  <option value="cancelled">
                    Annulé
                  </option>
                </select>
              </label>

              <label>
                Lieu
                <input
                  value={form.location}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      location:
                        event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Description
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description:
                        event.target.value,
                    })
                  }
                />
              </label>

              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={form.allDay}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      allDay:
                        event.target.checked,
                    })
                  }
                />

                Journée entière
              </label>
            </div>

            <footer>
              <button
                type="button"
                onClick={() =>
                  setFormOpen(false)
                }
              >
                Annuler
              </button>

              <button
                type="button"
                className={styles.primary}
                disabled={model.isMutating}
                onClick={() =>
                  void save()
                }
              >
                {model.isMutating
                  ? "Enregistrement..."
                  : "Enregistrer"}
              </button>
            </footer>
          </aside>
        </div>
      )}
    </section>
  );
}
