export type FightOfficialRole =
  | 'referee'
  | 'judge'
  | 'timekeeper'
  | 'doctor'
  | 'supervisor';

export type FightOfficialStatus =
  | 'assigned'
  | 'confirmed'
  | 'declined'
  | 'cancelled'
  | 'completed';

export type OfficialAvailabilityStatus =
  | 'pending'
  | 'available'
  | 'unavailable'
  | 'tentative'
  | null;

export type FightOfficialCandidate = {
  eventAssignmentId: string;
  profileId: string;
  name: string;
  rosterRole: string;
  canonicalRole: FightOfficialRole;
  rosterStatus: string;
  availabilityStatus: OfficialAvailabilityStatus;
  availableFrom: string | null;
  availableUntil: string | null;
};

export type UnlinkedOfficialMention = {
  eventAssignmentId: string;
  mention: string;
  rosterRole: string;
  rosterStatus: string;
};

export type FightOfficialAssignment = {
  id: string;
  fightId: string;
  userId: string;
  name: string;
  role: FightOfficialRole;
  position: number | null;
  status: FightOfficialStatus;
  assignedAt: string | null;
  availabilityStatus: OfficialAvailabilityStatus;
};

export type FightOfficialFighter = {
  id: string | null;
  name: string;
};

export type FightOfficialsFight = {
  fightId: string;
  fightOrder: number;
  fightStatus: string;
  disciplineId: string;
  disciplineName: string;
  weightCategory: string;
  red: FightOfficialFighter;
  blue: FightOfficialFighter;
  assignments: FightOfficialAssignment[];
};

export type FightOfficialsSnapshot = {
  eventId: string;
  eventName: string;
  fights: FightOfficialsFight[];
  candidates: FightOfficialCandidate[];
  unlinkedMentions: UnlinkedOfficialMention[];
};

export type AssignFightOfficialDraft = {
  fightId: string;
  userId: string;
  role: FightOfficialRole;
  position?: number | null;
};

export type UpdateFightOfficialStatusDraft = {
  assignmentId: string;
  status: FightOfficialStatus;
};
