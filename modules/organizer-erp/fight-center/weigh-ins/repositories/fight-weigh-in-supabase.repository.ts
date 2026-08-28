import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/infrastructure/supabase/database.types';
import type { FightWeighInRepository } from './fight-weigh-in.repository';
import type {
  FightWeighInAttempt,
  FightWeighInAttemptDraft,
  FightWeighInBoundsSource,
  FightWeighInComplianceStatus,
  FightWeighInFighter,
  FightWeighInHistoryItem,
  FightWeighInItem,
  FightWeighInSnapshot,
  FightWeighInWaiverDraft,
} from '../types';

type FightRow = Pick<
  Database['public']['Tables']['fights']['Row'],
  | 'id'
  | 'event_id'
  | 'fight_order'
  | 'status'
  | 'discipline_id'
  | 'fighter_red_id'
  | 'fighter_blue_id'
  | 'weight_category_id'
  | 'weight_category'
>;

type FighterRow = Pick<
  Database['public']['Tables']['fighters']['Row'],
  | 'id'
  | 'full_name'
  | 'nickname'
  | 'current_weight_kg'
>;

type DisciplineRow = Pick<
  Database['public']['Tables']['disciplines']['Row'],
  'id' | 'name'
>;

type WeighInRow = Database['public']['Tables']['weigh_ins']['Row'];
type WeighInHistoryRow = Database['public']['Tables']['weigh_in_history']['Row'];
type WeightCategoryRow = Pick<
  Database['public']['Tables']['discipline_weight_categories']['Row'],
  | 'id'
  | 'min_weight_kg'
  | 'max_weight_kg'
  | 'min_inclusive'
  | 'max_inclusive'
>;

type WeightPolicyRow = Pick<
  Database['public']['Tables']['discipline_weight_policies']['Row'],
  'discipline_id' | 'mode' | 'allow_custom_category'
>;

const PROTECTED_FIGHT_STATUSES = new Set([
  'live',
  'paused',
  'recovery',
  'completed',
  'finished',
  'published',
  'cancelled',
  'canceled',
]);

function normalized(value: string | null | undefined) {
  return (value ?? '').trim().toLocaleLowerCase('fr-FR');
}

function complianceStatus(
  value: string | null | undefined,
): FightWeighInComplianceStatus {
  switch (normalized(value)) {
    case 'compliant':
      return 'compliant';
    case 'underweight':
      return 'underweight';
    case 'overweight':
      return 'overweight';
    case 'waiver':
      return 'waiver';
    case 'disqualified':
      return 'disqualified';
    default:
      return 'pending';
  }
}

function boundsSource(
  policy: WeightPolicyRow | null,
  category: WeightCategoryRow | null,
): FightWeighInBoundsSource {
  if (category) return 'ruleset';

  switch (policy?.mode) {
    case 'event_defined':
      return 'event_defined';
    case 'open_weight':
      return 'open_weight';
    case 'none':
      return 'none';
    default:
      return 'unconfigured';
  }
}

function requiresWeighIn(
  source: FightWeighInBoundsSource,
) {
  return source === 'ruleset' || source === 'event_defined';
}

function attemptSort(
  left: WeighInRow,
  right: WeighInRow,
) {
  const attemptDelta =
    Number(right.attempt_number ?? 0) - Number(left.attempt_number ?? 0);

  if (attemptDelta !== 0) return attemptDelta;

  return new Date(right.measured_at ?? right.updated_at).getTime() -
    new Date(left.measured_at ?? left.updated_at).getTime();
}

function toHistoryItem(
  row: WeighInHistoryRow,
): FightWeighInHistoryItem {
  return {
    id: row.id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    measuredWeightKg: row.measured_weight_kg,
    reason: row.reason,
    createdAt: row.created_at,
    changedBy: row.changed_by,
  };
}

