import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/infrastructure/supabase/database.types';
import { normalizeBackendError } from '@/shared/errors/backend-error';
import { OrganizerOperationsError } from '@/modules/organizer-operations/errors';
import type { OrganizerContextRepository } from '@/modules/organizer-operations/repositories/organizer-operations.repository';
import type { EventPlatformRepository } from './event-platform.repository';
import type { EventChecklistItem, EventPlatformSnapshot, EventRecord, EventSponsor, EventStaffAssignment, EventStatus, FightCardEntry, RegistrationDecision, RegistrationHistoryEntry } from '../types';
import type { EventMode } from '../types';

type EventRow = Database['public']['Tables']['events']['Row'];
const asStatus = (value: string | null): EventStatus => ['draft', 'published', 'ongoing', 'completed', 'cancelled', 'archived'].includes(value ?? '') ? value as EventStatus : 'draft';

export class EventSupabaseRepository implements EventPlatformRepository {
  constructor(private readonly supabase: SupabaseClient<Database>, private readonly organizerContext?: OrganizerContextRepository, private readonly mode: EventMode = 'public') {}
  private async organizationId() { return this.organizerContext ? (await this.organizerContext.resolve()).organizationId : null; }
  private rethrow(reason: unknown): never { if (reason instanceof OrganizerOperationsError) throw reason; throw normalizeBackendError(reason); }

