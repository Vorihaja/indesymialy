import type { EventWizardDraft } from '../components/EventCreationWizard';
import { OrganizerEventWorkflowService } from './organizer-event-workflow.service';

export class SaveOrganizerEventWorkflowUseCase {
  constructor(
    private readonly service: OrganizerEventWorkflowService,
  ) {}

  load(eventId: string) {
    return this.service.load(eventId);
  }

  loadDetails(eventId: string) {
    return this.service.loadDetails(eventId);
  }

  candidates() {
    return this.service.candidates();
  }

  searchOfficialCandidates(query: string) {
    return this.service.searchOfficialCandidates(query);
  }

  invitations() {
    return this.service.invitations();
  }

  actionableInvitations() {
    return this.service.actionableInvitations();
  }
  respond(invitationId: string, accept: boolean) {
    return this.service.respond(invitationId, accept);
  }

  listEvents(eventIds: string[]) {
    return this.service.listEvents(eventIds);
  }

  setPublished(eventId: string, published: boolean) {
    return this.service.setPublished(eventId, published);
  }

  uploadPoster(eventId: string, file: File) {
    return this.service.uploadPoster(eventId, file);
  }

  execute(
    eventId: string | null,
    draft: EventWizardDraft,
    mode: 'Brouillon' | 'Préparation',
    readiness: number,
  ) {
    return this.service.save(eventId, draft, mode, readiness);
  }
}
