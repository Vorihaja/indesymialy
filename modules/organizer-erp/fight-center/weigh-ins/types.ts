export type FightWeighInCorner = 'red' | 'blue';

export type FightWeighInComplianceStatus =
  | 'pending'
  | 'compliant'
  | 'underweight'
  | 'overweight'
  | 'waiver'
  | 'disqualified';

export type FightWeighInHistoryItem = {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  measuredWeightKg: number | null;
  reason: string | null;
  createdAt: string;
  changedBy: string | null;
};

export type FightWeighInAttempt = {
  id: string;
  attemptNumber: number;
  minimumWeightKg: number | null;
  maximumWeightKg: number | null;
  measuredWeightKg: number | null;
  scheduledAt: string | null;
  measuredAt: string | null;
  complianceStatus: FightWeighInComplianceStatus;
  notes: string | null;
  validatedAt: string | null;
  validatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  history: FightWeighInHistoryItem[];
};

export type FightWeighInFighter = {
  fighterId: string | null;
  fullName: string;
  nickname: string | null;
  corner: FightWeighInCorner;
  currentWeightKg: number | null;
  latestAttempt: FightWeighInAttempt | null;
  attempts: FightWeighInAttempt[];
};

export type FightWeighInBoundsSource =
  | 'ruleset'
  | 'event_defined'
  | 'open_weight'
  | 'none'
  | 'unconfigured';

export type FightWeighInItem = {
  fightId: string;
  eventId: string;
  fightOrder: number;
  status: string;
  disciplineId: string;
  disciplineName: string;
  weightCategoryId: string | null;
  weightCategory: string;
  boundsSource: FightWeighInBoundsSource;
  minimumWeightKg: number | null;
  maximumWeightKg: number | null;
  minInclusive: boolean;
  maxInclusive: boolean;
  weighInRequired: boolean;
  canMeasure: boolean;
  fighterRed: FightWeighInFighter;
  fighterBlue: FightWeighInFighter;
};

export type FightWeighInSnapshot = {
  eventId: string;
  fights: FightWeighInItem[];
  totalFighters: number;
  compliant: number;
  nonCompliant: number;
  waived: number;
  pending: number;
};

export type FightWeighInAttemptDraft = {
  fightId: string;
  fighterId: string;
  corner: FightWeighInCorner;
  measuredWeightKg: number;
  minimumWeightKg: number | null;
  maximumWeightKg: number | null;
  notes: string;
};

export type FightWeighInWaiverDraft = {
  weighInId: string;
  reason: string;
};
