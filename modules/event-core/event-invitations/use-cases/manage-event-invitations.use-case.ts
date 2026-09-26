import {
  EventInvitationService,
} from "../services/event-invitation.service";

export class ManageEventInvitationsUseCase {
  constructor(
    private readonly service: EventInvitationService,
  ) {}

  listActionable() {
    return this.service.listActionable();
  }

  accept(
    invitationId: string,
  ) {
    return this.service.respond(
      invitationId,
      true,
    );
  }

  decline(
    invitationId: string,
  ) {
    return this.service.respond(
      invitationId,
      false,
    );
  }

  respond(
    invitationId: string,
    accept: boolean,
  ) {
    return this.service.respond(
      invitationId,
      accept,
    );
  }
}