import type { EventWizardDraft } from '../components/EventCreationWizard';
import { OrganizerEventWorkflowRepository } from './organizer-event-workflow.repository';

export class OrganizerEventWorkflowService {
  constructor(
    private readonly repository: OrganizerEventWorkflowRepository,
  ) {}

  load(eventId: string) {
    return this.repository.load(eventId);
  }

  loadDetails(eventId: string) {
    return this.repository.loadDetails(eventId);
  }

  candidates() {
    return this.repository.candidates();
  }

  searchOfficialCandidates(query: string) {
    return this.repository.searchOfficialCandidates(query);
  }

  invitations() {
    return this.repository.invitations();
  }

  actionableInvitations() {
    return this.repository.actionableInvitations();
  }
  respond(invitationId: string, accept: boolean) {
    return this.repository.respond(invitationId, accept);
  }

  listEvents(eventIds: string[]) {
    return this.repository.listEvents(eventIds);
  }

  setPublished(eventId: string, published: boolean) {
    return this.repository.setPublished(eventId, published);
  }

  uploadPoster(eventId: string, file: File) {
    return this.repository.uploadPoster(eventId, file);
  }

  save(
    eventId: string | null,
    draft: EventWizardDraft,
    mode: 'Brouillon' | 'Préparation',
    readiness: number,
  ) {
    if (!draft.event.name.trim()) {
      throw new Error('Le nom de l’événement est obligatoire.');
    }

    const invalidOfficial = draft.officials.find(
      (official) =>
        Boolean(official.name.trim()) &&
        !official.profileId &&
        !(official.legacyMention && official.assignmentId),
    );

    if (invalidOfficial) {
      throw new Error('Sélectionnez un compte Officiel Indesy dans les suggestions.');
    }

    return this.repository.save(eventId, draft, mode, readiness);
  }
}
