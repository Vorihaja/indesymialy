import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/infrastructure/supabase/database.types';
import type { FightCenterRepository } from './fight-center.repository';
import type {
  FightCardDraft,
  FightCardItem,
  FightCardMoveDirection,
  FightCardSnapshot,
  FightCardSyncResult,
  FightCardSyncState,
  FightReadinessCheck,
  FighterEligibilitySummary,
  FightWeightCategory,
  FightWeightPolicy,
  FightWeightPolicyMode,
  FightWeightRuleset,
  OperationalFightDraft,
  OperationalFightItem,
  OperationalFightReadinessState,
  OperationalFightSnapshot,
} from '../types';
import {
  normalizeFightCardSegment,
  normalizeFightCardStatus,
} from '../types';

type FightCardRow = Database['public']['Tables']['event_fight_cards']['Row'];
type FightRow = Database['public']['Tables']['fights']['Row'];
type FighterRow = Pick<
  Database['public']['Tables']['fighters']['Row'],
  | 'id'
  | 'full_name'
  | 'nickname'
  | 'current_weight_kg'
  | 'weight_class'
  | 'wins'
  | 'losses'
  | 'draws'
>;
type DisciplineRow = Pick<
  Database['public']['Tables']['disciplines']['Row'],
  'id' | 'name' | 'slug'
>;
type WeighInRow = Database['public']['Tables']['weigh_ins']['Row'];
type FightOfficialAssignmentRow =
  Database['public']['Tables']['fight_official_assignments']['Row'];
type ClubMemberRow = Pick<
  Database['public']['Tables']['club_members']['Row'],
  'id' | 'fighter_id'
>;
type LicenseRow = Pick<
  Database['public']['Tables']['licenses']['Row'],
  'id' | 'member_id' | 'license_number' | 'expiry_date' | 'status'
>;
type OperationalFighterRow = Pick<
  Database['public']['Tables']['fighters']['Row'],
  | 'id'
  | 'full_name'
  | 'nickname'
  | 'current_weight_kg'
  | 'weight_class'
  | 'medical_clearance_expiry'
>;

type WeightCatalogRow =
  Database['public']['Views']['discipline_weight_catalog']['Row'];

type WeightReference = {
  policy: FightWeightPolicy;
  rulesets: FightWeightRuleset[];
};

const PROTECTED_FIGHT_STATUSES = new Set([
  'live',
  'paused',
  'recovery',
  'completed',
  'finished',
  'published',
]);

function normalizedFightStatus(value: string | null) {
  return (value ?? '').trim().toLocaleLowerCase('fr-FR');
}

function isProtectedFightStatus(value: string | null) {
  return PROTECTED_FIGHT_STATUSES.has(normalizedFightStatus(value));
}

function sameParticipants(card: FightCardRow, fight: FightRow) {
  return (
    Boolean(card.fighter_red_id) &&
    Boolean(card.fighter_blue_id) &&
    card.fighter_red_id === fight.fighter_red_id &&
    card.fighter_blue_id === fight.fighter_blue_id
  );
}

function isStructurallySynced(card: FightCardRow, fight: FightRow) {
  return (
    fight.event_id === card.event_id &&
    fight.fight_order === card.position &&
    fight.discipline_id === card.discipline_id &&
    fight.fighter_red_id === card.fighter_red_id &&
    fight.fighter_blue_id === card.fighter_blue_id
  );
}

function resolveOperationalFight(
  card: FightCardRow,
  fights: FightRow[],
): FightRow | null {
  const canonical = fights.find((fight) => fight.id === card.id);

  if (canonical) {
    return canonical;
  }

  const participantMatch = fights.find((fight) => sameParticipants(card, fight));

  if (participantMatch) {
    return participantMatch;
  }

  return fights.find((fight) => fight.fight_order === card.position) ?? null;
}

function syncStateForCard(
  card: FightCardRow,
  fight: FightRow | null,
): FightCardSyncState {
  if (normalizeFightCardStatus(card.status) !== 'confirmed') {
    return 'planning';
  }

  if (!fight) {
    return 'not_synced';
  }

  if (isStructurallySynced(card, fight)) {
    return 'synced';
  }

  if (isProtectedFightStatus(fight.status)) {
    return 'protected';
  }

  return 'out_of_sync';
}


function normalizeWeightPolicyMode(
  value: string | null | undefined,
): FightWeightPolicyMode {
  switch (value) {
    case 'none':
    case 'standard':
    case 'ruleset':
    case 'event_defined':
    case 'open_weight':
      return value;
    default:
      return 'unconfigured';
  }
}

function weightReferenceForDiscipline(
  disciplineId: string,
  rows: WeightCatalogRow[],
): WeightReference {
  const disciplineRows = rows.filter(
    (row) => row.discipline_id === disciplineId,
  );

  const policyRow = disciplineRows[0] ?? null;
  const policyMode = normalizeWeightPolicyMode(
    policyRow?.policy_mode,
  );

  const policy: FightWeightPolicy = {
    mode: policyMode,
    allowCustomCategory:
      policyRow?.allow_custom_category ?? false,
    configured: policyMode !== 'unconfigured',
    notes: null,
  };

  const rulesetsById = new Map<
    string,
    FightWeightRuleset
  >();

  for (const row of disciplineRows) {
    if (!row.ruleset_id) {
      continue;
    }

    let ruleset = rulesetsById.get(
      row.ruleset_id,
    );

    if (!ruleset) {
      ruleset = {
        id: row.ruleset_id,
        code: row.ruleset_code ?? '',
        name:
          row.ruleset_name ?? 'Ruleset',
        governingBody:
          row.governing_body ?? null,
        versionLabel:
          row.version_label ?? null,
        verificationStatus:
          row.verification_status ?? 'pending',
        isDefault:
          row.ruleset_is_default ?? false,
        isActive:
          row.ruleset_is_active ?? false,
        categories: [],
      };

      rulesetsById.set(
        row.ruleset_id,
        ruleset,
      );
    }

    if (!row.category_id) {
      continue;
    }

    const category: FightWeightCategory = {
      id: row.category_id,
      rulesetId: row.ruleset_id,
      code: row.category_code ?? '',
      name:
        row.category_name ??
        row.display_label ??
        'Catégorie',
      displayLabel:
        row.display_label ??
        row.category_name ??
        'Catégorie',
      gender: row.gender ?? 'any',
      minWeightKg:
        row.min_weight_kg ?? null,
      maxWeightKg:
        row.max_weight_kg ?? null,
      isOpenWeight:
        row.is_open_weight ?? false,
      sortOrder:
        Number(row.sort_order ?? 0),
      isActive:
        row.category_is_active ?? false,
    };

    if (
      !ruleset.categories.some(
        (item) => item.id === category.id,
      )
    ) {
      ruleset.categories.push(category);
    }
  }

  const rulesets = [...rulesetsById.values()]
    .map((ruleset) => ({
      ...ruleset,
      categories: [...ruleset.categories].sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          a.displayLabel.localeCompare(
            b.displayLabel,
            'fr',
          ),
      ),
    }))
    .sort((a, b) => {
      if (a.isDefault !== b.isDefault) {
        return a.isDefault ? -1 : 1;
      }

      return a.name.localeCompare(b.name, 'fr');
    });

  return {
    policy,
    rulesets,
  };
}