function toAttempt(
  row: WeighInRow,
  historyByWeighIn: Map<string, FightWeighInHistoryItem[]>,
): FightWeighInAttempt {
  return {
    id: row.id,
    attemptNumber: Number(row.attempt_number ?? 1),
    minimumWeightKg: row.minimum_weight_kg,
    maximumWeightKg: row.maximum_weight_kg,
    measuredWeightKg: row.measured_weight_kg,
    scheduledAt: row.scheduled_at,
    measuredAt: row.measured_at,
    complianceStatus: complianceStatus(row.compliance_status),
    notes: row.notes,
    validatedAt: row.validated_at,
    validatedBy: row.validated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    history: historyByWeighIn.get(row.id) ?? [],
  };
}

function fighterPanel(
  corner: 'red' | 'blue',
  fighterId: string | null,
  fightersById: Map<string, FighterRow>,
  weighIns: WeighInRow[],
  fightId: string,
  historyByWeighIn: Map<string, FightWeighInHistoryItem[]>,
): FightWeighInFighter {
  const fighter = fighterId ? fightersById.get(fighterId) ?? null : null;
  const rows = fighterId
    ? weighIns
        .filter(
          (row) =>
            row.fight_id === fightId && row.fighter_id === fighterId,
        )
        .sort(attemptSort)
    : [];

  const attempts = rows.map((row) => toAttempt(row, historyByWeighIn));

  return {
    fighterId,
    fullName:
      fighter?.full_name ??
      (corner === 'red' ? 'Coin rouge à confirmer' : 'Coin bleu à confirmer'),
    nickname: fighter?.nickname ?? null,
    corner,
    currentWeightKg: fighter?.current_weight_kg ?? null,
    latestAttempt: attempts[0] ?? null,
    attempts,
  };
}

function autoCompliance(
  measuredWeightKg: number,
  minimumWeightKg: number | null,
  maximumWeightKg: number | null,
  minInclusive: boolean,
  maxInclusive: boolean,
): FightWeighInComplianceStatus {
  if (minimumWeightKg === null && maximumWeightKg === null) {
    return 'pending';
  }

  const belowMinimum =
    minimumWeightKg !== null &&
    (minInclusive
      ? measuredWeightKg < minimumWeightKg
      : measuredWeightKg <= minimumWeightKg);

  if (belowMinimum) {
    return 'underweight';
  }

  const aboveMaximum =
    maximumWeightKg !== null &&
    (maxInclusive
      ? measuredWeightKg > maximumWeightKg
      : measuredWeightKg >= maximumWeightKg);

  if (aboveMaximum) {
    return 'overweight';
  }

  return 'compliant';
}

export class FightWeighInSupabaseRepository implements FightWeighInRepository {
  constructor(
    private readonly supabase: SupabaseClient<Database>,
  ) {}

