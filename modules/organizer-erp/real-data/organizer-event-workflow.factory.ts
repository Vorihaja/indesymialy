import { createSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { OrganizerEventWorkflowRepository } from './organizer-event-workflow.repository';
import { OrganizerEventWorkflowService } from './organizer-event-workflow.service';
import { SaveOrganizerEventWorkflowUseCase } from './save-organizer-event-workflow.use-case';

let instance: SaveOrganizerEventWorkflowUseCase | null = null;
export function createOrganizerEventWorkflowUseCase() {
  if (!instance) instance = new SaveOrganizerEventWorkflowUseCase(new OrganizerEventWorkflowService(new OrganizerEventWorkflowRepository(createSupabaseBrowserClient())));
  return instance;
}