function selectableRulesets(
  rulesets: FightWeightRuleset[],
) {
  return rulesets.filter(
    (ruleset) =>
      ruleset.isActive &&
      ruleset.verificationStatus === 'verified' &&
      ruleset.categories.some(
        (category) => category.isActive,
      ),
  );
}

function selectedWeightCategory(
  categoryId: string | null,
  rulesets: FightWeightRuleset[],
) {
  if (!categoryId) return null;

  for (const ruleset of rulesets) {
    const category = ruleset.categories.find(
      (item) => item.id === categoryId,
    );

    if (category) {
      return {
        ruleset,
        category,
      };
    }
  }

  return null;
}

function buildWeightReadinessCheck(
  fight: FightRow,
  reference: WeightReference,
): FightReadinessCheck {
  const snapshot =
    fight.weight_category?.trim() ?? '';
  const selected = selectedWeightCategory(
    fight.weight_category_id,
    reference.rulesets,
  );
  const availableRulesets = selectableRulesets(
    reference.rulesets,
  );
  const mode = reference.policy.mode;

  if (mode === 'none') {
    return {
      key: 'weight',
      label: 'Catégorie de poids',
      state: 'ready',
      detail:
        'Non applicable selon la politique de la discipline',
      blocking: false,
    };
  }

  if (mode === 'open_weight') {
    return {
      key: 'weight',
      label: 'Catégorie de poids',
      state: 'ready',
      detail: 'Discipline configurée en Open Weight',
      blocking: false,
    };
  }

  if (mode === 'unconfigured') {
    return {
      key: 'weight',
      label: 'Catégorie de poids',
      state: 'warning',
      detail:
        'Politique de poids Indesy non configurée pour cette discipline',
      blocking: false,
    };
  }

  if (mode === 'event_defined') {
    const ready = Boolean(snapshot);

    return {
      key: 'weight',
      label: 'Catégorie de poids',
      state: ready ? 'ready' : 'blocked',
      detail: ready
        ? `${snapshot} · catégorie événement`
        : 'Catégorie définie par l’événement à renseigner',
      blocking: true,
    };
  }

  if (
    selected &&
    selected.category.isActive &&
    selected.ruleset.isActive &&
    selected.ruleset.verificationStatus === 'verified'
  ) {
    return {
      key: 'weight',
      label: 'Catégorie de poids',
      state: 'ready',
      detail: `${selected.category.displayLabel} · ${selected.ruleset.name}`,
      blocking: true,
    };
  }

  if (
    !fight.weight_category_id &&
    snapshot &&
    reference.policy.allowCustomCategory
  ) {
    return {
      key: 'weight',
      label: 'Catégorie de poids',
      state: 'warning',
      detail: `${snapshot} · catégorie personnalisée`,
      blocking: false,
    };
  }

  if (availableRulesets.length === 0) {
    return {
      key: 'weight',
      label: 'Catégorie de poids',
      state: 'blocked',
      detail: reference.policy.allowCustomCategory
        ? 'Aucun ruleset actif : renseignez une catégorie personnalisée'
        : 'Aucun ruleset vérifié et actif disponible',
      blocking: true,
    };
  }

  return {
    key: 'weight',
    label: 'Catégorie de poids',
    state: 'blocked',
    detail: fight.weight_category_id
      ? 'La catégorie liée n’est plus active ou vérifiée'
      : 'Sélectionnez une catégorie réglementaire',
    blocking: true,
  };
}

const FINISHED_FIGHT_STATUSES = new Set([
  'completed',
  'finished',
  'published',
]);

const LIVE_FIGHT_STATUSES = new Set([
  'live',
  'paused',
  'recovery',
]);

const CANCELLED_FIGHT_STATUSES = new Set([
  'cancelled',
  'canceled',
]);

const INVALID_LICENSE_STATUSES = new Set([
  'expired',
  'suspended',
  'cancelled',
  'canceled',
  'revoked',
  'inactive',
]);

function dayTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  parsed.setHours(0, 0, 0, 0);
  return parsed.getTime();
}

function isDateValidThrough(
  expiry: string | null,
  referenceDate: string | null,
) {
  const expiryTimestamp = dayTimestamp(expiry);

  if (expiryTimestamp === null) {
    return false;
  }

  const referenceTimestamp =
    dayTimestamp(referenceDate) ?? Date.now();

  return expiryTimestamp >= referenceTimestamp;
}

function isLicenseUsable(
  license: LicenseRow,
  referenceDate: string | null,
) {
  const normalized = (license.status ?? '')
    .trim()
    .toLocaleLowerCase('fr-FR');

  return (
    !INVALID_LICENSE_STATUSES.has(normalized) &&
    isDateValidThrough(
      license.expiry_date,
      referenceDate,
    )
  );
}

function latestWeighIn(
  rows: WeighInRow[],
  fightId: string,
  fighterId: string | null,
) {
  if (!fighterId) {
    return null;
  }

  const candidates = rows
    .filter(
      (row) =>
        row.fighter_id === fighterId &&
        (
          row.fight_id === fightId ||
          row.fight_id === null
        ),
    )
    .sort((left, right) => {
      const attemptDelta =
        Number(right.attempt_number ?? 0) -
        Number(left.attempt_number ?? 0);

      if (attemptDelta !== 0) {
        return attemptDelta;
      }

      return (
        dayTimestamp(
          right.measured_at ??
          right.updated_at,
        ) ?? 0
      ) - (
        dayTimestamp(
          left.measured_at ??
          left.updated_at,
        ) ?? 0
      );
    });

  return (
    candidates.find(
      (row) =>
        row.fight_id === fightId,
    ) ??
    candidates[0] ??
    null
  );
}

