export type FightCardSegment =
  | 'prelims'
  | 'main_card'
  | 'co_main_event'
  | 'main_event';

export type FightCardStatus =
  | 'draft'
  | 'proposed'
  | 'confirmed'
  | 'cancelled';

export type FightCardSyncState =
  | 'planning'
  | 'not_synced'
  | 'out_of_sync'
  | 'synced'
  | 'protected';

export type FightCenterFighter = {
  id: string;
  fullName: string;
  nickname: string | null;
  currentWeightKg: number | null;
  weightClass: string | null;
  wins: number;
  losses: number;
  draws: number;
};

export type FightCenterDiscipline = {
  id: string;
  name: string;
  slug: string;
};

export type FightWeightPolicyMode =
  | 'none'
  | 'standard'
  | 'ruleset'
  | 'event_defined'
  | 'open_weight'
  | 'unconfigured';

export type FightWeightPolicy = {
  mode: FightWeightPolicyMode;
  allowCustomCategory: boolean;
  configured: boolean;
  notes: string | null;
};

export type FightWeightCategory = {
  id: string;
  rulesetId: string;
  code: string;
  name: string;
  displayLabel: string;
  gender: string;
  minWeightKg: number | null;
  maxWeightKg: number | null;
  isOpenWeight: boolean;
  sortOrder: number;
  isActive: boolean;
};

export type FightWeightRuleset = {
  id: string;
  code: string;
  name: string;
  governingBody: string | null;
  versionLabel: string | null;
  verificationStatus: string;
  isDefault: boolean;
  isActive: boolean;
  categories: FightWeightCategory[];
};

export type FightCardItem = {
  id: string;
  eventId: string;
  position: number;
  segment: FightCardSegment;
  segmentRaw: string;
  disciplineId: string | null;
  disciplineName: string | null;
  fighterRedId: string | null;
  fighterRedMention: string | null;
  fighterRedName: string | null;
  fighterBlueId: string | null;
  fighterBlueMention: string | null;
  fighterBlueName: string | null;
  status: FightCardStatus;
  statusRaw: string;
  operationalFightId: string | null;
  operationalFightOrder: number | null;
  operationalFightStatus: string | null;
  syncState: FightCardSyncState;
};

export type FightCardSnapshot = {
  eventId: string;
  cards: FightCardItem[];
  fighters: FightCenterFighter[];
  disciplines: FightCenterDiscipline[];
};

export type FightCardDraft = {
  segment: FightCardSegment;
  disciplineId: string;
  fighterRedId: string;
  fighterRedMention: string;
  fighterBlueId: string;
  fighterBlueMention: string;
  status: FightCardStatus;
};

export type FightCardMoveDirection = 'up' | 'down';

export type FightCardSyncResult = {
  confirmed: number;
  created: number;
  updated: number;
  unchanged: number;
  needsConfiguration: number;
};

export type FightReadinessCheckState =
  | 'ready'
  | 'blocked'
  | 'warning';

export type FightReadinessCheck = {
  key: string;
  label: string;
  state: FightReadinessCheckState;
  detail: string;
  blocking: boolean;
};

export type FighterEligibilitySummary = {
  id: string | null;
  fullName: string;
  nickname: string | null;
  weightClass: string | null;
  currentWeightKg: number | null;
  medicalClearanceExpiry: string | null;
  medicalValid: boolean;
  licenseNumber: string | null;
  licenseExpiry: string | null;
  licenseValid: boolean;
  weighInStatus: string | null;
  measuredWeightKg: number | null;
  weighInValid: boolean;
};

export type OperationalFightReadinessState =
  | 'incomplete'
  | 'eligible'
  | 'ready'
  | 'live'
  | 'completed'
  | 'cancelled';

export type OperationalFightItem = {
  id: string;
  eventId: string;
  fightOrder: number;
  disciplineId: string;
  disciplineName: string;
  weightCategoryId: string | null;
  weightCategory: string;
  weightPolicy: FightWeightPolicy;
  weightRulesets: FightWeightRuleset[];
  scheduledRounds: number;
  fightType: string;
  status: string;
  fighterRed: FighterEligibilitySummary;
  fighterBlue: FighterEligibilitySummary;
  refereeConfirmed: number;
  judgesConfirmed: number;
  timekeepersConfirmed: number;
  supervisorsConfirmed: number;
  checks: FightReadinessCheck[];
  readinessPercent: number;
  readinessState: OperationalFightReadinessState;
  blockers: string[];
  canEdit: boolean;
  canMarkReady: boolean;
  canReturnToScheduled: boolean;
  canOpenFightLive: boolean;
};

export type OperationalFightSnapshot = {
  eventId: string;
  eventStartsAt: string | null;
  fights: OperationalFightItem[];
};

export type OperationalFightDraft = {
  weightCategoryId: string | null;
  weightCategory: string;
  scheduledRounds: number;
  fightType: string;
};

export const FIGHT_CARD_SEGMENTS: Array<{
  value: FightCardSegment;
  label: string;
}> = [
  { value: 'main_event', label: 'Main Event' },
  { value: 'co_main_event', label: 'Co-Main Event' },
  { value: 'main_card', label: 'Carte principale' },
  { value: 'prelims', label: 'Préliminaires' },
];

export const FIGHT_CARD_STATUSES: Array<{
  value: FightCardStatus;
  label: string;
}> = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'proposed', label: 'Proposé' },
  { value: 'confirmed', label: 'Confirmé' },
  { value: 'cancelled', label: 'Annulé' },
];

export const FIGHT_TYPE_OPTIONS = [
  { value: 'professional', label: 'Professionnel' },
  { value: 'amateur', label: 'Amateur' },
  { value: 'exhibition', label: 'Exhibition' },
] as const;

export function normalizeFightCardSegment(value: string): FightCardSegment {
  const normalized = value
    .trim()
    .toLocaleLowerCase('fr-FR')
    .replace(/[’']/g, '')
    .replace(/[\s-]+/g, '_');

  if (
    normalized === 'main_event' ||
    normalized === 'mainevent'
  ) {
    return 'main_event';
  }

  if (
    normalized === 'co_main_event' ||
    normalized === 'comain_event' ||
    normalized === 'co_main'
  ) {
    return 'co_main_event';
  }

  if (
    normalized === 'main_card' ||
    normalized === 'carte_principale'
  ) {
    return 'main_card';
  }

  return 'prelims';
}

export function normalizeFightCardStatus(value: string): FightCardStatus {
  const normalized = value.trim().toLocaleLowerCase('fr-FR');

  if (normalized === 'confirmed' || normalized === 'confirmé') {
    return 'confirmed';
  }

  if (normalized === 'proposed' || normalized === 'proposé') {
    return 'proposed';
  }

  if (normalized === 'cancelled' || normalized === 'annulé') {
    return 'cancelled';
  }

  return 'draft';
}
