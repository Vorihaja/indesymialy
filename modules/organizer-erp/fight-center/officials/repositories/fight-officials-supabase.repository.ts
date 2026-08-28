import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/infrastructure/supabase/database.types';
import type { FightOfficialsRepository } from './fight-officials.repository';
import type {
  AssignFightOfficialDraft,
  FightOfficialAssignment,
  FightOfficialCandidate,
  FightOfficialRole,
  FightOfficialStatus,
  FightOfficialsFight,
  FightOfficialsSnapshot,
  OfficialAvailabilityStatus,
  UnlinkedOfficialMention,
  UpdateFightOfficialStatusDraft,
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
  | 'weight_category'
>;

type FighterRow = Pick<
  Database['public']['Tables']['fighters']['Row'],
  'id' | 'full_name' | 'nickname'
>;

type DisciplineRow = Pick<
  Database['public']['Tables']['disciplines']['Row'],
  'id' | 'name'
>;

type EventOfficialRow = Pick<
  Database['public']['Tables']['event_official_assignments']['Row'],
  'id' | 'event_id' | 'profile_id' | 'mention' | 'role' | 'status'
>;

type FightAssignmentRow = Database['public']['Tables']['fight_official_assignments']['Row'];

type AvailabilityRow = Pick<
  Database['public']['Tables']['official_availability']['Row'],
  | 'event_id'
  | 'official_profile_id'
  | 'availability_status'
  | 'available_from'
  | 'available_until'
>;

type ProfileRow = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'id' | 'full_name'
>;

const BLOCKED_ROSTER_STATUSES = new Set([
  'cancelled',
  'canceled',
  'declined',
  'rejected',
]);

const ACTIVE_FIGHT_ASSIGNMENT_STATUSES = new Set([
  'assigned',
  'confirmed',
  'completed',
]);

function normalized(value: string | null | undefined) {
  return (value ?? '')
    .trim()
    .toLocaleLowerCase('fr-FR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function canonicalRole(value: string | null | undefined): FightOfficialRole | null {
  const role = normalized(value);

  if (
    role === 'referee' ||
    role === 'arbitre' ||
    role === 'arbitre central'
  ) {
    return 'referee';
  }

  if (role === 'judge' || role === 'juge') {
    return 'judge';
  }

  if (
    role === 'timekeeper' ||
    role === 'chronometreur' ||
    role === 'chronometre'
  ) {
    return 'timekeeper';
  }

  if (
    role === 'doctor' ||
    role === 'medecin' ||
    role === 'medecin de combat'
  ) {
    return 'doctor';
  }

  if (
    role === 'supervisor' ||
    role === 'superviseur' ||
    role === 'commissaire'
  ) {
    return 'supervisor';
  }

  return null;
}

function assignmentStatus(value: string | null): FightOfficialStatus {
  switch (value) {
    case 'confirmed':
      return 'confirmed';
    case 'declined':
      return 'declined';
    case 'cancelled':
      return 'cancelled';
    case 'completed':
      return 'completed';
    default:
      return 'assigned';
  }
}

function availabilityStatus(
  value: string | null | undefined,
): OfficialAvailabilityStatus {
  switch (value) {
    case 'pending':
    case 'available':
    case 'unavailable':
    case 'tentative':
      return value;
    default:
      return null;
  }
}

function displayFighterName(
  fighter: FighterRow | null,
  fallback: string,
) {
  if (!fighter) return fallback;
  if (fighter.nickname?.trim()) {
    return `${fighter.full_name} · “${fighter.nickname.trim()}”`;
  }
  return fighter.full_name;
}

function sortAssignments(
  left: FightOfficialAssignment,
  right: FightOfficialAssignment,
) {
  const order: Record<FightOfficialRole, number> = {
    referee: 0,
    judge: 1,
    timekeeper: 2,
    doctor: 3,
    supervisor: 4,
  };

  return (
    order[left.role] - order[right.role] ||
    Number(left.position ?? 0) - Number(right.position ?? 0) ||
    left.name.localeCompare(right.name, 'fr')
  );
}

export class FightOfficialsSupabaseRepository implements FightOfficialsRepository {
  constructor(
    private readonly supabase: SupabaseClient<Database>,
  ) {}

  async load(eventId: string): Promise<FightOfficialsSnapshot> {
    const [eventResult, fightsResult, rosterResult, availabilityResult] =
      await Promise.all([
        this.supabase
          .from('events')
          .select('id,title')
          .eq('id', eventId)
          .maybeSingle(),
        this.supabase
          .from('fights')
          .select(
            'id,event_id,fight_order,status,discipline_id,fighter_red_id,fighter_blue_id,weight_category',
          )
          .eq('event_id', eventId)
          .is('archived_at', null)
          .order('fight_order', { ascending: true }),
        this.supabase
          .from('event_official_assignments')
          .select('id,event_id,profile_id,mention,role,status')
          .eq('event_id', eventId)
          .order('created_at', { ascending: true }),
        this.supabase
          .from('official_availability')
          .select(
            'event_id,official_profile_id,availability_status,available_from,available_until',
          )
          .eq('event_id', eventId),
      ]);

    const firstError =
      eventResult.error ??
      fightsResult.error ??
      rosterResult.error ??
      availabilityResult.error;

    if (firstError) throw firstError;

    const fights = (fightsResult.data ?? []) as FightRow[];
    const roster = (rosterResult.data ?? []) as EventOfficialRow[];
    const availability = (availabilityResult.data ?? []) as AvailabilityRow[];
    const fightIds = fights.map((fight) => fight.id);

    const assignmentsResult = fightIds.length
      ? await this.supabase
          .from('fight_official_assignments')
          .select('*')
          .in('fight_id', fightIds)
      : { data: [] as FightAssignmentRow[], error: null };

    if (assignmentsResult.error) throw assignmentsResult.error;

    const assignments = (assignmentsResult.data ?? []) as FightAssignmentRow[];
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
    const profileIds = Array.from(
      new Set(
        [
          ...roster.map((item) => item.profile_id),
          ...assignments.map((item) => item.user_id),
        ].filter((id): id is string => Boolean(id)),
      ),
    );

    const [fightersResult, disciplinesResult, profilesResult] = await Promise.all([
      fighterIds.length
        ? this.supabase
            .from('fighters')
            .select('id,full_name,nickname')
            .in('id', fighterIds)
        : Promise.resolve({ data: [] as FighterRow[], error: null }),
      disciplineIds.length
        ? this.supabase
            .from('disciplines')
            .select('id,name')
            .in('id', disciplineIds)
        : Promise.resolve({ data: [] as DisciplineRow[], error: null }),
      profileIds.length
        ? this.supabase
            .from('profiles')
            .select('id,full_name')
            .in('id', profileIds)
        : Promise.resolve({ data: [] as ProfileRow[], error: null }),
    ]);

    const relatedError =
      fightersResult.error ?? disciplinesResult.error ?? profilesResult.error;

    if (relatedError) throw relatedError;

    const fightersById = new Map(
      ((fightersResult.data ?? []) as FighterRow[]).map((fighter) => [
        fighter.id,
        fighter,
      ]),
    );
    const disciplineNames = new Map(
      ((disciplinesResult.data ?? []) as DisciplineRow[]).map((discipline) => [
        discipline.id,
        discipline.name,
      ]),
    );
    const profileNames = new Map(
      ((profilesResult.data ?? []) as ProfileRow[]).map((profile) => [
        profile.id,
        profile.full_name,
      ]),
    );
    const availabilityByProfile = new Map(
      availability.map((item) => [item.official_profile_id, item]),
    );

    const mappedAssignments = assignments
      .map((item): FightOfficialAssignment | null => {
        const role = canonicalRole(item.role);
        if (!role) return null;

        const availabilityItem = availabilityByProfile.get(item.user_id) ?? null;

        return {
          id: item.id,
          fightId: item.fight_id,
          userId: item.user_id,
          name: profileNames.get(item.user_id) ?? 'Officiel Indesy',
          role,
          position: item.position,
          status: assignmentStatus(item.status),
          assignedAt: item.assigned_at,
          availabilityStatus: availabilityStatus(
            availabilityItem?.availability_status,
          ),
        };
      })
      .filter((item): item is FightOfficialAssignment => Boolean(item));

    const candidates = roster
      .map((item): FightOfficialCandidate | null => {
        if (!item.profile_id) return null;

        const role = canonicalRole(item.role);
        if (!role) return null;

        if (BLOCKED_ROSTER_STATUSES.has(normalized(item.status))) {
          return null;
        }

        const availabilityItem = availabilityByProfile.get(item.profile_id) ?? null;

        return {
          eventAssignmentId: item.id,
          profileId: item.profile_id,
          name: profileNames.get(item.profile_id) ?? 'Officiel Indesy',
          rosterRole: item.role,
          canonicalRole: role,
          rosterStatus: item.status,
          availabilityStatus: availabilityStatus(
            availabilityItem?.availability_status,
          ),
          availableFrom: availabilityItem?.available_from ?? null,
          availableUntil: availabilityItem?.available_until ?? null,
        };
      })
      .filter((item): item is FightOfficialCandidate => Boolean(item))
      .sort((left, right) => left.name.localeCompare(right.name, 'fr'));

    const unlinkedMentions = roster
      .filter((item) => !item.profile_id && Boolean(item.mention?.trim()))
      .map(
        (item): UnlinkedOfficialMention => ({
          eventAssignmentId: item.id,
          mention: item.mention?.trim() ?? 'Mention externe',
          rosterRole: item.role,
          rosterStatus: item.status,
        }),
      );

    const mappedFights = fights.map((fight): FightOfficialsFight => {
      const red = fight.fighter_red_id
        ? fightersById.get(fight.fighter_red_id) ?? null
        : null;
      const blue = fight.fighter_blue_id
        ? fightersById.get(fight.fighter_blue_id) ?? null
        : null;

      return {
        fightId: fight.id,
        fightOrder: fight.fight_order,
        fightStatus: fight.status ?? 'scheduled',
        disciplineId: fight.discipline_id,
        disciplineName: disciplineNames.get(fight.discipline_id) ?? 'Discipline',
        weightCategory: fight.weight_category?.trim() || 'Catégorie N/C',
        red: {
          id: fight.fighter_red_id,
          name: displayFighterName(red, 'Coin rouge à confirmer'),
        },
        blue: {
          id: fight.fighter_blue_id,
          name: displayFighterName(blue, 'Coin bleu à confirmer'),
        },
        assignments: mappedAssignments
          .filter(
            (assignment) =>
              assignment.fightId === fight.id &&
              ACTIVE_FIGHT_ASSIGNMENT_STATUSES.has(assignment.status),
          )
          .sort(sortAssignments),
      };
    });

    return {
      eventId,
      eventName: eventResult.data?.title ?? 'Événement actif',
      fights: mappedFights,
      candidates,
      unlinkedMentions,
    };
  }

  async assign(
    eventId: string,
    draft: AssignFightOfficialDraft,
  ): Promise<void> {
    const fightResult = await this.supabase
      .from('fights')
      .select('id,event_id')
      .eq('id', draft.fightId)
      .maybeSingle();

    if (fightResult.error) throw fightResult.error;
    if (!fightResult.data || fightResult.data.event_id !== eventId) {
      throw new Error('Ce combat ne correspond pas à l’événement actif.');
    }

    const { error } = await this.supabase.rpc('assign_event_official_to_fight', {
      p_fight_id: draft.fightId,
      p_user_id: draft.userId,
      p_role: draft.role,
      p_position: draft.role === 'judge' ? draft.position ?? undefined : 1,
    });

    if (error) throw error;
  }

  async updateStatus(
    eventId: string,
    draft: UpdateFightOfficialStatusDraft,
  ): Promise<void> {
    const assignmentResult = await this.supabase
      .from('fight_official_assignments')
      .select('id,fight_id')
      .eq('id', draft.assignmentId)
      .maybeSingle();

    if (assignmentResult.error) throw assignmentResult.error;
    if (!assignmentResult.data) {
      throw new Error('Affectation officielle introuvable.');
    }

    const fightResult = await this.supabase
      .from('fights')
      .select('id,event_id')
      .eq('id', assignmentResult.data.fight_id)
      .maybeSingle();

    if (fightResult.error) throw fightResult.error;
    if (!fightResult.data || fightResult.data.event_id !== eventId) {
      throw new Error('Cette affectation ne correspond pas à l’événement actif.');
    }

    const { error } = await this.supabase
      .from('fight_official_assignments')
      .update({ status: draft.status })
      .eq('id', draft.assignmentId);

    if (error) throw error;
  }
}