function weighInIsValid(
  row: WeighInRow | null,
) {
  if (!row) {
    return false;
  }

  const normalized =
    row.compliance_status
      .trim()
      .toLocaleLowerCase('fr-FR');

  return (
    normalized === 'compliant' ||
    normalized === 'waiver'
  );
}

function readinessState(
  status: string | null,
  blockers: string[],
): OperationalFightReadinessState {
  const normalized =
    normalizedFightStatus(status);

  if (
    LIVE_FIGHT_STATUSES.has(
      normalized,
    )
  ) {
    return 'live';
  }

  if (
    FINISHED_FIGHT_STATUSES.has(
      normalized,
    )
  ) {
    return 'completed';
  }

  if (
    CANCELLED_FIGHT_STATUSES.has(
      normalized,
    )
  ) {
    return 'cancelled';
  }

  if (blockers.length > 0) {
    return 'incomplete';
  }

  return normalized === 'ready'
    ? 'ready'
    : 'eligible';
}

function operationalFightIsEditable(
  status: string | null,
) {
  const normalized =
    normalizedFightStatus(status);

  return (
    !LIVE_FIGHT_STATUSES.has(
      normalized,
    ) &&
    !FINISHED_FIGHT_STATUSES.has(
      normalized,
    ) &&
    !CANCELLED_FIGHT_STATUSES.has(
      normalized,
    )
  );
}

function officialRoleMatches(
  value: string,
  expected: string,
) {
  const normalized = value
    .trim()
    .toLocaleLowerCase('fr-FR');

  if (expected === 'referee') {
    return (
      normalized.includes('referee') ||
      normalized.includes('arbitre')
    );
  }

  if (expected === 'judge') {
    return (
      normalized.includes('judge') ||
      normalized.includes('juge')
    );
  }

  if (expected === 'timekeeper') {
    return (
      normalized.includes('timekeeper') ||
      normalized.includes('chronom')
    );
  }

  if (expected === 'supervisor') {
    return (
      normalized.includes('supervisor') ||
      normalized.includes('superviseur')
    );
  }

  return normalized === expected;
}

function confirmedAssignments(
  rows: FightOfficialAssignmentRow[],
  fightId: string,
  role: string,
) {
  return rows.filter(
    (row) =>
      row.fight_id === fightId &&
      officialRoleMatches(
        row.role,
        role,
      ) &&
      (
        row.status ?? ''
      )
        .trim()
        .toLocaleLowerCase(
          'fr-FR',
        ) === 'confirmed',
  ).length;
}

function licenseForFighter(
  fighterId: string | null,
  members: ClubMemberRow[],
  licenses: LicenseRow[],
  referenceDate: string | null,
) {
  if (!fighterId) {
    return null;
  }

  const memberIds = new Set(
    members
      .filter(
        (member) =>
          member.fighter_id ===
          fighterId,
      )
      .map(
        (member) =>
          member.id,
      ),
  );

  return (
    licenses
      .filter(
        (license) =>
          Boolean(
            license.member_id,
          ) &&
          memberIds.has(
            license.member_id as string,
          ),
      )
      .sort(
        (left, right) =>
          (
            dayTimestamp(
              right.expiry_date,
            ) ?? 0
          ) -
          (
            dayTimestamp(
              left.expiry_date,
            ) ?? 0
          ),
      )
      .find(
        (license) =>
          isLicenseUsable(
            license,
            referenceDate,
          ),
      ) ??
    null
  );
}

function fighterEligibility(
  fighterId: string | null,
  fightersById: Map<
    string,
    OperationalFighterRow
  >,
  weighIns: WeighInRow[],
  fightId: string,
  members: ClubMemberRow[],
  licenses: LicenseRow[],
  referenceDate: string | null,
  fallbackName: string,
): FighterEligibilitySummary {
  const fighter = fighterId
    ? fightersById.get(
        fighterId,
      ) ?? null
    : null;

  const weighIn =
    latestWeighIn(
      weighIns,
      fightId,
      fighterId,
    );

  const license =
    licenseForFighter(
      fighterId,
      members,
      licenses,
      referenceDate,
    );

  return {
    id: fighter?.id ?? fighterId,
    fullName:
      fighter?.full_name ??
      fallbackName,
    nickname:
      fighter?.nickname ?? null,
    weightClass:
      fighter?.weight_class ?? null,
    currentWeightKg:
      fighter?.current_weight_kg ??
      null,
    medicalClearanceExpiry:
      fighter
        ?.medical_clearance_expiry ??
      null,
    medicalValid:
      isDateValidThrough(
        fighter
          ?.medical_clearance_expiry ??
          null,
        referenceDate,
      ),
    licenseNumber:
      license?.license_number ??
      null,
    licenseExpiry:
      license?.expiry_date ?? null,
    licenseValid:
      Boolean(license),
    weighInStatus:
      weighIn
        ?.compliance_status ??
      null,
    measuredWeightKg:
      weighIn
        ?.measured_weight_kg ??
      null,
    weighInValid:
      weighInIsValid(weighIn),
  };
}

