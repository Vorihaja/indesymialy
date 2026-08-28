'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, TriangleAlert } from 'lucide-react';

import {
  useOrganizerDashboard,
  useOrganizerSection,
} from '@/modules/organizer-operations/hooks/useOrganizerOperations';

import { createOrganizerEventWorkflowUseCase } from '../real-data/organizer-event-workflow.factory';
import type { EventWizardDraft } from '../components/EventCreationWizard';
import { OverviewDashboard } from '../components/OverviewDashboard';
import type { OrganizerModuleId } from '../types';

type OrganizerOverviewFeatureProps = {
  onNavigate: (module: OrganizerModuleId, tab?: string) => void;
};

export function OrganizerOverviewFeature({
  onNavigate,
}: OrganizerOverviewFeatureProps) {
  const dashboard = useOrganizerDashboard();
  const fights = useOrganizerSection('fights');

  const eventWorkflow = useMemo(
    () => createOrganizerEventWorkflowUseCase(),
    [],
  );

  const [eventDraft, setEventDraft] =
    useState<EventWizardDraft | null>(null);

  const [eventLoading, setEventLoading] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);

  const activeEventId =
    dashboard.data?.context?.activeEventId ?? null;

  useEffect(() => {
    let active = true;

    setEventDraft(null);
    setEventError(null);

    if (!activeEventId) {
      setEventLoading(false);

      return () => {
        active = false;
      };
    }

    setEventLoading(true);

    void eventWorkflow
      .load(activeEventId)
      .then((draft) => {
        if (!active) return;

        setEventDraft(draft);
        setEventError(null);
      })
      .catch((reason: unknown) => {
        if (!active) return;

        setEventDraft(null);
        setEventError(
          reason instanceof Error
            ? reason.message
            : 'Impossible de charger les détails de l’événement actif.',
        );
      })
      .finally(() => {
        if (active) {
          setEventLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [activeEventId, eventWorkflow]);

  if (dashboard.loading) {
    return (
      <div
        className="grid gap-3"
        aria-label="Chargement des données organisateur"
      >
        <section className="grid grid-cols-2 gap-px overflow-hidden border border-[#303238] bg-[#303238] md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="min-h-[82px] animate-pulse bg-[#151619] p-3"
            >
              <div className="h-2 w-20 bg-[#292c31]" />
              <div className="mt-4 h-5 w-24 bg-[#292c31]" />
              <div className="mt-2 h-2 w-32 bg-[#22252a]" />
            </div>
          ))}
        </section>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,.75fr)]">
          <div className="min-h-[210px] animate-pulse border border-[#303238] bg-[#151619]" />
          <div className="min-h-[210px] animate-pulse border border-[#303238] bg-[#151619]" />
        </div>

        <div className="flex min-h-24 items-center justify-center border border-[#303238] bg-[#111214]">
          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <Loader2
              size={15}
              className="animate-spin text-[#087cff]"
            />
            Chargement des données Supabase…
          </div>
        </div>
      </div>
    );
  }

  if (dashboard.error || !dashboard.data) {
    return (
      <section className="border border-red-500/30 bg-[#151214] p-5">
        <div className="flex items-start gap-3">
          <TriangleAlert
            size={18}
            className="mt-0.5 flex-none text-[#ff4058]"
          />

          <div>
            <strong className="block text-[11px] font-semibold text-white">
              Impossible de charger la Vue d’ensemble
            </strong>

            <p className="mt-1 max-w-2xl text-[9px] leading-5 text-zinc-500">
              {dashboard.error ??
                'Les données de l’organisation ne sont pas disponibles.'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <OverviewDashboard
      snapshot={dashboard.data}
      fightSection={fights.data}
      fightLoading={fights.loading}
      fightError={fights.error}
      eventDraft={eventDraft}
      eventLoading={eventLoading}
      eventError={eventError}
      onNavigate={onNavigate}
    />
  );
}