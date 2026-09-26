import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/infrastructure/supabase/database.types';
import { normalizeBackendError } from '@/shared/errors/backend-error';
import type { EventWizardDraft } from '../components/EventCreationWizard';

export type CoorganizerCandidate = {
  id: string;
  name: string;
  type: string;
  regionId: string | null;
  cityId: string | null;
};

export type EventOfficialCandidate = {
  profileId: string;
  fullName: string;
  username: string;
  photoUrl: string | null;
};

export type OrganizerEventListItem = {
  id: string;
  title: string;
  startsAt: string | null;
  venue: string | null;
  cityName: string | null;
  regionName: string | null;
  status: string;
  posterUrl: string | null;
  organizerId: string | null;
  publishedAt: string | null;
};

export type OrganizerEventDetails = {
  event: {
    id: string;
    title: string;
    eventType: string | null;
    startsAt: string | null;
    endsAt: string | null;
    venue: string | null;
    address: string | null;
    capacity: number | null;
    status: string;
    readinessPercent: number;
    visibility: string;
    publishedAt: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    timezoneName: string;
    organizerId: string | null;
    organizerName: string | null;
    regionName: string | null;
    districtName: string | null;
    cityName: string | null;
    communeName: string | null;
  };
  posterUrl: string | null;
  coorganizers: Array<{
    organizationId: string;
    name: string;
    role: string;
    status: string;
  }>;
  fightCards: Array<{
    id: string;
    position: number;
    segment: string;
    discipline: string;
    red: string;
    blue: string;
    status: string;
  }>;
  officials: Array<{
    id: string;
    name: string;
    role: string;
    status: string;
  }>;
  team: Array<{
    id: string;
    name: string;
    role: string;
    status: string;
    availability: string;
    zone: string | null;
    startsAt: string | null;
    endsAt: string | null;
    compensationAmount: number | null;
    currencyCode: string;
  }>;
  finance: {
    budgetId: string | null;
    budgetName: string | null;
    budgetStatus: string | null;
    currencyCode: string;
    version: number | null;
    plannedBudget: number;
    forecastRevenue: number;
    forecastExpenses: number;
    committedExpenses: number;
    paidExpenses: number;
    lines: Array<{
      id: string;
      type: string;
      category: string;
      label: string;
      forecast: number;
      committed: number;
      actual: number;
      notes: string | null;
    }>;
  };
  ticketing: {
    capacity: number;
    soldQuantity: number;
    availableQuantity: number;
    paidRevenue: number;
    salesCount: number;
    types: Array<{
      id: string;
      name: string;
      code: string | null;
      category: string;
      zone: string | null;
      price: number;
      currencyCode: string;
      totalQuantity: number;
      soldQuantity: number;
      maxPerOrder: number;
      salesStart: string | null;
      salesEnd: string | null;
      channels: string[];
      conditions: string | null;
      status: string;
    }>;
  };
};

const EVENT_POSTERS_BUCKET = 'event-posters';
const MAX_POSTER_SIZE = 10 * 1024 * 1024;

const ticketStatus = (value: string) =>
  value === 'published'
    ? 'Publié'
    : value === 'active'
      ? 'Actif'
      : 'Brouillon';

export function normalizeEventOfficialRole(value: string): string {
  const normalized = value
    .trim()
    .toLocaleLowerCase('fr-FR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (normalized === 'arbitre' || normalized === 'arbitre central') return 'referee';
  if (normalized === 'juge') return 'judge';
  if (normalized === 'chronometreur' || normalized === 'chronometre') return 'timekeeper';
  if (normalized === 'medecin') return 'doctor';
  if (normalized === 'superviseur') return 'supervisor';
  if (normalized === 'annonceur') return 'announcer';
  return normalized;
}

function relationName(value: unknown): string | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    const first = value[0] as { name?: unknown } | undefined;
    return typeof first?.name === 'string' ? first.name : null;
  }

  if (typeof value === 'object' && 'name' in value) {
    const name = (value as { name?: unknown }).name;
    return typeof name === 'string' ? name : null;
  }

  return null;
}

function posterExtension(file: File): string {
  switch (file.type) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      throw new Error(
        'Format d’affiche non accepté. Utilisez une image JPG, PNG ou WebP.',
      );
  }
}

