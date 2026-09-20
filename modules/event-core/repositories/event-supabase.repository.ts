import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/infrastructure/supabase/database.types';
import { normalizeBackendError, storageNotImplemented } from '@/shared/errors/backend-error';
import { OrganizerOperationsError } from '@/modules/organizer-operations/errors';
import type { OrganizerContextRepository } from '@/modules/organizer-operations/repositories/organizer-operations.repository';
import { EventMemoryRepository } from './event-memory.repository';
import type { EventChecklistItem, EventPlatformSnapshot, EventRecord, EventSponsor, EventStaffAssignment, EventStatus, FightCardEntry } from '../types';
import type { EventMode } from '../types';

type EventRow = Database['public']['Tables']['events']['Row'];
const overlays = new Map<string, Partial<EventRecord>>();
const asStatus = (value: string | null): EventStatus => ['draft', 'published', 'completed', 'cancelled', 'archived'].includes(value ?? '') ? value as EventStatus : 'draft';

export class EventSupabaseRepository extends EventMemoryRepository {
  constructor(private readonly supabase: SupabaseClient<Database>, private readonly organizerContext?: OrganizerContextRepository, private readonly mode: EventMode = 'public') { super(); }
  private async organizationId() { return this.organizerContext ? (await this.organizerContext.resolve()).organizationId : null; }
  private overlayKey(id: string, organizationId: string | null) { return `${organizationId ?? 'unscoped'}:${id}`; }
  private rethrow(reason: unknown): never { if (reason instanceof OrganizerOperationsError) throw reason; throw normalizeBackendError(reason); }

  override async getSnapshot(): Promise<EventPlatformSnapshot> {
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

                    category:
                      item.name,

                    price:
                      item.price,

                    quota:
                      item.total_quantity,

                    sold:
                      item.sold_quantity ??
                      0,

                    reserved:
                      0,

                    active:
                      true,
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

    const memory = await super.getSnapshot();
    try {
      const organizationId = await this.organizationId();
      let eventQuery = this.supabase.from('events').select('*').order('created_at', { ascending: false });
      if (organizationId) eventQuery = eventQuery.eq('organizer_id', organizationId);
      const eventsResult = await eventQuery;
      if (eventsResult.error) throw eventsResult.error;
      const events = eventsResult.data ?? [];
      const eventIds = new Set(events.map((event) => event.id));
      const [organizationsResult, checklistsResult, sponsorsResult, sponsorNamesResult, staffResult, ticketTypesResult, ticketsResult, salesResult, cardResult, fightsResult] = await Promise.all([
        this.supabase.from('organizations').select('id,name'), this.supabase.from('event_checklists').select('*'),
        this.supabase.from('event_sponsors').select('*'), this.supabase.from('sponsors').select('id,name'),
        this.supabase.from('staff_assignments').select('*'), this.supabase.from('ticket_types').select('*'),
        this.supabase.from('tickets').select('*'), this.supabase.from('ticket_sales').select('*'),
        this.supabase.from('fight_card').select('*').order('fight_order'), this.supabase.from('fights').select('*').order('fight_order'),
      ]);
      const error = [organizationsResult.error, checklistsResult.error, sponsorsResult.error, sponsorNamesResult.error, staffResult.error, ticketTypesResult.error, ticketsResult.error, salesResult.error, cardResult.error, fightsResult.error].find(Boolean);
      if (error) throw error;
      const organizationNames = new Map((organizationsResult.data ?? []).map((item) => [item.id, item.name]));
      const sponsorNames = new Map((sponsorNamesResult.data ?? []).map((item) => [item.id, item.name]));
      const salesByEvent = new Map<string, { sold: number; revenue: number }>();
      (salesResult.data ?? []).filter((sale) => sale.event_id && eventIds.has(sale.event_id)).forEach((sale) => {
        const eventId = sale.event_id as string; const current = salesByEvent.get(eventId) ?? { sold: 0, revenue: 0 };
        current.sold += sale.quantity ?? 0; current.revenue += sale.total_amount ?? 0; salesByEvent.set(eventId, current);
      });
      const fightsByEvent = new Map<string, number>();
      (fightsResult.data ?? []).filter((fight) => fight.event_id && eventIds.has(fight.event_id)).forEach((fight) => { const eventId = fight.event_id as string; fightsByEvent.set(eventId, (fightsByEvent.get(eventId) ?? 0) + 1); });
      return {
        ...memory,
        events: events.map((event) => this.mapEvent(event, organizationId, event.organizer_id ? organizationNames.get(event.organizer_id) : undefined, salesByEvent.get(event.id), fightsByEvent.get(event.id) ?? 0)),
        checklists: (checklistsResult.data ?? []).flatMap((item) => item.event_id && eventIds.has(item.event_id) ? [this.mapChecklist(item)] : []),
        sponsors: (sponsorsResult.data ?? []).flatMap((item) => item.event_id && eventIds.has(item.event_id) ? [this.mapSponsor(item, item.sponsor_id ? sponsorNames.get(item.sponsor_id) : undefined)] : []),
        staff: (staffResult.data ?? []).flatMap((item) => item.event_id && eventIds.has(item.event_id) ? [this.mapStaff(item)] : []),
        ticketTypes: (ticketTypesResult.data ?? []).flatMap((item) => item.event_id && eventIds.has(item.event_id) ? [{ id: item.id, eventId: item.event_id, name: item.name, category: item.name, price: item.price, quota: item.total_quantity, sold: item.sold_quantity ?? 0, reserved: 0, active: true }] : []),
        tickets: (ticketsResult.data ?? []).flatMap((item) => item.event_id && eventIds.has(item.event_id) ? [{ id: item.id, eventId: item.event_id, ticketTypeId: item.ticket_type, holderName: item.buyer_name, code: item.id, qrPrepared: false, status: 'sold' as const, paymentStatus: 'paid' as const }] : []),
        fightCard: (cardResult.data ?? []).flatMap((item) => item.event_id && eventIds.has(item.event_id) ? [this.mapFightCard(item)] : []),
      };
    } catch (reason) { this.rethrow(reason); }
  }