function buildFightChecks(
  fight: FightRow,
  red: FighterEligibilitySummary,
  blue: FighterEligibilitySummary,
  refereeConfirmed: number,
  judgesConfirmed: number,
  weightReference: WeightReference,
): FightReadinessCheck[] {
  const roundsReady =
    Number(
      fight.scheduled_rounds ??
        0,
    ) > 0;

  const fightTypeReady =
    Boolean(
      fight.fight_type?.trim(),
    );

  const weighInBlocking =
    weightReference.policy.mode === 'ruleset' ||
    weightReference.policy.mode === 'standard' ||
    weightReference.policy.mode === 'event_defined';

  return [
    {
      key: 'participants',
      label: 'Combattants',
      state:
        fight.fighter_red_id &&
        fight.fighter_blue_id
          ? 'ready'
          : 'blocked',
      detail:
        fight.fighter_red_id &&
        fight.fighter_blue_id
          ? 'Deux fiches combattants liées'
          : 'Un ou plusieurs combattants ne sont pas liés',
      blocking: true,
    },
    {
      key: 'discipline',
      label: 'Discipline',
      state:
        fight.discipline_id
          ? 'ready'
          : 'blocked',
      detail:
        fight.discipline_id
          ? 'Discipline opérationnelle définie'
          : 'Discipline manquante',
      blocking: true,
    },
    buildWeightReadinessCheck(
      fight,
      weightReference,
    ),
    {
      key: 'rounds',
      label: 'Rounds',
      state: roundsReady
        ? 'ready'
        : 'blocked',
      detail: roundsReady
        ? `${fight.scheduled_rounds} round${
            Number(
              fight.scheduled_rounds,
            ) > 1
              ? 's'
              : ''
          }`
        : 'Nombre de rounds invalide',
      blocking: true,
    },
    {
      key: 'fight-type',
      label: 'Type de combat',
      state: fightTypeReady
        ? 'ready'
        : 'blocked',
      detail: fightTypeReady
        ? (fight.fight_type as string)
        : 'Type de combat à définir',
      blocking: true,
    },
    {
      key: 'red-weigh-in',
      label: 'Pesée coin rouge',
      state: red.weighInValid
        ? 'ready'
        : weighInBlocking
          ? 'blocked'
          : 'warning',
      detail: red.weighInValid
        ? `${
            red.measuredWeightKg === null
              ? 'Poids validé'
              : `${red.measuredWeightKg} kg`
          } · ${
            red.weighInStatus
          }`
        : !weighInBlocking
          ? 'Pesée non requise par la politique de poids de la discipline'
          : red.weighInStatus
            ? `Statut : ${red.weighInStatus}`
            : 'Pesée non validée',
      blocking: weighInBlocking,
    },
    {
      key: 'blue-weigh-in',
      label: 'Pesée coin bleu',
      state: blue.weighInValid
        ? 'ready'
        : weighInBlocking
          ? 'blocked'
          : 'warning',
      detail: blue.weighInValid
        ? `${
            blue.measuredWeightKg === null
              ? 'Poids validé'
              : `${blue.measuredWeightKg} kg`
          } · ${
            blue.weighInStatus
          }`
        : !weighInBlocking
          ? 'Pesée non requise par la politique de poids de la discipline'
          : blue.weighInStatus
            ? `Statut : ${blue.weighInStatus}`
            : 'Pesée non validée',
      blocking: weighInBlocking,
    },
    {
      key: 'red-medical',
      label: 'Médical coin rouge',
      state: red.medicalValid
        ? 'ready'
        : 'blocked',
      detail: red.medicalValid
        ? `Valide jusqu’au ${red.medicalClearanceExpiry}`
        : 'Autorisation médicale absente ou expirée',
      blocking: true,
    },
    {
      key: 'blue-medical',
      label: 'Médical coin bleu',
      state: blue.medicalValid
        ? 'ready'
        : 'blocked',
      detail: blue.medicalValid
        ? `Valide jusqu’au ${blue.medicalClearanceExpiry}`
        : 'Autorisation médicale absente ou expirée',
      blocking: true,
    },
    {
      key: 'red-license',
      label: 'Licence coin rouge',
      state: red.licenseValid
        ? 'ready'
        : 'blocked',
      detail: red.licenseValid
        ? `${
            red.licenseNumber ??
            'Licence'
          } · échéance ${
            red.licenseExpiry
          }`
        : 'Licence valide non trouvée',
      blocking: true,
    },
    {
      key: 'blue-license',
      label: 'Licence coin bleu',
      state: blue.licenseValid
        ? 'ready'
        : 'blocked',
      detail: blue.licenseValid
        ? `${
            blue.licenseNumber ??
            'Licence'
          } · échéance ${
            blue.licenseExpiry
          }`
        : 'Licence valide non trouvée',
      blocking: true,
    },
    {
      key: 'referee',
      label: 'Arbitre central',
      state:
        refereeConfirmed >= 1
          ? 'ready'
          : 'blocked',
      detail:
        refereeConfirmed >= 1
          ? `${refereeConfirmed} arbitre confirmé`
          : 'Aucun arbitre confirmé',
      blocking: true,
    },
    {
      key: 'judges',
      label: 'Juges',
      state:
        judgesConfirmed >= 3
          ? 'ready'
          : 'blocked',
      detail: `${judgesConfirmed}/3 juges confirmés`,
      blocking: true,
    },
  ];
}

export class FightCenterSupabaseRepository implements FightCenterRepository {
  constructor(
    private readonly supabase: SupabaseClient<Database>,
  ) {}

