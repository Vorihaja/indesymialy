export type StaffAssignmentRequest = {
  id: string;
  eventId: string;
  eventTitle: string;
  staffName: string;
  role: string;
  status: "invited";
  assignedAt: string;
  startsAt: string | null;
  endsAt: string | null;
  zone: string | null;
  eventStartsAt: string | null;
  eventVenue: string | null;
};