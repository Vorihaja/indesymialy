import {
  OrganizationInvitationService,
} from "../services/organization-invitation.service";

export class ManageOrganizationInvitationsUseCase {
  constructor(
    private readonly service: OrganizationInvitationService,
  ) {}

  listPending() {
    return this.service.listPending();
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