  async getSnapshot(): Promise<EventPlatformSnapshot> {
    // EVENT-PUBLIC-RLS-FIX-1
    //
    // Le site public ne doit jamais charger les données
    // opérationnelles privées de l'ERP organisateur.
    //
    // La source de vérité de la visibilité publique est la
    // politique RLS events_public_published_read :
    //
    //   visibility = 'public'
    //   published_at IS NOT NULL
    //   archived_at IS NULL
    //
    // Les données privées restent accessibles uniquement dans
    // les modes métier autorisés par leurs propres RLS.
    if (this.mode === 'public') {
      try {
        const publicEventsResult = await this.supabase
          .from('events')
          .select('*')
          .eq('visibility', 'public')
          .not('published_at', 'is', null)
          .is('archived_at', null)
          .order('starts_at', {
            ascending: true,
            nullsFirst: false,
          })
          .limit(100);

        if (publicEventsResult.error) {
          throw publicEventsResult.error;
        }

        const publicEvents =
          publicEventsResult.data ?? [];

        const publicEventIds =
          publicEvents.map(
            (event) => event.id,
          );

        /*
         * Ces trois enrichissements possèdent une politique
         * de lecture publique dans Supabase.
         *
         * Ils restent facultatifs : une évolution de leur RLS
         * ne doit jamais empêcher le catalogue d'événements
         * publics de fonctionner.
         */
        let publicFightCards:
          Database['public']['Tables']['fight_card']['Row'][] = [];

        let publicFights:
          Database['public']['Tables']['fights']['Row'][] = [];

        let publicTicketTypes:
          Database['public']['Tables']['ticket_types']['Row'][] = [];

        if (publicEventIds.length > 0) {
          const [
            fightCardResult,
            fightsResult,
            ticketTypesResult,
          ] = await Promise.all([
            this.supabase
              .from('fight_card')
              .select('*')
              .in(
                'event_id',
                publicEventIds,
              )
              .order(
                'fight_order',
              ),

            this.supabase
              .from('fights')
              .select('*')
              .in(
                'event_id',
                publicEventIds,
              )
              .order(
                'fight_order',
              ),

            this.supabase
              .from('ticket_types')
              .select('*')
              .in(
                'event_id',
                publicEventIds,
              ),
          ]);

          /*
           * Les enrichissements publics sont volontairement
           * non bloquants.
           *
           * L'événement public reste affichable même si une
           * fonction secondaire n'est momentanément pas exposée.
           */
          if (!fightCardResult.error) {
            publicFightCards =
              fightCardResult.data ?? [];
          }

          if (!fightsResult.error) {
            publicFights =
              fightsResult.data ?? [];
          }

          if (!ticketTypesResult.error) {
            publicTicketTypes =
              ticketTypesResult.data ?? [];
          }
        }

        const [organizationsResult, citiesResult, regionsResult] = await Promise.all([
          this.supabase.from('organizations').select('id,name').in('id', publicEvents.map((event) => event.organizer_id).filter((id): id is string => Boolean(id))),
          this.supabase.from('cities').select('id,name').in('id', publicEvents.map((event) => event.city_id).filter((id): id is string => Boolean(id))),
          this.supabase.from('regions').select('id,name').in('id', publicEvents.map((event) => event.region_id).filter((id): id is string => Boolean(id))),
        ]);
        const organizationNames = new Map((organizationsResult.data ?? []).map((item) => [item.id, item.name]));
        const cityNames = new Map((citiesResult.data ?? []).map((item) => [item.id, item.name]));
        const regionNames = new Map((regionsResult.data ?? []).map((item) => [item.id, item.name]));

        const fightsByEvent =
          new Map<string, number>();

        for (
          const fight of publicFights
        ) {
          if (!fight.event_id) {
            continue;
          }

          fightsByEvent.set(
            fight.event_id,
            (
              fightsByEvent.get(
                fight.event_id,
              ) ?? 0
            ) + 1,
          );
        }

        const soldTicketsByEvent =
          new Map<string, number>();

        for (
          const ticketType of publicTicketTypes
        ) {
          if (!ticketType.event_id) {
            continue;
          }

          soldTicketsByEvent.set(
            ticketType.event_id,
            (
              soldTicketsByEvent.get(
                ticketType.event_id,
              ) ?? 0
            ) +
              Number(
                ticketType.sold_quantity ??
                  0,
              ),
          );
        }

        return {
          events:
            publicEvents.map(
              (event) => ({
                ...this.mapEvent(
                  event,
                  null,
                  event.organizer_id ? organizationNames.get(event.organizer_id) : undefined,
                  {
                    sold:
                      soldTicketsByEvent.get(
                        event.id,
                      ) ?? 0,

                    /*
                     * Le chiffre d'affaires de billetterie
                     * n'est pas public.
                     */
                    revenue: 0,
                  },
                  fightsByEvent.get(
                    event.id,
                  ) ?? 0,
                ),
                city: event.city_id ? cityNames.get(event.city_id) ?? '' : '',
                region: event.region_id ? regionNames.get(event.region_id) ?? '' : '',
              }),
            ),

          /*
           * Les modules suivants ne doivent pas récupérer les
           * données privées de l'ERP lors d'une consultation
           * anonyme.
           */
          competitions: [],

          fightCard:
            publicFightCards.map(
              (item) =>
                this.mapFightCard(
                  item,
                ),
            ),

          registrations: [],
          participants: [],
          staff: [],
          checklists: [],
          sponsors: [],

          ticketTypes:
            publicTicketTypes.flatMap(
              (item) => {

                const eventId =
                  item.event_id;


                /*
                 * ticket_types.event_id est nullable côté DB.
                 * Une entrée sans event_id ne peut pas appartenir
                 * au catalogue public d'un événement.
                 */

                if (
                  !eventId ||
                  !publicEventIds.includes(
                    eventId,
                  )
                ) {

                  return [];
                }


                return [
                  {
                    id:
                      item.id,

                    eventId,

                    name:
                      item.name,

                    category: item.category,

                    price:
                      item.price,

                    quota:
                      item.total_quantity,

                    sold:
                      item.sold_quantity ??
                      0,


                    active: item.status === 'active' || item.status === 'published',
                  },
                ];
              },
            ),

          /*
           * Les billets individuels et ventes sont privés.
           */
          tickets: [],
          accessLogs: [],

          /*
           * Ces projections publiques seront connectées
           * séparément à leurs tables publiques dédiées.
           */
          schedule: [],
          results: [],
          reports: [],
        };
      }
      catch (reason) {
        this.rethrow(reason);
      }
    }

    try {
      const organizationId = await this.organizationId();

      let eventQuery = this.supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (organizationId) {
        eventQuery = eventQuery.eq('organizer_id', organizationId);
      }

      const eventsResult = await eventQuery;

      if (eventsResult.error) {
        throw eventsResult.error;
      }

      const events = eventsResult.data ?? [];

      if (events.length === 0) {
        return {
          events: [],
          competitions: [],
          fightCard: [],
          registrations: [],
          participants: [],
          staff: [],
          checklists: [],
          sponsors: [],
          ticketTypes: [],
          tickets: [],
          accessLogs: [],
          schedule: [],
          results: [],
          reports: [],
        };
      }

      const eventIdList = events.map((event) => event.id);
      const eventIds = new Set(eventIdList);

      const [
        organizationsResult,
        checklistsResult,
        sponsorsResult,
        sponsorNamesResult,
        staffResult,
        ticketTypesResult,
        salesResult,
        cardResult,
        fightsResult,
        competitionsResult,
        registrationsResult,
        participantsResult,
        accessLogsResult,
        scheduleResult,
        reportsResult,
      ] = await Promise.all([
        this.supabase.from('organizations').select('id,name'),

        this.supabase
          .from('event_checklists')
          .select('*')
          .in('event_id', eventIdList),

        this.supabase
          .from('event_sponsors')
          .select('*')
          .in('event_id', eventIdList),

        this.supabase
          .from('sponsors')
          .select('id,name'),

        this.supabase
          .from('staff_assignments')
          .select('*')
          .in('event_id', eventIdList),

        this.supabase
          .from('ticket_types')
          .select('*')
          .in('event_id', eventIdList),


        this.supabase
          .from('ticket_sales')
          .select('*')
          .in('event_id', eventIdList),

        this.supabase
          .from('fight_card')
          .select('*')
          .in('event_id', eventIdList)
          .order('fight_order'),

        this.supabase
          .from('fights')
          .select('*')
          .in('event_id', eventIdList)
          .order('fight_order'),

        this.supabase
          .from('competitions')
          .select('*')
          .in('event_id', eventIdList),

        this.supabase
          .from('event_registrations')
          .select('*')
          .in('event_id', eventIdList)
          .order('submitted_at', { ascending: false }),

        this.supabase
          .from('event_participants')
          .select('*')
          .in('event_id', eventIdList),

        this.supabase
          .from('event_access_logs')
          .select('*')
          .in('event_id', eventIdList)
          .order('occurred_at', { ascending: false }),

        this.supabase
          .from('event_schedule_items')
          .select('*')
          .in('event_id', eventIdList)
          .order('starts_at'),

        this.supabase
          .from('event_reports')
          .select('*')
          .in('event_id', eventIdList)
          .order('created_at', { ascending: false }),
      ]);

      const firstError = [
        organizationsResult.error,
        checklistsResult.error,
        sponsorsResult.error,
        sponsorNamesResult.error,
        staffResult.error,
        ticketTypesResult.error,
        salesResult.error,
        cardResult.error,
        fightsResult.error,
        competitionsResult.error,
        registrationsResult.error,
        participantsResult.error,
        accessLogsResult.error,
        scheduleResult.error,
        reportsResult.error,
      ].find(Boolean);

      if (firstError) {
        throw firstError;
      }

      const competitions = competitionsResult.data ?? [];
      const registrations = registrationsResult.data ?? [];

      const competitionIds = competitions.map((item) => item.id);
      const registrationIds = registrations.map((item) => item.id);
      const profileIds = Array.from(new Set([
        ...registrations.flatMap((item) => [
          item.applicant_profile_id,
          item.reviewed_by,
        ]),
        ...(participantsResult.data ?? []).map((item) => item.profile_id),
      ].filter((id): id is string => Boolean(id))));

      const [
        categoriesResult,
        registrationHistoryResult,
        profilesResult,
      ] = await Promise.all([
        competitionIds.length
          ? this.supabase
              .from('competition_categories')
              .select('*')
              .in('competition_id', competitionIds)
          : Promise.resolve({ data: [], error: null }),

        registrationIds.length
          ? this.supabase
              .from('event_registration_history')
              .select('*')
              .in('registration_id', registrationIds)
              .order('created_at')
          : Promise.resolve({ data: [], error: null }),

        profileIds.length
          ? this.supabase
              .from('profiles')
              .select('id,full_name')
              .in('id', profileIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (categoriesResult.error) {
        throw categoriesResult.error;
      }

      if (registrationHistoryResult.error) {
        throw registrationHistoryResult.error;
      }

      if (profilesResult.error) {
        throw profilesResult.error;
      }

      const organizationNames = new Map(
        (organizationsResult.data ?? []).map(
          (item) => [item.id, item.name],
        ),
      );

      const profileNames = new Map(
        (profilesResult.data ?? []).map(
          (item) => [item.id, item.full_name],
        ),
      );

      const sponsorNames = new Map(
        (sponsorNamesResult.data ?? []).map(
          (item) => [item.id, item.name],
        ),
      );

      const categoriesByCompetition = new Map<string, string[]>();

      for (const category of categoriesResult.data ?? []) {
        const current =
          categoriesByCompetition.get(category.competition_id) ?? [];

        current.push(category.name);

        categoriesByCompetition.set(
          category.competition_id,
          current,
        );
      }

      const categoryNames = new Map(
        (categoriesResult.data ?? []).map(
          (item) => [item.id, item.name],
        ),
      );

      const historyByRegistration = new Map<string, RegistrationHistoryEntry[]>();

      for (const history of registrationHistoryResult.data ?? []) {
        const current =
          historyByRegistration.get(history.registration_id) ?? [];

        current.push({
          id: history.id,
          fromStatus: history.from_status
            ? history.from_status as RegistrationHistoryEntry['fromStatus']
            : undefined,
          toStatus: history.to_status as RegistrationHistoryEntry['toStatus'],
          changedBy: history.changed_by ?? undefined,
          reason: history.reason ?? undefined,
          createdAt: history.created_at,
        });

        historyByRegistration.set(
          history.registration_id,
          current,
        );
      }

      const salesByEvent =
        new Map<string, { sold: number; revenue: number }>();

      for (const sale of salesResult.data ?? []) {
        if (!sale.event_id || !eventIds.has(sale.event_id)) {
          continue;
        }

        const current =
          salesByEvent.get(sale.event_id) ??
          { sold: 0, revenue: 0 };

        current.sold += sale.quantity ?? 0;
        current.revenue += sale.total_amount ?? 0;

        salesByEvent.set(sale.event_id, current);
      }

      const fightsByEvent = new Map<string, number>();

      for (const fight of fightsResult.data ?? []) {
        if (!fight.event_id || !eventIds.has(fight.event_id)) {
          continue;
        }

        fightsByEvent.set(
          fight.event_id,
          (fightsByEvent.get(fight.event_id) ?? 0) + 1,
        );
      }

      return {
        events: events.map((event) =>
          this.mapEvent(
            event,
            organizationId,
            event.organizer_id
              ? organizationNames.get(event.organizer_id)
              : undefined,
            salesByEvent.get(event.id),
            fightsByEvent.get(event.id) ?? 0,
          ),
        ),

        competitions: competitions.map((item) => ({
          id: item.id,
          eventId: item.event_id,
          name: item.name,
          kind:
            item.kind as EventPlatformSnapshot['competitions'][number]['kind'],
          categories:
            categoriesByCompetition.get(item.id) ?? [],
          rules: item.rules ?? '',
          participantIds: [],
          ranking: [],
        })),

        fightCard: (cardResult.data ?? []).flatMap((item) =>
          item.event_id && eventIds.has(item.event_id)
            ? [this.mapFightCard(item)]
            : [],
        ),

        registrations: registrations.map((item) => ({
          id: item.id,
          eventId: item.event_id,
          applicantType:
            item.applicant_type as EventPlatformSnapshot['registrations'][number]['applicantType'],
          applicantProfileId: item.applicant_profile_id ?? undefined,
          applicantOrganizationId: item.applicant_organization_id ?? undefined,
          applicantName:
            (item.applicant_profile_id
              ? profileNames.get(item.applicant_profile_id)
              : undefined) ??
            (item.applicant_organization_id
              ? organizationNames.get(item.applicant_organization_id)
              : undefined) ??
            '',
          categoryId: item.competition_category_id ?? undefined,
          category:
            item.competition_category_id
              ? categoryNames.get(item.competition_category_id) ?? ''
              : '',
          weightKg: item.weight_kg ?? undefined,
          licenceNumber: item.license_number ?? undefined,
          medicalCertificate: Boolean(item.medical_certificate_path),
          documents: item.document_paths,
          paymentStatus:
            item.payment_status as EventPlatformSnapshot['registrations'][number]['paymentStatus'],
          eligibilityStatus:
            item.eligibility_status as EventPlatformSnapshot['registrations'][number]['eligibilityStatus'],
          status:
            item.status as EventPlatformSnapshot['registrations'][number]['status'],
          submittedAt: item.submitted_at,
          reviewedBy: item.reviewed_by ?? undefined,
          reviewedAt: item.reviewed_at ?? undefined,
          decisionReason: item.decision_reason ?? undefined,
          waitlistPosition: item.waitlist_position ?? undefined,
          history:
            historyByRegistration.get(item.id) ?? [],
        })),

        participants: (participantsResult.data ?? []).map((item) => ({
          id: item.id,
          eventId: item.event_id,
          name:
            (item.profile_id
              ? profileNames.get(item.profile_id)
              : undefined) ??
            (item.organization_id
              ? organizationNames.get(item.organization_id)
              : undefined) ??
            '',
          kind:
            item.participant_type as EventPlatformSnapshot['participants'][number]['kind'],
          status: item.status,
        })),

        staff: (staffResult.data ?? []).flatMap((item) =>
          item.event_id && eventIds.has(item.event_id)
            ? [this.mapStaff(item)]
            : [],
        ),

        checklists: (checklistsResult.data ?? []).flatMap((item) =>
          item.event_id && eventIds.has(item.event_id)
            ? [this.mapChecklist(item)]
            : [],
        ),

        sponsors: (sponsorsResult.data ?? []).flatMap((item) =>
          item.event_id && eventIds.has(item.event_id)
            ? [
                this.mapSponsor(
                  item,
                  item.sponsor_id
                    ? sponsorNames.get(item.sponsor_id)
                    : undefined,
                ),
              ]
            : [],
        ),

        ticketTypes: (ticketTypesResult.data ?? []).flatMap((item) =>
          item.event_id && eventIds.has(item.event_id)
            ? [{
                id: item.id,
                eventId: item.event_id,
                name: item.name,
                category: item.category,
                price: item.price,
                quota: item.total_quantity,
                sold: item.sold_quantity ?? 0,
                active: item.status === 'active' || item.status === 'published',
              }]
            : [],
        ),

        tickets: [],

        accessLogs: (accessLogsResult.data ?? []).map((item) => ({
          id: item.id,
          ticketId: item.ticket_id,
          result:
            item.result as EventPlatformSnapshot['accessLogs'][number]['result'],
          occurredAt: item.occurred_at,
          operator: item.operator_profile_id ?? '',
          zone: item.zone ?? '',
          manual: item.manual,
        })),

        schedule: (scheduleResult.data ?? []).map((item) => ({
          id: item.id,
          eventId: item.event_id,
          kind:
            item.kind as EventPlatformSnapshot['schedule'][number]['kind'],
          title: item.title,
          startsAt: item.starts_at,
          endsAt: item.ends_at,
          location: item.location ?? '',
          notificationPrepared: item.notification_prepared,
        })),

        results: (fightsResult.data ?? [])
          .filter(
            (item) =>
              item.event_id &&
              (
                item.status === 'completed' ||
                item.winner_id !== null ||
                item.method !== null
              ),
          )
          .map((item) => ({
            id: 'fight-result-' + item.id,
            eventId: item.event_id as string,
            fightId: item.id,
            title: 'Combat #' + item.fight_order,
            winner: item.winner_id ?? '',
            podium: [],
            decision: item.method ?? '',
            statistics: (
              item.ending_round !== null
                ? { endingRound: item.ending_round }
                : {}
            ) as Record<string, number>,
            published: item.status === 'completed',
            officialReportPrepared: false,
            exportPrepared: false,
            source: 'unknown' as const,
          })),

        reports: (reportsResult.data ?? []).map((item) => ({
          id: item.id,
          eventId: item.event_id,
          kind:
            item.kind as EventPlatformSnapshot['reports'][number]['kind'],
          title: item.title,
          status:
            item.status as EventPlatformSnapshot['reports'][number]['status'],
          generatedAt: item.generated_at ?? undefined,
          exportPrepared: false,
        })),
      };
    }
    catch (reason) {
      this.rethrow(reason);
    }
  }

  async getEvent(id: string) { return (await this.getSnapshot()).events.find((event) => event.id === id) ?? null; }
  async createEvent(
    input: Pick<
      EventRecord,
      'title' | 'discipline' | 'venue' | 'city' | 'startsAt'
    >,
  ): Promise<EventRecord> {
    try {
      const organizationId = await this.organizationId();

      const { data, error } = await this.supabase
        .from('events')
        .insert({
          title: input.title,
          venue: input.venue,
          status: 'draft',
          organizer_id: organizationId,
          starts_at: input.startsAt,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.mapEvent(
        data,
        organizationId,
      );
    }
    catch (reason) {
      this.rethrow(reason);
    }
  }

  async updateEvent(
    id: string,
    patch: Partial<EventRecord>,
  ) {
    try {
      const organizationId = await this.organizationId();

      const update:
        Database['public']['Tables']['events']['Update'] = {
          updated_at: new Date().toISOString(),
        };

      if (patch.title !== undefined) {
        update.title = patch.title;
      }

      if (patch.venue !== undefined) {
        update.venue = patch.venue;
      }

      if (patch.status !== undefined) {
        update.status = patch.status;
      }

      if (patch.startsAt !== undefined) {
        update.starts_at = patch.startsAt;
      }

      if (patch.endsAt !== undefined) {
        update.ends_at = patch.endsAt;
      }

      if (patch.capacity !== undefined) {
        update.capacity =
          patch.capacity > 0
            ? patch.capacity
            : null;
      }

      if (patch.visibility !== undefined) {
        update.visibility = patch.visibility;
      }

      let query = this.supabase
        .from('events')
        .update(update)
        .eq('id', id);

      if (organizationId) {
        query = query.eq(
          'organizer_id',
          organizationId,
        );
      }

      const { data, error } = await query
        .select()
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      return this.mapEvent(
        data,
        organizationId,
      );
    }
    catch (reason) {
      this.rethrow(reason);
    }
  }

  async removeEvent(id: string) {
    try {
      const organizationId = await this.organizationId(); let query = this.supabase.from('events').delete({ count: 'exact' }).eq('id', id); if (organizationId) query = query.eq('organizer_id', organizationId);
      const { error, count } = await query; if (error) throw error; return Boolean(count);
    } catch (reason) { this.rethrow(reason); }
  }
  changeEventStatus(id: string, nextStatus: EventStatus) { return this.updateEvent(id, { status: nextStatus }); }
  async decideRegistration(
    id: string,
    decision: RegistrationDecision,
  ) {
    try {
      const { error } = await this.supabase.rpc(
        'review_event_registration',
        {
          p_registration_id: id,
          p_status: decision.status,
          p_eligibility_status: decision.eligibilityStatus,
          p_reason: decision.reason,
          p_waitlist_position: decision.waitlistPosition,
          p_payment_status: decision.paymentStatus,
        },
      );

      if (error) {
        throw error;
      }
    } catch (reason) {
      this.rethrow(reason);
    }
  }
  async toggleChecklist(id: string) {
    try {
      const organizationId = await this.organizationId(); const { data, error } = await this.supabase.from('event_checklists').select('is_completed,event_id').eq('id', id).maybeSingle();
      if (error) throw error; if (!data?.event_id) return;
      if (organizationId) { const owned = await this.supabase.from('events').select('id').eq('id', data.event_id).eq('organizer_id', organizationId).maybeSingle(); if (owned.error) throw owned.error; if (!owned.data) throw new OrganizerOperationsError('FORBIDDEN'); }
      const update = await this.supabase.from('event_checklists').update({ is_completed: !data.is_completed }).eq('id', id); if (update.error) throw update.error;
    } catch (reason) { this.rethrow(reason); }
  }
  async validateTicket(
    code: string,
    operator: string,
    zone: string,
  ): Promise<"accepted" | "used" | "refused" | "duplicate"> {
    try {
      /*
       * L'opérateur réel est auth.uid() dans le RPC.
       * On n'utilise jamais une chaîne fournie par le client
       * comme autorité d'identité.
       */
      void operator;

      const ticketId = code.trim();

      const { data, error } = await this.supabase.rpc(
        'record_event_ticket_access',
        {
          p_ticket_id: ticketId,
          p_zone: zone.trim(),
          p_result: 'accepted',
          p_manual: false,
        },
      );

      if (error) {
        throw error;
      }

      if (
        data !== 'accepted' &&
        data !== 'used' &&
        data !== 'refused' &&
        data !== 'duplicate'
      ) {
        throw new Error(
          'Résultat de contrôle billet invalide.',
        );
      }

      return data;
    }
    catch (reason) {
      this.rethrow(reason);
    }
  }

  private mapEvent(row: EventRow, _organizationId: string | null, organizerName = 'Organisation', sales?: { sold: number; revenue: number }, fights = 0): EventRecord {
    return { id: row.id, title: row.title, description: '', discipline: '', organizerId: row.organizer_id ?? '', organizerName, venue: row.venue ?? '', region: '', city: '', capacity: row.capacity ?? 0, startsAt: row.starts_at ?? row.created_at ?? new Date(0).toISOString(), endsAt: row.ends_at ?? row.starts_at ?? row.updated_at ?? row.created_at ?? new Date(0).toISOString(), budget: 0, status: asStatus(row.status), visibility: row.visibility === 'public' ? 'public' : row.visibility === 'unlisted' ? 'unlisted' : 'private', contacts: [], statistics: { registrations: 0, ticketsSold: sales?.sold ?? 0, fights, revenue: sales?.revenue ?? 0 } };
  }
  private mapChecklist(row: Database['public']['Tables']['event_checklists']['Row']): EventChecklistItem { return { id: row.id, eventId: row.event_id as string, category: 'administration', title: row.task_name, assignee: '', dueAt: '', priority: row.critical_blocking ? 'critical' : 'normal', status: row.is_completed ? 'validated' : 'todo' }; }
  private mapSponsor(row: Database['public']['Tables']['event_sponsors']['Row'], name = 'Sponsor'): EventSponsor { return { id: row.id, eventId: row.event_id as string, name, level: 'partner', packageName: '', amount: row.amount, benefits: [], visibility: [], contractPrepared: Boolean(row.contract_start || row.contract_end), deliverables: [], status: 'confirmed', history: [] }; }
  private mapStaff(row: Database['public']['Tables']['staff_assignments']['Row']): EventStaffAssignment { return { id: row.id, eventId: row.event_id as string, name: row.staff_name, role: row.role, availability: '', schedule: row.assigned_at ?? '', mission: row.role, status: row.status === 'confirmed' || row.status === 'declined' || row.status === 'completed' ? row.status : 'invited', documents: [], email: '', phone: row.phone ?? undefined }; }
  private mapFightCard(row: Database['public']['Tables']['fight_card']['Row']): FightCardEntry { return { id: row.id, eventId: row.event_id as string, order: row.fight_order, billing: row.tag === 'main_event' || row.tag === 'co_main_event' ? row.tag : 'preliminary', redFighter: row.fighter_a_id ?? 'À confirmer', blueFighter: row.fighter_b_id ?? 'À confirmer', discipline: '', weightCategory: '', rounds: 0, roundDurationSeconds: 0, status: row.is_confirmed ? 'confirmed' : 'planned' }; }
}
