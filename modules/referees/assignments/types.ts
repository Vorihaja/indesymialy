export type RefereeAssignmentSource = "event" | "fight";

export type RefereeAssignmentResponse =
  | "confirmed"
  | "declined";

export type RefereeAssignmentItem = {
  key: string;
  source: RefereeAssignmentSource;
  sourceId: string;
  eventId: string;
  fightId: string | null;
  eventTitle: string;
  assignmentLabel: string;
  startsAt: string | null;
  endsAt: string | null;
  venue: string | null;
  role: string;
  status: string;
  availability: string | null;
  assignedAt: string | null;
};

export type RefereeAssignmentResponseInput = {
  source: RefereeAssignmentSource;
  sourceId: string;
  status: RefereeAssignmentResponse;
};