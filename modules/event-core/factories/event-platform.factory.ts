import { createSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { OrganizerContextSupabaseRepository } from '@/modules/organizer-operations/repositories/organizer-context-supabase.repository';
import { EventSupabaseRepository } from '../repositories/event-supabase.repository';
import { EventPlatformService } from '../services/event-platform.service';
import { ManageEventPlatformUseCase } from '../use-cases/manage-event-platform.use-case';
import type { EventMode } from '../types';
const instances = new Map<EventMode, ManageEventPlatformUseCase>();
export function createEventPlatformUseCase(mode: EventMode = 'public') { const existing = instances.get(mode); if (existing) return existing; const supabase = createSupabaseBrowserClient(); const context = mode === 'organizer' ? new OrganizerContextSupabaseRepository(supabase) : undefined; const useCase = new ManageEventPlatformUseCase(new EventPlatformService(new EventSupabaseRepository(supabase, context, mode))); instances.set(mode, useCase); return useCase; }
