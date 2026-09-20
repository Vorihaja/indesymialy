"use client";

import { useMemo, useState } from "react";
import { CalendarClock, MapPin, RefreshCw } from "lucide-react";

import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";
import { Alert, Button, EmptyState, MetricCard, SectionHeader } from "@/components/ui";

import { useOfficialAvailability } from "../hooks/useOfficialAvailability";
import type {
  OfficialAvailabilityItem,
  OfficialAvailabilityResponseStatus,
  OfficialAvailabilityStatus,
} from "../types";

const STATUS_LABELS: Record<OfficialAvailabilityStatus, string> = {
  pending: "À confirmer",
  available: "Disponible",
  unavailable: "Indisponible",
  tentative: "Provisoire",
};

const STATUS_CLASSES: Record<OfficialAvailabilityStatus, string> = {
  pending: "border-zinc-600 bg-zinc-800 text-zinc-200",
  available: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  unavailable: "border-red-500/40 bg-red-500/10 text-red-300",
  tentative: "border-amber-500/40 bg-amber-500/10 text-amber-200",
};

const RESPONSE_STATUSES: OfficialAvailabilityResponseStatus[] = [
  "available",
  "unavailable",
  "tentative",
];

function dateTimeLabel(value: string | null) {
  if (!value) {
    return "Non renseigné";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function inputDateTime(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function isoDateTime(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function AvailabilityEditor({
  item,
  saving,
  onSave,
}: {
  item: OfficialAvailabilityItem;
  saving: boolean;
  onSave: (input: {
    status: OfficialAvailabilityResponseStatus;
    availableFrom: string | null;
    availableUntil: string | null;
    notes: string | null;
  }) => Promise<void>;
}) {
  const [status, setStatus] = useState(item.status);
  const [availableFrom, setAvailableFrom] = useState(inputDateTime(item.availableFrom));
  const [availableUntil, setAvailableUntil] = useState(inputDateTime(item.availableUntil));
  const [notes, setNotes] = useState(item.notes ?? "");

  return (
    <div className="grid gap-3 border-t border-zinc-800 pt-4 lg:grid-cols-[minmax(150px,0.7fr)_minmax(190px,1fr)_minmax(190px,1fr)_minmax(220px,1.4fr)_auto] lg:items-end">
      <label className="grid gap-1 text-xs text-zinc-400">
        Statut
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as OfficialAvailabilityStatus)}
          className="h-10 border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-blue-500"
        >
          {status === "pending" && (
            <option value="pending" disabled>{STATUS_LABELS.pending}</option>
          )}
          {RESPONSE_STATUSES.map((value) => (
            <option key={value} value={value}>{STATUS_LABELS[value]}</option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-xs text-zinc-400">
        Disponible à partir de
        <input
          type="datetime-local"
          value={availableFrom}
          onChange={(event) => setAvailableFrom(event.target.value)}
          className="h-10 border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-blue-500"
        />
      </label>

      <label className="grid gap-1 text-xs text-zinc-400">
        Disponible jusqu’à
        <input
          type="datetime-local"
          value={availableUntil}
          onChange={(event) => setAvailableUntil(event.target.value)}
          className="h-10 border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-blue-500"
        />
      </label>

      <label className="grid gap-1 text-xs text-zinc-400">
        Note
        <input
          type="text"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Précision utile à l’organisateur"
          className="h-10 border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-blue-500"
        />
      </label>

      <Button
        size="sm"
        loading={saving}
        disabled={status === "pending"}
        onClick={() => {
          if (status === "pending") {
            return;
          }

          void onSave({
            status,
            availableFrom: isoDateTime(availableFrom),
            availableUntil: isoDateTime(availableUntil),
            notes,
          });
        }}
      >
        Enregistrer
      </Button>
    </div>
  );
}

export function OfficialAvailabilityWorkspace() {
  const model = useOfficialAvailability();
  const counts = useMemo(() => ({
    total: model.items.length,
    available: model.items.filter((item) => item.status === "available").length,
    unavailable: model.items.filter((item) => item.status === "unavailable").length,
    pending: model.items.filter((item) => item.status === "pending").length,
    tentative: model.items.filter((item) => item.status === "tentative").length,
  }), [model.items]);

  if (model.loading) {
    return <IndesyDualOrbitLoader label="Chargement des disponibilités" variant="data" />;
  }

  return (
    <div className="mx-auto grid w-full max-w-[1500px] gap-5">
      <SectionHeader
        eyebrow="ERP Officiel · disponibilité événementielle"
        title="Disponibilités"
        description="Répondez aux demandes associées à vos événements. Ces informations sont utilisées par l’organisateur pour les désignations."
        actions={(
          <Button variant="outline" size="sm" onClick={model.refresh} leftIcon={<RefreshCw size={15} />}>
            Actualiser
          </Button>
        )}
      />

      {model.error && (
        <Alert tone="danger" title="Impossible de synchroniser les disponibilités">
          {model.error}
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <MetricCard label="Total" value={counts.total} tone="info" />
        <MetricCard label="Disponibles" value={counts.available} tone="success" />
        <MetricCard label="Indisponibles" value={counts.unavailable} tone="danger" />
        <MetricCard label="À confirmer" value={counts.pending} tone="neutral" />
        <MetricCard label="Provisoires" value={counts.tentative} tone="warning" />
      </div>

      {model.items.length === 0 ? (
        <EmptyState
          icon={<CalendarClock size={34} className="text-blue-400" />}
          title="Aucune demande de disponibilité"
          description="Les disponibilités apparaissent ici lorsqu’un événement ou une demande est associé à votre profil Officiel."
        />
      ) : (
        <div className="grid gap-3">
          {model.items.map((item) => (
            <article key={`${item.id}:${item.updatedAt}`} className="border border-zinc-800 bg-zinc-950/70 p-4 shadow-sm">
              <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-zinc-100">{item.eventTitle}</h2>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                    <span>{dateTimeLabel(item.eventStartsAt)}</span>
                    {item.venue && (
                      <span className="inline-flex items-center gap-1"><MapPin size={13} />{item.venue}</span>
                    )}
                    <span>Mise à jour {dateTimeLabel(item.updatedAt)}</span>
                  </div>
                </div>

                <span className={`inline-flex w-fit border px-2.5 py-1 text-xs font-semibold ${STATUS_CLASSES[item.status]}`}>
                  {STATUS_LABELS[item.status]}
                </span>
              </div>

              <AvailabilityEditor
                item={item}
                saving={model.mutatingId === item.id}
                onSave={(values) => model.update({ id: item.id, ...values })}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
