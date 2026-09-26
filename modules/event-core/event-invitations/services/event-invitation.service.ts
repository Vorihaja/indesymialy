import type {
  EventInvitationRepository,
} from "../repositories/event-invitation.repository";

export class EventInvitationService {
  constructor(
    private readonly repository: EventInvitationRepository,
  ) {}

  listActionable() {
    return this.repository.listActionable();
  }

  respond(
    invitationId: string,
    accept: boolean,
  ) {
    const normalizedId =
      invitationId.trim();

    if (!normalizedId) {
      throw new Error(
        "L’invitation d’événement est obligatoire.",
      );
    }

    return this.repository.respond(
      normalizedId,
      accept,
    );
  }
}