function paidTicketStatus(value: string | null): boolean {
  const normalized = (value ?? '').trim().toLocaleLowerCase('fr-FR');
  return ['paid', 'completed', 'succeeded', 'payé', 'paye'].includes(normalized);
}

export class OrganizerEventWorkflowRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  private async currentStatus(eventId: string): Promise<string> {
    const { data, error } = await this.supabase
      .from('events')
      .select('status')
      .eq('id', eventId)
      .single();

    if (error) throw error;

    return data.status ?? 'draft';
  }

  private async resolveStatus(
    eventId: string | null,
    mode: 'Brouillon' | 'Préparation',
  ): Promise<string> {
    if (!eventId) return 'draft';
    if (mode === 'Brouillon') return 'draft';
    return this.currentStatus(eventId);
  }

  private storagePathFromPublicUrl(url: string): string | null {
    const marker = `/storage/v1/object/public/${EVENT_POSTERS_BUCKET}/`;
    const markerIndex = url.indexOf(marker);

    if (markerIndex < 0) return null;

    const encodedPath = url.slice(markerIndex + marker.length);

    try {
      return decodeURIComponent(encodedPath);
    } catch {
      return encodedPath;
    }
  }

  async invitations() {
    const { data, error } = await this.supabase.rpc(
      'list_my_event_coorganizations',
    );

    if (error) throw error;
    return data ?? [];
  }

  async actionableInvitations() {
    const invitations = await this.invitations();

    const pending = invitations.filter(
      (item) => item.status === 'pending',
    );

    if (pending.length === 0) {
      return [];
    }

    const organizationIds = Array.from(
      new Set(
        pending.map(
          (item) => item.organization_id,
        ),
      ),
    );

    const manageability = await Promise.all(
      organizationIds.map(async (organizationId) => {
        const { data, error } = await this.supabase.rpc(
          'can_manage_organization',
          {
            p_organization_id: organizationId,
          },
        );

        if (error) throw error;

        return [
          organizationId,
          data === true,
        ] as const;
      }),
    );

    const manageableOrganizationIds = new Set(
      manageability
        .filter(([, manageable]) => manageable)
        .map(([organizationId]) => organizationId),
    );

    return pending.filter(
      (item) =>
        manageableOrganizationIds.has(
          item.organization_id,
        ),
    );
  }
  async respond(invitationId: string, accept: boolean) {
    const { error } = await this.supabase.rpc(
      'respond_event_coorganization',
      {
        p_invitation_id: invitationId,
        p_accept: accept,
      },
    );

    if (error) throw error;
  }

  async candidates(): Promise<CoorganizerCandidate[]> {
    const { data, error } = await this.supabase.rpc(
      'list_event_coorganizer_candidates',
    );

    if (error) throw error;

    return (data ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      regionId: item.region_id,
      cityId: item.city_id,
    }));
  }

  async searchOfficialCandidates(query: string): Promise<EventOfficialCandidate[]> {
    const { data, error } = await this.supabase.rpc(
      'search_event_official_candidates',
      {
        p_limit: 8,
        p_query: query.trim(),
      },
    );

    if (error) throw error;

    return (data ?? []).map((item) => ({
      profileId: item.profile_id,
      fullName: item.full_name,
      username: item.username,
      photoUrl: item.photo_url,
    }));
  }

  async save(
    eventId: string | null,
    draft: EventWizardDraft,
    mode: 'Brouillon' | 'Préparation',
    readiness: number,
  ) {
    try {
      const status = await this.resolveStatus(eventId, mode);

      const { data, error } = await this.supabase.rpc(
        'save_organizer_event_workflow_v2',
        {
          p_event_id: eventId!,
          p_payload: {
            ...draft,
            readiness,
          },
          p_status: status,
        },
      );

      if (error) throw error;
      return data;
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  async listEvents(eventIds: string[]): Promise<OrganizerEventListItem[]> {
    if (!eventIds.length) return [];

    try {
      const ids = Array.from(new Set(eventIds));

      const [eventsResult, postersResult] = await Promise.all([
        this.supabase
          .from('events')
          .select(
            'id,title,starts_at,venue,status,organizer_id,published_at,regions(name),cities(name)',
          )
          .in('id', ids)
          .order('starts_at', {
            ascending: true,
            nullsFirst: false,
          }),

        this.supabase
          .from('club_media')
          .select('id,event_id,file_url,created_at')
          .in('event_id', ids)
          .eq('media_type', 'poster')
          .eq('is_public', true)
          .order('created_at', { ascending: false }),
      ]);

      const firstError = eventsResult.error ?? postersResult.error;
      if (firstError) throw firstError;

      const postersByEvent = new Map<string, string>();

      for (const poster of postersResult.data ?? []) {
        if (poster.event_id && !postersByEvent.has(poster.event_id)) {
          postersByEvent.set(poster.event_id, poster.file_url);
        }
      }

      return (eventsResult.data ?? []).map((event) => ({
        id: event.id,
        title: event.title,
        startsAt: event.starts_at,
        venue: event.venue,
        cityName: relationName(event.cities),
        regionName: relationName(event.regions),
        status: event.status ?? 'draft',
        posterUrl: postersByEvent.get(event.id) ?? null,
        organizerId: event.organizer_id,
        publishedAt: event.published_at,
      }));
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  async loadDetails(eventId: string): Promise<OrganizerEventDetails> {
    try {
      const eventResult = await this.supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventResult.error) throw eventResult.error;
      const event = eventResult.data;

      const [
        posterResult,
        coorganizersResult,
        fightCardsResult,
        officialsResult,
        staffResult,
        budgetResult,
        ticketsResult,
        ticketSalesResult,
        regionResult,
        districtResult,
        cityResult,
        communeResult,
      ] = await Promise.all([
        this.supabase
          .from('club_media')
          .select('file_url,created_at')
          .eq('event_id', eventId)
          .eq('media_type', 'poster')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),

        this.supabase
          .from('event_coorganizers')
          .select('organization_id,role,status')
          .eq('event_id', eventId),

        this.supabase
          .from('event_fight_cards')
          .select('*')
          .eq('event_id', eventId)
          .order('position'),

        this.supabase
          .from('event_official_assignments')
          .select('*')
          .eq('event_id', eventId)
          .order('created_at'),

        this.supabase
          .from('staff_assignments')
          .select('*')
          .eq('event_id', eventId)
          .order('staff_name'),

        this.supabase
          .from('event_budgets')
          .select('*')
          .eq('event_id', eventId)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle(),

        this.supabase
          .from('ticket_types')
          .select('*')
          .eq('event_id', eventId)
          .order('price'),

        this.supabase
          .from('ticket_sales')
          .select('*')
          .eq('event_id', eventId)
          .order('sold_at', { ascending: false }),

        event.region_id
          ? this.supabase
              .from('regions')
              .select('name')
              .eq('id', event.region_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),

        event.district_id
          ? this.supabase
              .from('districts')
              .select('name')
              .eq('id', event.district_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),

        event.city_id
          ? this.supabase
              .from('cities')
              .select('name')
              .eq('id', event.city_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),

        event.commune_id
          ? this.supabase
              .from('communes')
              .select('name')
              .eq('id', event.commune_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      const firstError = [
        posterResult.error,
        coorganizersResult.error,
        fightCardsResult.error,
        officialsResult.error,
        staffResult.error,
        budgetResult.error,
        ticketsResult.error,
        ticketSalesResult.error,
        regionResult.error,
        districtResult.error,
        cityResult.error,
        communeResult.error,
      ].find(Boolean);

      if (firstError) throw firstError;

      const coorganizers = coorganizersResult.data ?? [];
      const fightCards = fightCardsResult.data ?? [];
      const officials = officialsResult.data ?? [];
      const staff = staffResult.data ?? [];
      const tickets = ticketsResult.data ?? [];
      const ticketSales = ticketSalesResult.data ?? [];

      const organizationIds = Array.from(
        new Set(
          [
            event.organizer_id,
            ...coorganizers.map((item) => item.organization_id),
          ].filter((id): id is string => Boolean(id)),
        ),
      );

      const profileIds = Array.from(
        new Set(
          officials
            .map((item) => item.profile_id)
            .filter((id): id is string => Boolean(id)),
        ),
      );

      const disciplineIds = Array.from(
        new Set(
          fightCards
            .map((item) => item.discipline_id)
            .filter((id): id is string => Boolean(id)),
        ),
      );

      const fighterIds = Array.from(
        new Set(
          fightCards
            .flatMap((item) => [item.fighter_red_id, item.fighter_blue_id])
            .filter((id): id is string => Boolean(id)),
        ),
      );

      const [
        organizationsResult,
        profilesResult,
        disciplinesResult,
        fightersResult,
      ] = await Promise.all([
        organizationIds.length
          ? this.supabase
              .from('organizations')
              .select('id,name')
              .in('id', organizationIds)
          : Promise.resolve({ data: [], error: null }),

        profileIds.length
          ? this.supabase
              .from('profiles')
              .select('id,full_name')
              .in('id', profileIds)
          : Promise.resolve({ data: [], error: null }),

        disciplineIds.length
          ? this.supabase
              .from('disciplines')
              .select('id,name')
              .in('id', disciplineIds)
          : Promise.resolve({ data: [], error: null }),

        fighterIds.length
          ? this.supabase
              .from('fighters')
              .select('id,full_name')
              .in('id', fighterIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const referenceError = [
        organizationsResult.error,
        profilesResult.error,
        disciplinesResult.error,
        fightersResult.error,
      ].find(Boolean);

      if (referenceError) throw referenceError;

      const organizationNames = new Map(
        (organizationsResult.data ?? []).map((item) => [item.id, item.name]),
      );

      const profileNames = new Map(
        (profilesResult.data ?? []).map((item) => [item.id, item.full_name]),
      );

      const disciplineNames = new Map(
        (disciplinesResult.data ?? []).map((item) => [item.id, item.name]),
      );

      const fighterNames = new Map(
        (fightersResult.data ?? []).map((item) => [item.id, item.full_name]),
      );

      let budgetLines: Database['public']['Tables']['event_budget_lines']['Row'][] = [];

      if (budgetResult.data?.id) {
        const linesResult = await this.supabase
          .from('event_budget_lines')
          .select('*')
          .eq('event_budget_id', budgetResult.data.id)
          .order('position');

        if (linesResult.error) throw linesResult.error;
        budgetLines = linesResult.data ?? [];
      }

      const budgetLine = budgetLines.find(
        (line) =>
          line.line_type === 'revenue' &&
          line.category_code === 'budget',
      );

      const plannedBudget = Number(budgetLine?.forecast_amount ?? 0);

      const forecastRevenue = budgetLines
        .filter(
          (line) =>
            line.line_type === 'revenue' &&
            line.category_code !== 'budget',
        )
        .reduce(
          (sum, line) => sum + Number(line.forecast_amount ?? 0),
          0,
        );

      const expenseLines = budgetLines.filter(
        (line) => line.line_type === 'expense',
      );

      const forecastExpenses = expenseLines.reduce(
        (sum, line) => sum + Number(line.forecast_amount ?? 0),
        0,
      );

      const committedExpenses = expenseLines.reduce(
        (sum, line) => sum + Number(line.committed_amount ?? 0),
        0,
      );

      const paidExpenses = expenseLines.reduce(
        (sum, line) => sum + Number(line.actual_amount ?? 0),
        0,
      );

      const typeCapacity = tickets.reduce(
        (sum, ticket) => sum + Number(ticket.total_quantity ?? 0),
        0,
      );

      const typeSold = tickets.reduce(
        (sum, ticket) => sum + Number(ticket.sold_quantity ?? 0),
        0,
      );

      const saleSold = ticketSales.reduce(
        (sum, sale) => sum + Number(sale.quantity ?? 0),
        0,
      );

      const soldQuantity = typeSold > 0 ? typeSold : saleSold;

      const paidRevenue = ticketSales
        .filter((sale) => paidTicketStatus(sale.payment_status))
        .reduce(
          (sum, sale) => sum + Number(sale.total_amount ?? 0),
          0,
        );

      return {
        event: {
          id: event.id,
          title: event.title,
          eventType: event.event_type,
          startsAt: event.starts_at,
          endsAt: event.ends_at,
          venue: event.venue,
          address: event.address,
          capacity: event.capacity,
          status: event.status ?? 'draft',
          readinessPercent: Number(event.readiness_percent ?? 0),
          visibility: event.visibility,
          publishedAt: event.published_at,
          createdAt: event.created_at,
          updatedAt: event.updated_at,
          timezoneName: event.timezone_name,
          organizerId: event.organizer_id,
          organizerName: event.organizer_id
            ? organizationNames.get(event.organizer_id) ?? null
            : null,
          regionName: regionResult.data?.name ?? null,
          districtName: districtResult.data?.name ?? null,
          cityName: cityResult.data?.name ?? null,
          communeName: communeResult.data?.name ?? null,
        },

        posterUrl: posterResult.data?.file_url ?? null,

        coorganizers: coorganizers.map((item) => ({
          organizationId: item.organization_id,
          name: organizationNames.get(item.organization_id) ?? 'Organisation',
          role: item.role,
          status: item.status,
        })),

        fightCards: fightCards.map((item) => ({
          id: item.id,
          position: item.position,
          segment: item.segment,
          discipline: item.discipline_id
            ? disciplineNames.get(item.discipline_id) ?? 'Discipline'
            : 'Discipline non renseignée',
          red:
            item.fighter_red_mention ??
            (item.fighter_red_id
              ? fighterNames.get(item.fighter_red_id)
              : null) ??
            'Coin rouge non renseigné',
          blue:
            item.fighter_blue_mention ??
            (item.fighter_blue_id
              ? fighterNames.get(item.fighter_blue_id)
              : null) ??
            'Coin bleu non renseigné',
          status: item.status,
        })),

        officials: officials.map((item) => ({
          id: item.id,
          name:
            (item.profile_id ? profileNames.get(item.profile_id) : null) ??
            item.mention ??
            'Officiel non renseigné',
          role: item.role,
          status: item.status,
        })),

        team: staff.map((item) => ({
          id: item.id,
          name: item.staff_name,
          role: item.role,
          status: item.status ?? 'invited',
          availability: item.availability_status,
          zone: item.zone,
          startsAt: item.starts_at,
          endsAt: item.ends_at,
          compensationAmount: item.compensation_amount,
          currencyCode: item.currency_code,
        })),

        finance: {
          budgetId: budgetResult.data?.id ?? null,
          budgetName: budgetResult.data?.name ?? null,
          budgetStatus: budgetResult.data?.status ?? null,
          currencyCode: budgetResult.data?.currency_code ?? 'MGA',
          version: budgetResult.data?.version ?? null,
          plannedBudget,
          forecastRevenue,
          forecastExpenses,
          committedExpenses,
          paidExpenses,
          lines: budgetLines.map((line) => ({
            id: line.id,
            type: line.line_type,
            category: line.category_code,
            label: line.label,
            forecast: Number(line.forecast_amount ?? 0),
            committed: Number(line.committed_amount ?? 0),
            actual: Number(line.actual_amount ?? 0),
            notes: line.notes,
          })),
        },

        ticketing: {
          capacity: typeCapacity,
          soldQuantity,
          availableQuantity: Math.max(0, typeCapacity - soldQuantity),
          paidRevenue,
          salesCount: ticketSales.length,
          types: tickets.map((ticket) => ({
            id: ticket.id,
            name: ticket.name,
            code: ticket.code,
            category: ticket.category,
            zone: ticket.zone,
            price: Number(ticket.price ?? 0),
            currencyCode: ticket.currency_code,
            totalQuantity: Number(ticket.total_quantity ?? 0),
            soldQuantity: Number(ticket.sold_quantity ?? 0),
            maxPerOrder: Number(ticket.max_per_order ?? 0),
            salesStart: ticket.sales_start,
            salesEnd: ticket.sales_end,
            channels: ticket.channels,
            conditions: ticket.conditions,
            status: ticket.status,
          })),
        },
      };
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  async setPublished(eventId: string, published: boolean): Promise<void> {
    try {
      const now = new Date().toISOString();

      const { error } = await this.supabase
        .from('events')
        .update({
          status: published ? 'published' : 'draft',
          published_at: published ? now : null,
          visibility: published ? 'public' : 'private',
          updated_at: now,
        })
        .eq('id', eventId);

      if (error) throw error;
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  async uploadPoster(eventId: string, file: File): Promise<string> {
    try {
      if (file.size > MAX_POSTER_SIZE) {
        throw new Error(
          'L’affiche dépasse la taille maximale autorisée de 10 Mo.',
        );
      }

      const extension = posterExtension(file);

      const [authResult, eventResult, currentPosterResult] = await Promise.all([
        this.supabase.auth.getUser(),

        this.supabase
          .from('events')
          .select('id,title,organizer_id')
          .eq('id', eventId)
          .single(),

        this.supabase
          .from('club_media')
          .select('id,file_url,created_at')
          .eq('event_id', eventId)
          .eq('media_type', 'poster')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (authResult.error) throw authResult.error;
      if (!authResult.data.user) {
        throw new Error('Votre session utilisateur est introuvable.');
      }

      if (eventResult.error) throw eventResult.error;
      if (currentPosterResult.error) throw currentPosterResult.error;

      const organizerId = eventResult.data.organizer_id;

      if (!organizerId) {
        throw new Error(
          'Cet événement ne possède pas d’organisation principale.',
        );
      }

      const oldPosterUrl = currentPosterResult.data?.file_url ?? null;
      const oldStoragePath = oldPosterUrl
        ? this.storagePathFromPublicUrl(oldPosterUrl)
        : null;

      const storagePath = `${organizerId}/${eventId}/poster-${Date.now()}.${extension}`;

      const uploadResult = await this.supabase.storage
        .from(EVENT_POSTERS_BUCKET)
        .upload(storagePath, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false,
        });

      if (uploadResult.error) throw uploadResult.error;

      const publicUrlResult = this.supabase.storage
        .from(EVENT_POSTERS_BUCKET)
        .getPublicUrl(uploadResult.data.path);

      const publicUrl = publicUrlResult.data.publicUrl;
      const now = new Date().toISOString();

      const metadata = {
        event_id: eventId,
        organization_id: organizerId,
        media_type: 'poster',
        file_url: publicUrl,
        thumbnail_url: publicUrl,
        title: `Affiche · ${eventResult.data.title}`,
        description: 'Affiche officielle de l’événement',
        is_featured: true,
        is_public: true,
        uploaded_by: authResult.data.user.id,
        created_at: now,
      };

      let metadataError: unknown = null;

      if (currentPosterResult.data) {
        const result = await this.supabase
          .from('club_media')
          .update(metadata)
          .eq('id', currentPosterResult.data.id);

        metadataError = result.error;
      } else {
        const result = await this.supabase.from('club_media').insert(metadata);
        metadataError = result.error;
      }

      if (metadataError) {
        await this.supabase.storage
          .from(EVENT_POSTERS_BUCKET)
          .remove([uploadResult.data.path]);

        throw metadataError;
      }

      if (oldStoragePath && oldStoragePath !== uploadResult.data.path) {
        await this.supabase.storage
          .from(EVENT_POSTERS_BUCKET)
          .remove([oldStoragePath]);
      }

      return publicUrl;
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  async load(eventId: string): Promise<EventWizardDraft> {
    const [
      eventResult,
      cardsResult,
      officialsResult,
      staffResult,
      budgetsResult,
      ticketsResult,
      coorganizersResult,
    ] = await Promise.all([
      this.supabase
        .from('events')
        .select(
          'title,event_type,starts_at,venue,address,region_id,district_id,city_id,commune_id',
        )
        .eq('id', eventId)
        .single(),

      this.supabase
        .from('event_fight_cards')
        .select(
          'position,segment,fighter_red_mention,fighter_blue_mention,discipline_id',
        )
        .eq('event_id', eventId)
        .order('position'),

      this.supabase
        .from('event_official_assignments')
        .select('id,profile_id,mention,role,status')
        .eq('event_id', eventId)
        .order('created_at'),

      this.supabase
        .from('staff_assignments')
        .select('staff_name,role')
        .eq('event_id', eventId)
        .order('assigned_at'),

      this.supabase
        .from('event_budgets')
        .select('id')
        .eq('event_id', eventId)
        .order('version', { ascending: false })
        .limit(1),

      this.supabase
        .from('ticket_types')
        .select('*')
        .eq('event_id', eventId)
        .order('name'),

      this.supabase
        .from('event_coorganizers')
        .select('organization_id,role,status,organizations(name)')
        .eq('event_id', eventId),
    ]);

    const firstError =
      eventResult.error ??
      cardsResult.error ??
      officialsResult.error ??
      staffResult.error ??
      budgetsResult.error ??
      ticketsResult.error ??
      coorganizersResult.error;

    if (firstError) throw firstError;

    if (!eventResult.data) {
      throw new Error('Événement introuvable.');
    }

    const disciplineIds = Array.from(
      new Set(
        (cardsResult.data ?? []).flatMap((item) =>
          item.discipline_id ? [item.discipline_id] : [],
        ),
      ),
    );

    const officialProfileIds = Array.from(
      new Set(
        (officialsResult.data ?? []).flatMap((item) =>
          item.profile_id ? [item.profile_id] : [],
        ),
      ),
    );

    const [disciplinesResult, linesResult, officialProfilesResult] = await Promise.all([
      disciplineIds.length
        ? this.supabase
            .from('disciplines')
            .select('id,name')
            .in('id', disciplineIds)
        : Promise.resolve({ data: [], error: null }),

      budgetsResult.data?.[0]?.id
        ? this.supabase
            .from('event_budget_lines')
            .select('*')
            .eq('event_budget_id', budgetsResult.data[0].id)
            .order('position')
        : Promise.resolve({ data: [], error: null }),

      officialProfileIds.length
        ? this.supabase
            .from('profiles')
            .select('id,full_name')
            .in('id', officialProfileIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (disciplinesResult.error) throw disciplinesResult.error;
    if (linesResult.error) throw linesResult.error;
    if (officialProfilesResult.error) throw officialProfilesResult.error;

    const disciplineNames = new Map(
      (disciplinesResult.data ?? []).map((item) => [item.id, item.name]),
    );
    const officialNames = new Map(
      (officialProfilesResult.data ?? []).map((item) => [item.id, item.full_name]),
    );

    const lines = linesResult.data ?? [];
    const budget = lines.find(
      (item) =>
        item.line_type === 'revenue' && item.category_code === 'budget',
    );

    return {
      event: {
        name: eventResult.data.title,
        type: eventResult.data.event_type ?? 'Gala',
        date: eventResult.data.starts_at
          ? new Date(eventResult.data.starts_at).toISOString().slice(0, 16)
          : '',
        location: eventResult.data.venue ?? '',
        address: eventResult.data.address ?? '',
        regionId: eventResult.data.region_id ?? '',
        districtId: eventResult.data.district_id ?? '',
        cityId: eventResult.data.city_id ?? '',
        communeId: eventResult.data.commune_id ?? '',
      },

      coorganizers: (coorganizersResult.data ?? []).map((item) => ({
        organizationId: item.organization_id,
        name: item.organizations?.name ?? 'Organisation',
        role: item.role,
        status: item.status,
      })),

      fightCards: (cardsResult.data ?? []).map((item) => ({
        segment: item.segment,
        discipline: item.discipline_id
          ? disciplineNames.get(item.discipline_id) ?? 'MMA'
          : 'MMA',
        red: item.fighter_red_mention ?? '',
        blue: item.fighter_blue_mention ?? '',
      })),

      officials: (officialsResult.data ?? []).map((item) => ({
        assignmentId: item.id,
        profileId: item.profile_id ?? '',
        name: (
          (item.profile_id ? officialNames.get(item.profile_id) : null) ??
          item.mention ??
          ''
        ).replace(/^@/, ''),
        role: normalizeEventOfficialRole(item.role),
        status: item.status,
        legacyMention: !item.profile_id && Boolean(item.mention?.trim()),
        legacyMentionValue: !item.profile_id ? item.mention ?? undefined : undefined,
      })),

      team: (staffResult.data ?? []).map((item) => ({
        name: item.staff_name,
        role: item.role,
      })),

      budget: String(budget?.forecast_amount ?? ''),

      expenses: lines
        .filter((item) => item.line_type === 'expense')
        .map((item) => ({
          label: item.label,
          amount: String(item.forecast_amount),
        })),

      tickets: (ticketsResult.data ?? []).map((item) => ({
        name: item.name,
        code: item.code ?? '',
        category: item.category,
        zone: item.zone ?? '',
        price: String(item.price),
        currency: item.currency_code === 'MGA' ? 'Ar' : item.currency_code,
        quota: String(item.total_quantity),
        maxPerOrder: String(item.max_per_order),
        salesStart: item.sales_start
          ? new Date(item.sales_start).toISOString().slice(0, 16)
          : '',
        salesEnd: item.sales_end
          ? new Date(item.sales_end).toISOString().slice(0, 16)
          : '',
        channels: item.channels,
        conditions: item.conditions ?? '',
        status: ticketStatus(item.status),
      })),
    };
  }
}
