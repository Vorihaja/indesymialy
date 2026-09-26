export type EventInvitationOpenStatus =
  | "pending"
  | "sent";

export type EventInvitation = {
  id: string;
  eventId: string;
  eventTitle: string;
  invitationType: string;
  role: string;
  status: EventInvitationOpenStatus;
  sentAt: string;
  eventStartsAt: string | null;
  eventVenue: string | null;
};