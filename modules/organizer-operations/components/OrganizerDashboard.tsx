"use client";

import Link from "next/link";

import {
  motion,
  useReducedMotion,
} from "framer-motion";

import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  CircleGauge,
  Radio,
  ShieldCheck,
  Swords,
  Zap,
} from "lucide-react";

import {
  Alert,
  Badge,
  Progress,
} from "@/components/ui";

import type {
  OrganizerDashboardSnapshot,
  OrganizerTone,
} from "../types";

import {
  OrganizerKpiGrid,
} from "./OrganizerKpiGrid";

import {
  OrganizerEventSwitcher,
} from "./OrganizerEventSwitcher";

const severityTone = {
  critical: "danger",
  warning: "warning",
  info: "info",
} as const;

const statusTone: Record<
  OrganizerTone,
  "neutral" | "success" | "warning" | "danger" | "info"
> = {
  neutral: "neutral",
  success: "success",
  warning: "warning",
  danger: "danger",
  info: "info",
};

const headlineMetrics = new Set([
  "fights",
  "tickets",
  "revenue",
  "fill",
  "staff",
  "critical",
]);

export function OrganizerDashboard({
  snapshot,
  switchingEvent,
  onSwitchActiveEvent,
}: {
  snapshot: OrganizerDashboardSnapshot;
  switchingEvent: boolean;
  onSwitchActiveEvent: (eventId: string) => void;
}) {
  const reduceMotion = useReducedMotion();

  const visibleMetrics = snapshot.metrics.filter((metric) =>
    headlineMetrics.has(metric.id),
  );

  const reveal = reduceMotion
    ? {}
    : {
        initial: {
          opacity: 0,
          y: 8,
        },
        animate: {
          opacity: 1,
          y: 0,
        },
        transition: {
          duration: 0.28,
        },
      };

  return (
    <motion.div
      className="organizer-control grid gap-3"
      {...reveal}
    >
      {/* EVENT COMMAND BAR */}
      <section
        className="relative overflow-hidden border border-[var(--ds-border)] bg-[var(--ds-card)]"
        aria-label="Événement actif"
      >
        <div
          className="absolute inset-y-0 left-0 w-[3px] bg-[var(--ds-primary)]"
          aria-hidden="true"
        />

        <div className="grid gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <div className="hidden h-11 w-11 flex-none place-items-center border border-[var(--ds-border)] bg-[var(--ds-bg)] text-[var(--ds-primary)] sm:grid">
              <CircleGauge
                size={20}
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[7px] font-black uppercase tracking-[0.17em] text-[var(--ds-primary)]">
                  Event Command Center
                </span>

                {snapshot.activeEvent && (
                  <Badge
                    tone={
                      snapshot.activeEvent.status === "live"
                        ? "danger"
                        : "info"
                    }
                  >
                    {snapshot.activeEvent.status}
                  </Badge>
                )}
              </div>

              <h2 className="mt-1 truncate text-base font-black uppercase tracking-[-0.02em] text-[var(--ds-text)] sm:text-lg">
                {snapshot.activeEvent?.name ?? "Aucun événement actif"}
              </h2>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-[var(--ds-muted)]">
                <span>
                  {snapshot.activeEvent?.venue ??
                    "Créez ou sélectionnez un événement"}
                </span>

                <span>{snapshot.eventCountdown}</span>

                <span>
                  Actualisé {snapshot.generatedAt}
                </span>
              </div>
            </div>
          </div>

          <OrganizerEventSwitcher
            events={snapshot.events}
            activeEventId={snapshot.activeEvent?.id ?? null}
            disabled={switchingEvent}
            onChange={onSwitchActiveEvent}
          />
        </div>

        <div className="grid border-t border-[var(--ds-border)] sm:grid-cols-[150px_1fr]">
          <div className="flex items-center gap-3 border-b border-[var(--ds-border)] px-3 py-2 sm:border-b-0 sm:border-r">
            <strong className="text-2xl font-black tracking-[-0.04em] text-[var(--ds-text)]">
              {snapshot.readiness}%
            </strong>

            <div>
              <span className="block text-[7px] font-black uppercase tracking-[0.13em] text-[var(--ds-muted)]">
                Readiness
              </span>

              <span className="text-[8px] text-[var(--ds-text-2)]">
                Préparation globale
              </span>
            </div>
          </div>

          <div className="p-3">
            <Progress
              value={snapshot.readiness}
              label="Préparation globale de l’événement"
            />
          </div>
        </div>
      </section>

      {/* ACTIONS RAPIDES */}
      <nav
        className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
        aria-label="Actions rapides Organisateur"
      >
        {snapshot.quickActions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            className={`
              group
              flex
              min-w-[150px]
              flex-1
              items-center
              justify-between
              gap-3
              border
              px-3
              py-2.5
              transition
              ${
                action.tone === "primary"
                  ? "border-[var(--ds-primary)] bg-[var(--ds-primary)] text-white"
                  : action.tone === "danger"
                    ? "border-[color-mix(in_srgb,var(--ds-primary)_45%,var(--ds-border))] bg-[color-mix(in_srgb,var(--ds-primary)_8%,transparent)] text-[var(--ds-primary)]"
                    : "border-[var(--ds-border)] bg-[var(--ds-card)] text-[var(--ds-text)] hover:border-[var(--ds-primary)]"
              }
            `}
          >
            <div className="min-w-0">
              <strong className="block truncate text-[9px] font-black uppercase tracking-[0.08em]">
                {action.label}
              </strong>

              <span className="mt-0.5 block truncate text-[7px] opacity-70">
                {action.detail}
              </span>
            </div>

            <ArrowUpRight
              size={14}
              className="flex-none transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        ))}
      </nav>

      {/* KPI */}
      <OrganizerKpiGrid metrics={visibleMetrics} />

      {/* READINESS + ALERTES */}
      <div className="grid gap-3 xl:grid-cols-[1.3fr_.7fr]">
        <section
          className="erp-section-panel !p-0 overflow-hidden"
          aria-labelledby="readiness-heading"
        >
          <div className="flex items-center justify-between gap-4 border-b border-[var(--ds-border)] px-3 py-2.5">
            <div>
              <span className="ds-label">
                READINESS PAR DOMAINE
              </span>

              <h2
                id="readiness-heading"
                className="mt-0.5 text-[12px] font-black uppercase tracking-[0.02em]"
              >
                Préparation opérationnelle
              </h2>
            </div>

            <ShieldCheck
              size={17}
              className="text-[var(--ds-primary)]"
              aria-hidden="true"
            />
          </div>

          <div className="grid md:grid-cols-2">
            {snapshot.readinessDomains.map((domain) => (
              <Link
                href={domain.href}
                key={domain.id}
                className="group border-b border-r border-[var(--ds-border)] p-3 transition hover:bg-[var(--ds-hover)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-[9px] font-black uppercase tracking-[0.08em]">
                    {domain.label}
                  </strong>

                  <Badge
                    tone={
                      domain.connected
                        ? statusTone[domain.tone]
                        : "warning"
                    }
                  >
                    {domain.value === null
                      ? "N/C"
                      : `${domain.value}%`}
                  </Badge>
                </div>

                <p className="mt-1 min-h-8 text-[8px] leading-4 text-[var(--ds-muted)]">
                  {domain.detail}
                </p>

                {domain.value !== null && (
                  <div className="mt-2">
                    <Progress
                      value={domain.value}
                      label={domain.label}
                    />
                  </div>
                )}

                <div className="mt-2 flex items-center justify-end text-[7px] font-black uppercase tracking-[0.1em] text-[var(--ds-muted)] group-hover:text-[var(--ds-primary)]">
                  Ouvrir
                  <ChevronRight size={11} />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <aside
          className="erp-section-panel organizer-alerts !p-0 overflow-hidden"
          aria-labelledby="alerts-heading"
        >
          <div className="flex items-center justify-between gap-4 border-b border-[var(--ds-border)] px-3 py-2.5">
            <div>
              <span className="ds-label">
                PRIORITÉS
              </span>

              <h2
                id="alerts-heading"
                className="mt-0.5 text-[12px] font-black uppercase"
              >
                Alertes opérationnelles
              </h2>
            </div>

            <AlertTriangle
              size={17}
              className="text-[var(--ds-primary)]"
              aria-hidden="true"
            />
          </div>

          <div className="grid gap-2 p-3">
            {!snapshot.alerts.length && (
              <div className="flex min-h-24 items-center justify-center border border-[var(--ds-border)] text-center">
                <div>
                  <ShieldCheck
                    size={18}
                    className="mx-auto text-emerald-500"
                    aria-hidden="true"
                  />

                  <strong className="mt-2 block text-[9px] uppercase">
                    Aucun blocage détecté
                  </strong>
                </div>
              </div>
            )}

            {snapshot.alerts.slice(0, 5).map((item) => (
              <Link
                href={item.href}
                key={item.id}
              >
                <Alert
                  tone={severityTone[item.severity]}
                  title={item.title}
                >
                  {item.detail}
                </Alert>
              </Link>
            ))}

            <Link
              className="organizer-text-link"
              href="/dashboard/organisateur/notifications"
            >
              Toutes les alertes
              <ChevronRight size={14} />
            </Link>
          </div>
        </aside>
      </div>

      {/* ÉTAT OPÉRATIONNEL */}
      <section
        className="erp-section-panel !p-0 overflow-hidden"
        aria-labelledby="operational-heading"
      >
        <div className="flex items-center justify-between border-b border-[var(--ds-border)] px-3 py-2.5">
          <div>
            <span className="ds-label">
              EVENT STATUS
            </span>

            <h2
              id="operational-heading"
              className="mt-0.5 text-[12px] font-black uppercase"
            >
              État opérationnel
            </h2>
          </div>

          <Zap
            size={16}
            className="text-[var(--ds-primary)]"
            aria-hidden="true"
          />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4">
          {snapshot.operationalStatus.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group relative min-w-0 border-b border-r border-[var(--ds-border)] p-3 transition hover:bg-[var(--ds-hover)]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[8px] font-black uppercase tracking-[0.1em] text-[var(--ds-muted)]">
                  {item.label}
                </span>

                {!item.connected && (
                  <Badge tone="warning">
                    N/C
                  </Badge>
                )}
              </div>

              <strong className="mt-3 block truncate text-xl font-black tracking-[-0.04em] text-[var(--ds-text)]">
                {item.value}
              </strong>

              <p className="mt-1 truncate pr-5 text-[8px] text-[var(--ds-muted)]">
                {item.detail}
              </p>

              <ChevronRight
                size={13}
                className="absolute bottom-3 right-3 text-[var(--ds-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--ds-primary)]"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* ÉVÉNEMENTS + ACTIVITÉ */}
      <div className="grid gap-3 xl:grid-cols-[1.2fr_.8fr]">
        <section
          className="erp-section-panel !p-0 overflow-hidden"
          aria-labelledby="events-heading"
        >
          <div className="flex items-center justify-between border-b border-[var(--ds-border)] px-3 py-2.5">
            <div>
              <span className="ds-label">
                PORTEFEUILLE
              </span>

              <h2
                id="events-heading"
                className="mt-0.5 text-[12px] font-black uppercase"
              >
                Événements sous contrôle
              </h2>
            </div>

            <CalendarDays
              size={16}
              aria-hidden="true"
            />
          </div>

          <div>
            {!snapshot.events.length && (
              <p className="organizer-empty-row">
                Aucun événement enregistré pour cette organisation.
              </p>
            )}

            {snapshot.events.slice(0, 6).map((event) => (
              <Link
                href={
                  event.href ??
                  "/dashboard/organisateur/events"
                }
                className="grid items-center gap-3 border-b border-[var(--ds-border)] px-3 py-2.5 transition hover:bg-[var(--ds-hover)] sm:grid-cols-[minmax(0,1fr)_170px_16px]"
                key={event.id}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge
                      tone={
                        snapshot.activeEvent?.id === event.id
                          ? "danger"
                          : "neutral"
                      }
                    >
                      {snapshot.activeEvent?.id === event.id
                        ? "ACTIF"
                        : event.dateLabel}
                    </Badge>

                    <strong className="truncate text-[10px] font-black">
                      {event.name}
                    </strong>
                  </div>

                  <span className="mt-1 block truncate text-[8px] text-[var(--ds-muted)]">
                    {event.venue}
                  </span>
                </div>

                <div>
                  <div className="mb-1 flex justify-between text-[8px] text-[var(--ds-muted)]">
                    <span className="flex items-center gap-1">
                      <Swords size={11} />
                      {event.fights} combats
                    </span>

                    <span>
                      {event.readiness}%
                    </span>
                  </div>

                  <Progress
                    value={event.readiness}
                    label={`Préparation de ${event.name}`}
                  />
                </div>

                <ChevronRight size={14} />
              </Link>
            ))}
          </div>

          <div className="p-3">
            <Link
              className="organizer-text-link"
              href="/dashboard/organisateur/events"
            >
              Tous les événements
              <ChevronRight size={14} />
            </Link>
          </div>
        </section>

        <section
          className="erp-section-panel !p-0 overflow-hidden"
          aria-labelledby="activity-heading"
        >
          <div className="flex items-center justify-between border-b border-[var(--ds-border)] px-3 py-2.5">
            <div>
              <span className="ds-label">
                FLUX OPÉRATIONNEL
              </span>

              <h2
                id="activity-heading"
                className="mt-0.5 text-[12px] font-black uppercase"
              >
                Activité récente
              </h2>
            </div>

            <Radio
              size={16}
              className="text-[var(--ds-primary)]"
              aria-hidden="true"
            />
          </div>

          <ol className="divide-y divide-[var(--ds-border)]">
            {!snapshot.activities.length && (
              <li className="p-4 text-[9px] text-[var(--ds-muted)]">
                Aucune activité récente.
              </li>
            )}

            {snapshot.activities.slice(0, 6).map((activity) => (
              <li
                key={activity.id}
                className="grid grid-cols-[8px_minmax(0,1fr)] gap-3 px-3 py-2.5"
              >
                <span
                  className={`
                    mt-1
                    h-2
                    w-2
                    rounded-full
                    ${
                      activity.status === "success"
                        ? "bg-emerald-500"
                        : activity.status === "danger"
                          ? "bg-[var(--ds-primary)]"
                          : "bg-[var(--ds-secondary)]"
                    }
                  `}
                  aria-hidden="true"
                />

                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="truncate text-[9px]">
                      {activity.label}
                    </strong>

                    <time className="flex-none text-[7px] text-[var(--ds-muted)]">
                      {activity.time}
                    </time>
                  </div>

                  <p className="mt-1 truncate text-[8px] text-[var(--ds-muted)]">
                    {activity.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </motion.div>
  );
}