import type {
  OrganizationInvitationRepository,
} from "../repositories/organization-invitation.repository";

export class OrganizationInvitationService {
  constructor(
    private readonly repository: OrganizationInvitationRepository,
  ) {}

  listPending() {
    return this.repository.listPending();
  }

  respond(
    invitationId: string,
    accept: boolean,
  ) {
    const normalizedId =
      invitationId.trim();

    if (!normalizedId) {
      throw new Error(
        "L'invitation d'organisation est obligatoire.",
      );
    }

    return this.repository.respond(
      normalizedId,
      accept,
    );
  }
}