  async load(eventId: string): Promise<FightWeighInSnapshot> {
    const fightsResult = await this.supabase
      .from('fights')
      .select(
        'id,event_id,fight_order,status,discipline_id,fighter_red_id,fighter_blue_id,weight_category_id,weight_category',
      )
      .eq('event_id', eventId)
      .is('archived_at', null)
      .order('fight_order', { ascending: true });

    if (fightsResult.error) throw fightsResult.error;

    const fights = (fightsResult.data ?? []) as FightRow[];
    const fighterIds = Array.from(
      new Set(
        fights
          .flatMap((fight) => [fight.fighter_red_id, fight.fighter_blue_id])
          .filter((id): id is string => Boolean(id)),
      ),
    );
    const disciplineIds = Array.from(
      new Set(fights.map((fight) => fight.discipline_id).filter(Boolean)),
    );
    const categoryIds = Array.from(
      new Set(
        fights
          .map((fight) => fight.weight_category_id)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const [
      fightersResult,
      disciplinesResult,
      categoriesResult,
      policiesResult,
      weighInsResult,
    ] = await Promise.all([
      fighterIds.length
        ? this.supabase
            .from('fighters')
            .select('id,full_name,nickname,current_weight_kg')
            .in('id', fighterIds)
        : Promise.resolve({ data: [] as FighterRow[], error: null }),
      disciplineIds.length
        ? this.supabase
            .from('disciplines')
            .select('id,name')
            .in('id', disciplineIds)
        : Promise.resolve({ data: [] as DisciplineRow[], error: null }),
      categoryIds.length
        ? this.supabase
            .from('discipline_weight_categories')
            .select('id,min_weight_kg,max_weight_kg,min_inclusive,max_inclusive')
            .in('id', categoryIds)
        : Promise.resolve({ data: [] as WeightCategoryRow[], error: null }),
      disciplineIds.length
        ? this.supabase
            .from('discipline_weight_policies')
            .select('discipline_id,mode,allow_custom_category')
            .in('discipline_id', disciplineIds)
        : Promise.resolve({ data: [] as WeightPolicyRow[], error: null }),
      this.supabase
        .from('weigh_ins')
        .select('*')
        .eq('event_id', eventId),
    ]);

    const firstError =
      fightersResult.error ??
      disciplinesResult.error ??
      categoriesResult.error ??
      policiesResult.error ??
      weighInsResult.error;

    if (firstError) throw firstError;

    const weighIns = (weighInsResult.data ?? []) as WeighInRow[];
    const weighInIds = weighIns.map((row) => row.id);

    const historyResult = weighInIds.length
      ? await this.supabase
          .from('weigh_in_history')
          .select('*')
          .in('weigh_in_id', weighInIds)
          .order('created_at', { ascending: false })
      : { data: [] as WeighInHistoryRow[], error: null };

    if (historyResult.error) throw historyResult.error;

    const historyByWeighIn = new Map<string, FightWeighInHistoryItem[]>();

    for (const row of (historyResult.data ?? []) as WeighInHistoryRow[]) {
      const current = historyByWeighIn.get(row.weigh_in_id) ?? [];
      current.push(toHistoryItem(row));
      historyByWeighIn.set(row.weigh_in_id, current);
    }

    const fightersById = new Map<string, FighterRow>(
      ((fightersResult.data ?? []) as FighterRow[]).map((row) => [row.id, row]),
    );
    const disciplineNames = new Map<string, string>(
      ((disciplinesResult.data ?? []) as DisciplineRow[]).map((row) => [
        row.id,
        row.name,
      ]),
    );
    const categoriesById = new Map<string, WeightCategoryRow>(
      ((categoriesResult.data ?? []) as WeightCategoryRow[]).map((row) => [
        row.id,
        row,
      ]),
    );
    const policiesByDiscipline = new Map<string, WeightPolicyRow>(
      ((policiesResult.data ?? []) as WeightPolicyRow[]).map((row) => [
        row.discipline_id,
        row,
      ]),
    );

    const items: FightWeighInItem[] = fights.map((fight) => {
      const category = fight.weight_category_id
        ? categoriesById.get(fight.weight_category_id) ?? null
        : null;
      const policy = policiesByDiscipline.get(fight.discipline_id) ?? null;
      const source = boundsSource(policy, category);
      const latestFightBounds = weighIns
        .filter((row) => row.fight_id === fight.id)
        .sort(attemptSort)
        .find(
          (row) =>
            row.minimum_weight_kg !== null ||
            row.maximum_weight_kg !== null,
        );

      return {
        fightId: fight.id,
        eventId,
        fightOrder: fight.fight_order,
        status: fight.status ?? 'scheduled',
        disciplineId: fight.discipline_id,
        disciplineName: disciplineNames.get(fight.discipline_id) ?? 'Discipline',
        weightCategoryId: fight.weight_category_id ?? null,
        weightCategory: fight.weight_category?.trim() ?? '',
        boundsSource: source,
        minimumWeightKg:
          category?.min_weight_kg ??
          latestFightBounds?.minimum_weight_kg ??
          null,
        maximumWeightKg:
          category?.max_weight_kg ??
          latestFightBounds?.maximum_weight_kg ??
          null,
        minInclusive: category?.min_inclusive ?? false,
        maxInclusive: category?.max_inclusive ?? true,
        weighInRequired: requiresWeighIn(source),
        canMeasure: !PROTECTED_FIGHT_STATUSES.has(normalized(fight.status)),
        fighterRed: fighterPanel(
          'red',
          fight.fighter_red_id,
          fightersById,
          weighIns,
          fight.id,
          historyByWeighIn,
        ),
        fighterBlue: fighterPanel(
          'blue',
          fight.fighter_blue_id,
          fightersById,
          weighIns,
          fight.id,
          historyByWeighIn,
        ),
      };
    });

    const latest = items.flatMap((fight) =>
      [fight.fighterRed, fight.fighterBlue]
        .filter((fighter) => Boolean(fighter.fighterId))
        .map((fighter) => fighter.latestAttempt),
    );

    const statusCount = (status: FightWeighInComplianceStatus) =>
      latest.filter((attempt) => attempt?.complianceStatus === status).length;

    return {
      eventId,
      fights: items,
      totalFighters: items.reduce(
        (count, fight) =>
          count + Number(Boolean(fight.fighterRed.fighterId)) + Number(Boolean(fight.fighterBlue.fighterId)),
        0,
      ),
      compliant: statusCount('compliant'),
      nonCompliant:
        statusCount('underweight') +
        statusCount('overweight') +
        statusCount('disqualified'),
      waived: statusCount('waiver'),
      pending:
        latest.filter(
          (attempt) => !attempt || attempt.complianceStatus === 'pending',
        ).length,
    };
  }

  async createAttempt(
    eventId: string,
    draft: FightWeighInAttemptDraft,
  ): Promise<void> {
    const fightResult = await this.supabase
      .from('fights')
      .select(
        'id,event_id,status,fighter_red_id,fighter_blue_id,weight_category_id',
      )
      .eq('id', draft.fightId)
      .eq('event_id', eventId)
      .maybeSingle();

    if (fightResult.error) throw fightResult.error;
    if (!fightResult.data) throw new Error('Combat introuvable pour cet événement.');

    if (PROTECTED_FIGHT_STATUSES.has(normalized(fightResult.data.status))) {
      throw new Error('La pesée ne peut plus être modifiée dans l’état actuel du combat.');
    }

    const expectedFighterId =
      draft.corner === 'red'
        ? fightResult.data.fighter_red_id
        : fightResult.data.fighter_blue_id;

    if (!expectedFighterId || expectedFighterId !== draft.fighterId) {
      throw new Error('Le combattant sélectionné ne correspond plus à ce coin du combat.');
    }

    let minimumWeightKg = draft.minimumWeightKg;
    let maximumWeightKg = draft.maximumWeightKg;
    let minInclusive = false;
    let maxInclusive = true;

    if (fightResult.data.weight_category_id) {
      const categoryResult = await this.supabase
        .from('discipline_weight_categories')
        .select('min_weight_kg,max_weight_kg,min_inclusive,max_inclusive')
        .eq('id', fightResult.data.weight_category_id)
        .maybeSingle();

      if (categoryResult.error) throw categoryResult.error;
      if (!categoryResult.data) {
        throw new Error('La catégorie réglementaire liée au combat est introuvable.');
      }

      minimumWeightKg = categoryResult.data.min_weight_kg;
      maximumWeightKg = categoryResult.data.max_weight_kg;
      minInclusive = categoryResult.data.min_inclusive;
      maxInclusive = categoryResult.data.max_inclusive;
    } else if (minimumWeightKg === null && maximumWeightKg === null) {
      const previousBoundsResult = await this.supabase
        .from('weigh_ins')
        .select('minimum_weight_kg,maximum_weight_kg')
        .eq('event_id', eventId)
        .eq('fight_id', draft.fightId)
        .or('minimum_weight_kg.not.is.null,maximum_weight_kg.not.is.null')
        .order('attempt_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (previousBoundsResult.error) throw previousBoundsResult.error;

      minimumWeightKg = previousBoundsResult.data?.minimum_weight_kg ?? null;
      maximumWeightKg = previousBoundsResult.data?.maximum_weight_kg ?? null;
    }

    if (!Number.isFinite(draft.measuredWeightKg) || draft.measuredWeightKg <= 0) {
      throw new Error('Le poids mesuré doit être supérieur à 0 kg.');
    }

    const previousAttempts = await this.supabase
      .from('weigh_ins')
      .select('attempt_number')
      .eq('event_id', eventId)
      .eq('fight_id', draft.fightId)
      .eq('fighter_id', draft.fighterId)
      .order('attempt_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (previousAttempts.error) throw previousAttempts.error;

    const nextAttempt = Number(previousAttempts.data?.attempt_number ?? 0) + 1;

    if (nextAttempt > 2) {
      throw new Error(
        'Deux tentatives de pesée maximum sont autorisées pour ce combattant.',
      );
    }

    const status = autoCompliance(
      draft.measuredWeightKg,
      minimumWeightKg,
      maximumWeightKg,
      minInclusive,
      maxInclusive,
    );
    const now = new Date().toISOString();
    const authResult = await this.supabase.auth.getUser();
    const userId = authResult.data.user?.id ?? null;

    const insertResult = await this.supabase
      .from('weigh_ins')
      .insert({
        event_id: eventId,
        fight_id: draft.fightId,
        fighter_id: draft.fighterId,
        attempt_number: nextAttempt,
        minimum_weight_kg: minimumWeightKg,
        maximum_weight_kg: maximumWeightKg,
        measured_weight_kg: draft.measuredWeightKg,
        measured_at: now,
        compliance_status: status,
        notes: draft.notes.trim() || null,
        validated_by: status === 'pending' ? null : userId,
        validated_at: status === 'pending' ? null : now,
        updated_at: now,
      })
      .select('id')
      .single();

    if (insertResult.error) throw insertResult.error;

    const historyResult = await this.supabase
      .from('weigh_in_history')
      .insert({
        weigh_in_id: insertResult.data.id,
        from_status: null,
        to_status: status,
        measured_weight_kg: draft.measuredWeightKg,
        reason: draft.notes.trim() || 'Mesure enregistrée depuis Fight Center.',
        changed_by: userId,
      });

    if (historyResult.error) throw historyResult.error;
  }

  async waive(
    eventId: string,
    draft: FightWeighInWaiverDraft,
  ): Promise<void> {
    const reason = draft.reason.trim();

    if (!reason) {
      throw new Error('Le motif de la dérogation est obligatoire.');
    }

    const currentResult = await this.supabase
      .from('weigh_ins')
      .select('id,event_id,fight_id,compliance_status,measured_weight_kg,notes')
      .eq('id', draft.weighInId)
      .eq('event_id', eventId)
      .maybeSingle();

    if (currentResult.error) throw currentResult.error;
    if (!currentResult.data) throw new Error('Pesée introuvable.');

    const currentStatus = complianceStatus(
      currentResult.data.compliance_status,
    );

    if (currentStatus !== 'underweight' && currentStatus !== 'overweight') {
      throw new Error('Seule une pesée hors limite peut recevoir une dérogation.');
    }

    if (!currentResult.data.fight_id) {
      throw new Error('La pesée doit être rattachée à un combat pour recevoir une dérogation.');
    }

    const fightResult = await this.supabase
      .from('fights')
      .select('status')
      .eq('id', currentResult.data.fight_id)
      .eq('event_id', eventId)
      .maybeSingle();

    if (fightResult.error) throw fightResult.error;
    if (!fightResult.data) throw new Error('Combat introuvable pour cette pesée.');

    if (PROTECTED_FIGHT_STATUSES.has(normalized(fightResult.data.status))) {
      throw new Error('La dérogation ne peut plus être modifiée dans l’état actuel du combat.');
    }

    const authResult = await this.supabase.auth.getUser();
    const userId = authResult.data.user?.id ?? null;
    const now = new Date().toISOString();

    const updateResult = await this.supabase
      .from('weigh_ins')
      .update({
        compliance_status: 'waiver',
        notes: reason,
        validated_by: userId,
        validated_at: now,
        updated_at: now,
      })
      .eq('id', draft.weighInId)
      .eq('event_id', eventId);

    if (updateResult.error) throw updateResult.error;

    const historyResult = await this.supabase
      .from('weigh_in_history')
      .insert({
        weigh_in_id: draft.weighInId,
        from_status: currentResult.data.compliance_status,
        to_status: 'waiver',
        measured_weight_kg: currentResult.data.measured_weight_kg,
        reason,
        changed_by: userId,
      });

    if (historyResult.error) throw historyResult.error;
  }
}
