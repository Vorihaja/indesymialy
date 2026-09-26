import type {
  OrganizationInvitation,
} from "../types";

export interface OrganizationInvitationRepository {
  listPending(): Promise<OrganizationInvitation[]>;

  respond(
    invitationId: string,
    accept: boolean,
  ): Promise<void>;
}