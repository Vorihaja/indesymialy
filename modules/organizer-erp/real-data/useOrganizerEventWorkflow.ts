'use client';
import { useMemo, useState } from 'react';
import type { EventWizardDraft } from '../components/EventCreationWizard';
import type { CoorganizerCandidate } from './organizer-event-workflow.repository';
import { createOrganizerEventWorkflowUseCase } from './organizer-event-workflow.factory';

export function useOrganizerEventWorkflow(onSaved: () => Promise<unknown>) {
  const useCase = useMemo(() => createOrganizerEventWorkflowUseCase(), []);
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<CoorganizerCandidate[]>([]);
  const loadCandidates = async () => { const items = await useCase.candidates(); setCandidates(items); return items; };
  const load = async (eventId: string) => {
    setLoading(true);
    try { return await useCase.load(eventId); } finally { setLoading(false); }
  };
  const save = async (eventId: string | null, draft: EventWizardDraft, mode: 'Brouillon' | 'Préparation', readiness: number) => {
    setLoading(true);
    try { const id = await useCase.execute(eventId, draft, mode, readiness); await onSaved(); return id; } finally { setLoading(false); }
  };
  return { load, save, loadCandidates, candidates, loading };
}
