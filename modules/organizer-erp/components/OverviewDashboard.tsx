'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Swords,
  TicketCheck,
  Users,
  WalletCards,
} from 'lucide-react';

import type {
  OrganizerAlert,
  OrganizerDashboardSnapshot,
  OrganizerMetric,
  OrganizerSectionSnapshot,
} from '@/modules/organizer-operations/types';

import type { OrganizerModuleId } from '../types';

import {
  calculateEventReadiness,
  type EventWizardDraft,
} from './EventCreationWizard';

import {
  OrganizerDialog,
  organizerButtonClass,
  organizerPrimaryButtonClass,
} from './OrganizerFeedback';

type OverviewDashboardProps = {
  snapshot: OrganizerDashboardSnapshot;
  fightSection: OrganizerSectionSnapshot | null;
  fightLoading: boolean;
  fightError: string | null;
  eventDraft: EventWizardDraft | null;
  eventLoading: boolean;
  eventError: string | null;
  onNavigate: (module: OrganizerModuleId, tab?: string) => void;
};

type OverviewKpi = {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone?: OrganizerMetric['tone'];
  connected?: boolean;
};

type OverviewBlock = {
  label: string;
  value: string;
  detail: string;
  progress: number | null;
  module: OrganizerModuleId;
  tab?: string;
};