  override async getEvent(id: string) { return (await this.getSnapshot()).events.find((event) => event.id === id) ?? null; }
  override async createEvent(input: Pick<EventRecord, 'title' | 'discipline' | 'venue' | 'city' | 'startsAt'>): Promise<EventRecord> {
    try {
      const organizationId = await this.organizationId();
      const { data, error } = await this.supabase.from('events').insert({ title: input.title, venue: input.venue, status: 'draft', organizer_id: organizationId }).select().single();
      if (error) throw error;
      overlays.set(this.overlayKey(data.id, organizationId), { discipline: input.discipline, city: input.city, startsAt: input.startsAt, endsAt: input.startsAt });
      return this.mapEvent(data, organizationId);
    } catch (reason) { this.rethrow(reason); }
  }
  override async updateEvent(id: string, patch: Partial<EventRecord>) {
    try {
      const organizationId = await this.organizationId();
      const update: Database['public']['Tables']['events']['Update'] = { updated_at: new Date().toISOString() };
      if (patch.title !== undefined) update.title = patch.title; if (patch.venue !== undefined) update.venue = patch.venue; if (patch.status !== undefined) update.status = patch.status;
      let query = this.supabase.from('events').update(update).eq('id', id); if (organizationId) query = query.eq('organizer_id', organizationId);
      const { data, error } = await query.select().maybeSingle(); if (error) throw error; if (!data) return null;
      const key = this.overlayKey(id, organizationId); overlays.set(key, { ...(overlays.get(key) ?? {}), ...patch, id }); return this.mapEvent(data, organizationId);
    } catch (reason) { this.rethrow(reason); }
  }
  override async removeEvent(id: string) {
    try {
      const organizationId = await this.organizationId(); let query = this.supabase.from('events').delete({ count: 'exact' }).eq('id', id); if (organizationId) query = query.eq('organizer_id', organizationId);
      const { error, count } = await query; if (error) throw error; overlays.delete(this.overlayKey(id, organizationId)); return Boolean(count);
    } catch (reason) { this.rethrow(reason); }
  }
  override changeEventStatus(id: string, nextStatus: EventStatus) { return this.updateEvent(id, { status: nextStatus }); }
  override decideRegistration() { return Promise.reject(storageNotImplemented('inscriptions événement')); }
  override async toggleChecklist(id: string) {
    try {
      const organizationId = await this.organizationId(); const { data, error } = await this.supabase.from('event_checklists').select('is_completed,event_id').eq('id', id).maybeSingle();
      if (error) throw error; if (!data?.event_id) return;
      if (organizationId) { const owned = await this.supabase.from('events').select('id').eq('id', data.event_id).eq('organizer_id', organizationId).maybeSingle(); if (owned.error) throw owned.error; if (!owned.data) throw new OrganizerOperationsError('FORBIDDEN'); }
      const update = await this.supabase.from('event_checklists').update({ is_completed: !data.is_completed }).eq('id', id); if (update.error) throw update.error;
    } catch (reason) { this.rethrow(reason); }
  }
  private mapEvent(row: EventRow, organizationId: string | null, organizerName = 'Organisation', sales?: { sold: number; revenue: number }, fights = 0): EventRecord {
    return { id: row.id, title: row.title, description: '', discipline: '', organizerId: row.organizer_id ?? '', organizerName, venue: row.venue ?? '', region: '', city: '', capacity: row.capacity ?? 0, startsAt: row.starts_at ?? row.created_at ?? new Date(0).toISOString(), endsAt: row.ends_at ?? row.starts_at ?? row.updated_at ?? row.created_at ?? new Date(0).toISOString(), budget: 0, status: asStatus(row.status), visibility: row.visibility === 'public' ? 'public' : row.visibility === 'unlisted' ? 'unlisted' : 'private', contacts: [], statistics: { registrations: 0, ticketsSold: sales?.sold ?? 0, fights, revenue: sales?.revenue ?? 0 }, ...overlays.get(this.overlayKey(row.id, organizationId)) };
  }
  private mapChecklist(row: Database['public']['Tables']['event_checklists']['Row']): EventChecklistItem { return { id: row.id, eventId: row.event_id as string, category: 'administration', title: row.task_name, assignee: '', dueAt: '', priority: row.critical_blocking ? 'critical' : 'normal', status: row.is_completed ? 'validated' : 'todo' }; }
  private mapSponsor(row: Database['public']['Tables']['event_sponsors']['Row'], name = 'Sponsor'): EventSponsor { return { id: row.id, eventId: row.event_id as string, name, level: 'partner', packageName: '', amount: row.amount, benefits: [], visibility: [], contractPrepared: Boolean(row.contract_start || row.contract_end), deliverables: [], status: 'confirmed', history: [] }; }
  private mapStaff(row: Database['public']['Tables']['staff_assignments']['Row']): EventStaffAssignment { return { id: row.id, eventId: row.event_id as string, name: row.staff_name, role: row.role, availability: '', schedule: row.assigned_at ?? '', mission: row.role, status: row.status === 'confirmed' || row.status === 'declined' || row.status === 'completed' ? row.status : 'invited', documents: [], email: '', phone: row.phone ?? undefined }; }
  private mapFightCard(row: Database['public']['Tables']['fight_card']['Row']): FightCardEntry { return { id: row.id, eventId: row.event_id as string, order: row.fight_order, billing: row.tag === 'main_event' || row.tag === 'co_main_event' ? row.tag : 'preliminary', redFighter: row.fighter_a_id ?? 'À confirmer', blueFighter: row.fighter_b_id ?? 'À confirmer', discipline: '', weightCategory: '', rounds: 0, roundDurationSeconds: 0, status: row.is_confirmed ? 'confirmed' : 'planned' }; }
}