  async loadFightCard(eventId: string): Promise<FightCardSnapshot> {
    const [cardsResult, fightersResult, disciplinesResult, fightsResult] = await Promise.all([
      this.supabase
        .from('event_fight_cards')
        .select('*')
        .eq('event_id', eventId)
        .order('position', { ascending: true }),

      this.supabase
        .from('fighters')
        .select(
          'id,full_name,nickname,current_weight_kg,weight_class,wins,losses,draws',
        )
        .order('full_name', { ascending: true }),

      this.supabase
        .from('disciplines')
        .select('id,name,slug')
        .is('archived_at', null)
        .order('name', { ascending: true }),

      this.supabase
        .from('fights')
        .select('*')
        .eq('event_id', eventId)
        .is('archived_at', null)
        .order('fight_order', { ascending: true }),
    ]);

    const error =
      cardsResult.error ??
      fightersResult.error ??
      disciplinesResult.error ??
      fightsResult.error;

    if (error) throw error;

    const fighterRows = (fightersResult.data ?? []) as FighterRow[];
    const disciplineRows = (disciplinesResult.data ?? []) as DisciplineRow[];
    const fightRows = (fightsResult.data ?? []) as FightRow[];

    const fighters = fighterRows.map((fighter) => ({
      id: fighter.id,
      fullName: fighter.full_name,
      nickname: fighter.nickname,
      currentWeightKg: fighter.current_weight_kg,
      weightClass: fighter.weight_class,
      wins: Number(fighter.wins ?? 0),
      losses: Number(fighter.losses ?? 0),
      draws: Number(fighter.draws ?? 0),
    }));

    const disciplines = disciplineRows.map((discipline) => ({
      id: discipline.id,
      name: discipline.name,
      slug: discipline.slug,
    }));

    const fighterNames = new Map(
      fighters.map((fighter) => [fighter.id, fighter.fullName]),
    );

    const disciplineNames = new Map(
      disciplines.map((discipline) => [discipline.id, discipline.name]),
    );

    return {
      eventId,
      fighters,
      disciplines,
      cards: ((cardsResult.data ?? []) as FightCardRow[]).map((card): FightCardItem => {
        const operationalFight = resolveOperationalFight(card, fightRows);

        return {
          id: card.id,
          eventId: card.event_id,
          position: card.position,
          segment: normalizeFightCardSegment(card.segment),
          segmentRaw: card.segment,
          disciplineId: card.discipline_id,
          disciplineName: card.discipline_id
            ? disciplineNames.get(card.discipline_id) ?? null
            : null,
          fighterRedId: card.fighter_red_id,
          fighterRedMention: card.fighter_red_mention,
          fighterRedName: card.fighter_red_id
            ? fighterNames.get(card.fighter_red_id) ?? null
            : null,
          fighterBlueId: card.fighter_blue_id,
          fighterBlueMention: card.fighter_blue_mention,
          fighterBlueName: card.fighter_blue_id
            ? fighterNames.get(card.fighter_blue_id) ?? null
            : null,
          status: normalizeFightCardStatus(card.status),
          statusRaw: card.status,
          operationalFightId: operationalFight?.id ?? null,
          operationalFightOrder: operationalFight?.fight_order ?? null,
          operationalFightStatus: operationalFight?.status ?? null,
          syncState: syncStateForCard(card, operationalFight),
        };
      }),
    };
  }

