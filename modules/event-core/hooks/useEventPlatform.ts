'use client';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createEventPlatformUseCase } from '../factories/event-platform.factory';
import type { EventMode, EventPlatformSnapshot, EventRecord, EventStatus, RegistrationDecision } from '../types';
export function useEventPlatform(eventId?: string, mode: EventMode = 'public') {
  const pathname = usePathname(); const resolvedMode: EventMode = pathname.startsWith('/dashboard/organisateur') ? 'organizer' : mode;
  const useCase = useMemo(() => createEventPlatformUseCase(resolvedMode), [resolvedMode]); const [snapshot, setSnapshot] = useState<EventPlatformSnapshot | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => { try { setLoading(true); setSnapshot(await useCase.execute()); setError(null); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Erreur inattendue'); } finally { setLoading(false); } }, [useCase]);
  useEffect(() => { queueMicrotask(() => { void refresh(); }); }, [refresh]); const selectedEvent = eventId ? snapshot?.events.find((event) => event.id === eventId) ?? null : snapshot?.events[0] ?? null;
  return { snapshot, selectedEvent, loading, error, refresh, createEvent: async (input: Pick<EventRecord, 'title' | 'discipline' | 'venue' | 'city' | 'startsAt'>) => { const result = await useCase.createEvent(input); await refresh(); return result; }, updateEvent: async (id: string, patch: Partial<EventRecord>) => { await useCase.updateEvent(id, patch); await refresh(); }, deleteEvent: async (id: string) => { await useCase.deleteEvent(id); await refresh(); }, changeStatus: async (id: string, status: EventStatus) => { await useCase.changeStatus(id, status); await refresh(); }, decideRegistration: async (id: string, decision: RegistrationDecision) => { await useCase.decideRegistration(id, decision); await refresh(); }, toggleChecklist: async (id: string) => { await useCase.toggleChecklist(id); await refresh(); }, validateAccess: async (code: string) => { const result = await useCase.validateAccess(code, 'Opérateur courant', 'Entrée principale'); await refresh(); return result; } };
}
