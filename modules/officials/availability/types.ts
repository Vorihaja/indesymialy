export const OFFICIAL_AVAILABILITY_STATUSES = [
  "pending",
  "available",
  "unavailable",
  "tentative",
] as const;

export type OfficialAvailabilityStatus =
  (typeof OFFICIAL_AVAILABILITY_STATUSES)[number];

export type OfficialAvailabilityResponseStatus = Exclude<
  OfficialAvailabilityStatus,
  "pending"
>;

export type OfficialAvailabilityItem = {
  id: string;
  eventId: string;
  eventTitle: string;
  eventStartsAt: string | null;
  eventEndsAt: string | null;
  venue: string | null;
  status: OfficialAvailabilityStatus;
  availableFrom: string | null;
  availableUntil: string | null;
  notes: string | null;
  respondedAt: string | null;
  updatedAt: string;
};

export type UpdateOfficialAvailabilityInput = {
  id: string;
  status: OfficialAvailabilityResponseStatus;
  availableFrom: string | null;
  availableUntil: string | null;
  notes: string | null;
};