  async createFightCardEntry(
    eventId: string,
    draft: FightCardDraft,
  ): Promise<void> {
    const positionResult = await this.supabase
      .from('event_fight_cards')
      .select('position')
      .eq('event_id', eventId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (positionResult.error) throw positionResult.error;

    const nextPosition = Number(positionResult.data?.position ?? 0) + 1;

    const { error } = await this.supabase.from('event_fight_cards').insert({
      event_id: eventId,
      position: nextPosition,
      segment: draft.segment,
      discipline_id: draft.disciplineId || null,
      fighter_red_id: draft.fighterRedId || null,
      fighter_red_mention:
        draft.fighterRedId || !draft.fighterRedMention.trim()
          ? null
          : draft.fighterRedMention.trim(),
      fighter_blue_id: draft.fighterBlueId || null,
      fighter_blue_mention:
        draft.fighterBlueId || !draft.fighterBlueMention.trim()
          ? null
          : draft.fighterBlueMention.trim(),
      status: draft.status,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  }

  async updateFightCardEntry(
    cardId: string,
    draft: FightCardDraft,
  ): Promise<void> {
    const { error } = await this.supabase
      .from('event_fight_cards')
      .update({
        segment: draft.segment,
        discipline_id: draft.disciplineId || null,
        fighter_red_id: draft.fighterRedId || null,
        fighter_red_mention:
          draft.fighterRedId || !draft.fighterRedMention.trim()
            ? null
            : draft.fighterRedMention.trim(),
        fighter_blue_id: draft.fighterBlueId || null,
        fighter_blue_mention:
          draft.fighterBlueId || !draft.fighterBlueMention.trim()
            ? null
            : draft.fighterBlueMention.trim(),
        status: draft.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cardId);

    if (error) throw error;
  }

  async deleteFightCardEntry(
    eventId: string,
    cardId: string,
  ): Promise<void> {
    const { error } = await this.supabase
      .from('event_fight_cards')
      .delete()
      .eq('id', cardId)
      .eq('event_id', eventId);

    if (error) throw error;

    await this.normalizePositions(eventId);
  }

  async moveFightCardEntry(
    eventId: string,
    cardId: string,
    direction: FightCardMoveDirection,
  ): Promise<void> {
    const cardsResult = await this.supabase
      .from('event_fight_cards')
      .select('id,position')
      .eq('event_id', eventId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (cardsResult.error) throw cardsResult.error;

    const cards = cardsResult.data ?? [];
    const currentIndex = cards.findIndex((card) => card.id === cardId);

    if (currentIndex < 0) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const current = cards[currentIndex];
    const target = cards[targetIndex];

    if (!current || !target) return;

    const now = new Date().toISOString();
    const highestPosition = cards.reduce(
      (highest, card) => Math.max(highest, Number(card.position ?? 0)),
      0,
    );
    const temporaryPosition = highestPosition + 1000;

    const temporaryResult = await this.supabase
      .from('event_fight_cards')
      .update({
        position: temporaryPosition,
        updated_at: now,
      })
      .eq('id', current.id)
      .eq('event_id', eventId);

    if (temporaryResult.error) throw temporaryResult.error;

    const targetResult = await this.supabase
      .from('event_fight_cards')
      .update({
        position: current.position,
        updated_at: now,
      })
      .eq('id', target.id)
      .eq('event_id', eventId);

    if (targetResult.error) throw targetResult.error;

    const currentResult = await this.supabase
      .from('event_fight_cards')
      .update({
        position: target.position,
        updated_at: now,
      })
      .eq('id', current.id)
      .eq('event_id', eventId);

    if (currentResult.error) throw currentResult.error;

    await this.normalizePositions(eventId);
  }

  async syncConfirmedFightCard(eventId: string): Promise<FightCardSyncResult> {
    const [cardsResult, fightsResult] = await Promise.all([
      this.supabase
        .from('event_fight_cards')
        .select('*')
        .eq('event_id', eventId)
        .eq('status', 'confirmed')
        .order('position', { ascending: true }),
      this.supabase
        .from('fights')
        .select('*')
        .eq('event_id', eventId)
        .is('archived_at', null)
        .order('fight_order', { ascending: true }),
    ]);

    const error = cardsResult.error ?? fightsResult.error;
    if (error) throw error;

    const cards = (cardsResult.data ?? []) as FightCardRow[];
    const fights = (fightsResult.data ?? []) as FightRow[];

    if (!cards.length) {
      throw new Error(
        'Aucun combat confirmé n’est disponible pour la synchronisation.',
      );
    }

    for (const card of cards) {
      if (!card.discipline_id || !card.fighter_red_id || !card.fighter_blue_id) {
        throw new Error(
          `Le combat #${card.position} est confirmé mais incomplet.`,
        );
      }
    }

    const usedFightIds = new Set<string>();

    const plans = cards.map((card) => {
      const canonical = fights.find(
        (fight) => fight.id === card.id && !usedFightIds.has(fight.id),
      );
      const participantMatch = canonical
        ? null
        : fights.find(
            (fight) =>
              !usedFightIds.has(fight.id) && sameParticipants(card, fight),
          );
      const orderMatch = canonical || participantMatch
        ? null
        : fights.find(
            (fight) =>
              !usedFightIds.has(fight.id) && fight.fight_order === card.position,
          );
      const fight = canonical ?? participantMatch ?? orderMatch ?? null;

      if (fight) {
        usedFightIds.add(fight.id);
      }

      return {
        card,
        fight,
        changed: fight ? !isStructurallySynced(card, fight) : true,
      };
    });

    const targetOrders = new Set(cards.map((card) => card.position));
    const unmanagedBlockers = fights.filter(
      (fight) =>
        targetOrders.has(fight.fight_order) && !usedFightIds.has(fight.id),
    );

    if (unmanagedBlockers.length) {
      const orders = unmanagedBlockers
        .map((fight) => `#${fight.fight_order}`)
        .join(', ');
      throw new Error(
        `Synchronisation bloquée : un combat opérationnel non rattaché occupe déjà ${orders}. Vérifiez l’onglet Combats avant de continuer.`,
      );
    }

    const protectedPlan = plans.find(
      (plan) =>
        plan.fight &&
        plan.changed &&
        isProtectedFightStatus(plan.fight.status),
    );

    if (protectedPlan?.fight) {
      throw new Error(
        `Le combat opérationnel #${protectedPlan.fight.fight_order} est actuellement « ${protectedPlan.fight.status ?? 'protégé'} ». Un combat en direct, terminé ou publié ne peut pas être réécrit depuis la Fight Card.`,
      );
    }

    const canonicalIds = new Set(cards.map((card) => card.id));
    const crossEventIdResult = await this.supabase
      .from('fights')
      .select('id,event_id')
      .in('id', [...canonicalIds]);

    if (crossEventIdResult.error) throw crossEventIdResult.error;

    const crossEventConflict = (crossEventIdResult.data ?? []).find(
      (fight) => fight.event_id !== eventId,
    );

    if (crossEventConflict) {
      throw new Error(
        'Synchronisation bloquée : un identifiant de Fight Card est déjà utilisé par un combat d’un autre événement.',
      );
    }

    const movingPlans = plans.filter(
      (plan) =>
        plan.fight &&
        plan.fight.fight_order !== plan.card.position,
    );

    const highestOrder = fights.reduce(
      (highest, fight) => Math.max(highest, Number(fight.fight_order ?? 0)),
      0,
    );
    const temporaryBase = highestOrder + 1000;
    const now = new Date().toISOString();

    for (const [index, plan] of movingPlans.entries()) {
      if (!plan.fight) continue;

      const temporaryResult = await this.supabase
        .from('fights')
        .update({
          fight_order: temporaryBase + index,
          updated_at: now,
        })
        .eq('id', plan.fight.id)
        .eq('event_id', eventId);

      if (temporaryResult.error) throw temporaryResult.error;
    }

    let created = 0;
    let updated = 0;
    let unchanged = 0;
    let needsConfiguration = 0;

    for (const plan of plans) {
      const { card, fight } = plan;

      if (!fight) {
        needsConfiguration += 1;

        const insertResult = await this.supabase.from('fights').insert({
          id: card.id,
          event_id: eventId,
          discipline_id: card.discipline_id as string,
          fight_order: card.position,
          fighter_red_id: card.fighter_red_id,
          fighter_blue_id: card.fighter_blue_id,
          weight_category_id: null,
          weight_category: null,
          scheduled_rounds: 3,
          fight_type: 'professional',
          status: 'scheduled',
          updated_at: now,
        });

        if (insertResult.error) throw insertResult.error;
        created += 1;
        continue;
      }

      if (!plan.changed) {
        unchanged += 1;
        continue;
      }

      const disciplineChanged =
        fight.discipline_id !== card.discipline_id;

      const updateResult = await this.supabase
        .from('fights')
        .update({
          event_id: eventId,
          discipline_id: card.discipline_id as string,
          fight_order: card.position,
          fighter_red_id: card.fighter_red_id,
          fighter_blue_id: card.fighter_blue_id,
          ...(disciplineChanged
            ? {
                weight_category_id: null,
                weight_category: null,
              }
            : {}),
          updated_at: now,
        })
        .eq('id', fight.id)
        .eq('event_id', eventId);

      if (updateResult.error) throw updateResult.error;
      updated += 1;

      if (
        disciplineChanged ||
        (
          !fight.weight_category_id &&
          !fight.weight_category?.trim()
        )
      ) {
        needsConfiguration += 1;
      }
    }

    return {
      confirmed: cards.length,
      created,
      updated,
      unchanged,
      needsConfiguration,
    };
  }


  async loadOperationalFights(
    eventId: string,
  ): Promise<OperationalFightSnapshot> {
    const [
      eventResult,
      fightsResult,
    ] = await Promise.all([
      this.supabase
        .from('events')
        .select('id,starts_at')
        .eq('id', eventId)
        .maybeSingle(),

      this.supabase
        .from('fights')
        .select('*')
        .eq('event_id', eventId)
        .is('archived_at', null)
        .order(
          'fight_order',
          { ascending: true },
        ),
    ]);

    const firstError =
      eventResult.error ??
      fightsResult.error;

    if (firstError) {
      throw firstError;
    }

    const fights =
      (fightsResult.data ??
        []) as FightRow[];

    const fightIds =
      fights.map(
        (fight) => fight.id,
      );

    const fighterIds =
      Array.from(
        new Set(
          fights
            .flatMap(
              (fight) => [
                fight.fighter_red_id,
                fight.fighter_blue_id,
              ],
            )
            .filter(
              (
                id,
              ): id is string =>
                Boolean(id),
            ),
        ),
      );

    const disciplineIds =
      Array.from(
        new Set(
          fights
            .map(
              (fight) =>
                fight.discipline_id,
            )
            .filter(Boolean),
        ),
      );

    const [
      fightersResult,
      disciplinesResult,
      weighInsResult,
      assignmentsResult,
      membersResult,
      weightCatalogResult,
    ] = await Promise.all([
      fighterIds.length
        ? this.supabase
            .from('fighters')
            .select(
              'id,full_name,nickname,current_weight_kg,weight_class,medical_clearance_expiry',
            )
            .in(
              'id',
              fighterIds,
            )
        : Promise.resolve({
            data:
              [] as OperationalFighterRow[],
            error: null,
          }),

      disciplineIds.length
        ? this.supabase
            .from('disciplines')
            .select(
              'id,name,slug',
            )
            .in(
              'id',
              disciplineIds,
            )
        : Promise.resolve({
            data:
              [] as DisciplineRow[],
            error: null,
          }),

      this.supabase
        .from('weigh_ins')
        .select('*')
        .eq(
          'event_id',
          eventId,
        ),

      fightIds.length
        ? this.supabase
            .from(
              'fight_official_assignments',
            )
            .select('*')
            .in(
              'fight_id',
              fightIds,
            )
        : Promise.resolve({
            data:
              [] as FightOfficialAssignmentRow[],
            error: null,
          }),

      fighterIds.length
        ? this.supabase
            .from('club_members')
            .select(
              'id,fighter_id',
            )
            .in(
              'fighter_id',
              fighterIds,
            )
        : Promise.resolve({
            data:
              [] as ClubMemberRow[],
            error: null,
          }),

      disciplineIds.length
        ? this.supabase
            .from('discipline_weight_catalog')
            .select('*')
            .in(
              'discipline_id',
              disciplineIds,
            )
        : Promise.resolve({
            data:
              [] as WeightCatalogRow[],
            error: null,
          }),
    ]);

    const relatedError =
      fightersResult.error ??
      disciplinesResult.error ??
      weighInsResult.error ??
      assignmentsResult.error ??
      membersResult.error ??
      weightCatalogResult.error;

    if (relatedError) {
      throw relatedError;
    }

    const members =
      (membersResult.data ??
        []) as ClubMemberRow[];

    const memberIds =
      members.map(
        (member) =>
          member.id,
      );

    const licensesResult =
      memberIds.length
        ? await this.supabase
            .from('licenses')
            .select(
              'id,member_id,license_number,expiry_date,status',
            )
            .in(
              'member_id',
              memberIds,
            )
        : {
            data:
              [] as LicenseRow[],
            error: null,
          };

    if (licensesResult.error) {
      throw licensesResult.error;
    }

    const operationalFighterRows =
      (fightersResult.data ?? []) as OperationalFighterRow[];

    const operationalDisciplineRows =
      (disciplinesResult.data ?? []) as DisciplineRow[];

    const fightersById = new Map<string, OperationalFighterRow>(
      operationalFighterRows.map((fighter) => [fighter.id, fighter]),
    );

    const disciplineNames = new Map<string, string>(
      operationalDisciplineRows.map((discipline) => [
        discipline.id,
        discipline.name,
      ]),
    );

    const weighIns =
      (weighInsResult.data ??
        []) as WeighInRow[];

    const assignments =
      (assignmentsResult.data ??
        []) as FightOfficialAssignmentRow[];

    const licenses =
      (licensesResult.data ??
        []) as LicenseRow[];

    const weightCatalogRows =
      (weightCatalogResult.data ??
        []) as WeightCatalogRow[];

    const eventStartsAt =
      eventResult.data
        ?.starts_at ?? null;

    const operationalFights =
      fights.map(
        (
          fight,
        ): OperationalFightItem => {
          const red =
            fighterEligibility(
              fight.fighter_red_id,
              fightersById,
              weighIns,
              fight.id,
              members,
              licenses,
              eventStartsAt,
              'Coin rouge à confirmer',
            );

          const blue =
            fighterEligibility(
              fight.fighter_blue_id,
              fightersById,
              weighIns,
              fight.id,
              members,
              licenses,
              eventStartsAt,
              'Coin bleu à confirmer',
            );

          const refereeConfirmed =
            confirmedAssignments(
              assignments,
              fight.id,
              'referee',
            );

          const judgesConfirmed =
            confirmedAssignments(
              assignments,
              fight.id,
              'judge',
            );

          const timekeepersConfirmed =
            confirmedAssignments(
              assignments,
              fight.id,
              'timekeeper',
            );

          const supervisorsConfirmed =
            confirmedAssignments(
              assignments,
              fight.id,
              'supervisor',
            );

          const weightReference =
            weightReferenceForDiscipline(
              fight.discipline_id,
              weightCatalogRows,
            );

          const checks =
            buildFightChecks(
              fight,
              red,
              blue,
              refereeConfirmed,
              judgesConfirmed,
              weightReference,
            );

          const blockingChecks =
            checks.filter(
              (check) =>
                check.blocking,
            );

          const readyChecks =
            blockingChecks.filter(
              (check) =>
                check.state ===
                'ready',
            );

          const blockers =
            blockingChecks
              .filter(
                (check) =>
                  check.state !==
                  'ready',
              )
              .map(
                (check) =>
                  check.label,
              );

          const currentState =
            readinessState(
              fight.status,
              blockers,
            );

          const editable =
            operationalFightIsEditable(
              fight.status,
            );

          const normalizedStatus =
            normalizedFightStatus(
              fight.status,
            );

          return {
            id: fight.id,
            eventId,
            fightOrder:
              fight.fight_order,
            disciplineId:
              fight.discipline_id,
            disciplineName:
              disciplineNames.get(
                fight.discipline_id,
              ) ??
              'Discipline',
            weightCategoryId:
              fight.weight_category_id ?? null,
            weightCategory:
              fight.weight_category?.trim() ??
              '',
            weightPolicy:
              weightReference.policy,
            weightRulesets:
              weightReference.rulesets,
            scheduledRounds:
              Number(
                fight.scheduled_rounds ??
                  0,
              ),
            fightType:
              fight.fight_type ??
              '',
            status:
              fight.status ??
              'scheduled',
            fighterRed: red,
            fighterBlue: blue,
            refereeConfirmed,
            judgesConfirmed,
            timekeepersConfirmed,
            supervisorsConfirmed,
            checks,
            readinessPercent:
              blockingChecks.length
                ? Math.round(
                    (
                      readyChecks.length /
                      blockingChecks.length
                    ) *
                      100,
                  )
                : 0,
            readinessState:
              currentState,
            blockers,
            canEdit: editable,
            canMarkReady:
              editable &&
              blockers.length ===
                0 &&
              normalizedStatus !==
                'ready',
            canReturnToScheduled:
              editable &&
              normalizedStatus ===
                'ready',
            canOpenFightLive:
              normalizedStatus ===
                'ready' ||
              LIVE_FIGHT_STATUSES.has(
                normalizedStatus,
              ) ||
              FINISHED_FIGHT_STATUSES.has(
                normalizedStatus,
              ),
          };
        },
      );

    return {
      eventId,
      eventStartsAt,
      fights:
        operationalFights,
    };
  }

  async updateOperationalFight(
    eventId: string,
    fightId: string,
    draft: OperationalFightDraft,
  ): Promise<void> {
    const existingResult =
      await this.supabase
        .from('fights')
        .select(
          'id,event_id,status,discipline_id,weight_category_id,weight_category',
        )
        .eq(
          'id',
          fightId,
        )
        .eq(
          'event_id',
          eventId,
        )
        .maybeSingle();

    if (
      existingResult.error
    ) {
      throw existingResult.error;
    }

    if (
      !existingResult.data
    ) {
      throw new Error(
        'Le combat opérationnel est introuvable.',
      );
    }

    if (
      !operationalFightIsEditable(
        existingResult.data
          .status,
      )
    ) {
      throw new Error(
        'Un combat en direct, terminé, publié ou annulé ne peut plus être reconfiguré.',
      );
    }

    const weightCatalogResult =
      await this.supabase
        .from('discipline_weight_catalog')
        .select('*')
        .eq(
          'discipline_id',
          existingResult.data.discipline_id,
        );

    if (weightCatalogResult.error) {
      throw weightCatalogResult.error;
    }

    const weightReference =
      weightReferenceForDiscipline(
        existingResult.data.discipline_id,
        (weightCatalogResult.data ?? []) as WeightCatalogRow[],
      );

    let weightCategoryId: string | null = null;
    let weightCategory: string | null = null;

    if (draft.weightCategoryId) {
      const selected = selectedWeightCategory(
        draft.weightCategoryId,
        weightReference.rulesets,
      );

      if (!selected) {
        throw new Error(
          'La catégorie de poids sélectionnée est introuvable pour cette discipline.',
        );
      }

      if (
        !selected.category.isActive ||
        !selected.ruleset.isActive ||
        selected.ruleset.verificationStatus !== 'verified'
      ) {
        throw new Error(
          'La catégorie de poids sélectionnée n’est pas issue d’un ruleset vérifié et actif.',
        );
      }

      weightCategoryId = selected.category.id;
      weightCategory = selected.category.displayLabel;
    } else {
      const custom = draft.weightCategory.trim();
      const mode = weightReference.policy.mode;

      if (mode === 'event_defined') {
        weightCategory = custom || null;
      } else if (
        weightReference.policy.allowCustomCategory &&
        custom
      ) {
        weightCategory = custom;
      } else {
        weightCategory = null;
      }
    }

    const result =
      await this.supabase
        .from('fights')
        .update({
          weight_category_id:
            weightCategoryId,
          weight_category:
            weightCategory,
          scheduled_rounds:
            draft.scheduledRounds,
          fight_type:
            draft.fightType.trim(),
          status:
            normalizedFightStatus(
              existingResult.data
                .status,
            ) === 'ready'
              ? 'scheduled'
              : existingResult
                  .data.status,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          fightId,
        )
        .eq(
          'event_id',
          eventId,
        );

    if (result.error) {
      throw result.error;
    }
  }

  async markOperationalFightReady(
    eventId: string,
    fightId: string,
  ): Promise<void> {
    const snapshot = await this.loadOperationalFights(eventId);
    const fight = snapshot.fights.find((item) => item.id === fightId);

    if (!fight) {
      throw new Error('Le combat opérationnel est introuvable.');
    }

    if (!fight.canEdit) {
      throw new Error(
        'Ce combat ne peut plus changer vers le statut prêt.',
      );
    }

    if (fight.blockers.length > 0) {
      throw new Error(
        `Le combat #${fight.fightOrder} n’est pas prêt : ${fight.blockers.join(', ')}.`,
      );
    }

    const result = await this.supabase
      .from('fights')
      .update({
        status: 'ready',
        updated_at: new Date().toISOString(),
      })
      .eq('id', fightId)
      .eq('event_id', eventId);

    if (result.error) {
      throw result.error;
    }
  }

  async returnOperationalFightToScheduled(
    eventId: string,
    fightId: string,
  ): Promise<void> {
    const existingResult =
      await this.supabase
        .from('fights')
        .select('id,status')
        .eq(
          'id',
          fightId,
        )
        .eq(
          'event_id',
          eventId,
        )
        .maybeSingle();

    if (
      existingResult.error
    ) {
      throw existingResult.error;
    }

    if (
      !existingResult.data
    ) {
      throw new Error(
        'Le combat opérationnel est introuvable.',
      );
    }

    if (
      normalizedFightStatus(
        existingResult.data
          .status,
      ) !== 'ready'
    ) {
      throw new Error(
        'Seul un combat au statut prêt peut être repassé en préparation.',
      );
    }

    const result =
      await this.supabase
        .from('fights')
        .update({
          status: 'scheduled',
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          fightId,
        )
        .eq(
          'event_id',
          eventId,
        );

    if (result.error) {
      throw result.error;
    }
  }

  private async normalizePositions(eventId: string): Promise<void> {
    const result = await this.supabase
      .from('event_fight_cards')
      .select('id,position')
      .eq('event_id', eventId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (result.error) throw result.error;

    const updates = (result.data ?? [])
      .map((card, index) => ({
        id: card.id,
        current: card.position,
        next: index + 1,
      }))
      .filter((card) => card.current !== card.next);

    for (const update of updates) {
      const { error } = await this.supabase
        .from('event_fight_cards')
        .update({
          position: update.next,
          updated_at: new Date().toISOString(),
        })
        .eq('id', update.id);

      if (error) throw error;
    }
  }
}