function Panel({
  label,
  title,
  action,
  children,
  className = '',
}: {
  label: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 border border-[#303238] bg-[#151619] ${className}`}
    >
      <header className="flex min-h-10 items-center justify-between gap-4 border-b border-[#303238] px-3 py-2">
        <div className="min-w-0">
          <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-zinc-500">
            {label}
          </span>

          <h2 className="mt-0.5 truncate text-[10px] font-semibold text-zinc-100">
            {title}
          </h2>
        </div>

        {action}
      </header>

      {children}
    </section>
  );
}

const numberFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

function formatAr(value: number) {
  return `${numberFormatter.format(value)} Ar`;
}

function metricById(
  snapshot: OrganizerDashboardSnapshot,
  id: string,
) {
  return snapshot.metrics.find((metric) => metric.id === id);
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function extractPercent(value?: string) {
  if (!value) return null;

  const match = value.match(/-?\d+(?:[.,]\d+)?/);

  if (!match) return null;

  const parsed = Number(match[0].replace(',', '.'));

  if (!Number.isFinite(parsed)) return null;

  return clampPercent(parsed);
}

function ratioPercent(value?: string) {
  if (!value) return null;

  const match = value.match(/(\d+)\s*\/\s*(\d+)/);

  if (!match) return null;

  const current = Number(match[1]);
  const total = Number(match[2]);

  if (!total) return 0;

  return clampPercent((current / total) * 100);
}

function formatEventDate(value?: string) {
  if (!value) return 'Date non renseignée';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date non renseignée';
  }

  return date.toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function eventCountdown(value?: string) {
  if (!value) return 'Échéance non renseignée';

  const target = new Date(value);

  if (Number.isNaN(target.getTime())) {
    return 'Échéance non renseignée';
  }

  const difference = target.getTime() - Date.now();

  if (difference <= 0) {
    return 'DATE ATTEINTE';
  }

  const totalMinutes = Math.floor(difference / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `J-${days} · ${String(hours).padStart(2, '0')}h ${String(
      minutes,
    ).padStart(2, '0')}m`;
  }

  return `${String(hours).padStart(2, '0')}h ${String(
    minutes,
  ).padStart(2, '0')}m`;
}

function kpiBorderClass(kpi: OverviewKpi) {
  if (kpi.connected === false) {
    return 'border-l-2 border-l-amber-500';
  }

  switch (kpi.tone) {
    case 'danger':
      return 'border-l-2 border-l-[#ff1638]';

    case 'warning':
      return 'border-l-2 border-l-amber-500';

    case 'success':
      return 'border-l-2 border-l-emerald-500';

    case 'info':
      return 'border-l-2 border-l-[#087cff]';

    default:
      return '';
  }
}

function alertDestination(
  alert: OrganizerAlert,
): {
  module: OrganizerModuleId;
  tab?: string;
} {
  const href = alert.href.toLowerCase();

  if (href.includes('checklist')) {
    return {
      module: 'operations',
      tab: 'Checklists',
    };
  }

  if (
    href.includes('official') ||
    href.includes('referee') ||
    href.includes('judge') ||
    href.includes('staff')
  ) {
    return {
      module: 'team',
      tab: 'Officiels',
    };
  }

  if (href.includes('ticket')) {
    return {
      module: 'ticketing',
      tab: 'Vue d’ensemble',
    };
  }

  if (href.includes('sponsor')) {
    return {
      module: 'partners',
      tab: 'Sponsors',
    };
  }

  if (href.includes('fight')) {
    return {
      module: 'fight-center',
      tab: 'Combats',
    };
  }

  return {
    module: 'operations',
    tab: 'Incidents',
  };
}

const blockIcons = [
  TicketCheck,
  Users,
  ShieldCheck,
  WalletCards,
];

export function OverviewDashboard({
  snapshot,
  fightSection,
  fightLoading,
  fightError,
  eventDraft,
  eventLoading,
  eventError,
  onNavigate,
}: OverviewDashboardProps) {
  const [selectedAlert, setSelectedAlert] =
    useState<OrganizerAlert | null>(null);

  const [activityOpen, setActivityOpen] = useState(false);

  const ticketsMetric = metricById(snapshot, 'tickets');
  const fillMetric = metricById(snapshot, 'fill');
  const revenueMetric = metricById(snapshot, 'revenue');
  const officialsMetric = metricById(snapshot, 'officials');
  const staffMetric = metricById(snapshot, 'staff');
  const sponsorsMetric = metricById(snapshot, 'sponsors');

  const priorityEvent = useMemo(() => {
    const activeEventId = snapshot.context?.activeEventId;

    if (activeEventId) {
      const active = snapshot.events.find(
        (event) => event.id === activeEventId,
      );

      if (active) return active;
    }

    return snapshot.events[0] ?? null;
  }, [snapshot.context?.activeEventId, snapshot.events]);

  const eventName =
    eventDraft?.event.name.trim() ||
    priorityEvent?.name ||
    snapshot.eventName ||
    'Aucun événement actif';

  const eventVenue =
    eventDraft?.event.location.trim() ||
    priorityEvent?.venue ||
    'Lieu non renseigné';

  const eventDate = eventDraft?.event.date
    ? formatEventDate(eventDraft.event.date)
    : priorityEvent?.dateLabel &&
        !priorityEvent.dateLabel
          .toLowerCase()
          .includes('non stock')
      ? priorityEvent.dateLabel
      : 'Date non renseignée';

  const readiness = eventDraft
    ? calculateEventReadiness(eventDraft)
    : priorityEvent?.readiness ?? 0;

  const fightCount =
    eventDraft?.fightCards.length ??
    priorityEvent?.fights ??
    0;

  const countdown = eventDraft?.event.date
    ? eventCountdown(eventDraft.event.date)
    : 'Échéance non renseignée';

  const checklistCompleted = snapshot.checklist.reduce(
    (total, item) => total + item.completed,
    0,
  );

  const checklistTotal = snapshot.checklist.reduce(
    (total, item) => total + item.total,
    0,
  );

  const checklistProgress = checklistTotal
    ? clampPercent(
        (checklistCompleted / checklistTotal) * 100,
      )
    : 0;

  const budget = Number(eventDraft?.budget ?? 0);

  const forecastExpenses =
    eventDraft?.expenses.reduce(
      (total, expense) =>
        total + (Number(expense.amount) || 0),
      0,
    ) ?? 0;

  const forecastBalance =
    budget > 0 ? budget - forecastExpenses : null;

  const financeProgress =
    budget > 0
      ? clampPercent((forecastExpenses / budget) * 100)
      : null;

  const kpis: OverviewKpi[] = [
    {
      id: 'events',
      label: 'Événements organisés',
      value: String(snapshot.events.length),
      detail:
        snapshot.events.length > 0
          ? 'Données liées à votre organisation'
          : 'Aucun événement enregistré',
      tone: 'info',
      connected: true,
    },
    {
      id: 'tickets',
      label: 'Billets vendus',
      value: ticketsMetric?.value ?? '—',
      detail:
        ticketsMetric?.detail ??
        'Aucune donnée de billetterie',
      tone: ticketsMetric?.tone,
      connected: ticketsMetric?.connected,
    },
    {
      id: 'fill',
      label: 'Taux de remplissage',
      value: fillMetric?.value ?? '—',
      detail:
        fillMetric?.detail ??
        'Aucune capacité configurée',
      tone: fillMetric?.tone,
      connected: fillMetric?.connected,
    },
    {
      id: 'revenue',
      label: 'Revenus billetterie',
      value: revenueMetric?.value ?? '—',
      detail:
        revenueMetric?.detail ??
        'Aucune vente payée enregistrée',
      tone: revenueMetric?.tone,
      connected: revenueMetric?.connected,
    },
    {
      id: 'officials',
      label: 'Officiels confirmés',
      value: officialsMetric?.value ?? '—',
      detail:
        officialsMetric?.detail ??
        'Aucune affectation enregistrée',
      tone: officialsMetric?.tone,
      connected: officialsMetric?.connected,
    },
    {
      id: 'sponsors',
      label: 'Sponsors actifs',
      value: sponsorsMetric?.value ?? '—',
      detail:
        sponsorsMetric?.detail ??
        'Aucun sponsor rattaché',
      tone: sponsorsMetric?.tone,
      connected: sponsorsMetric?.connected,
    },
  ];

  const blocks: OverviewBlock[] = [
    {
      label: 'Billetterie',
      value: fillMetric?.value ?? '—',
      detail: ticketsMetric
        ? `${ticketsMetric.value} billets vendus`
        : 'Aucune vente enregistrée',
      progress: extractPercent(fillMetric?.value),
      module: 'ticketing',
      tab: 'Vue d’ensemble',
    },
    {
      label: 'Équipe & Officiels',
      value: officialsMetric?.value ?? '—',
      detail: staffMetric
        ? `Staff ${staffMetric.value}`
        : 'Aucune donnée staff',
      progress: ratioPercent(officialsMetric?.value),
      module: 'team',
      tab: 'Officiels',
    },
    {
      label: 'Checklist opérationnelle',
      value: `${checklistCompleted} / ${checklistTotal}`,
      detail:
        checklistTotal > 0
          ? `${Math.max(
              checklistTotal - checklistCompleted,
              0,
            )} tâche(s) encore ouverte(s)`
          : 'Aucune tâche enregistrée',
      progress: checklistProgress,
      module: 'operations',
      tab: 'Checklists',
    },
    {
      label: 'Finances événement',
      value:
        forecastBalance !== null
          ? formatAr(forecastBalance)
          : revenueMetric?.value ?? '—',
      detail:
        forecastBalance !== null
          ? `${formatAr(
              forecastExpenses,
            )} de dépenses prévues sur ${formatAr(budget)}`
          : revenueMetric?.detail ??
            'Aucun budget prévisionnel enregistré',
      progress: financeProgress,
      module: 'finance',
      tab: 'Synthèse',
    },
  ];

  const fightRecords = fightSection?.records ?? [];

  const currentFight =
    fightRecords.find(
      (record) =>
        record.status.toLowerCase() === 'live' ||
        record.status.toLowerCase() === 'en cours',
    ) ??
    fightRecords[0] ??
    null;

  const fightParticipants = currentFight?.title.split(
    /\s+vs\s+/i,
  ) ?? ['Coin rouge', 'Coin bleu'];

  const redFighter =
    fightParticipants[0]?.trim() || 'Coin rouge';

  const blueFighter =
    fightParticipants[1]?.trim() || 'Coin bleu';

  const selectedAlertDestination = selectedAlert
    ? alertDestination(selectedAlert)
    : null;

  return (
    <div className="grid gap-3">
      {/* KPI */}
      <section
        className="grid grid-cols-2 gap-px overflow-hidden border border-[#303238] bg-[#303238] md:grid-cols-3 xl:grid-cols-6"
        aria-label="Indicateurs principaux"
      >
        {kpis.map((kpi) => (
          <article
            key={kpi.id}
            className={`min-h-[82px] bg-[#151619] px-3 py-2 ${kpiBorderClass(
              kpi,
            )}`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-500">
                {kpi.label}
              </span>

              {kpi.connected === false && (
                <span className="flex-none text-[7px] font-bold uppercase tracking-[0.08em] text-amber-400">
                  N/C
                </span>
              )}
            </div>

            <strong className="mt-1.5 block truncate text-[18px] font-semibold tracking-[-0.035em] text-white">
              {kpi.value}
            </strong>

            <span className="mt-0.5 block truncate text-[8px] text-zinc-500">
              {kpi.detail}
            </span>
          </article>
        ))}
      </section>

      {/* Event + alerts */}
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,.75fr)]">
        <Panel
          label="Événement prioritaire"
          title={eventName}
          action={
            priorityEvent ? (
              <span className="border border-[#35404f] bg-[#087cff]/10 px-2 py-1 text-[7px] font-bold uppercase tracking-[0.1em] text-[#3d92ff]">
                Événement sélectionné
              </span>
            ) : undefined
          }
        >
          {priorityEvent ? (
            <div className="grid gap-4 p-4 lg:grid-cols-[1fr_180px]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[9px] text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={12} />
                    {eventVenue}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={12} />
                    {eventDate}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Swords size={12} />
                    {fightCount} combat
                    {fightCount > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-500">
                      Préparation
                    </span>

                    <strong className="font-mono text-[12px] text-white">
                      {readiness} %
                    </strong>
                  </div>

                  <div className="h-1.5 overflow-hidden bg-[#292c31]">
                    <div
                      className="h-full bg-[#ff1638] transition-[width] duration-300"
                      style={{
                        width: `${clampPercent(
                          readiness,
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {eventLoading && (
                  <p className="mt-3 text-[8px] text-zinc-600">
                    Chargement des détails persistés…
                  </p>
                )}

                {eventError && (
                  <p className="mt-3 border-l-2 border-amber-500 pl-2 text-[8px] leading-4 text-amber-300">
                    Certaines données détaillées ne sont pas
                    disponibles : {eventError}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/dashboard/organisateur/events/${priorityEvent.id}/edit`}
                    className={organizerButtonClass}
                  >
                    Gérer l’événement
                  </Link>

                  <button
                    type="button"
                    onClick={() =>
                      onNavigate(
                        'fight-center',
                        'Fight Card',
                      )
                    }
                    className={organizerPrimaryButtonClass}
                  >
                    Fight Center
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col justify-between border-l border-[#303238] pl-4">
                <div>
                  <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-zinc-600">
                    Échéance
                  </span>

                  <strong className="mt-2 block font-mono text-[18px] font-semibold text-white">
                    {countdown}
                  </strong>
                </div>

                <div className="mt-5">
                  <span className="text-[7px] uppercase tracking-[0.1em] text-zinc-600">
                    Source
                  </span>

                  <span className="mt-1 block text-[8px] text-emerald-400">
                    Evénement actif
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[180px] flex-col items-center justify-center px-5 text-center">
              <CalendarDays
                size={25}
                className="text-zinc-700"
              />

              <strong className="mt-3 text-[11px] text-zinc-300">
                Aucun événement enregistré
              </strong>

              <p className="mt-1 max-w-sm text-[9px] leading-5 text-zinc-600">
                Les statistiques apparaîtront ici dès qu’un
                compte organisateur créera son premier
                événement.
              </p>

              <Link
                href="/dashboard/organisateur/events/new"
                className={`${organizerPrimaryButtonClass} mt-4`}
              >
                Créer le premier événement
              </Link>
            </div>
          )}
        </Panel>

        <Panel
          label="Priorités"
          title="Alertes critiques"
          action={
            <AlertTriangle
              size={14}
              className="text-[#ff4058]"
            />
          }
        >
          {snapshot.alerts.length > 0 ? (
            <div className="divide-y divide-[#292c31]">
              {snapshot.alerts.slice(0, 5).map((alert) => (
                <button
                  key={alert.id}
                  type="button"
                  onClick={() => setSelectedAlert(alert)}
                  className="flex min-h-12 w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.025]"
                >
                  <span
                    className={`mt-1 h-2 w-2 flex-none ${
                      alert.severity === 'critical'
                        ? 'bg-[#ff1638]'
                        : alert.severity === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-[#087cff]'
                    }`}
                  />

                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-[9px] font-semibold text-zinc-200">
                      {alert.title}
                    </strong>

                    <span className="mt-0.5 block line-clamp-2 text-[8px] leading-4 text-zinc-600">
                      {alert.detail}
                    </span>
                  </span>

                  <ArrowRight
                    size={12}
                    className="mt-1 flex-none text-zinc-700"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[180px] items-center justify-center p-4 text-center">
              <div>
                <CheckCircle2
                  size={22}
                  className="mx-auto text-emerald-500"
                />

                <strong className="mt-2 block text-[10px] text-zinc-300">
                  Aucun point critique
                </strong>

                <span className="mt-1 block text-[8px] text-zinc-600">
                  Les alertes apparaîtront ici à partir des
                  données opérationnelles réelles.
                </span>
              </div>
            </div>
          )}
        </Panel>
      </div>

      {/* Fight Center */}
      <Panel
        label="Fight Center"
        title={
          currentFight
            ? 'Combat de référence'
            : 'Aucun combat actif'
        }
        action={
          <button
            type="button"
            onClick={() =>
              onNavigate('fight-center', 'Combats')
            }
            className="flex items-center gap-1 text-[8px] font-semibold text-[#3d92ff] hover:text-white"
          >
            Ouvrir
            <ArrowRight size={11} />
          </button>
        }
      >
        {fightLoading ? (
          <div className="grid min-h-[125px] animate-pulse grid-cols-3">
            <div className="bg-[#171719]" />
            <div className="border-x border-[#303238] bg-[#101114]" />
            <div className="bg-[#171719]" />
          </div>
        ) : fightError ? (
          <div className="flex min-h-[125px] items-center justify-center p-4 text-center">
            <p className="max-w-lg text-[9px] leading-5 text-amber-300">
              Les données de combat ne sont pas disponibles :
              {' '}
              {fightError}
            </p>
          </div>
        ) : currentFight ? (
          <div className="grid md:grid-cols-[1fr_220px_1fr]">
            <div className="border-b border-[#303238] p-4 md:border-b-0 md:border-r">
              <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-[#ff4058]">
                Coin rouge
              </span>

              <strong className="mt-3 block text-[16px] font-semibold text-white">
                {redFighter}
              </strong>
            </div>

            <div className="grid place-items-center border-b border-[#303238] bg-[#0d0e10] p-4 text-center md:border-b-0 md:border-r">
              <div>
                <span className="text-[7px] font-bold uppercase tracking-[0.12em] text-zinc-600">
                  Statut
                </span>

                <strong className="mt-1 block text-[11px] font-semibold uppercase text-zinc-200">
                  {currentFight.status}
                </strong>

                <span className="mt-2 block max-w-[190px] text-[8px] leading-4 text-zinc-600">
                  {currentFight.detail}
                </span>
              </div>
            </div>

            <div className="p-4 text-right">
              <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
                Coin bleu
              </span>

              <strong className="mt-3 block text-[16px] font-semibold text-white">
                {blueFighter}
              </strong>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[125px] flex-col items-center justify-center px-4 text-center">
            <Swords
              size={21}
              className="text-zinc-700"
            />

            <strong className="mt-2 text-[10px] text-zinc-300">
              Aucun combat enregistré
            </strong>

            <span className="mt-1 text-[8px] text-zinc-600">
              Les combats ajoutés à l’événement actif
              apparaîtront automatiquement ici.
            </span>
          </div>
        )}
      </Panel>

      {/* Operational blocks */}
      <section className="grid gap-px border border-[#303238] bg-[#303238] md:grid-cols-2 xl:grid-cols-4">
        {blocks.map((block, index) => {
          const Icon = blockIcons[index];

          return (
            <button
              key={block.label}
              type="button"
              onClick={() =>
                onNavigate(block.module, block.tab)
              }
              className="group min-h-[116px] bg-[#151619] p-3 text-left transition-colors hover:bg-[#181a1e]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[7px] font-bold uppercase tracking-[0.11em] text-zinc-600">
                    {block.label}
                  </span>

                  <strong className="mt-2 block text-[16px] font-semibold tracking-[-0.03em] text-white">
                    {block.value}
                  </strong>
                </div>

                <Icon
                  size={15}
                  className="text-zinc-600 transition-colors group-hover:text-[#3d92ff]"
                />
              </div>

              <span className="mt-1 block truncate text-[8px] text-zinc-500">
                {block.detail}
              </span>

              {block.progress !== null && (
                <div className="mt-3 h-1 overflow-hidden bg-[#292c31]">
                  <div
                    className="h-full bg-[#087cff] transition-[width]"
                    style={{
                      width: `${block.progress}%`,
                    }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </section>

      {/* Activity */}
      <Panel
        label="Flux opérationnel"
        title="Activité récente"
        action={
          snapshot.activities.length > 0 ? (
            <button
              type="button"
              onClick={() => setActivityOpen(true)}
              className="flex items-center gap-1 text-[8px] font-semibold text-[#3d92ff] hover:text-white"
            >
              Tout voir
              <ArrowRight size={11} />
            </button>
          ) : undefined
        }
      >
        {snapshot.activities.length > 0 ? (
          <div className="divide-y divide-[#292c31]">
            {snapshot.activities
              .slice(0, 5)
              .map((activity) => (
                <div
                  key={activity.id}
                  className="grid min-h-11 gap-2 px-3 py-2 text-[9px] sm:grid-cols-[145px_90px_1fr] sm:items-center"
                >
                  <span className="font-mono text-[8px] text-zinc-600">
                    {activity.time}
                  </span>

                  <span className="text-[#3d92ff]">
                    {activity.label}
                  </span>

                  <strong className="font-medium text-zinc-300">
                    {activity.detail}
                  </strong>
                </div>
              ))}
          </div>
        ) : (
          <div className="flex min-h-[90px] items-center justify-center text-center">
            <span className="text-[9px] text-zinc-600">
              Aucune activité réelle enregistrée pour le
              moment.
            </span>
          </div>
        )}
      </Panel>

      {/* Alert detail */}
      <OrganizerDialog
        open={Boolean(selectedAlert)}
        eyebrow="Alerte opérationnelle"
        title={selectedAlert?.title ?? 'Alerte'}
        description={selectedAlert?.detail}
        onClose={() => setSelectedAlert(null)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setSelectedAlert(null)}
              className={organizerButtonClass}
            >
              Fermer
            </button>

            {selectedAlertDestination && (
              <button
                type="button"
                onClick={() => {
                  const destination =
                    selectedAlertDestination;

                  setSelectedAlert(null);

                  onNavigate(
                    destination.module,
                    destination.tab,
                  );
                }}
                className={organizerPrimaryButtonClass}
              >
                Ouvrir le module
                <ArrowRight size={13} />
              </button>
            )}
          </>
        }
      >
        <div className="border-l-2 border-[#ff1638] bg-[#111214] p-3">
          <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-600">
            Donnée opérationnelle
          </span>

          <p className="mt-1 text-[10px] leading-5 text-zinc-400">
            {selectedAlert?.detail}
          </p>
        </div>
      </OrganizerDialog>

      {/* Activity detail */}
      <OrganizerDialog
        open={activityOpen}
        eyebrow="Journal opérationnel"
        title="Activité récente"
        description="Éléments chargés depuis les données persistées de l’organisation."
        onClose={() => setActivityOpen(false)}
        footer={
          <button
            type="button"
            onClick={() => setActivityOpen(false)}
            className={organizerButtonClass}
          >
            Fermer
          </button>
        }
      >
        <div className="divide-y divide-[#292c31] border border-[#303238]">
          {snapshot.activities.map((activity) => (
            <div
              key={`${activity.id}-detail`}
              className="grid gap-2 px-3 py-3 sm:grid-cols-[145px_90px_1fr]"
            >
              <span className="font-mono text-[8px] text-zinc-600">
                {activity.time}
              </span>

              <span className="text-[9px] text-[#3d92ff]">
                {activity.label}
              </span>

              <span className="text-[9px] text-zinc-300">
                {activity.detail}
              </span>
            </div>
          ))}

          {!snapshot.activities.length && (
            <div className="p-5 text-center text-[9px] text-zinc-600">
              Aucune activité enregistrée.
            </div>
          )}
        </div>
      </OrganizerDialog>
    </div>
  );
}