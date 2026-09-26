import type {
  EventInvitation,
} from "../types";

export interface EventInvitationRepository {
  listActionable(): Promise<EventInvitation[]>;

  respond(
    invitationId: string,
    accept: boolean,
  ): Promise<void>;
}