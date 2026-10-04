import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";
import type { RealErpData, RealErpQuery } from "./types";

type Row = Record<string, unknown>;
type Context = { userId: string; organizationIds: string[]; activeOrganizationId: string | null; fighterId: string | null };

const text = (value: unknown) => value === null || value === undefined || value === "" ? "—" : String(value);
const money = (value: unknown) => `${Number(value ?? 0).toLocaleString("fr-FR")} Ar`;
const date = (value: unknown) => {
  if (!value) return "—";
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString("fr-FR");
};
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const asRows = (value: unknown[] | null) => (value ?? []) as Row[];
function buildData(
  query: RealErpQuery,
  columns: string[],
  rows: string[][],
  ids: string[],
  kpis?: RealErpData["kpis"],
  mutation?: Pick<RealErpData, "entity" | "records" | "fields" | "capabilities">,
): RealErpData {
  return {
    label: query.moduleLabel,
    action: "Créer",
    kpis: kpis ?? [
      { label: "Enregistrements", value: String(rows.length), detail: "Données disponibles", tone: "blue" },
      { label: "Source", value: "LIVE", detail: "Synchronisé avec la base", tone: "green" },
    ],
    columns,
    rows,
    rowIds: ids,
    source: "supabase",
    entity: mutation?.entity ?? "readonly",
    records: mutation?.records ?? [],
    fields: mutation?.fields ?? [],
    capabilities: mutation?.capabilities ?? { create: false, update: false, delete: false },
    emptyMessage: "Aucune donnée disponible dans ce périmètre.",
  };
}

function mutation(
  entity: RealErpData["entity"],
  rows: Row[],
  fields: RealErpData["fields"],
  capabilities: RealErpData["capabilities"] = { create: true, update: true, delete: true },
): Pick<RealErpData, "entity" | "records" | "fields" | "capabilities"> {
  return {
    entity,
    fields,
    records: rows.map((row) => ({
      id: text(row.id),
      values: Object.fromEntries(fields.map((field) => {
        const value = row[field.name];
        return [field.name, typeof value === "number" ? value : value === null || value === undefined ? null : String(value)];
      })),
    })),
    capabilities,
  };
}
export class RealErpSupabaseRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  private officialProfiles(limit = 50) {
    return this.supabase.rpc("search_event_official_candidates", {
      p_limit: limit,
      p_query: "",
    });
  }

  private async context(): Promise<Context> {
    const { data, error } = await this.supabase.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error("Session utilisateur introuvable.");

    const [owned, memberships, fighter, activeOrganization] = await Promise.all([
      this.supabase.from("organizations").select("id").eq("owner_id", data.user.id),
      this.supabase.from("organization_members").select("organization_id").eq("profile_id", data.user.id),
      this.supabase.from("fighters").select("id").eq("profile_id", data.user.id).maybeSingle(),
      this.supabase.from("active_organizations").select("organization_id").eq("profile_id", data.user.id).maybeSingle(),
    ]);
    const firstError = owned.error ?? memberships.error ?? fighter.error ?? activeOrganization.error;
    if (firstError) throw firstError;

    return {
      userId: data.user.id,
      organizationIds: Array.from(new Set([
        ...(owned.data ?? []).map((item) => item.id),
        ...(memberships.data ?? []).flatMap((item) => item.organization_id ? [item.organization_id] : []),
      ])),
      activeOrganizationId: activeOrganization.data?.organization_id ?? null,
      fighterId: fighter.data?.id ?? null,
    };
  }

  private async clubOrganizationId(context: Context): Promise<string | null> {
    if (!context.organizationIds.length) return null;

    const result = await this.supabase
      .from("organizations")
      .select("id")
      .in("id", context.organizationIds)
      .eq("type", "club")
      .order("created_at", { ascending: true });

    if (result.error) throw result.error;

    const clubIds = (result.data ?? []).map((item) => item.id);

    if (
      context.activeOrganizationId &&
      clubIds.includes(context.activeOrganizationId)
    ) {
      return context.activeOrganizationId;
    }

    return clubIds[0] ?? null;
  }

  private async accessibleEventIds(context: Context): Promise<string[]> {
    if (!context.organizationIds.length) return [];
    const [owned, shared] = await Promise.all([
      this.supabase.from("events").select("id").in("organizer_id", context.organizationIds),
      this.supabase.from("event_coorganizers").select("event_id").in("organization_id", context.organizationIds).eq("status", "accepted"),
    ]);
    const error = owned.error ?? shared.error;
    if (error) throw error;
    return Array.from(new Set([...(owned.data ?? []).map(item => item.id), ...(shared.data ?? []).map(item => item.event_id)]));
  }

  private organizerActiveEventStorageKey(context: Context) {
    const organizationId =
      context.activeOrganizationId ??
      context.organizationIds[0] ??
      null;

    return organizationId
      ? `indesy-mialy:organizer-active-event:${organizationId}`
      : null;
  }

  private readStoredActiveEventId(context: Context): string | null {
    if (typeof window === "undefined") return null;

    const key = this.organizerActiveEventStorageKey(context);
    if (!key) return null;

    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private storeActiveEventId(context: Context, eventId: string) {
    if (typeof window === "undefined") return;

    const key = this.organizerActiveEventStorageKey(context);
    if (!key) return;

    try {
      window.localStorage.setItem(key, eventId);
    } catch {
      // Le stockage local n'est pas critique pour le fonctionnement de l'ERP.
    }
  }

  private removeStoredActiveEventId(context: Context) {
    if (typeof window === "undefined") return;

    const key = this.organizerActiveEventStorageKey(context);
    if (!key) return;

    try {
      window.localStorage.removeItem(key);
    } catch {
      // Le stockage local n'est pas critique pour le fonctionnement de l'ERP.
    }
  }

  private async activeEventId(context: Context) {
    const ids = await this.accessibleEventIds(context);

    if (!ids.length) {
      this.removeStoredActiveEventId(context);
      return null;
    }

    const storedEventId = this.readStoredActiveEventId(context);

    if (storedEventId && ids.includes(storedEventId)) {
      return storedEventId;
    }

    if (storedEventId) {
      this.removeStoredActiveEventId(context);
    }

    const result = await this.supabase
      .from("events")
      .select("id")
      .in("id", ids)
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (result.error) throw result.error;

    const fallbackEventId = result.data?.id ?? null;

    if (fallbackEventId) {
      this.storeActiveEventId(context, fallbackEventId);
    }

    return fallbackEventId;
  }

  private async activeCompetitionId(context: Context) {
    const eventId = await this.activeEventId(context);
    if (!eventId) return null;
    const result = await this.supabase.from("competitions").select("id").eq("event_id", eventId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (result.error) throw result.error;
    return result.data?.id ?? null;
  }

  async load(query: RealErpQuery): Promise<RealErpData> {
    const context = await this.context();
    // INDESY CRUD FALLBACK P0:
    // les libelles de modules ne participent plus au dispatch.
    const key = query.tab;

    if (query.role === "organizer" && query.moduleId === "events") {
      if (["registrations", "registration"].includes(key)) return this.eventRegistrations(query, context);
      if (key === "categories") return this.competitionCategories(query, context);
      if (key === "engaged-clubs") return this.eventParticipants(query, context);
      if (key === "planning") return this.eventSchedule(query, context);
      if (key === "competitions") return this.competitions(query, context);
      return this.events(query, context);
    }
    if (query.role === "organizer" && query.moduleId === "fight-center") {
      if (key === "weigh-in") return this.weighIns(query, context);
      if (key === "replacements") return this.fightReplacements(query, context);
      if (key === "fighters") return this.eventFighters(query, context);
      if (["fight-card", "matchmaking"].includes(key)) return this.eventFightCards(query, context);
      return this.organizerFights(query, context);
    }
    if (query.role === "organizer" && query.moduleId === "operations" && key === "checklists") return this.eventChecklists(query, context);
    if (query.role === "organizer" && query.moduleId === "operations" && key === "planning") return this.eventSchedule(query, context);
    if (query.role === "organizer" && query.moduleId === "operations") {
      if (key === "logistics") return this.eventOperations(query, context, "logistics");
      if (key === "security") return this.eventOperations(query, context, "security");
      if (key === "medical") return this.eventOperations(query, context, "medical");
      if (key === "communication") return this.eventOperations(query, context, "communication");
      if (key === "documents") return this.eventOperations(query, context, "document");
      if (key === "incidents") return this.eventOperations(query, context, "incident");
    }
    if (query.role === "organizer" && query.moduleId === "partners") {
      const partnerTab = normalize(key);
      if (key === "deliverables" || /livrable/.test(partnerTab)) return this.organizerSponsorDeliverables(query, context);
      if (key === "activations" || /activation/.test(partnerTab)) return this.organizerSponsorActivations(query, context);
      if (key === "visibility" || /visibilite/.test(partnerTab)) return this.organizerSponsorVisibility(query, context);
      if (key === "packages" || /package/.test(partnerTab)) return this.organizerSponsorPackages(query, context);
      if (key === "contracts" || /contrat/.test(partnerTab)) return this.organizerSponsorContracts(query, context);
      if (key === "partners" || /partenaire/.test(partnerTab)) return this.organizerSponsorDirectory(query, context);
      return this.organizerSponsorPipeline(query, context);
    }
    if (query.role === "organizer" && query.moduleId === "ticketing") {
      const ticketingTab = normalize(key);
      if (["ticket-types", "quotas"].includes(key) || /type|quota/.test(ticketingTab)) return this.ticketTypes(query, context);
      if (key === "invitations" || /invitation/.test(ticketingTab)) return this.eventInvitations(query, context);
      if (key === "access-control" || /controle d.acces/.test(ticketingTab)) return this.eventAccessLogs(query, context);
      if (key === "refunds" || /remboursement/.test(ticketingTab)) return this.ticketRefunds(query, context);
      return this.ticketSales(query, context);
    }
    if (query.role === "organizer" && query.moduleId === "team") {
      const teamTab = normalize(key);
      if (key === "accreditations" || /accreditation/.test(teamTab)) return this.eventAccreditations(query, context);
      if (key === "assignments" || /affectation/.test(teamTab)) return this.fightOfficialAssignments(query, context);
      if (
        ["referees", "judges", "officials"].includes(key) ||
        /arbitre|juge|officiel/.test(teamTab)
      ) {
        return this.eventOfficials(query, context);
      }
      return this.eventStaff(query, context);
    }
    if (query.role === "organizer" && query.moduleId === "personnel") return this.eventStaff(query, context);

    if (query.role === "club" && query.moduleId === "members") {
      if (key === "attendance") {
        return this.clubAttendances(query, context);
      }

      return this.clubMembers(query, context);
    }

    if (query.role === "organizer" && query.moduleId === "finance") {
      if (/facture/.test(key)) return this.eventInvoices(query, context);
      if (/paiement/.test(key)) return this.eventInvoicePayments(query, context);
      if (/budget/.test(key)) return this.eventBudget(query, context);
      if (/revenu/.test(key)) return this.eventFinance(query, context, "revenue");
      if (/depense/.test(key)) return this.eventFinance(query, context, "expense");
      if (/transaction/.test(key)) return this.eventFinance(query, context);
      return this.eventFinanceOverview(query, context);
    }
    /*
     * INDESY CRUD FALLBACK P0
     *
     * Ces modules ne doivent jamais etre interpretes comme une autre
     * entite metier ni tomber dans erp_workspace_records.
     */
    if (
      ["calendar", "management", "statistics"].includes(
        query.moduleId,
      )
    ) {
      return this.unsupported(query);
    }

    if (
      ["profile", "settings", "notifications"].includes(
        query.moduleId,
      )
    ) {
      return this.identity(query, context);
    }

    if (
      query.moduleId === "overview" &&
      ["federation", "league", "club", "coach"].includes(
        query.role,
      )
    ) {
      return this.organizationOverview(
        query,
        context,
      );
    }
    if (
      query.role === "fighter" &&
      query.moduleId === "performance"
    ) {
      return this.fighterPerformance(
        query,
        context,
      );
    }

    if (
      query.role === "club" &&
      query.moduleId === "performance"
    ) {
      return this.clubPerformance(
        query,
        context,
      );
    }

    if (query.moduleId === "performance") {
      return this.unsupported(query);
    }

    if (
      query.role === "organizer" &&
      ["marketplace", "control-room"].includes(query.moduleId)
    ) {
      return this.unsupported(query);
    }

    if (
      query.role === "sponsor" &&
      [
        "portfolio",
        "opportunities",
        "contracts",
        "campaigns",
        "deliverables",
        "activations",
        "live",
      ].includes(query.moduleId)
    ) {
      return this.unsupported(query);
    }

    if (/overview|vue d.ensemble/.test(key)) {
      if (query.role === "fighter" || query.role === "official" || query.role === "referee" || query.role === "judge") return this.fights(query, context);
      if (query.role === "seller") return this.products(query, context);
      if (query.role === "sponsor") return this.sponsors(query);
      if (["club", "coach", "federation", "league"].includes(query.role)) return this.people(query, context);
      return this.events(query, context);
    }

    if (/evenement|competition|planning|calendrier/.test(key)) return this.events(query, context);
    if (/fight|combat|resultat|classement|performance|sport/.test(key)) return this.fights(query, context);
    if (/billet|ticket|vente|controle d.acces|invitation|remboursement/.test(key)) return this.ticketing(query, context);
    if (/personnel|equipe|staff|membre|utilisateur|officiel|arbitre|juge|affectation|accreditation/.test(key)) return this.people(query, context);
    if (/entrainement|seance|presence|programme|objectif/.test(key)) return this.training(query, context);
    if (/finance|budget|revenu|depense|paiement|transaction|facture|solde/.test(key)) return this.finance(query, context);
    if (/sponsor|partenaire|offre|activation|livrable|visibilite/.test(key)) return this.sponsors(query);
    if (/marketplace|produit|stock|inventaire|commande|livraison|client/.test(key)) return this.products(query, context);
    if (/contrat/.test(key)) return this.contracts(query);
    if (/licence|document|conformite|medical|certificat|suspension/.test(key)) return this.licenses(query);
    if (/parametre|profil|compte|organisation|preference|notification|integration/.test(key)) return this.identity(query, context);

    return this.unsupported(query);
  }

  async create(entity: RealErpData["entity"], values: Record<string, string | number | null>, scope?: Pick<RealErpQuery, "role" | "moduleId" | "tab">) {
    const context = await this.context();
    const organizationId = context.activeOrganizationId ?? context.organizationIds[0] ?? null;
    switch (entity) {
      case "events": {
        if (!organizationId) throw new Error("Aucune organisation n’est associée à ce compte.");
        const result = await this.supabase.from("events").insert({
          title: String(values.title ?? "").trim(),
          venue: String(values.venue ?? "").trim() || null,
          status: String(values.status ?? "draft"),
          organizer_id: organizationId,
        }).select("id").single();
        if (result.error) throw result.error;
        return result.data.id;
      }
      case "organization_transactions": {
        if (!organizationId) throw new Error("Aucune organisation n’est associée à ce compte.");
        const result = await this.supabase.from("transactions").insert({
          description: String(values.description ?? "").trim(),
          category: String(values.category ?? "").trim() || null,
          type: String(values.type ?? "expense"),
          amount: Number(values.amount ?? 0),
          transaction_date: String(values.transaction_date ?? new Date().toISOString().slice(0, 10)),
          organization_id: organizationId,
          created_by: context.userId,
        }).select("id").single();
        if (result.error) throw result.error;
        return result.data.id;
      }
      case "fighter_transactions": {
        if (!context.fighterId) throw new Error("Aucun profil combattant n’est associé à ce compte.");
        const result = await this.supabase.from("fighter_transactions").insert({
          label: String(values.label ?? "").trim(),
          category: String(values.category ?? "").trim() || null,
          transaction_type: String(values.transaction_type ?? "expense"),
          amount: Number(values.amount ?? 0),
          transaction_date: String(values.transaction_date ?? new Date().toISOString().slice(0, 10)),
          fighter_id: context.fighterId,
        }).select("id").single();
        if (result.error) throw result.error;
        return result.data.id;
      }
      case "club_members": {
        const clubOrganizationId =
          await this.clubOrganizationId(
            context,
          );

        if (!clubOrganizationId) {
          throw new Error(
            "Aucun club actif n’est associé à ce compte.",
          );
        }

        const firstName =
          String(
            values.first_name ??
            "",
          ).trim();

        const lastName =
          String(
            values.last_name ??
            "",
          ).trim();

        const result =
          await this.supabase
            .from("club_members")
            .insert({
              organization_id:
                clubOrganizationId,
              first_name:
                firstName,
              last_name:
                lastName,
              full_name:
                [
                  firstName,
                  lastName,
                ]
                  .filter(Boolean)
                  .join(" "),
              email:
                String(
                  values.email ??
                  "",
                ).trim() ||
                null,
              phone:
                String(
                  values.phone ??
                  "",
                ).trim() ||
                null,
              role:
                String(
                  values.role ??
                  "member",
                ),
              primary_discipline:
                String(
                  values.primary_discipline ??
                  "",
                ).trim() ||
                null,
              weight_category:
                String(
                  values.weight_category ??
                  "",
                ).trim() ||
                null,
              belt_level:
                String(
                  values.belt_level ??
                  "",
                ).trim() ||
                null,
              member_status:
                String(
                  values.member_status ??
                  "active",
                ),
              join_date:
                String(
                  values.join_date ??
                  "",
                ) ||
                null,
              notes:
                String(
                  values.notes ??
                  "",
                ).trim() ||
                null,
            })
            .select("id")
            .single();

        if (result.error) {
          throw result.error;
        }

        return result.data.id;
      }

      case "attendances": {
        const clubOrganizationId =
          await this.clubOrganizationId(
            context,
          );

        if (!clubOrganizationId) {
          throw new Error(
            "Aucun club actif n’est associé à ce compte.",
          );
        }

        const result =
          await this.supabase
            .from("attendances")
            .insert({
              organization_id:
                clubOrganizationId,
              member_id:
                String(
                  values.member_id ??
                  "",
                ) ||
                null,
              session_date:
                String(
                  values.session_date ??
                  new Date()
                    .toISOString()
                    .slice(
                      0,
                      10,
                    ),
                ),
              session_time:
                String(
                  values.session_time ??
                  "00:00",
                ),
              discipline:
                String(
                  values.discipline ??
                  "",
                ).trim() ||
                null,
              status:
                String(
                  values.status ??
                  "present",
                ),
              check_method:
                String(
                  values.check_method ??
                  "manual",
                ),
              notes:
                String(
                  values.notes ??
                  "",
                ).trim() ||
                null,
            })
            .select("id")
            .single();

        if (result.error) {
          throw result.error;
        }

        return result.data.id;
      }
      case "training_sessions": {

        if (!organizationId) throw new Error("Aucune organisation n’est associée à ce compte.");
        const result = await this.supabase.from("training_sessions").insert({
          title: String(values.title ?? "").trim(),
          discipline: String(values.discipline ?? "").trim() || null,
          coach_name: String(values.coach_name ?? "").trim() || null,
          day_of_week: Number(values.day_of_week ?? 1),
          start_time: String(values.start_time ?? "") || null,
          end_time: String(values.end_time ?? "") || null,
          capacity: values.capacity === null || values.capacity === "" ? null : Number(values.capacity),
          organization_id: organizationId,
        }).select("id").single();
        if (result.error) throw result.error;
        return result.data.id;
      }
      case "products": {
        if (!organizationId) throw new Error("Une organisation vendeuse est nécessaire.");
        const result = await this.supabase.from("products").insert({
          name: String(values.name ?? "").trim(),
          price: Number(values.price ?? 0),
          stock: Number(values.stock ?? 0),
          seller_id: organizationId,
        }).select("id").single();
        if (result.error) throw result.error;
        return result.data.id;
      }
      case "contracts": {
        const result = await this.supabase.from("contracts").insert({
          ref: String(values.ref ?? "").trim(),
          beneficiary: String(values.beneficiary ?? "").trim(),
          type: String(values.type ?? "").trim(),
          amount: Number(values.amount ?? 0),
          manager: String(values.manager ?? "").trim(),
          payment: String(values.payment ?? "pending"),
          start_date: String(values.start_date ?? ""),
          end_date: String(values.end_date ?? ""),
          status: String(values.status ?? "draft"),
          details: String(values.details ?? "").trim() || null,
        }).select("id").single();
        if (result.error) throw result.error;
        return result.data.id;
      }
      case "competitions": {
        const eventId = await this.activeEventId(context);
        if (!eventId) throw new Error("Créez d’abord un événement.");
        const result = await this.supabase.from("competitions").insert({
          event_id: eventId,
          name: String(values.name ?? "").trim(),
          kind: String(values.kind ?? "tournament"),
          rules: String(values.rules ?? "").trim() || null,
          status: String(values.status ?? "draft"),
        }).select("id").single();
        if (result.error) throw result.error;
        return result.data.id;
      }
      case "competition_categories": {
        const competitionId = await this.activeCompetitionId(context);
        if (!competitionId) throw new Error("Créez d’abord une compétition pour l’événement actif.");
        const optionalNumber = (value: string | number | null | undefined) => value === null || value === "" || value === undefined ? null : Number(value);
        const result = await this.supabase.from("competition_categories").insert({
          competition_id: competitionId,
          name: String(values.name ?? "").trim(),
          gender: String(values.gender ?? "").trim() || null,
          min_age: optionalNumber(values.min_age),
          max_age: optionalNumber(values.max_age),
          min_weight_kg: optionalNumber(values.min_weight_kg),
          max_weight_kg: optionalNumber(values.max_weight_kg),
          capacity: optionalNumber(values.capacity),
        }).select("id").single();
        if (result.error) throw result.error;
        return result.data.id;
      }
      case "event_fight_cards": {
        const eventId = await this.activeEventId(context);
        if (!eventId) throw new Error("Créez d’abord un événement.");
        const result = await this.supabase.from("event_fight_cards").insert({
          event_id: eventId,
          position: Number(values.position ?? 1),
          segment: String(values.segment ?? "main_card"),
          discipline_id: String(values.discipline_id ?? "") || null,
          fighter_red_id: String(values.fighter_red_id ?? "") || null,
          fighter_blue_id: String(values.fighter_blue_id ?? "") || null,
          fighter_red_mention: String(values.fighter_red_mention ?? "").trim() || null,
          fighter_blue_mention: String(values.fighter_blue_mention ?? "").trim() || null,
          status: String(values.status ?? "draft"),
        }).select("id").single();
        if (result.error) throw result.error;
        return result.data.id;
      }
      case "fights": {
        const eventId = await this.activeEventId(context);
        if (!eventId) throw new Error("Créez d’abord un événement.");
        const result = await this.supabase.from("fights").insert({
          event_id: eventId,
          discipline_id: String(values.discipline_id ?? ""),
          fight_order: Number(values.fight_order ?? 1),
          fighter_red_id: String(values.fighter_red_id ?? "") || null,
          fighter_blue_id: String(values.fighter_blue_id ?? "") || null,
          weight_category: String(values.weight_category ?? "").trim(),
          scheduled_rounds: Number(values.scheduled_rounds ?? 3),
          fight_type: String(values.fight_type ?? "professional"),
          status: String(values.status ?? "scheduled"),
        }).select("id").single();
        if (result.error) throw result.error;
        return result.data.id;
      }
      case "weigh_ins": {
        const eventId = await this.activeEventId(context);
        if (!eventId) throw new Error("Créez d’abord un événement.");
        const result = await this.supabase.from("weigh_ins").insert({
          event_id: eventId,
          fighter_id: String(values.fighter_id ?? ""),
          fight_id: String(values.fight_id ?? "") || null,
          attempt_number: Number(values.attempt_number ?? 1),
          minimum_weight_kg: values.minimum_weight_kg === null || values.minimum_weight_kg === "" ? null : Number(values.minimum_weight_kg),
          maximum_weight_kg: values.maximum_weight_kg === null || values.maximum_weight_kg === "" ? null : Number(values.maximum_weight_kg),
          measured_weight_kg: values.measured_weight_kg === null || values.measured_weight_kg === "" ? null : Number(values.measured_weight_kg),
          scheduled_at: String(values.scheduled_at ?? "") || null,
          measured_at: String(values.measured_at ?? "") || null,
          compliance_status: String(values.compliance_status ?? "pending"),
          notes: String(values.notes ?? "").trim() || null,
        }).select("id").single();
        if (result.error) throw result.error;
        return result.data.id;
      }
      case "fight_replacements": {
        const eventId = await this.activeEventId(context);
        if (!eventId) throw new Error("Créez d’abord un événement.");
        const result = await this.supabase.from("fight_replacements").insert({
          event_id: eventId,
          fight_id: String(values.fight_id ?? ""),
          corner: String(values.corner ?? "red"),
          previous_fighter_id: String(values.previous_fighter_id ?? ""),
          replacement_fighter_id: String(values.replacement_fighter_id ?? ""),
          reason: String(values.reason ?? "").trim(),
          status: String(values.status ?? "proposed"),
          replaced_by: context.userId,
        }).select("id").single();
        if (result.error) throw result.error;
        return result.data.id;
      }
      case "ticket_sales": {
        const result = await this.supabase.rpc("record_event_ticket_sale", {
          p_ticket_type_id: String(values.ticket_type_id ?? ""),
          p_buyer_name: String(values.buyer_name ?? ""),
          p_buyer_email: String(values.buyer_email ?? ""),
          p_buyer_phone: String(values.buyer_phone ?? ""),
          p_quantity: Number(values.quantity ?? 1),
          p_payment_status: String(values.payment_status ?? "paid"),
        });
        if (result.error) throw result.error;
        return result.data;
      }
      case "event_invitations": {
        const eventId = await this.activeEventId(context);
        if (!eventId) throw new Error("Créez d’abord un événement.");
        const result = await this.supabase.from("event_invitations").insert({
          event_id: eventId,
          invitation_type: String(values.invitation_type ?? "guest"),
          mention: String(values.mention ?? "").trim(),
          role: String(values.role ?? "guest"),
          invitee_profile_id: String(values.invitee_profile_id ?? "") || null,
          status: String(values.status ?? "sent"),
          sent_by: context.userId,
        }).select("id").single();
        if (result.error) throw result.error;
        return result.data.id;
      }
      case "event_access_logs": {
        const result = await this.supabase.rpc("record_event_ticket_access", {
          p_ticket_id: String(values.ticket_id ?? ""),
          p_zone: String(values.zone ?? "") || undefined,
          p_result: String(values.result ?? "accepted"),
          p_manual: String(values.manual ?? "false") === "true",
        });
        if (result.error) throw result.error;
        return String(result.data);
      }
      case "ticket_refunds": {
        const result = await this.supabase.from("ticket_refunds").insert({
          ticket_sale_id: String(values.ticket_sale_id ?? ""),
          amount: Number(values.amount ?? 0),
          reason: String(values.reason ?? "").trim(),
          status: "requested",
          requested_by: context.userId,
        }).select("id").single();
        if (result.error) throw result.error;
        return result.data.id;
      }
      case "event_schedule_items": {
        const eventId = await this.activeEventId(context); if (!eventId) throw new Error("Créez d’abord un événement.");
        const result = await this.supabase.from("event_schedule_items").insert({ event_id: eventId, title: String(values.title ?? "").trim(), kind: String(values.kind ?? "setup"), starts_at: String(values.starts_at ?? ""), ends_at: String(values.ends_at ?? ""), location: String(values.location ?? "").trim() || null, status: String(values.status ?? "planned") }).select("id").single();
        if (result.error) throw result.error; return result.data.id;
      }
      case "event_checklists": {
        const eventId = await this.activeEventId(context); if (!eventId) throw new Error("Créez d’abord un événement.");
        const completed = String(values.is_completed ?? "false") === "true";
        const result = await this.supabase.from("event_checklists").insert({ event_id: eventId, task_name: String(values.task_name ?? "").trim(), category: String(values.category ?? "").trim() || null, due_at: String(values.due_at ?? "") || null, priority: String(values.priority ?? "normal"), is_completed: completed, completed_by: completed ? context.userId : null, completed_at: completed ? new Date().toISOString() : null }).select("id").single();
        if (result.error) throw result.error; return result.data.id;
      }
      case "ticket_types": {
        const eventId = await this.activeEventId(context); if (!eventId) throw new Error("Créez d’abord un événement.");
        const result = await this.supabase.from("ticket_types").insert({ event_id: eventId, name: String(values.name ?? "").trim(), code: String(values.code ?? "").trim() || null, category: String(values.category ?? "Standard"), zone: String(values.zone ?? "").trim() || null, price: Number(values.price ?? 0), total_quantity: Number(values.total_quantity ?? 0), max_per_order: Number(values.max_per_order ?? 6), sales_start: String(values.sales_start ?? "") || null, sales_end: String(values.sales_end ?? "") || null, status: String(values.status ?? "draft") }).select("id").single();
        if (result.error) throw result.error; return result.data.id;
      }
      case "staff_assignments": {
        const eventId = await this.activeEventId(context); if (!eventId) throw new Error("Créez d’abord un événement.");
        const status = String(values.status ?? "invited");
        const result = await this.supabase.from("staff_assignments").insert({ event_id: eventId, profile_id: String(values.profile_id ?? "") || null, staff_name: String(values.staff_name ?? "").trim(), phone: String(values.phone ?? "").trim() || null, role: String(values.role ?? "").trim(), zone: String(values.zone ?? "").trim() || null, starts_at: String(values.starts_at ?? "") || null, ends_at: String(values.ends_at ?? "") || null, status, availability_status: String(values.availability_status ?? "unknown"), compensation_amount: values.compensation_amount === null || values.compensation_amount === "" ? null : Number(values.compensation_amount), confirmed_at: status === "confirmed" ? new Date().toISOString() : null }).select("id").single();
        if (result.error) throw result.error; return result.data.id;
      }
      case "event_official_assignments": {
        const eventId = await this.activeEventId(context); if (!eventId) throw new Error("Créez d’abord un événement.");
        const result = await this.supabase.from("event_official_assignments").insert({ event_id: eventId, profile_id: String(values.profile_id ?? "") || null, mention: String(values.mention ?? "").trim() || null, role: String(values.role ?? "official"), status: String(values.status ?? "invited") }).select("id").single();
        if (result.error) throw result.error; return result.data.id;
      }
      case "fight_official_assignments": {
        const result = await this.supabase.rpc("assign_event_official_to_fight", { p_fight_id: String(values.fight_id ?? ""), p_user_id: String(values.user_id ?? ""), p_role: String(values.role ?? "judge"), p_position: values.position === null || values.position === "" ? undefined : Number(values.position) });
        if (result.error) throw result.error; return result.data;
      }
      case "event_accreditations": {
        const eventId = await this.activeEventId(context); if (!eventId) throw new Error("Créez d’abord un événement.");
        const status = String(values.status ?? "draft");
        const result = await this.supabase.from("event_accreditations").insert({ event_id: eventId, profile_id: String(values.profile_id ?? "") || null, holder_name: String(values.holder_name ?? "").trim(), badge_code: String(values.badge_code ?? "").trim() || `ACC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, accreditation_type: String(values.accreditation_type ?? "staff"), access_zones: String(values.access_zones ?? "").split(",").map((zone) => zone.trim()).filter(Boolean), status, valid_from: String(values.valid_from ?? "") || null, valid_until: String(values.valid_until ?? "") || null, issued_by: context.userId, issued_at: ["issued", "active"].includes(status) ? new Date().toISOString() : null }).select("id").single();
        if (result.error) throw result.error; return result.data.id;
      }
      case "event_operations": {
        const eventId = await this.activeEventId(context);
        if (!eventId) throw new Error("Créez d’abord un événement.");
        if (!scope) throw new Error("Le domaine opérationnel est manquant.");
        const tab = normalize(scope.tab);
        const domain = /logistique|logistics/.test(tab) ? "logistics"
          : /securite|security/.test(tab) ? "security"
          : /medical/.test(tab) ? "medical"
          : /communication/.test(tab) ? "communication"
          : /document/.test(tab) ? "document"
          : /incident/.test(tab) ? "incident"
          : null;
        if (!domain) throw new Error("Domaine opérationnel invalide.");
        const result = await this.supabase.from("event_operation_records").insert({
          event_id: eventId,
          domain,
          title: String(values.title ?? "").trim(),
          description: String(values.description ?? "").trim() || null,
          category: String(values.category ?? "").trim() || null,
          severity: String(values.severity ?? "normal"),
          status: String(values.status ?? "draft"),
          owner_profile_id: String(values.owner_profile_id ?? "") || null,
          due_at: String(values.due_at ?? "") || null,
          resolution: String(values.resolution ?? "").trim() || null,
          attachment_path: String(values.attachment_path ?? "").trim() || null,
          visibility: String(values.visibility ?? "internal"),
          created_by: context.userId,
        }).select("id").single();
        if (result.error) throw result.error;
        return result.data.id;
      }
      case "sponsors": {
        if (!organizationId) throw new Error("Aucune organisation organisatrice active.");
        const result = await this.supabase.from("sponsors").insert({
          name: String(values.name ?? "").trim(),
          contact_name: String(values.contact_name ?? "").trim() || null,
          contact_email: String(values.contact_email ?? "").trim() || null,
          contact_phone: String(values.contact_phone ?? "").trim() || null,
          website_url: String(values.website_url ?? "").trim() || null,
          tier: String(values.tier ?? "").trim() || null,
          notes: String(values.notes ?? "").trim() || null,
          is_active: String(values.is_active ?? "true") === "true",
          managing_organization_id: organizationId,
          created_by: context.userId,
        }).select("id").single();
        if (result.error) throw result.error;
        return result.data.id;
      }
      case "sponsor_pipeline": {
        if (!organizationId) throw new Error("Aucune organisation organisatrice active.");
        const eventId = await this.activeEventId(context);
        if (!eventId) throw new Error("Créez d’abord un événement.");
        const result = await this.supabase.from("sponsor_pipeline").insert({
          organization_id: organizationId,
          event_id: eventId,
          sponsor_id: String(values.sponsor_id ?? ""),
          stage: "lead",
          estimated_value: values.estimated_value === null || values.estimated_value === "" ? null : Number(values.estimated_value),
          currency_code: String(values.currency_code ?? "MGA"),
          probability_percent: Number(values.probability_percent ?? 0),
          next_action_at: String(values.next_action_at ?? "") || null,
          owner_profile_id: String(values.owner_profile_id ?? "") || null,
          notes: String(values.notes ?? "").trim() || null,
          created_by: context.userId,
        }).select("id").single();
        if (result.error) throw result.error;
        return result.data.id;
      }
      case "sponsor_packages": {
        if (!organizationId) throw new Error("Aucune organisation organisatrice active.");
        const eventId = await this.activeEventId(context);
        const result = await this.supabase.from("sponsor_packages").insert({
          organization_id: organizationId,
          event_id: eventId,
          name: String(values.name ?? "").trim(),
          description: String(values.description ?? "").trim() || null,
          price: Number(values.price ?? 0),
          currency_code: String(values.currency_code ?? "MGA"),
          capacity: values.capacity === null || values.capacity === "" ? null : Number(values.capacity),
          benefits: String(values.benefits ?? "").trim() || null,
          status: String(values.status ?? "draft"),
          valid_from: String(values.valid_from ?? "") || null,
          valid_until: String(values.valid_until ?? "") || null,
          created_by: context.userId,
        }).select("id").single();
        if (result.error) throw result.error;
        return result.data.id;
      }
      case "sponsor_contracts": {
        const result = await this.supabase.from("sponsor_contracts").insert({
          event_sponsor_id: String(values.event_sponsor_id ?? ""),
          package_id: String(values.package_id ?? "") || null,
          reference: String(values.reference ?? "").trim(),
          title: String(values.title ?? "").trim(),
          amount: Number(values.amount ?? 0),
          currency_code: String(values.currency_code ?? "MGA"),
          starts_on: String(values.starts_on ?? ""),
          ends_on: String(values.ends_on ?? ""),
          status: "draft",
          payment_status: String(values.payment_status ?? "pending"),
          document_path: String(values.document_path ?? "").trim() || null,
          terms: String(values.terms ?? "").trim() || null,
          created_by: context.userId,
        }).select("id").single();
        if (result.error) throw result.error;
        return result.data.id;
      }
      case "sponsor_visibility": {
        const result = await this.supabase.from("sponsor_visibility_items").insert({
          event_sponsor_id: String(values.event_sponsor_id ?? ""),
          channel: String(values.channel ?? "venue"),
          placement: String(values.placement ?? "").trim(),
          starts_at: String(values.starts_at ?? "") || null,
          ends_at: String(values.ends_at ?? "") || null,
          target_impressions: values.target_impressions === null || values.target_impressions === "" ? null : Number(values.target_impressions),
          actual_impressions: Number(values.actual_impressions ?? 0),
          target_reach: values.target_reach === null || values.target_reach === "" ? null : Number(values.target_reach),
          actual_reach: Number(values.actual_reach ?? 0),
          status: String(values.status ?? "planned"),
          evidence_path: String(values.evidence_path ?? "").trim() || null,
          created_by: context.userId,
        }).select("id").single();
        if (result.error) throw result.error;
        return result.data.id;
      }
      case "sponsor_activations": {
        const result = await this.supabase.from("sponsor_activations").insert({
          event_sponsor_id: String(values.event_sponsor_id ?? ""),
          title: String(values.title ?? "").trim(),
          activation_type: String(values.activation_type ?? "other"),
          description: String(values.description ?? "").trim() || null,
          location: String(values.location ?? "").trim() || null,
          starts_at: String(values.starts_at ?? "") || null,
          ends_at: String(values.ends_at ?? "") || null,
          budget: values.budget === null || values.budget === "" ? null : Number(values.budget),
          target_contacts: values.target_contacts === null || values.target_contacts === "" ? null : Number(values.target_contacts),
          actual_contacts: Number(values.actual_contacts ?? 0),
          status: String(values.status ?? "draft"),
          evidence_path: String(values.evidence_path ?? "").trim() || null,
          owner_profile_id: String(values.owner_profile_id ?? "") || null,
          created_by: context.userId,
        }).select("id").single();
        if (result.error) throw result.error;
        return result.data.id;
      }
      case "sponsor_deliverables": {
        const result = await this.supabase.from("event_sponsor_deliverables").insert({
          event_sponsor_id: String(values.event_sponsor_id ?? ""),
          title: String(values.title ?? "").trim(),
          description: String(values.description ?? "").trim() || null,
          due_at: String(values.due_at ?? "") || null,
          estimated_value: values.estimated_value === null || values.estimated_value === "" ? null : Number(values.estimated_value),
          evidence_path: String(values.evidence_path ?? "").trim() || null,
          status: "todo",
        }).select("id").single();
        if (result.error) throw result.error;
        return result.data.id;
      }
      case "event_budget_lines": {
        const eventId = await this.activeEventId(context);
        if (!eventId) throw new Error("Créez d’abord un événement.");
        let budget = await this.supabase.from("event_budgets").select("id,status").eq("event_id", eventId).in("status", ["draft","submitted"]).order("version", { ascending: false }).limit(1).maybeSingle();
        if (budget.error) throw budget.error;
        if (!budget.data) {
          const last = await this.supabase.from("event_budgets").select("version").eq("event_id", eventId).order("version", { ascending: false }).limit(1).maybeSingle();
          if (last.error) throw last.error;
          const created = await this.supabase.from("event_budgets").insert({
            event_id: eventId, version: Number(last.data?.version ?? 0) + 1,
            name: String(values.budget_name ?? "Budget principal").trim(),
            currency_code: String(values.currency_code ?? "MGA"), status: "draft", created_by: context.userId,
          }).select("id,status").single();
          if (created.error) throw created.error;
          budget = created;
        }
        const budgetData = budget.data;
        if (!budgetData) throw new Error("Budget actif introuvable.");
        if (budgetData.status !== "draft") throw new Error("Le budget soumis doit être repassé en brouillon avant modification.");
        const positionResult = await this.supabase.from("event_budget_lines").select("position").eq("event_budget_id", budgetData.id).order("position", { ascending: false }).limit(1).maybeSingle();
        if (positionResult.error) throw positionResult.error;
        const result = await this.supabase.from("event_budget_lines").insert({
          event_budget_id: budgetData.id,
          line_type: String(values.line_type ?? "expense"),
          category_code: String(values.category_code ?? "other").trim(),
          label: String(values.label ?? "").trim(),
          forecast_amount: Number(values.forecast_amount ?? 0),
          position: Number(positionResult.data?.position ?? -1) + 1,
          notes: String(values.notes ?? "").trim() || null,
        }).select("id").single();
        if (result.error) throw result.error;
        return result.data.id;
      }
      case "event_invoices": {
        const eventId = await this.activeEventId(context);
        if (!eventId) throw new Error("Créez d’abord un événement.");
        const result = await this.supabase.from("event_invoices").insert({
          event_id: eventId,
          invoice_number: String(values.invoice_number ?? "").trim(),
          direction: String(values.direction ?? "payable"),
          counterparty_name: String(values.counterparty_name ?? "").trim(),
          counterparty_email: String(values.counterparty_email ?? "").trim() || null,
          counterparty_organization_id: String(values.counterparty_organization_id ?? "") || null,
          description: String(values.description ?? "").trim(),
          issue_date: String(values.issue_date ?? new Date().toISOString().slice(0, 10)),
          due_date: String(values.due_date ?? ""),
          subtotal: Number(values.subtotal ?? 0),
          tax_amount: Number(values.tax_amount ?? 0),
          currency_code: String(values.currency_code ?? "MGA"),
          status: String(values.status ?? "draft"),
          document_path: String(values.document_path ?? "").trim() || null,
          notes: String(values.notes ?? "").trim() || null,
          created_by: context.userId,
        }).select("id").single();
        if (result.error) throw result.error;
        return result.data.id;
      }
      case "event_invoice_payments": {
        const result = await this.supabase.rpc("record_event_invoice_payment", {
          p_invoice_id: String(values.invoice_id ?? ""),
          p_amount: Number(values.amount ?? 0),
          p_method: String(values.method ?? "bank_transfer"),
          p_reference: String(values.reference ?? "").trim() || undefined,
          p_notes: String(values.notes ?? "").trim() || undefined,
          p_paid_at: String(values.paid_at ?? "") || undefined,
        });
        if (result.error) throw result.error;
        return result.data;
      }
      case "event_transactions": {
        const eventId = await this.activeEventId(context); if (!eventId) throw new Error("Créez d’abord un événement.");
        const result = await this.supabase.from("event_transactions").insert({ event_id: eventId, description: String(values.description ?? "").trim(), category_code: String(values.category_code ?? "other"), transaction_type: String(values.transaction_type ?? "expense"), amount: Number(values.amount ?? 0), budget_line_id: String(values.budget_line_id ?? "") || null, due_at: String(values.due_at ?? "") || null, occurred_at: String(values.occurred_at ?? "") || null, reference: String(values.reference ?? "").trim() || null, status: "planned", recorded_by: context.userId }).select("id").single();
        if (result.error) throw result.error; return result.data.id;
      }
      case "workspace_records": {
        if (!scope) throw new Error("Le périmètre du module ERP est manquant.");
        const result = await this.supabase.from("erp_workspace_records").insert({
          owner_profile_id: context.userId,
          role_slug: scope.role,
          module_id: scope.moduleId,
          tab_id: scope.tab,
          title: String(values.title ?? "").trim(),
          description: String(values.description ?? "").trim() || null,
          status: String(values.status ?? "todo"),
          priority: String(values.priority ?? "normal"),
          due_at: String(values.due_at ?? "") || null,
        }).select("id").single();
        if (result.error) throw result.error; return result.data.id;
      }
      default:
        throw new Error("La création n’est pas encore disponible pour ce domaine.");
    }
  }

  async update(entity: RealErpData["entity"], id: string, values: Record<string, string | number | null>) {
    const context = await this.context();
    let error: unknown = null;
    switch (entity) {
      case "events":
        ({ error } = await this.supabase.from("events").update({ title: String(values.title ?? "").trim(), venue: String(values.venue ?? "").trim() || null, status: String(values.status ?? "draft"), updated_at: new Date().toISOString() }).eq("id", id));
        break;
      case "organization_transactions":
        ({ error } = await this.supabase.from("transactions").update({ description: String(values.description ?? "").trim(), category: String(values.category ?? "").trim() || null, type: String(values.type ?? "expense"), amount: Number(values.amount ?? 0), transaction_date: String(values.transaction_date ?? "") }).eq("id", id));
        break;
      case "fighter_transactions":
        ({ error } = await this.supabase.from("fighter_transactions").update({ label: String(values.label ?? "").trim(), category: String(values.category ?? "").trim() || null, transaction_type: String(values.transaction_type ?? "expense"), amount: Number(values.amount ?? 0), transaction_date: String(values.transaction_date ?? "") }).eq("id", id));
        break;
      case "club_members": {
        const firstName =
          String(
            values.first_name ??
            "",
          ).trim();

        const lastName =
          String(
            values.last_name ??
            "",
          ).trim();

        ({
          error,
        } =
          await this.supabase
            .from("club_members")
            .update({
              first_name:
                firstName,
              last_name:
                lastName,
              full_name:
                [
                  firstName,
                  lastName,
                ]
                  .filter(Boolean)
                  .join(" "),
              email:
                String(
                  values.email ??
                  "",
                ).trim() ||
                null,
              phone:
                String(
                  values.phone ??
                  "",
                ).trim() ||
                null,
              role:
                String(
                  values.role ??
                  "member",
                ),
              primary_discipline:
                String(
                  values.primary_discipline ??
                  "",
                ).trim() ||
                null,
              weight_category:
                String(
                  values.weight_category ??
                  "",
                ).trim() ||
                null,
              belt_level:
                String(
                  values.belt_level ??
                  "",
                ).trim() ||
                null,
              member_status:
                String(
                  values.member_status ??
                  "active",
                ),
              join_date:
                String(
                  values.join_date ??
                  "",
                ) ||
                null,
              notes:
                String(
                  values.notes ??
                  "",
                ).trim() ||
                null,
              updated_at:
                new Date()
                  .toISOString(),
            })
            .eq(
              "id",
              id,
            ));

        break;
      }

      case "attendances":
        ({
          error,
        } =
          await this.supabase
            .from("attendances")
            .update({
              member_id:
                String(
                  values.member_id ??
                  "",
                ) ||
                null,
              session_date:
                String(
                  values.session_date ??
                  "",
                ),
              session_time:
                String(
                  values.session_time ??
                  "",
                ),
              discipline:
                String(
                  values.discipline ??
                  "",
                ).trim() ||
                null,
              status:
                String(
                  values.status ??
                  "present",
                ),
              check_method:
                String(
                  values.check_method ??
                  "manual",
                ),
              notes:
                String(
                  values.notes ??
                  "",
                ).trim() ||
                null,
            })
            .eq(
              "id",
              id,
            ));

        break;
      case "training_sessions":
        ({ error } = await this.supabase.from("training_sessions").update({ title: String(values.title ?? "").trim(), discipline: String(values.discipline ?? "").trim() || null, coach_name: String(values.coach_name ?? "").trim() || null, day_of_week: Number(values.day_of_week ?? 1), start_time: String(values.start_time ?? "") || null, end_time: String(values.end_time ?? "") || null, capacity: values.capacity === null || values.capacity === "" ? null : Number(values.capacity) }).eq("id", id));
        break;
      case "products":
        ({ error } = await this.supabase.from("products").update({ name: String(values.name ?? "").trim(), price: Number(values.price ?? 0), stock: Number(values.stock ?? 0) }).eq("id", id));
        break;
      case "contracts":
        ({ error } = await this.supabase.from("contracts").update({ ref: String(values.ref ?? "").trim(), beneficiary: String(values.beneficiary ?? "").trim(), type: String(values.type ?? "").trim(), amount: Number(values.amount ?? 0), manager: String(values.manager ?? "").trim(), payment: String(values.payment ?? "pending"), start_date: String(values.start_date ?? ""), end_date: String(values.end_date ?? ""), status: String(values.status ?? "draft"), details: String(values.details ?? "").trim() || null }).eq("id", id));
        break;
      case "competitions":
        ({ error } = await this.supabase.from("competitions").update({ name: String(values.name ?? "").trim(), kind: String(values.kind ?? "tournament"), rules: String(values.rules ?? "").trim() || null, status: String(values.status ?? "draft"), updated_at: new Date().toISOString() }).eq("id", id));
        break;
      case "competition_categories": {
        const optionalNumber = (value: string | number | null | undefined) => value === null || value === "" || value === undefined ? null : Number(value);
        ({ error } = await this.supabase.from("competition_categories").update({ name: String(values.name ?? "").trim(), gender: String(values.gender ?? "").trim() || null, min_age: optionalNumber(values.min_age), max_age: optionalNumber(values.max_age), min_weight_kg: optionalNumber(values.min_weight_kg), max_weight_kg: optionalNumber(values.max_weight_kg), capacity: optionalNumber(values.capacity) }).eq("id", id));
        break;
      }
      case "event_budget_lines": {
        const previous = await this.supabase.from("event_budget_lines").select("event_budget_id,event_budgets(status)").eq("id", id).single();
        if (previous.error) throw previous.error;
        const currentStatus = previous.data.event_budgets?.status ?? "draft";
        const nextStatus = String(values.budget_status ?? currentStatus);
        if (currentStatus !== "draft" && nextStatus === currentStatus) throw new Error("Seul un budget en brouillon peut être modifié.");
        if (currentStatus === "draft") {
          const details = await this.supabase.from("event_budget_lines").update({
            line_type: String(values.line_type ?? "expense"),
            category_code: String(values.category_code ?? "other").trim(),
            label: String(values.label ?? "").trim(),
            forecast_amount: Number(values.forecast_amount ?? 0),
            notes: String(values.notes ?? "").trim() || null,
            updated_at: new Date().toISOString(),
          }).eq("id", id);
          error = details.error;
        }
        if (!error && nextStatus !== currentStatus) {
          const transition = await this.supabase.rpc("transition_event_budget", {
            p_budget_id: previous.data.event_budget_id, p_status: nextStatus,
            p_note: String(values.notes ?? "").trim() || undefined,
          });
          error = transition.error;
        }
        break;
      }
      case "event_invoices":
        ({ error } = await this.supabase.from("event_invoices").update({
          invoice_number: String(values.invoice_number ?? "").trim(),
          direction: String(values.direction ?? "payable"),
          counterparty_name: String(values.counterparty_name ?? "").trim(),
          counterparty_email: String(values.counterparty_email ?? "").trim() || null,
          counterparty_organization_id: String(values.counterparty_organization_id ?? "") || null,
          description: String(values.description ?? "").trim(),
          issue_date: String(values.issue_date ?? ""),
          due_date: String(values.due_date ?? ""),
          subtotal: Number(values.subtotal ?? 0),
          tax_amount: Number(values.tax_amount ?? 0),
          currency_code: String(values.currency_code ?? "MGA"),
          status: String(values.status ?? "draft"),
          document_path: String(values.document_path ?? "").trim() || null,
          notes: String(values.notes ?? "").trim() || null,
          updated_at: new Date().toISOString(),
        }).eq("id", id));
        break;
      case "sponsors":
        ({ error } = await this.supabase.from("sponsors").update({
          name: String(values.name ?? "").trim(),
          contact_name: String(values.contact_name ?? "").trim() || null,
          contact_email: String(values.contact_email ?? "").trim() || null,
          contact_phone: String(values.contact_phone ?? "").trim() || null,
          website_url: String(values.website_url ?? "").trim() || null,
          tier: String(values.tier ?? "").trim() || null,
          notes: String(values.notes ?? "").trim() || null,
          is_active: String(values.is_active ?? "true") === "true",
          updated_at: new Date().toISOString(),
        }).eq("id", id));
        break;
      case "sponsor_pipeline": {
        const previous = await this.supabase.from("sponsor_pipeline").select("stage").eq("id", id).single();
        if (previous.error) throw previous.error;
        const nextStage = String(values.stage ?? previous.data.stage);
        const details = await this.supabase.from("sponsor_pipeline").update({
          sponsor_id: String(values.sponsor_id ?? ""),
          estimated_value: values.estimated_value === null || values.estimated_value === "" ? null : Number(values.estimated_value),
          currency_code: String(values.currency_code ?? "MGA"),
          probability_percent: Number(values.probability_percent ?? 0),
          next_action_at: String(values.next_action_at ?? "") || null,
          owner_profile_id: String(values.owner_profile_id ?? "") || null,
          notes: String(values.notes ?? "").trim() || null,
          lost_reason: String(values.lost_reason ?? "").trim() || null,
          updated_at: new Date().toISOString(),
        }).eq("id", id);
        error = details.error;
        if (!error && nextStage !== previous.data.stage) {
          const transition = await this.supabase.rpc("transition_sponsor_pipeline", {
            p_pipeline_id: id, p_stage: nextStage,
            p_note: String(values.lost_reason ?? values.notes ?? "").trim() || undefined,
          });
          error = transition.error;
        }
        break;
      }
      case "sponsor_packages":
        ({ error } = await this.supabase.from("sponsor_packages").update({
          name: String(values.name ?? "").trim(),
          description: String(values.description ?? "").trim() || null,
          price: Number(values.price ?? 0),
          currency_code: String(values.currency_code ?? "MGA"),
          capacity: values.capacity === null || values.capacity === "" ? null : Number(values.capacity),
          benefits: String(values.benefits ?? "").trim() || null,
          status: String(values.status ?? "draft"),
          valid_from: String(values.valid_from ?? "") || null,
          valid_until: String(values.valid_until ?? "") || null,
          updated_at: new Date().toISOString(),
        }).eq("id", id));
        break;
      case "sponsor_contracts": {
        const previous = await this.supabase.from("sponsor_contracts").select("status").eq("id", id).single();
        if (previous.error) throw previous.error;
        const nextStatus = String(values.status ?? previous.data.status);
        const details = await this.supabase.from("sponsor_contracts").update({
          event_sponsor_id: String(values.event_sponsor_id ?? ""),
          package_id: String(values.package_id ?? "") || null,
          reference: String(values.reference ?? "").trim(),
          title: String(values.title ?? "").trim(),
          amount: Number(values.amount ?? 0),
          currency_code: String(values.currency_code ?? "MGA"),
          starts_on: String(values.starts_on ?? ""),
          ends_on: String(values.ends_on ?? ""),
          payment_status: String(values.payment_status ?? "pending"),
          document_path: String(values.document_path ?? "").trim() || null,
          terms: String(values.terms ?? "").trim() || null,
          terminated_reason: String(values.terminated_reason ?? "").trim() || null,
          updated_at: new Date().toISOString(),
        }).eq("id", id);
        error = details.error;
        if (!error && nextStatus !== previous.data.status) {
          const transition = await this.supabase.rpc("transition_sponsor_contract", {
            p_contract_id: id, p_status: nextStatus,
            p_note: String(values.terminated_reason ?? values.terms ?? "").trim() || undefined,
          });
          error = transition.error;
        }
        break;
      }
      case "sponsor_visibility":
        ({ error } = await this.supabase.from("sponsor_visibility_items").update({
          event_sponsor_id: String(values.event_sponsor_id ?? ""),
          channel: String(values.channel ?? "venue"),
          placement: String(values.placement ?? "").trim(),
          starts_at: String(values.starts_at ?? "") || null,
          ends_at: String(values.ends_at ?? "") || null,
          target_impressions: values.target_impressions === null || values.target_impressions === "" ? null : Number(values.target_impressions),
          actual_impressions: Number(values.actual_impressions ?? 0),
          target_reach: values.target_reach === null || values.target_reach === "" ? null : Number(values.target_reach),
          actual_reach: Number(values.actual_reach ?? 0),
          status: String(values.status ?? "planned"),
          evidence_path: String(values.evidence_path ?? "").trim() || null,
          updated_at: new Date().toISOString(),
        }).eq("id", id));
        break;
      case "sponsor_activations":
        ({ error } = await this.supabase.from("sponsor_activations").update({
          event_sponsor_id: String(values.event_sponsor_id ?? ""),
          title: String(values.title ?? "").trim(),
          activation_type: String(values.activation_type ?? "other"),
          description: String(values.description ?? "").trim() || null,
          location: String(values.location ?? "").trim() || null,
          starts_at: String(values.starts_at ?? "") || null,
          ends_at: String(values.ends_at ?? "") || null,
          budget: values.budget === null || values.budget === "" ? null : Number(values.budget),
          target_contacts: values.target_contacts === null || values.target_contacts === "" ? null : Number(values.target_contacts),
          actual_contacts: Number(values.actual_contacts ?? 0),
          status: String(values.status ?? "draft"),
          evidence_path: String(values.evidence_path ?? "").trim() || null,
          owner_profile_id: String(values.owner_profile_id ?? "") || null,
          updated_at: new Date().toISOString(),
        }).eq("id", id));
        break;
      case "sponsor_deliverables": {
        const previous = await this.supabase.from("event_sponsor_deliverables").select("status").eq("id", id).single();
        if (previous.error) throw previous.error;
        const nextStatus = String(values.status ?? previous.data.status);
        const details = await this.supabase.from("event_sponsor_deliverables").update({
          event_sponsor_id: String(values.event_sponsor_id ?? ""),
          title: String(values.title ?? "").trim(),
          description: String(values.description ?? "").trim() || null,
          due_at: String(values.due_at ?? "") || null,
          estimated_value: values.estimated_value === null || values.estimated_value === "" ? null : Number(values.estimated_value),
          evidence_path: String(values.evidence_path ?? "").trim() || null,
        }).eq("id", id);
        error = details.error;
        if (!error && nextStatus !== previous.data.status) {
          const transition = await this.supabase.rpc("transition_sponsor_deliverable", {
            p_deliverable_id: id, p_status: nextStatus,
            p_note: String(values.description ?? "").trim() || undefined,
          });
          error = transition.error;
        }
        break;
      }
      case "event_registrations": {
        const result = await this.supabase.rpc("review_event_registration", {
          p_registration_id: id,
          p_status: String(values.status ?? "pending"),
          p_eligibility_status: String(values.eligibility_status ?? "pending"),
          p_payment_status: String(values.payment_status ?? "not_required"),
          p_reason: String(values.decision_reason ?? "").trim() || undefined,
          p_waitlist_position:
            values.waitlist_position === null || values.waitlist_position === ""
              ? undefined
              : Number(values.waitlist_position),
        });
        error = result.error;
        break;
      }
      case "event_invitations":
        ({ error } = await this.supabase.from("event_invitations").update({ invitation_type: String(values.invitation_type ?? "guest"), mention: String(values.mention ?? "").trim(), role: String(values.role ?? "guest"), invitee_profile_id: String(values.invitee_profile_id ?? "") || null, status: String(values.status ?? "sent"), responded_at: ["accepted", "declined"].includes(String(values.status ?? "")) ? new Date().toISOString() : null }).eq("id", id));
        break;
      case "ticket_refunds": {
        const result = await this.supabase.rpc("review_event_ticket_refund", {
          p_refund_id: id,
          p_status: String(values.status ?? "approved"),
          p_processed_amount: values.processed_amount === null || values.processed_amount === "" ? undefined : Number(values.processed_amount),
          p_external_reference: String(values.external_reference ?? "") || undefined,
        });
        error = result.error;
        break;
      }
      case "event_participants":
        ({ error } = await this.supabase.from("event_participants").update({ participant_type: String(values.participant_type ?? "club"), status: String(values.status ?? "pending"), public_visible: String(values.public_visible ?? "false") === "true" }).eq("id", id));
        break;
      case "event_fight_cards":
        ({ error } = await this.supabase.from("event_fight_cards").update({ position: Number(values.position ?? 1), segment: String(values.segment ?? "main_card"), discipline_id: String(values.discipline_id ?? "") || null, fighter_red_id: String(values.fighter_red_id ?? "") || null, fighter_blue_id: String(values.fighter_blue_id ?? "") || null, fighter_red_mention: String(values.fighter_red_mention ?? "").trim() || null, fighter_blue_mention: String(values.fighter_blue_mention ?? "").trim() || null, status: String(values.status ?? "draft"), updated_at: new Date().toISOString() }).eq("id", id));
        break;
      case "fights":
        ({ error } = await this.supabase.from("fights").update({ discipline_id: String(values.discipline_id ?? ""), fight_order: Number(values.fight_order ?? 1), fighter_red_id: String(values.fighter_red_id ?? "") || null, fighter_blue_id: String(values.fighter_blue_id ?? "") || null, weight_category: String(values.weight_category ?? "").trim(), scheduled_rounds: Number(values.scheduled_rounds ?? 3), fight_type: String(values.fight_type ?? "professional"), status: String(values.status ?? "scheduled"), winner_id: String(values.winner_id ?? "") || null, method: String(values.method ?? "").trim() || null, ending_round: values.ending_round === null || values.ending_round === "" ? null : Number(values.ending_round), ending_time: String(values.ending_time ?? "") || null, cancellation_reason: String(values.cancellation_reason ?? "").trim() || null, updated_at: new Date().toISOString() }).eq("id", id));
        break;
      case "weigh_ins": {
        const previous = await this.supabase.from("weigh_ins").select("compliance_status").eq("id", id).single();
        if (previous.error) throw previous.error;
        const nextStatus = String(values.compliance_status ?? previous.data.compliance_status);
        ({ error } = await this.supabase.from("weigh_ins").update({ fighter_id: String(values.fighter_id ?? ""), fight_id: String(values.fight_id ?? "") || null, attempt_number: Number(values.attempt_number ?? 1), minimum_weight_kg: values.minimum_weight_kg === null || values.minimum_weight_kg === "" ? null : Number(values.minimum_weight_kg), maximum_weight_kg: values.maximum_weight_kg === null || values.maximum_weight_kg === "" ? null : Number(values.maximum_weight_kg), measured_weight_kg: values.measured_weight_kg === null || values.measured_weight_kg === "" ? null : Number(values.measured_weight_kg), scheduled_at: String(values.scheduled_at ?? "") || null, measured_at: String(values.measured_at ?? "") || null, compliance_status: nextStatus, notes: String(values.notes ?? "").trim() || null, validated_by: ["compliant", "non_compliant", "waived"].includes(nextStatus) ? context.userId : null, validated_at: ["compliant", "non_compliant", "waived"].includes(nextStatus) ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq("id", id));
        if (!error && previous.data.compliance_status !== nextStatus) {
          const history = await this.supabase.from("weigh_in_history").insert({ weigh_in_id: id, from_status: previous.data.compliance_status, to_status: nextStatus, measured_weight_kg: values.measured_weight_kg === null || values.measured_weight_kg === "" ? null : Number(values.measured_weight_kg), reason: String(values.notes ?? "").trim() || null, changed_by: context.userId });
          error = history.error;
        }
        break;
      }
      case "fight_replacements": {
        const status = String(values.status ?? "proposed");
        ({ error } = await this.supabase.from("fight_replacements").update({ corner: String(values.corner ?? "red"), fight_id: String(values.fight_id ?? ""), previous_fighter_id: String(values.previous_fighter_id ?? ""), replacement_fighter_id: String(values.replacement_fighter_id ?? ""), reason: String(values.reason ?? "").trim(), status, effective_at: status === "confirmed" ? new Date().toISOString() : undefined }).eq("id", id));
        if (!error && status === "confirmed") {
          const replacement = String(values.corner ?? "red") === "blue"
            ? await this.supabase.from("fights").update({ fighter_blue_id: String(values.replacement_fighter_id ?? ""), updated_at: new Date().toISOString() }).eq("id", String(values.fight_id ?? ""))
            : await this.supabase.from("fights").update({ fighter_red_id: String(values.replacement_fighter_id ?? ""), updated_at: new Date().toISOString() }).eq("id", String(values.fight_id ?? ""));
          error = replacement.error;
        }
        break;
      }
      case "event_schedule_items":
        ({ error } = await this.supabase.from("event_schedule_items").update({ title: String(values.title ?? "").trim(), kind: String(values.kind ?? "setup"), starts_at: String(values.starts_at ?? ""), ends_at: String(values.ends_at ?? ""), location: String(values.location ?? "").trim() || null, status: String(values.status ?? "planned") }).eq("id", id)); break;
      case "event_checklists": {
        const completed = String(values.is_completed ?? "false") === "true";
        ({ error } = await this.supabase.from("event_checklists").update({ task_name: String(values.task_name ?? "").trim(), category: String(values.category ?? "").trim() || null, due_at: String(values.due_at ?? "") || null, priority: String(values.priority ?? "normal"), is_completed: completed, completed_by: completed ? context.userId : null, completed_at: completed ? new Date().toISOString() : null }).eq("id", id)); break;
      }
      case "ticket_types":
        ({ error } = await this.supabase.from("ticket_types").update({ name: String(values.name ?? "").trim(), code: String(values.code ?? "").trim() || null, category: String(values.category ?? "Standard"), zone: String(values.zone ?? "").trim() || null, price: Number(values.price ?? 0), total_quantity: Number(values.total_quantity ?? 0), max_per_order: Number(values.max_per_order ?? 6), sales_start: String(values.sales_start ?? "") || null, sales_end: String(values.sales_end ?? "") || null, status: String(values.status ?? "draft") }).eq("id", id)); break;
      case "staff_assignments":
        ({ error } = await this.supabase.from("staff_assignments").update({ profile_id: String(values.profile_id ?? "") || null, staff_name: String(values.staff_name ?? "").trim(), phone: String(values.phone ?? "").trim() || null, role: String(values.role ?? "").trim(), zone: String(values.zone ?? "").trim() || null, starts_at: String(values.starts_at ?? "") || null, ends_at: String(values.ends_at ?? "") || null, status: String(values.status ?? "invited"), availability_status: String(values.availability_status ?? "unknown"), compensation_amount: values.compensation_amount === null || values.compensation_amount === "" ? null : Number(values.compensation_amount), confirmed_at: String(values.status ?? "") === "confirmed" ? new Date().toISOString() : null }).eq("id", id)); break;
      case "event_official_assignments":
        ({ error } = await this.supabase.from("event_official_assignments").update({ profile_id: String(values.profile_id ?? "") || null, mention: String(values.mention ?? "").trim() || null, role: String(values.role ?? "official"), status: String(values.status ?? "invited") }).eq("id", id)); break;
      case "fight_official_assignments":
        ({ error } = await this.supabase.from("fight_official_assignments").update({ position: values.position === null || values.position === "" ? null : Number(values.position), status: String(values.status ?? "assigned") }).eq("id", id)); break;
      case "event_accreditations": {
        const status = String(values.status ?? "draft");
        ({ error } = await this.supabase.from("event_accreditations").update({ profile_id: String(values.profile_id ?? "") || null, holder_name: String(values.holder_name ?? "").trim(), badge_code: String(values.badge_code ?? "").trim(), accreditation_type: String(values.accreditation_type ?? "staff"), access_zones: String(values.access_zones ?? "").split(",").map((zone) => zone.trim()).filter(Boolean), status, valid_from: String(values.valid_from ?? "") || null, valid_until: String(values.valid_until ?? "") || null, issued_at: ["issued", "active"].includes(status) ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq("id", id));
        break;
      }
      case "event_operations": {
        const previous = await this.supabase.from("event_operation_records").select("status").eq("id", id).single();
        if (previous.error) throw previous.error;
        const nextStatus = String(values.status ?? previous.data.status);
        const details = await this.supabase.from("event_operation_records").update({
          title: String(values.title ?? "").trim(),
          description: String(values.description ?? "").trim() || null,
          category: String(values.category ?? "").trim() || null,
          severity: String(values.severity ?? "normal"),
          owner_profile_id: String(values.owner_profile_id ?? "") || null,
          due_at: String(values.due_at ?? "") || null,
          resolution: String(values.resolution ?? "").trim() || null,
          attachment_path: String(values.attachment_path ?? "").trim() || null,
          visibility: String(values.visibility ?? "internal"),
          updated_at: new Date().toISOString(),
        }).eq("id", id);
        error = details.error;
        if (!error && previous.data.status !== nextStatus) {
          const transition = await this.supabase.rpc("transition_event_operation", {
            p_operation_id: id,
            p_status: nextStatus,
            p_note: String(values.resolution ?? "").trim() || undefined,
          });
          error = transition.error;
        }
        break;
      }
      case "event_transactions": {
        const previous = await this.supabase.from("event_transactions").select("status").eq("id", id).single();
        if (previous.error) throw previous.error;
        const nextStatus = String(values.status ?? previous.data.status);
        const details = await this.supabase.from("event_transactions").update({
          description: String(values.description ?? "").trim(),
          category_code: String(values.category_code ?? "other"),
          transaction_type: String(values.transaction_type ?? "expense"),
          amount: Number(values.amount ?? 0),
          budget_line_id: String(values.budget_line_id ?? "") || null,
          due_at: String(values.due_at ?? "") || null,
          occurred_at: String(values.occurred_at ?? "") || null,
          reference: String(values.reference ?? "").trim() || null,
          updated_at: new Date().toISOString(),
        }).eq("id", id);
        error = details.error;
        if (!error && nextStatus !== previous.data.status) {
          const transition = await this.supabase.rpc("transition_event_transaction", {
            p_transaction_id: id, p_status: nextStatus,
            p_note: String(values.description ?? "").trim() || undefined,
          });
          error = transition.error;
        }
        break;
      }
      case "workspace_records":
        ({ error } = await this.supabase.from("erp_workspace_records").update({ title: String(values.title ?? "").trim(), description: String(values.description ?? "").trim() || null, status: String(values.status ?? "todo"), priority: String(values.priority ?? "normal"), due_at: String(values.due_at ?? "") || null, updated_at: new Date().toISOString() }).eq("id", id)); break;
      default:
        throw new Error("La modification n’est pas encore disponible pour ce domaine.");
    }
    if (error) throw error;
  }

  async remove(entity: RealErpData["entity"], id: string) {
    let error: unknown = null;
    switch (entity) {
      case "events": ({ error } = await this.supabase.from("events").delete().eq("id", id)); break;
      case "organization_transactions": ({ error } = await this.supabase.from("transactions").delete().eq("id", id)); break;
      case "fighter_transactions": ({ error } = await this.supabase.from("fighter_transactions").delete().eq("id", id)); break;
      case "club_members": ({ error } = await this.supabase.from("club_members").delete().eq("id", id)); break;
      case "attendances": ({ error } = await this.supabase.from("attendances").delete().eq("id", id)); break;
      case "training_sessions": ({ error } = await this.supabase.from("training_sessions").delete().eq("id", id)); break;
      case "products": ({ error } = await this.supabase.from("products").delete().eq("id", id)); break;
      case "contracts": ({ error } = await this.supabase.from("contracts").delete().eq("id", id)); break;
      case "competitions": ({ error } = await this.supabase.from("competitions").delete().eq("id", id)); break;
      case "competition_categories": ({ error } = await this.supabase.from("competition_categories").delete().eq("id", id)); break;
      case "event_fight_cards": ({ error } = await this.supabase.from("event_fight_cards").delete().eq("id", id)); break;
      case "fights": ({ error } = await this.supabase.from("fights").delete().eq("id", id)); break;
      case "weigh_ins": ({ error } = await this.supabase.from("weigh_ins").delete().eq("id", id)); break;
      case "fight_replacements": ({ error } = await this.supabase.from("fight_replacements").delete().eq("id", id)); break;
      case "event_invitations": ({ error } = await this.supabase.from("event_invitations").delete().eq("id", id)); break;
      case "event_schedule_items": ({ error } = await this.supabase.from("event_schedule_items").delete().eq("id", id)); break;
      case "event_checklists": ({ error } = await this.supabase.from("event_checklists").delete().eq("id", id)); break;
      case "ticket_types": ({ error } = await this.supabase.from("ticket_types").delete().eq("id", id)); break;
      case "staff_assignments": ({ error } = await this.supabase.from("staff_assignments").delete().eq("id", id)); break;
      case "event_official_assignments": ({ error } = await this.supabase.from("event_official_assignments").delete().eq("id", id)); break;
      case "fight_official_assignments": ({ error } = await this.supabase.from("fight_official_assignments").delete().eq("id", id)); break;
      case "event_accreditations": ({ error } = await this.supabase.from("event_accreditations").delete().eq("id", id)); break;
      case "event_operations": ({ error } = await this.supabase.from("event_operation_records").delete().eq("id", id)); break;
      case "sponsors": ({ error } = await this.supabase.from("sponsors").delete().eq("id", id)); break;
      case "sponsor_pipeline": ({ error } = await this.supabase.from("sponsor_pipeline").delete().eq("id", id)); break;
      case "sponsor_packages": ({ error } = await this.supabase.from("sponsor_packages").delete().eq("id", id)); break;
      case "sponsor_contracts": ({ error } = await this.supabase.from("sponsor_contracts").delete().eq("id", id)); break;
      case "sponsor_visibility": ({ error } = await this.supabase.from("sponsor_visibility_items").delete().eq("id", id)); break;
      case "sponsor_activations": ({ error } = await this.supabase.from("sponsor_activations").delete().eq("id", id)); break;
      case "sponsor_deliverables": ({ error } = await this.supabase.from("event_sponsor_deliverables").delete().eq("id", id)); break;
      case "event_budget_lines": ({ error } = await this.supabase.from("event_budget_lines").delete().eq("id", id)); break;
      case "event_invoices": ({ error } = await this.supabase.from("event_invoices").delete().eq("id", id)); break;
      case "event_transactions": ({ error } = await this.supabase.from("event_transactions").delete().eq("id", id)); break;
      case "workspace_records": ({ error } = await this.supabase.from("erp_workspace_records").delete().eq("id", id)); break;
      default: throw new Error("La suppression n’est pas encore disponible pour ce domaine.");
    }
    if (error) throw error;
  }
  private async events(query: RealErpQuery, context: Context) {
    let request = this.supabase.from("events").select("*,regions(name),cities(name)").order("updated_at", { ascending: false });
    if (query.role === "fan") {
      request = request.in("status", ["published", "active", "live"]);
    } else if (query.role !== "super-admin" && query.role !== "admin") {
      const ids = await this.accessibleEventIds(context);
      request = request.in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    }
    const result = await request;
    if (result.error) throw result.error;
    const rows = asRows(result.data);
    const fields: RealErpData["fields"] = [
      { name: "title", label: "Nom de l’événement", type: "text", required: true },
      { name: "venue", label: "Lieu", type: "text" },
      { name: "status", label: "Statut", type: "select", required: true, options: [
        { label: "Brouillon", value: "draft" }, { label: "Publié", value: "published" },
        { label: "Terminé", value: "completed" }, { label: "Annulé", value: "cancelled" },
        { label: "Archivé", value: "archived" },
      ] },
    ];
    return buildData(query, ["Événement", "Salle", "Région", "Ville", "Statut", "Mise à jour"], rows.map((row) => [text(row.title), text(row.venue), text((row.regions as Row | null)?.name), text((row.cities as Row | null)?.name), text(row.status), date(row.updated_at)]), rows.map((row) => text(row.id)), [
      { label: "Événements", value: String(rows.length), detail: "Total accessible", tone: "blue" },
      { label: "Publiés / actifs", value: String(rows.filter((row) => ["published", "active", "live"].includes(text(row.status))).length), detail: "Visibles ou en cours", tone: "green" },
      { label: "Brouillons", value: String(rows.filter((row) => text(row.status) === "draft").length), detail: "À finaliser", tone: "amber" },
    ], query.role === "organizer" ? mutation("events", rows, fields) : undefined);
  }

  private async fights(query: RealErpQuery, context: Context) {
    let request = this.supabase.from("fights").select("*").order("fight_order");
    if (query.role === "fighter" && context.fighterId) request = request.or(`fighter_red_id.eq.${context.fighterId},fighter_blue_id.eq.${context.fighterId}`);
    const [result, fighters] = await Promise.all([request, this.supabase.from("fighters").select("id,full_name")]);
    if (result.error) throw result.error;
    if (fighters.error) throw fighters.error;
    const names = new Map((fighters.data ?? []).map((item) => [item.id, item.full_name]));
    const rows = asRows(result.data);
    return buildData(query, ["Coin rouge", "Coin bleu", "Catégorie", "Rounds", "Statut", "Résultat"], rows.map((row) => [
      names.get(text(row.fighter_red_id)) ?? "À confirmer", names.get(text(row.fighter_blue_id)) ?? "À confirmer",
      text(row.weight_category), text(row.scheduled_rounds), text(row.status), row.winner_id ? names.get(text(row.winner_id)) ?? text(row.method) : text(row.method),
    ]), rows.map((row) => text(row.id)), [
      { label: "Combats", value: String(rows.length), detail: "Périmètre accessible", tone: "red" },
      { label: "Terminés", value: String(rows.filter((row) => ["completed", "finished"].includes(text(row.status))).length), detail: "Résultats enregistrés", tone: "green" },
      { label: "Programmés", value: String(rows.filter((row) => ["scheduled", "planned"].includes(text(row.status))).length), detail: "À venir", tone: "blue" },
    ]);
  }

  private async ticketing(query: RealErpQuery, context: Context) {
    let request = this.supabase.from("ticket_sales").select("*").order("sold_at", { ascending: false });
    if (context.organizationIds.length) {
      const ids = await this.accessibleEventIds(context);
      request = request.in("event_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    }
    const result = await request;
    if (result.error) throw result.error;
    const rows = asRows(result.data);
    const revenue = rows.reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0);
    const quantity = rows.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0);
    return buildData(query, ["Acheteur", "Email", "Quantité", "Montant", "Paiement", "Date"], rows.map((row) => [text(row.buyer_name), text(row.buyer_email), text(row.quantity), money(row.total_amount), text(row.payment_status), date(row.sold_at)]), rows.map((row) => text(row.id)), [
      { label: "Billets vendus", value: quantity.toLocaleString("fr-FR"), detail: "Quantité réelle", tone: "blue" },
      { label: "Recettes", value: money(revenue), detail: "Ventes enregistrées", tone: "green" },
      { label: "Transactions", value: String(rows.length), detail: "Opérations de vente", tone: "blue" },
    ]);
  }

  private async people(query: RealErpQuery, context: Context) {
    let request = this.supabase.from("organization_members").select("id,organization_id,profile_id,role,status,joined_at");
    if (context.organizationIds.length) request = request.in("organization_id", context.organizationIds);
    const [result, profiles] = await Promise.all([request, this.supabase.from("profiles").select("id,full_name,email")]);
    if (result.error) throw result.error;
    if (profiles.error) throw profiles.error;
    const profileMap = new Map((profiles.data ?? []).map((item) => [item.id, item]));
    const rows = asRows(result.data);
    return buildData(query, ["Personne", "Email", "Rôle", "Statut", "Depuis"], rows.map((row) => {
      const profile = profileMap.get(text(row.profile_id));
      return [profile?.full_name ?? "Profil", profile?.email ?? "—", text(row.role), text(row.status), date(row.joined_at)];
    }), rows.map((row) => text(row.id)), [
      { label: "Personnes", value: String(rows.length), detail: "Membres accessibles", tone: "blue" },
      { label: "Actifs", value: String(rows.filter((row) => text(row.status) === "active").length), detail: "Comptes actifs", tone: "green" },
    ]);
  }

  private async clubMembers(
    query: RealErpQuery,
    context: Context,
  ) {
    const organizationId =
      await this.clubOrganizationId(context);

    if (!organizationId) {
      return buildData(
        query,
        ["Membre", "Rôle", "Discipline", "Statut", "Adhésion"],
        [],
        [],
        [
          {
            label: "Membres",
            value: "0",
            detail: "Aucun club actif",
            tone: "amber",
          },
        ],
      );
    }

    const result =
      await this.supabase
        .from("club_members")
        .select("*")
        .eq("organization_id", organizationId)
        .order("full_name", {
          ascending: true,
        });

    if (result.error) {
      throw result.error;
    }

    let rows =
      asRows(result.data);

    if (query.tab === "fighters") {
      rows =
        rows.filter(
          (row) =>
            row.role === "fighter" ||
            Boolean(row.fighter_id),
        );
    }

    if (query.tab === "coaches") {
      rows =
        rows.filter(
          (row) =>
            row.role === "coach",
        );
    }

    const fields:
      RealErpData["fields"] = [
        {
          name: "first_name",
          label: "Prénom",
          type: "text",
          required: true,
        },
        {
          name: "last_name",
          label: "Nom",
          type: "text",
          required: true,
        },
        {
          name: "email",
          label: "Email",
          type: "text",
        },
        {
          name: "phone",
          label: "Téléphone",
          type: "text",
        },
        {
          name: "role",
          label: "Rôle",
          type: "select",
          required: true,
          options: [
            {
              label: "Membre",
              value: "member",
            },
            {
              label: "Combattant",
              value: "fighter",
            },
            {
              label: "Coach",
              value: "coach",
            },
            {
              label: "Responsable",
              value: "manager",
            },
          ],
        },
        {
          name: "primary_discipline",
          label: "Discipline",
          type: "text",
        },
        {
          name: "weight_category",
          label: "Catégorie de poids",
          type: "text",
        },
        {
          name: "belt_level",
          label: "Grade / niveau",
          type: "text",
        },
        {
          name: "member_status",
          label: "Statut",
          type: "select",
          required: true,
          options: [
            {
              label: "Actif",
              value: "active",
            },
            {
              label: "En attente",
              value: "pending",
            },
            {
              label: "Suspendu",
              value: "suspended",
            },
            {
              label: "Inactif",
              value: "inactive",
            },
          ],
        },
        {
          name: "join_date",
          label: "Date d’adhésion",
          type: "date",
        },
        {
          name: "notes",
          label: "Notes",
          type: "textarea",
        },
      ];

    const memberName =
      (row: Row) => {
        const full =
          text(row.full_name);

        if (full !== "—") {
          return full;
        }

        return [
          text(row.first_name),
          text(row.last_name),
        ]
          .filter(
            (value) =>
              value !== "—",
          )
          .join(" ") ||
          "Membre";
      };

    const activeCount =
      rows.filter(
        (row) =>
          text(row.member_status) ===
          "active",
      ).length;

    const fighterCount =
      rows.filter(
        (row) =>
          row.role === "fighter" ||
          Boolean(row.fighter_id),
      ).length;

    return buildData(
      query,
      [
        "Membre",
        "Rôle",
        "Discipline",
        "Catégorie",
        "Statut",
        "Adhésion",
      ],
      rows.map(
        (row) => [
          memberName(row),
          text(row.role),
          text(row.primary_discipline),
          text(row.weight_category),
          text(row.member_status),
          date(
            row.join_date ??
            row.joined_at,
          ),
        ],
      ),
      rows.map(
        (row) =>
          text(row.id),
      ),
      [
        {
          label: "Membres",
          value: String(rows.length),
          detail: "Périmètre du club",
          tone: "blue",
        },
        {
          label: "Actifs",
          value: String(activeCount),
          detail: "Adhésions actives",
          tone: "green",
        },
        {
          label: "Combattants",
          value: String(fighterCount),
          detail: "Membres combattants",
          tone: "red",
        },
      ],
      mutation(
        "club_members",
        rows,
        fields,
      ),
    );
  }

  private async clubAttendances(
    query: RealErpQuery,
    context: Context,
  ) {
    const organizationId =
      await this.clubOrganizationId(context);

    if (!organizationId) {
      return buildData(
        query,
        [
          "Membre",
          "Date",
          "Heure",
          "Discipline",
          "Statut",
        ],
        [],
        [],
      );
    }

    const [
      attendanceResult,
      membersResult,
    ] =
      await Promise.all([
        this.supabase
          .from("attendances")
          .select("*")
          .eq(
            "organization_id",
            organizationId,
          )
          .order(
            "session_date",
            {
              ascending: false,
            },
          ),
        this.supabase
          .from("club_members")
          .select(
            "id,full_name,first_name,last_name",
          )
          .eq(
            "organization_id",
            organizationId,
          )
          .order(
            "full_name",
            {
              ascending: true,
            },
          ),
      ]);

    const error =
      attendanceResult.error ??
      membersResult.error;

    if (error) {
      throw error;
    }

    const rows =
      asRows(
        attendanceResult.data,
      );

    const memberNames =
      new Map(
        (
          membersResult.data ??
          []
        ).map(
          (member) => [
            member.id,
            member.full_name ??
            [
              member.first_name,
              member.last_name,
            ]
              .filter(Boolean)
              .join(" "),
          ],
        ),
      );

    const fields:
      RealErpData["fields"] = [
        {
          name: "member_id",
          label: "Membre",
          type: "select",
          required: true,
          options:
            (
              membersResult.data ??
              []
            ).map(
              (member) => ({
                label:
                  member.full_name ??
                  [
                    member.first_name,
                    member.last_name,
                  ]
                    .filter(Boolean)
                    .join(" "),
                value:
                  member.id,
              }),
            ),
        },
        {
          name: "session_date",
          label: "Date",
          type: "date",
          required: true,
        },
        {
          name: "session_time",
          label: "Heure",
          type: "time",
          required: true,
        },
        {
          name: "discipline",
          label: "Discipline",
          type: "text",
        },
        {
          name: "status",
          label: "Statut",
          type: "select",
          options: [
            {
              label: "Présent",
              value: "present",
            },
            {
              label: "Absent",
              value: "absent",
            },
            {
              label: "Retard",
              value: "late",
            },
            {
              label: "Excusé",
              value: "excused",
            },
          ],
        },
        {
          name: "check_method",
          label: "Mode de pointage",
          type: "select",
          options: [
            {
              label: "Manuel",
              value: "manual",
            },
            {
              label: "QR",
              value: "qr",
            },
            {
              label: "Import",
              value: "import",
            },
          ],
        },
        {
          name: "notes",
          label: "Notes",
          type: "textarea",
        },
      ];

    const presentCount =
      rows.filter(
        (row) =>
          text(row.status) ===
          "present",
      ).length;

    return buildData(
      query,
      [
        "Membre",
        "Date",
        "Heure",
        "Discipline",
        "Statut",
        "Pointage",
      ],
      rows.map(
        (row) => [
          memberNames.get(
            text(row.member_id),
          ) ??
          "Membre",
          date(row.session_date),
          text(row.session_time),
          text(row.discipline),
          text(row.status),
          text(row.check_method),
        ],
      ),
      rows.map(
        (row) =>
          text(row.id),
      ),
      [
        {
          label: "Pointages",
          value: String(rows.length),
          detail: "Historique réel",
          tone: "blue",
        },
        {
          label: "Présences",
          value: String(presentCount),
          detail: "Présences enregistrées",
          tone: "green",
        },
      ],
      mutation(
        "attendances",
        rows,
        fields,
      ),
    );
  }
  private async training(query: RealErpQuery, context: Context) {

    let request = this.supabase.from("training_sessions").select("*").order("day_of_week");
    if (context.organizationIds.length) request = request.in("organization_id", context.organizationIds);
    const result = await request;
    if (result.error) throw result.error;
    const rows = asRows(result.data);
    const fields: RealErpData["fields"] = [
      { name: "title", label: "Titre de la séance", type: "text", required: true },
      { name: "discipline", label: "Discipline", type: "text" },
      { name: "coach_name", label: "Coach", type: "text" },
      { name: "day_of_week", label: "Jour de la semaine (1-7)", type: "number", required: true },
      { name: "start_time", label: "Heure de début", type: "time" },
      { name: "end_time", label: "Heure de fin", type: "time" },
      { name: "capacity", label: "Capacité", type: "number" },
    ];
    return buildData(query, ["Séance", "Discipline", "Coach", "Jour", "Début", "Fin", "Capacité"], rows.map((row) => [text(row.title), text(row.discipline), text(row.coach_name), text(row.day_of_week), text(row.start_time), text(row.end_time), text(row.capacity)]), rows.map((row) => text(row.id)), undefined, mutation("training_sessions", rows, fields));
  }

  private async finance(query: RealErpQuery, context: Context) {
    if (query.role === "fighter" && context.fighterId) {
      const result = await this.supabase.from("fighter_transactions").select("*").eq("fighter_id", context.fighterId).order("transaction_date", { ascending: false });
      if (result.error) throw result.error;
      return this.financeData(query, asRows(result.data), "transaction_type", "label");
    }
    let request = this.supabase.from("transactions").select("*").order("transaction_date", { ascending: false });
    if (context.organizationIds.length) request = request.in("organization_id", context.organizationIds);
    const result = await request;
    if (result.error) throw result.error;
    return this.financeData(query, asRows(result.data), "type", "description");
  }

  private financeData(query: RealErpQuery, rows: Row[], typeKey: string, labelKey: string) {
    const isIncome = (row: Row) => /income|revenue|recette|credit|entrée/.test(normalize(text(row[typeKey])));
    const income = rows.filter(isIncome).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
    const expense = rows.filter((row) => !isIncome(row)).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
    const fighter = query.role === "fighter";
    const fields: RealErpData["fields"] = [
      { name: fighter ? "label" : "description", label: "Libellé", type: "text", required: true },
      { name: "category", label: "Catégorie", type: "text" },
      { name: fighter ? "transaction_type" : "type", label: "Type", type: "select", required: true, options: [
        { label: "Recette", value: "income" }, { label: "Dépense", value: "expense" },
      ] },
      { name: "amount", label: "Montant (Ar)", type: "number", required: true },
      { name: "transaction_date", label: "Date", type: "date", required: true },
    ];
    return buildData(query, ["Libellé", "Catégorie", "Type", "Montant", "Date"], rows.map((row) => [text(row[labelKey]), text(row.category), text(row[typeKey]), money(row.amount), date(row.transaction_date)]), rows.map((row) => text(row.id)), [
      { label: "Recettes", value: money(income), detail: "Total réel", tone: "green" },
      { label: "Dépenses", value: money(expense), detail: "Total réel", tone: "red" },
      { label: "Solde", value: money(income - expense), detail: "Disponible calculé", tone: income - expense >= 0 ? "blue" : "amber" },
    ], mutation(fighter ? "fighter_transactions" : "organization_transactions", rows, fields));
  }

  private async organizationOverview(
    query: RealErpQuery,
    context: Context,
  ) {
    const organizationId =
      context.activeOrganizationId &&
      context.organizationIds.includes(
        context.activeOrganizationId,
      )
        ? context.activeOrganizationId
        : context.organizationIds[0] ??
          null;

    if (!organizationId) {
      return buildData(
        query,
        [
          "Organisation",
          "Type",
          "Statut",
        ],
        [],
        [],
        [
          {
            label: "Organisation",
            value: "Aucune",
            detail: "Aucun périmètre actif",
            tone: "amber",
          },
        ],
      );
    }

    const [
      organizationResult,
      membersResult,
      ownedEventsResult,
      coorganizedResult,
      trainingResult,
    ] =
      await Promise.all([
        this.supabase
          .from("organizations")
          .select(
            "id,name,type,status,is_verified",
          )
          .eq(
            "id",
            organizationId,
          )
          .maybeSingle(),

        this.supabase
          .from("organization_members")
          .select(
            "id,role,status,joined_at",
          )
          .eq(
            "organization_id",
            organizationId,
          ),

        this.supabase
          .from("events")
          .select(
            "id,title,status,starts_at",
          )
          .eq(
            "organizer_id",
            organizationId,
          )
          .order(
            "starts_at",
            {
              ascending: false,
            },
          ),

        this.supabase
          .from("event_coorganizers")
          .select(
            "event_id,status",
          )
          .eq(
            "organization_id",
            organizationId,
          )
          .eq(
            "status",
            "accepted",
          ),

        this.supabase
          .from("training_sessions")
          .select(
            "id,title,day_of_week,start_time,end_time",
          )
          .eq(
            "organization_id",
            organizationId,
          ),
      ]);

    const error =
      organizationResult.error ??
      membersResult.error ??
      ownedEventsResult.error ??
      coorganizedResult.error ??
      trainingResult.error;

    if (error) {
      throw error;
    }

    const organization =
      organizationResult.data;

    if (!organization) {
      return buildData(
        query,
        [
          "Organisation",
          "Type",
          "Statut",
        ],
        [],
        [],
      );
    }

    const members =
      asRows(
        membersResult.data,
      );

    const ownedEvents =
      asRows(
        ownedEventsResult.data,
      );

    const coorganizedEvents =
      asRows(
        coorganizedResult.data,
      );

    const sessions =
      asRows(
        trainingResult.data,
      );

    const activeMembers =
      members.filter(
        (member) =>
          text(
            member.status,
          ) === "active",
      ).length;

    const upcomingEvents =
      ownedEvents.filter(
        (event) => {
          if (!event.starts_at) {
            return false;
          }

          const startsAt =
            new Date(
              String(
                event.starts_at,
              ),
            );

          return (
            !Number.isNaN(
              startsAt.getTime(),
            ) &&
            startsAt.getTime() >=
              Date.now()
          );
        },
      ).length;

    const eventCount =
      new Set([
        ...ownedEvents.map(
          (event) =>
            text(
              event.id,
            ),
        ),
        ...coorganizedEvents.map(
          (event) =>
            text(
              event.event_id,
            ),
        ),
      ]).size;

    const kpis:
      RealErpData["kpis"] = [
        {
          label: "Membres",
          value:
            String(
              members.length,
            ),
          detail: "Périmètre réel",
          tone: "blue",
        },
        {
          label: "Actifs",
          value:
            String(
              activeMembers,
            ),
          detail: "Membres actifs",
          tone: "green",
        },
        {
          label: "Événements",
          value:
            String(
              eventCount,
            ),
          detail: "Organisés ou coorganisés",
          tone: "red",
        },
        {
          label: "Séances",
          value:
            String(
              sessions.length,
            ),
          detail: "Planning enregistré",
          tone: "amber",
        },
      ];

    return buildData(
      query,
      [
        "Organisation",
        "Type",
        "Statut",
        "Vérification",
        "Membres",
        "Événements à venir",
      ],
      [
        [
          organization.name,
          text(
            organization.type,
          ),
          text(
            organization.status,
          ),
          organization.is_verified
            ? "Vérifiée"
            : "Non vérifiée",
          String(
            members.length,
          ),
          String(
            upcomingEvents,
          ),
        ],
      ],
      [
        organization.id,
      ],
      kpis,
    );
  }
  private async fighterPerformance(
    query: RealErpQuery,
    context: Context,
  ) {
    if (!context.fighterId) {
      return buildData(
        query,
        [
          "Indicateur",
          "Valeur",
          "Détail",
        ],
        [],
        [],
        [
          {
            label: "Profil combattant",
            value: "Absent",
            detail: "Aucun combattant lié au compte",
            tone: "amber",
          },
        ],
      );
    }

    const [
      fighterResult,
      fightsResult,
      fightersResult,
    ] =
      await Promise.all([
        this.supabase
          .from("fighters")
          .select("*")
          .eq(
            "id",
            context.fighterId,
          )
          .maybeSingle(),

        this.supabase
          .from("fights")
          .select("*")
          .or(
            `fighter_red_id.eq.${context.fighterId},fighter_blue_id.eq.${context.fighterId}`,
          )
          .order(
            "fight_order",
            {
              ascending: true,
            },
          ),

        this.supabase
          .from("fighters")
          .select(
            "id,full_name",
          ),
      ]);

    const error =
      fighterResult.error ??
      fightsResult.error ??
      fightersResult.error;

    if (error) {
      throw error;
    }

    const fighter =
      fighterResult.data;

    if (!fighter) {
      return buildData(
        query,
        [
          "Indicateur",
          "Valeur",
          "Détail",
        ],
        [],
        [],
      );
    }

    const fights =
      asRows(
        fightsResult.data,
      );

    const fighterNames =
      new Map(
        (
          fightersResult.data ??
          []
        ).map(
          (item) => [
            item.id,
            item.full_name,
          ] as const,
        ),
      );

    const opponentName =
      (fight: Row) => {
        const redId =
          text(
            fight.fighter_red_id,
          );

        const blueId =
          text(
            fight.fighter_blue_id,
          );

        const opponentId =
          redId === context.fighterId
            ? blueId
            : redId;

        return (
          fighterNames.get(
            opponentId,
          ) ??
          "Adversaire à confirmer"
        );
      };

    const fightResult =
      (fight: Row) => {
        const winnerId =
          text(
            fight.winner_id,
          );

        if (
          winnerId ===
          context.fighterId
        ) {
          return "Victoire";
        }

        if (
          fight.winner_id
        ) {
          return "Défaite";
        }

        if (
          ["completed", "finished"].includes(
            text(
              fight.status,
            ),
          )
        ) {
          return "Résultat non renseigné";
        }

        return "À venir";
      };

    const wins =
      Number(
        fighter.wins ??
        0,
      );

    const losses =
      Number(
        fighter.losses ??
        0,
      );

    const draws =
      Number(
        fighter.draws ??
        0,
      );

    const record =
      `${wins}-${losses}-${draws}`;

    const completed =
      fights.filter(
        (fight) =>
          [
            "completed",
            "finished",
          ].includes(
            text(
              fight.status,
            ),
          ),
      ).length;

    const scheduled =
      fights.filter(
        (fight) =>
          [
            "scheduled",
            "planned",
          ].includes(
            text(
              fight.status,
            ),
          ),
      ).length;

    const kpis:
      RealErpData["kpis"] = [
        {
          label: "Record",
          value: record,
          detail: "V-D-N officiel",
          tone: "blue",
        },
        {
          label: "Classement ELO",
          value:
            String(
              fighter.elo_rating ??
              0,
            ),
          detail: "Valeur enregistrée",
          tone: "green",
        },
        {
          label: "Combats accessibles",
          value:
            String(
              fights.length,
            ),
          detail: "Historique réel",
          tone: "red",
        },
        {
          label: "Programmés",
          value:
            String(
              scheduled,
            ),
          detail: "Combats à venir",
          tone: "amber",
        },
      ];

    if (
      query.tab === "sport"
    ) {
      return buildData(
        query,
        [
          "Combattant",
          "Record",
          "ELO",
          "Catégorie",
          "Statut",
        ],
        [
          [
            fighter.full_name,
            record,
            String(
              fighter.elo_rating ??
              0,
            ),
            text(
              fighter.weight_class,
            ),
            text(
              fighter.status_professional,
            ),
          ],
        ],
        [
          fighter.id,
        ],
        kpis,
      );
    }

    if (
      query.tab === "condition"
    ) {
      return buildData(
        query,
        [
          "Poids",
          "Catégorie",
          "Taille",
          "Allonge",
          "Dernier médical",
          "Validité médicale",
        ],
        [
          [
            fighter.current_weight_kg
              ? `${fighter.current_weight_kg} kg`
              : "—",
            text(
              fighter.weight_class,
            ),
            fighter.height_cm
              ? `${fighter.height_cm} cm`
              : "—",
            fighter.reach_cm
              ? `${fighter.reach_cm} cm`
              : "—",
            date(
              fighter.last_medical_check,
            ),
            date(
              fighter.medical_clearance_expiry,
            ),
          ],
        ],
        [
          fighter.id,
        ],
        kpis,
      );
    }

    if (
      query.tab === "fights" ||
      query.tab === "reports" ||
      query.tab === "progress"
    ) {
      return buildData(
        query,
        [
          "Adversaire",
          "Catégorie",
          "Statut",
          "Résultat",
          "Méthode",
        ],
        fights.map(
          (fight) => [
            opponentName(
              fight,
            ),
            text(
              fight.weight_category,
            ),
            text(
              fight.status,
            ),
            fightResult(
              fight,
            ),
            text(
              fight.method,
            ),
          ],
        ),
        fights.map(
          (fight) =>
            text(
              fight.id,
            ),
        ),
        kpis,
      );
    }

    return buildData(
      query,
      [
        "Combattant",
        "Record",
        "ELO",
        "Combats",
        "Terminés",
        "Programmés",
      ],
      [
        [
          fighter.full_name,
          record,
          String(
            fighter.elo_rating ??
            0,
          ),
          String(
            fights.length,
          ),
          String(
            completed,
          ),
          String(
            scheduled,
          ),
        ],
      ],
      [
        fighter.id,
      ],
      kpis,
    );
  }

  private async clubPerformance(
    query: RealErpQuery,
    context: Context,
  ) {
    const organizationId =
      await this.clubOrganizationId(
        context,
      );

    if (!organizationId) {
      return buildData(
        query,
        [
          "Indicateur",
          "Valeur",
        ],
        [],
        [],
        [
          {
            label: "Club",
            value: "Absent",
            detail: "Aucun club actif",
            tone: "amber",
          },
        ],
      );
    }

    const membersResult =
      await this.supabase
        .from("club_members")
        .select(
          "id,full_name,first_name,last_name,fighter_id,primary_discipline,member_status",
        )
        .eq(
          "organization_id",
          organizationId,
        );

    if (
      membersResult.error
    ) {
      throw membersResult.error;
    }

    const members =
      asRows(
        membersResult.data,
      );

    const fighterIds =
      members.flatMap(
        (member) =>
          member.fighter_id
            ? [
                text(
                  member.fighter_id,
                ),
              ]
            : [],
      );

    let fighterRows:
      Row[] = [];

    let redFightRows:
      Row[] = [];

    let blueFightRows:
      Row[] = [];

    if (
      fighterIds.length
    ) {
      const [
        fightersResult,
        redResult,
        blueResult,
      ] =
        await Promise.all([
          this.supabase
            .from("fighters")
            .select(
              "id,full_name,wins,losses,draws,elo_rating,weight_class,status",
            )
            .in(
              "id",
              fighterIds,
            ),

          this.supabase
            .from("fights")
            .select("*")
            .in(
              "fighter_red_id",
              fighterIds,
            ),

          this.supabase
            .from("fights")
            .select("*")
            .in(
              "fighter_blue_id",
              fighterIds,
            ),
        ]);

      const error =
        fightersResult.error ??
        redResult.error ??
        blueResult.error;

      if (error) {
        throw error;
      }

      fighterRows =
        asRows(
          fightersResult.data,
        );

      redFightRows =
        asRows(
          redResult.data,
        );

      blueFightRows =
        asRows(
          blueResult.data,
        );
    }

    const fightsById =
      new Map<
        string,
        Row
      >();

    for (
      const fight of [
        ...redFightRows,
        ...blueFightRows,
      ]
    ) {
      fightsById.set(
        text(
          fight.id,
        ),
        fight,
      );
    }

    const fights =
      Array.from(
        fightsById.values(),
      );

    const fightersById =
      new Map(
        fighterRows.map(
          (fighter) => [
            text(
              fighter.id,
            ),
            fighter,
          ] as const,
        ),
      );

    const membersByFighterId =
      new Map(
        members.flatMap(
          (member) =>
            member.fighter_id
              ? [
                  [
                    text(
                      member.fighter_id,
                    ),
                    member,
                  ] as const,
                ]
              : [],
        ),
      );

    const nameForMember =
      (member: Row) => {
        const fullName =
          text(
            member.full_name,
          );

        if (
          fullName !== "—"
        ) {
          return fullName;
        }

        return [
          text(
            member.first_name,
          ),
          text(
            member.last_name,
          ),
        ]
          .filter(
            (value) =>
              value !== "—",
          )
          .join(" ") ||
          "Membre";
      };

    const clubFighterIds =
      new Set(
        fighterIds,
      );

    const clubFighterName =
      (fighterId: string) => {
        const member =
          membersByFighterId.get(
            fighterId,
          );

        if (member) {
          return nameForMember(
            member,
          );
        }

        return (
          text(
            fightersById.get(
              fighterId,
            )?.full_name,
          )
        );
      };

    const fightClubFighter =
      (fight: Row) => {
        const red =
          text(
            fight.fighter_red_id,
          );

        if (
          clubFighterIds.has(
            red,
          )
        ) {
          return red;
        }

        return text(
          fight.fighter_blue_id,
        );
      };

    const opponentId =
      (
        fight: Row,
        clubFighterId: string,
      ) => {
        const red =
          text(
            fight.fighter_red_id,
          );

        return (
          red === clubFighterId
            ? text(
                fight.fighter_blue_id,
              )
            : red
        );
      };

    const allFighterIds =
      Array.from(
        new Set(
          fights.flatMap(
            (fight) => [
              text(
                fight.fighter_red_id,
              ),
              text(
                fight.fighter_blue_id,
              ),
            ],
          ),
        ),
      ).filter(
        (id) =>
          id !== "—",
      );

    let allFighterNames =
      new Map<
        string,
        string
      >();

    if (
      allFighterIds.length
    ) {
      const namesResult =
        await this.supabase
          .from("fighters")
          .select(
            "id,full_name",
          )
          .in(
            "id",
            allFighterIds,
          );

      if (
        namesResult.error
      ) {
        throw namesResult.error;
      }

      allFighterNames =
        new Map(
          (
            namesResult.data ??
            []
          ).map(
            (fighter) => [
              fighter.id,
              fighter.full_name,
            ] as const,
          ),
        );
    }

    const groupMap =
      new Map<
        string,
        {
          total: number;
          active: number;
          fighters: number;
        }
      >();

    for (
      const member of members
    ) {
      const discipline =
        text(
          member.primary_discipline,
        ) === "—"
          ? "Non renseignée"
          : text(
              member.primary_discipline,
            );

      const current =
        groupMap.get(
          discipline,
        ) ?? {
          total: 0,
          active: 0,
          fighters: 0,
        };

      current.total +=
        1;

      if (
        text(
          member.member_status,
        ) === "active"
      ) {
        current.active +=
          1;
      }

      if (
        member.fighter_id
      ) {
        current.fighters +=
          1;
      }

      groupMap.set(
        discipline,
        current,
      );
    }

    const totalWins =
      fighterRows.reduce(
        (sum, fighter) =>
          sum +
          Number(
            fighter.wins ??
            0,
          ),
        0,
      );

    const totalLosses =
      fighterRows.reduce(
        (sum, fighter) =>
          sum +
          Number(
            fighter.losses ??
            0,
          ),
        0,
      );

    const kpis:
      RealErpData["kpis"] = [
        {
          label: "Combattants",
          value:
            String(
              fighterRows.length,
            ),
          detail: "Profils liés au club",
          tone: "red",
        },
        {
          label: "Combats accessibles",
          value:
            String(
              fights.length,
            ),
          detail: "Historique réel",
          tone: "blue",
        },
        {
          label: "Victoires carrière",
          value:
            String(
              totalWins,
            ),
          detail: "Somme des records",
          tone: "green",
        },
        {
          label: "Défaites carrière",
          value:
            String(
              totalLosses,
            ),
          detail: "Somme des records",
          tone: "amber",
        },
      ];

    if (
      query.tab === "fighters"
    ) {
      return buildData(
        query,
        [
          "Combattant",
          "Discipline",
          "Catégorie",
          "Record",
          "ELO",
          "Statut",
        ],
        fighterRows.map(
          (fighter) => {
            const member =
              membersByFighterId.get(
                text(
                  fighter.id,
                ),
              );

            return [
              member
                ? nameForMember(
                    member,
                  )
                : text(
                    fighter.full_name,
                  ),
              member
                ? text(
                    member.primary_discipline,
                  )
                : "—",
              text(
                fighter.weight_class,
              ),
              `${Number(fighter.wins ?? 0)}-${Number(fighter.losses ?? 0)}-${Number(fighter.draws ?? 0)}`,
              String(
                fighter.elo_rating ??
                0,
              ),
              text(
                fighter.status,
              ),
            ];
          },
        ),
        fighterRows.map(
          (fighter) =>
            text(
              fighter.id,
            ),
        ),
        kpis,
      );
    }

    if (
      query.tab === "groups"
    ) {
      const groups =
        Array.from(
          groupMap.entries(),
        );

      return buildData(
        query,
        [
          "Groupe / discipline",
          "Membres",
          "Actifs",
          "Combattants",
        ],
        groups.map(
          (
            [
              discipline,
              stats,
            ],
          ) => [
            discipline,
            String(
              stats.total,
            ),
            String(
              stats.active,
            ),
            String(
              stats.fighters,
            ),
          ],
        ),
        groups.map(
          (
            [
              discipline,
            ],
            index,
          ) =>
            `${index}-${discipline}`,
        ),
        kpis,
      );
    }

    if (
      query.tab ===
        "competitions"
    ) {
      return buildData(
        query,
        [
          "Combattant",
          "Adversaire",
          "Catégorie",
          "Statut",
          "Résultat",
        ],
        fights.map(
          (fight) => {
            const fighterId =
              fightClubFighter(
                fight,
              );

            const rivalId =
              opponentId(
                fight,
                fighterId,
              );

            let result =
              "À venir";

            if (
              fight.winner_id
            ) {
              result =
                text(
                  fight.winner_id,
                ) === fighterId
                  ? "Victoire"
                  : "Défaite";
            }

            return [
              clubFighterName(
                fighterId,
              ),
              allFighterNames.get(
                rivalId,
              ) ??
              "Adversaire à confirmer",
              text(
                fight.weight_category,
              ),
              text(
                fight.status,
              ),
              result,
            ];
          },
        ),
        fights.map(
          (fight) =>
            text(
              fight.id,
            ),
        ),
        kpis,
      );
    }

    if (
      query.tab === "reports"
    ) {
      return buildData(
        query,
        [
          "Combattant",
          "Record carrière",
          "ELO",
          "Combats accessibles",
        ],
        fighterRows.map(
          (fighter) => {
            const fighterId =
              text(
                fighter.id,
              );

            const accessibleFightCount =
              fights.filter(
                (fight) =>
                  text(
                    fight.fighter_red_id,
                  ) === fighterId ||
                  text(
                    fight.fighter_blue_id,
                  ) === fighterId,
              ).length;

            return [
              clubFighterName(
                fighterId,
              ),
              `${Number(fighter.wins ?? 0)}-${Number(fighter.losses ?? 0)}-${Number(fighter.draws ?? 0)}`,
              String(
                fighter.elo_rating ??
                0,
              ),
              String(
                accessibleFightCount,
              ),
            ];
          },
        ),
        fighterRows.map(
          (fighter) =>
            text(
              fighter.id,
            ),
        ),
        kpis,
      );
    }

    return buildData(
      query,
      [
        "Indicateur",
        "Valeur",
      ],
      [
        [
          "Combattants liés",
          String(
            fighterRows.length,
          ),
        ],
        [
          "Combats accessibles",
          String(
            fights.length,
          ),
        ],
        [
          "Disciplines représentées",
          String(
            groupMap.size,
          ),
        ],
        [
          "Membres du club",
          String(
            members.length,
          ),
        ],
      ],
      [
        "fighters",
        "fights",
        "disciplines",
        "members",
      ],
      kpis,
    );
  }
  private async sponsors(query: RealErpQuery) {

    const result = await this.supabase.from("sponsor_offers").select("*").order("created_at", { ascending: false });
    if (result.error) throw result.error;
    const rows = asRows(result.data);
    return buildData(query, ["Montant", "Devise", "Durée", "Statut", "Validité"], rows.map((row) => [money(row.amount), text(row.currency), text(row.duration_months), text(row.status), date(row.valid_until)]), rows.map((row) => text(row.id)));
  }

  private async products(query: RealErpQuery, context: Context) {
    let request = this.supabase.from("products").select("*").order("name");
    if (context.organizationIds.length && !["super-admin", "admin", "fan"].includes(query.role)) request = request.in("seller_id", context.organizationIds);
    const result = await request;
    if (result.error) throw result.error;
    const rows = asRows(result.data);
    const fields: RealErpData["fields"] = [
      { name: "name", label: "Nom du produit", type: "text", required: true },
      { name: "price", label: "Prix (Ar)", type: "number", required: true },
      { name: "stock", label: "Stock", type: "number", required: true },
    ];
    return buildData(query, ["Produit", "Prix", "Stock"], rows.map((row) => [text(row.name), money(row.price), text(row.stock)]), rows.map((row) => text(row.id)), [
      { label: "Articles", value: String(rows.length), detail: "Catalogue réel", tone: "blue" },
      { label: "Stock total", value: rows.reduce((sum, row) => sum + Number(row.stock ?? 0), 0).toLocaleString("fr-FR"), detail: "Unités disponibles", tone: "green" },
    ], query.role === "seller" ? mutation("products", rows, fields) : undefined);
  }

  private async contracts(query: RealErpQuery) {
    const result = await this.supabase.from("contracts").select("*").order("created_at", { ascending: false });
    if (result.error) throw result.error;
    const rows = asRows(result.data);
    const fields: RealErpData["fields"] = [
      { name: "ref", label: "Référence", type: "text", required: true },
      { name: "beneficiary", label: "Bénéficiaire", type: "text", required: true },
      { name: "type", label: "Type", type: "text", required: true },
      { name: "amount", label: "Montant (Ar)", type: "number", required: true },
      { name: "manager", label: "Responsable", type: "text" },
      { name: "payment", label: "Paiement", type: "select", options: [
        { label: "En attente", value: "pending" }, { label: "Payé", value: "paid" },
      ] },
      { name: "start_date", label: "Date de début", type: "date", required: true },
      { name: "end_date", label: "Date de fin", type: "date", required: true },
      { name: "status", label: "Statut", type: "select", options: [
        { label: "Brouillon", value: "draft" }, { label: "Actif", value: "active" }, { label: "Terminé", value: "completed" },
      ] },
      { name: "details", label: "Détails", type: "textarea" },
    ];
    return buildData(query, ["Référence", "Bénéficiaire", "Type", "Montant", "Début", "Fin", "Statut"], rows.map((row) => [text(row.ref), text(row.beneficiary), text(row.type), money(row.amount), date(row.start_date), date(row.end_date), text(row.status)]), rows.map((row) => text(row.id)), undefined, mutation("contracts", rows, fields));
  }

  private async licenses(query: RealErpQuery) {
    const result = await this.supabase.from("licenses").select("*").order("expiry_date");
    if (result.error) throw result.error;
    const rows = asRows(result.data);
    return buildData(query, ["Licence", "Type", "Fédération", "Émission", "Expiration", "Statut"], rows.map((row) => [text(row.license_number), text(row.license_type), text(row.federation_name), date(row.issue_date), date(row.expiry_date), text(row.status)]), rows.map((row) => text(row.id)));
  }

  private async eventFightCards(query: RealErpQuery, context: Context) {
    const eventId = await this.activeEventId(context);
    const [cardsResult, fightersResult, disciplinesResult] = await Promise.all([
      eventId ? this.supabase.from("event_fight_cards").select("*").eq("event_id", eventId).order("position") : Promise.resolve({ data: [], error: null }),
      this.supabase.from("fighters").select("id,full_name").order("full_name"),
      this.supabase.from("disciplines").select("id,name").order("name"),
    ]);
    const error = cardsResult.error ?? fightersResult.error ?? disciplinesResult.error;
    if (error) throw error;
    const rows = asRows(cardsResult.data);
    const fighterNames = new Map((fightersResult.data ?? []).map((item) => [item.id, item.full_name]));
    const fighterOptions = [{ label: "À confirmer", value: "" }, ...(fightersResult.data ?? []).map((item) => ({ label: item.full_name, value: item.id }))];
    const disciplineOptions = [{ label: "À confirmer", value: "" }, ...(disciplinesResult.data ?? []).map((item) => ({ label: item.name, value: item.id }))];
    const fields: RealErpData["fields"] = [
      { name: "position", label: "Position", type: "number", required: true },
      { name: "segment", label: "Segment", type: "select", required: true, options: [{ label: "Préliminaires", value: "prelims" }, { label: "Carte principale", value: "main_card" }, { label: "Main event", value: "main_event" }] },
      { name: "discipline_id", label: "Discipline", type: "select", options: disciplineOptions },
      { name: "fighter_red_id", label: "Coin rouge", type: "select", options: fighterOptions },
      { name: "fighter_red_mention", label: "Mention coin rouge", type: "text" },
      { name: "fighter_blue_id", label: "Coin bleu", type: "select", options: fighterOptions },
      { name: "fighter_blue_mention", label: "Mention coin bleu", type: "text" },
      { name: "status", label: "Statut", type: "select", required: true, options: [{ label: "Brouillon", value: "draft" }, { label: "Proposé", value: "proposed" }, { label: "Confirmé", value: "confirmed" }, { label: "Annulé", value: "cancelled" }] },
    ];
    return buildData(query, ["Position", "Segment", "Coin rouge", "Coin bleu", "Statut"], rows.map((row) => [
      text(row.position), text(row.segment), fighterNames.get(text(row.fighter_red_id)) ?? text(row.fighter_red_mention), fighterNames.get(text(row.fighter_blue_id)) ?? text(row.fighter_blue_mention), text(row.status),
    ]), rows.map((row) => text(row.id)), [
      { label: "Affiches", value: String(rows.length), detail: "Carte de l’événement", tone: "blue" },
      { label: "Confirmées", value: String(rows.filter((row) => row.status === "confirmed").length), detail: "Matchmaking validé", tone: "green" },
    ], mutation("event_fight_cards", rows, fields));
  }

  private async organizerFights(query: RealErpQuery, context: Context) {
    const eventId = await this.activeEventId(context);
    const [fightsResult, fightersResult, disciplinesResult] = await Promise.all([
      eventId ? this.supabase.from("fights").select("*").eq("event_id", eventId).order("fight_order") : Promise.resolve({ data: [], error: null }),
      this.supabase.from("fighters").select("id,full_name").order("full_name"),
      this.supabase.from("disciplines").select("id,name").order("name"),
    ]);
    const error = fightsResult.error ?? fightersResult.error ?? disciplinesResult.error;
    if (error) throw error;
    const rows = asRows(fightsResult.data);
    const fighterNames = new Map((fightersResult.data ?? []).map((item) => [item.id, item.full_name]));
    const fighterOptions = [{ label: "À confirmer", value: "" }, ...(fightersResult.data ?? []).map((item) => ({ label: item.full_name, value: item.id }))];
    const fields: RealErpData["fields"] = [
      { name: "fight_order", label: "Ordre", type: "number", required: true },
      { name: "discipline_id", label: "Discipline", type: "select", required: true, options: (disciplinesResult.data ?? []).map((item) => ({ label: item.name, value: item.id })) },
      { name: "fighter_red_id", label: "Coin rouge", type: "select", options: fighterOptions },
      { name: "fighter_blue_id", label: "Coin bleu", type: "select", options: fighterOptions },
      { name: "weight_category", label: "Catégorie de poids", type: "text", required: true },
      { name: "scheduled_rounds", label: "Rounds prévus", type: "number", required: true },
      { name: "fight_type", label: "Type", type: "select", options: [{ label: "Professionnel", value: "professional" }, { label: "Amateur", value: "amateur" }, { label: "Exhibition", value: "exhibition" }] },
      { name: "status", label: "Statut", type: "select", required: true, options: [{ label: "Planifié", value: "scheduled" }, { label: "Prêt", value: "ready" }, { label: "En direct", value: "live" }, { label: "Terminé", value: "completed" }, { label: "Annulé", value: "cancelled" }] },
      { name: "winner_id", label: "Vainqueur", type: "select", options: fighterOptions },
      { name: "method", label: "Méthode / décision", type: "text" },
      { name: "ending_round", label: "Round final", type: "number" },
      { name: "ending_time", label: "Temps final", type: "time" },
      { name: "cancellation_reason", label: "Motif d’annulation", type: "textarea" },
    ];
    return buildData(query, ["Ordre", "Combat", "Catégorie", "Rounds", "Statut", "Résultat"], rows.map((row) => [
      text(row.fight_order), `${fighterNames.get(text(row.fighter_red_id)) ?? "À confirmer"} vs ${fighterNames.get(text(row.fighter_blue_id)) ?? "À confirmer"}`, text(row.weight_category), text(row.scheduled_rounds), text(row.status), row.winner_id ? `${fighterNames.get(text(row.winner_id)) ?? "Vainqueur"} · ${text(row.method)}` : "—",
    ]), rows.map((row) => text(row.id)), [
      { label: "Combats", value: String(rows.length), detail: "Événement actif", tone: "blue" },
      { label: "Prêts", value: String(rows.filter((row) => ["ready", "live"].includes(text(row.status))).length), detail: "Opérationnels", tone: "green" },
      { label: "Résultats", value: String(rows.filter((row) => Boolean(row.winner_id)).length), detail: "Résultats saisis", tone: "blue" },
    ], mutation("fights", rows, fields));
  }

  private async eventFighters(query: RealErpQuery, context: Context) {
    const eventId = await this.activeEventId(context);
    const fights = eventId ? await this.supabase.from("fights").select("fighter_red_id,fighter_blue_id").eq("event_id", eventId) : { data: [], error: null };
    if (fights.error) throw fights.error;
    const ids = Array.from(new Set((fights.data ?? []).flatMap((item) => [item.fighter_red_id, item.fighter_blue_id]).filter((id): id is string => Boolean(id))));
    const result = ids.length ? await this.supabase.from("fighters").select("id,full_name,nickname,weight_class,current_weight_kg,status,medical_clearance_expiry").in("id", ids).order("full_name") : { data: [], error: null };
    if (result.error) throw result.error;
    const rows = asRows(result.data);
    return buildData(query, ["Combattant", "Surnom", "Catégorie", "Poids", "Médical", "Statut"], rows.map((row) => [
      text(row.full_name), text(row.nickname), text(row.weight_class), row.current_weight_kg === null ? "—" : `${text(row.current_weight_kg)} kg`, date(row.medical_clearance_expiry), text(row.status),
    ]), rows.map((row) => text(row.id)), [
      { label: "Combattants", value: String(rows.length), detail: "Engagés sur la carte", tone: "blue" },
      { label: "Médical renseigné", value: String(rows.filter((row) => Boolean(row.medical_clearance_expiry)).length), detail: "Contrôles disponibles", tone: "green" },
    ]);
  }

  private async weighIns(query: RealErpQuery, context: Context) {
    const eventId = await this.activeEventId(context);
    const [weighResult, fightersResult, fightsResult] = await Promise.all([
      eventId ? this.supabase.from("weigh_ins").select("*").eq("event_id", eventId).order("scheduled_at") : Promise.resolve({ data: [], error: null }),
      this.supabase.from("fighters").select("id,full_name").order("full_name"),
      eventId ? this.supabase.from("fights").select("id,fight_order,weight_category").eq("event_id", eventId).order("fight_order") : Promise.resolve({ data: [], error: null }),
    ]);
    const error = weighResult.error ?? fightersResult.error ?? fightsResult.error;
    if (error) throw error;
    const rows = asRows(weighResult.data);
    const names = new Map((fightersResult.data ?? []).map((item) => [item.id, item.full_name]));
    const fields: RealErpData["fields"] = [
      { name: "fighter_id", label: "Combattant", type: "select", required: true, options: (fightersResult.data ?? []).map((item) => ({ label: item.full_name, value: item.id })) },
      { name: "fight_id", label: "Combat", type: "select", options: [{ label: "Non rattaché", value: "" }, ...(fightsResult.data ?? []).map((item) => ({ label: `#${item.fight_order} · ${item.weight_category}`, value: item.id }))] },
      { name: "attempt_number", label: "Tentative", type: "number", required: true },
      { name: "minimum_weight_kg", label: "Poids minimum", type: "number" }, { name: "maximum_weight_kg", label: "Poids maximum", type: "number" },
      { name: "measured_weight_kg", label: "Poids mesuré", type: "number" },
      { name: "scheduled_at", label: "Pesée prévue", type: "datetime-local" }, { name: "measured_at", label: "Mesuré le", type: "datetime-local" },
      { name: "compliance_status", label: "Conformité", type: "select", required: true, options: [{ label: "En attente", value: "pending" }, { label: "Conforme", value: "compliant" }, { label: "Non conforme", value: "non_compliant" }, { label: "Dérogation", value: "waived" }] },
      { name: "notes", label: "Notes / justification", type: "textarea" },
    ];
    return buildData(query, ["Combattant", "Tentative", "Poids", "Fourchette", "Statut", "Validation"], rows.map((row) => [
      names.get(text(row.fighter_id)) ?? text(row.fighter_id), text(row.attempt_number), row.measured_weight_kg === null ? "—" : `${text(row.measured_weight_kg)} kg`, `${text(row.minimum_weight_kg)} – ${text(row.maximum_weight_kg)} kg`, text(row.compliance_status), date(row.validated_at),
    ]), rows.map((row) => text(row.id)), undefined, mutation("weigh_ins", rows, fields));
  }

  private async fightReplacements(query: RealErpQuery, context: Context) {
    const eventId = await this.activeEventId(context);
    const [replacementResult, fightersResult, fightsResult] = await Promise.all([
      eventId ? this.supabase.from("fight_replacements").select("*").eq("event_id", eventId).order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
      this.supabase.from("fighters").select("id,full_name").order("full_name"),
      eventId ? this.supabase.from("fights").select("id,fight_order,weight_category").eq("event_id", eventId).order("fight_order") : Promise.resolve({ data: [], error: null }),
    ]);
    const error = replacementResult.error ?? fightersResult.error ?? fightsResult.error;
    if (error) throw error;
    const rows = asRows(replacementResult.data);
    const names = new Map((fightersResult.data ?? []).map((item) => [item.id, item.full_name]));
    const fighterOptions = (fightersResult.data ?? []).map((item) => ({ label: item.full_name, value: item.id }));
    const fields: RealErpData["fields"] = [
      { name: "fight_id", label: "Combat", type: "select", required: true, options: (fightsResult.data ?? []).map((item) => ({ label: `#${item.fight_order} · ${item.weight_category}`, value: item.id })) },
      { name: "corner", label: "Coin remplacé", type: "select", required: true, options: [{ label: "Rouge", value: "red" }, { label: "Bleu", value: "blue" }] },
      { name: "previous_fighter_id", label: "Combattant remplacé", type: "select", required: true, options: fighterOptions },
      { name: "replacement_fighter_id", label: "Remplaçant", type: "select", required: true, options: fighterOptions },
      { name: "reason", label: "Motif", type: "textarea", required: true },
      { name: "status", label: "Statut", type: "select", required: true, options: [{ label: "Proposé", value: "proposed" }, { label: "Confirmé et appliqué", value: "confirmed" }, { label: "Annulé", value: "cancelled" }] },
    ];
    return buildData(query, ["Combat", "Coin", "Remplacé", "Remplaçant", "Motif", "Statut"], rows.map((row) => [
      text(row.fight_id), text(row.corner), names.get(text(row.previous_fighter_id)) ?? text(row.previous_fighter_id), names.get(text(row.replacement_fighter_id)) ?? text(row.replacement_fighter_id), text(row.reason), text(row.status),
    ]), rows.map((row) => text(row.id)), undefined, mutation("fight_replacements", rows, fields));
  }

  private async competitions(query: RealErpQuery, context: Context) {
    const eventId = await this.activeEventId(context);
    const result = eventId ? await this.supabase.from("competitions").select("*").eq("event_id", eventId).order("updated_at", { ascending: false }) : { data: [], error: null };
    if (result.error) throw result.error;
    const rows = asRows(result.data);
    const fields: RealErpData["fields"] = [
      { name: "name", label: "Nom de la compétition", type: "text", required: true },
      { name: "kind", label: "Format", type: "select", required: true, options: [{ label: "Tournoi", value: "tournament" }, { label: "Gala", value: "gala" }, { label: "Championnat", value: "championship" }] },
      { name: "rules", label: "Règlement", type: "textarea" },
      { name: "status", label: "Statut", type: "select", required: true, options: [{ label: "Brouillon", value: "draft" }, { label: "Ouverte", value: "open" }, { label: "Clôturée", value: "closed" }, { label: "Terminée", value: "completed" }] },
    ];
    return buildData(query, ["Compétition", "Format", "Statut", "Mise à jour"], rows.map((row) => [text(row.name), text(row.kind), text(row.status), date(row.updated_at)]), rows.map((row) => text(row.id)), [
      { label: "Compétitions", value: String(rows.length), detail: "Événement actif", tone: "blue" },
      { label: "Ouvertes", value: String(rows.filter((row) => row.status === "open").length), detail: "Inscriptions possibles", tone: "green" },
    ], mutation("competitions", rows, fields));
  }

  private async competitionCategories(query: RealErpQuery, context: Context) {
    const competitionId = await this.activeCompetitionId(context);
    const result = competitionId ? await this.supabase.from("competition_categories").select("*").eq("competition_id", competitionId).order("name") : { data: [], error: null };
    if (result.error) throw result.error;
    const rows = asRows(result.data);
    const fields: RealErpData["fields"] = [
      { name: "name", label: "Nom de la catégorie", type: "text", required: true },
      { name: "gender", label: "Genre", type: "select", options: [{ label: "Non spécifié", value: "" }, { label: "Féminin", value: "female" }, { label: "Masculin", value: "male" }, { label: "Mixte", value: "mixed" }] },
      { name: "min_age", label: "Âge minimum", type: "number" }, { name: "max_age", label: "Âge maximum", type: "number" },
      { name: "min_weight_kg", label: "Poids minimum (kg)", type: "number" }, { name: "max_weight_kg", label: "Poids maximum (kg)", type: "number" },
      { name: "capacity", label: "Capacité", type: "number" },
    ];
    return buildData(query, ["Catégorie", "Genre", "Âges", "Poids", "Capacité"], rows.map((row) => [
      text(row.name), text(row.gender), `${text(row.min_age)} – ${text(row.max_age)}`, `${text(row.min_weight_kg)} – ${text(row.max_weight_kg)} kg`, text(row.capacity),
    ]), rows.map((row) => text(row.id)), undefined, mutation("competition_categories", rows, fields));
  }

  private async eventRegistrations(query: RealErpQuery, context: Context) {
    const eventId = await this.activeEventId(context);
    const result = eventId ? await this.supabase.from("event_registrations").select("*").eq("event_id", eventId).order("submitted_at", { ascending: false }) : { data: [], error: null };
    if (result.error) throw result.error;
    const rows = asRows(result.data);
    const profileIds = rows.map((row) => text(row.applicant_profile_id)).filter(Boolean);
    const organizationIds = rows.map((row) => text(row.applicant_organization_id)).filter(Boolean);
    const [profilesResult, organizationsResult] = await Promise.all([
      profileIds.length
        ? this.supabase.from("profiles").select("id,full_name").in("id", profileIds)
        : Promise.resolve({ data: [], error: null }),
      organizationIds.length
        ? this.supabase.from("organizations").select("id,name").in("id", organizationIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (profilesResult.error) throw profilesResult.error;
    if (organizationsResult.error) throw organizationsResult.error;
    const applicantNames = new Map<string, string>([
      ...(profilesResult.data ?? []).map((profile) => [profile.id, profile.full_name] as const),
      ...(organizationsResult.data ?? []).map((organization) => [organization.id, organization.name] as const),
    ]);
    const fields: RealErpData["fields"] = [
      { name: "status", label: "Décision", type: "select", required: true, options: [{ label: "En attente", value: "pending" }, { label: "Validée", value: "validated" }, { label: "Liste d’attente", value: "waiting_list" }, { label: "Refusée", value: "refused" }] },
      { name: "eligibility_status", label: "Éligibilité", type: "select", required: true, options: [{ label: "À contrôler", value: "pending" }, { label: "Éligible", value: "eligible" }, { label: "Inéligible", value: "ineligible" }, { label: "Dérogation requise", value: "waiver_required" }] },
      { name: "payment_status", label: "Paiement", type: "select", required: true, options: [{ label: "Non requis", value: "not_required" }, { label: "Préparé", value: "prepared" }, { label: "En attente", value: "pending" }, { label: "Payé", value: "paid" }, { label: "Remboursé", value: "refunded" }] },
      { name: "waitlist_position", label: "Position en attente", type: "number" },
      { name: "decision_reason", label: "Motif de la décision", type: "textarea" },
    ];
    return buildData(query, ["Candidat", "Type", "Licence", "Poids", "Éligibilité", "Paiement", "Statut"], rows.map((row) => [
      applicantNames.get(text(row.applicant_profile_id ?? row.applicant_organization_id)) ?? "Candidat", text(row.applicant_type), text(row.license_number), row.weight_kg === null ? "—" : `${text(row.weight_kg)} kg`, text(row.eligibility_status), text(row.payment_status), text(row.status),
    ]), rows.map((row) => text(row.id)), [
      { label: "Demandes", value: String(rows.length), detail: "Événement actif", tone: "blue" },
      { label: "À examiner", value: String(rows.filter((row) => row.status === "pending").length), detail: "Décision requise", tone: "amber" },
      { label: "Validées", value: String(rows.filter((row) => row.status === "validated").length), detail: "Participants confirmés", tone: "green" },
    ], mutation("event_registrations", rows, fields, { create: false, update: true, delete: false }));
  }

  private async eventParticipants(query: RealErpQuery, context: Context) {
    const eventId = await this.activeEventId(context);
    const result = eventId ? await this.supabase.from("event_participants").select("*").eq("event_id", eventId).order("created_at", { ascending: false }) : { data: [], error: null };
    if (result.error) throw result.error;
    const rows = asRows(result.data);
    const fields: RealErpData["fields"] = [
      { name: "participant_type", label: "Type", type: "select", required: true, options: [{ label: "Club", value: "club" }, { label: "Combattant", value: "fighter" }, { label: "Coach", value: "coach" }, { label: "Organisateur", value: "organizer" }, { label: "Arbitre", value: "referee" }, { label: "Juge", value: "judge" }, { label: "Bénévole", value: "volunteer" }, { label: "Staff", value: "staff" }, { label: "Sponsor", value: "sponsor" }, { label: "Vendeur", value: "seller" }, { label: "Média", value: "media" }] },
      { name: "status", label: "Statut", type: "select", required: true, options: [{ label: "Invité", value: "invited" }, { label: "Confirmé", value: "confirmed" }, { label: "Refusé", value: "declined" }, { label: "Présent", value: "checked_in" }, { label: "Terminé", value: "completed" }] },
      { name: "public_visible", label: "Visibilité publique", type: "select", options: [{ label: "Masqué", value: "false" }, { label: "Visible", value: "true" }] },
    ];
    return buildData(query, ["Participant", "Type", "Statut", "Public"], rows.map((row) => [
      text(row.organization_id ?? row.profile_id), text(row.participant_type), text(row.status), row.public_visible ? "Oui" : "Non",
    ]), rows.map((row) => text(row.id)), undefined, mutation("event_participants", rows, fields, { create: false, update: true, delete: false }));
  }

  private async eventSchedule(query: RealErpQuery, context: Context) {
    const eventId = await this.activeEventId(context);
    const result = eventId ? await this.supabase.from("event_schedule_items").select("*").eq("event_id", eventId).order("starts_at") : { data: [], error: null };
    if (result.error) throw result.error;
    const rows = asRows(result.data);
    const fields: RealErpData["fields"] = [
      { name: "title", label: "Intitulé", type: "text", required: true }, { name: "kind", label: "Type", type: "select", required: true, options: [{ label: "Installation", value: "setup" }, { label: "Pesée", value: "weigh_in" }, { label: "Briefing", value: "briefing" }, { label: "Médical", value: "medical" }, { label: "Sécurité", value: "security" }, { label: "Billetterie", value: "ticketing" }, { label: "Ouverture des portes", value: "doors_open" }, { label: "Combat", value: "fight" }, { label: "Cérémonie", value: "ceremony" }, { label: "Clôture", value: "closing" }] },
      { name: "starts_at", label: "Début", type: "datetime-local", required: true }, { name: "ends_at", label: "Fin", type: "datetime-local", required: true },
      { name: "location", label: "Lieu", type: "text" }, { name: "status", label: "Statut", type: "select", options: [{ label: "Planifié", value: "planned" }, { label: "En cours", value: "in_progress" }, { label: "Terminé", value: "completed" }] },
    ];
    return buildData(query, ["Élément", "Type", "Début", "Fin", "Lieu", "Statut"], rows.map((row) => [text(row.title), text(row.kind), date(row.starts_at), date(row.ends_at), text(row.location), text(row.status)]), rows.map((row) => text(row.id)), undefined, mutation("event_schedule_items", rows, fields));
  }

  private async eventChecklists(query: RealErpQuery, context: Context) {
    const eventId = await this.activeEventId(context);
    const result = eventId ? await this.supabase.from("event_checklists").select("*").eq("event_id", eventId).order("due_at") : { data: [], error: null };
    if (result.error) throw result.error;
    const rows = asRows(result.data);
    const fields: RealErpData["fields"] = [
      { name: "task_name", label: "Tâche", type: "text", required: true }, { name: "category", label: "Catégorie", type: "text" },
      { name: "due_at", label: "Échéance", type: "datetime-local" }, { name: "priority", label: "Priorité", type: "select", options: [{ label: "Normale", value: "normal" }, { label: "Haute", value: "high" }, { label: "Critique", value: "critical" }] },
      { name: "is_completed", label: "État", type: "select", options: [{ label: "À faire", value: "false" }, { label: "Terminée", value: "true" }] },
    ];
    return buildData(query, ["Tâche", "Catégorie", "Échéance", "Priorité", "État"], rows.map((row) => [text(row.task_name), text(row.category), date(row.due_at), text(row.priority), row.is_completed ? "Terminée" : "À faire"]), rows.map((row) => text(row.id)), [{ label: "Tâches", value: String(rows.length), detail: "Checklist événement", tone: "blue" }, { label: "Terminées", value: String(rows.filter((row) => row.is_completed).length), detail: "Progression réelle", tone: "green" }], mutation("event_checklists", rows, fields));
  }

  private async eventOperations(
    query: RealErpQuery,
    context: Context,
    domain: "logistics" | "security" | "medical" | "communication" | "document" | "incident",
  ) {
    const eventId = await this.activeEventId(context);
    const [result, profilesResult] = await Promise.all([
      eventId
        ? this.supabase.from("event_operation_records").select("*").eq("event_id", eventId).eq("domain", domain).order("updated_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      this.supabase.from("profiles").select("id,full_name,email").order("full_name"),
    ]);
    const error = result.error ?? profilesResult.error;
    if (error) throw error;
    const rows = asRows(result.data);
    const profileNames = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile.full_name]));
    const categoryOptions: Record<typeof domain, Array<{ label: string; value: string }>> = {
      logistics: [
        { label: "Transport", value: "transport" }, { label: "Installation", value: "setup" },
        { label: "Matériel", value: "equipment" }, { label: "Hébergement", value: "accommodation" },
        { label: "Restauration", value: "catering" },
      ],
      security: [
        { label: "Contrôle d’accès", value: "access_control" }, { label: "Public", value: "crowd" },
        { label: "Périmètre", value: "perimeter" }, { label: "Évacuation", value: "evacuation" },
        { label: "Coordination", value: "coordination" },
      ],
      medical: [
        { label: "Équipe médicale", value: "medical_team" }, { label: "Ambulance", value: "ambulance" },
        { label: "Matériel", value: "equipment" }, { label: "Protocole", value: "protocol" },
        { label: "Contrôle", value: "check" },
      ],
      communication: [
        { label: "Annonce", value: "announcement" }, { label: "Presse", value: "press" },
        { label: "Réseaux sociaux", value: "social" }, { label: "Signalétique", value: "signage" },
        { label: "Communication de crise", value: "crisis" },
      ],
      document: [
        { label: "Autorisation", value: "authorization" }, { label: "Contrat", value: "contract" },
        { label: "Assurance", value: "insurance" }, { label: "Plan", value: "plan" },
        { label: "Procès-verbal", value: "minutes" },
      ],
      incident: [
        { label: "Sécurité", value: "security" }, { label: "Médical", value: "medical" },
        { label: "Technique", value: "technical" }, { label: "Public", value: "crowd" },
        { label: "Conformité", value: "compliance" },
      ],
    };
    const fields: RealErpData["fields"] = [
      { name: "title", label: domain === "incident" ? "Incident" : "Intitulé", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "category", label: "Catégorie", type: "select", required: true, options: categoryOptions[domain] },
      { name: "severity", label: domain === "incident" ? "Gravité" : "Criticité", type: "select", required: true, options: [
        { label: "Faible", value: "low" }, { label: "Normale", value: "normal" },
        { label: "Haute", value: "high" }, { label: "Critique", value: "critical" },
      ] },
      { name: "owner_profile_id", label: "Responsable", type: "select", options: [
        { label: "Non affecté", value: "" },
        ...(profilesResult.data ?? []).map((profile) => ({ label: `${profile.full_name} · ${profile.email}`, value: profile.id })),
      ] },
      { name: "due_at", label: "Échéance", type: "datetime-local" },
      { name: "status", label: "Statut", type: "select", required: true, options: [
        { label: "Brouillon", value: "draft" }, { label: "Planifié", value: "planned" },
        { label: "En cours", value: "in_progress" }, { label: "Bloqué", value: "blocked" },
        { label: "Résolu", value: "resolved" }, { label: "Clôturé", value: "closed" },
        { label: "Annulé", value: "cancelled" },
      ] },
      { name: "resolution", label: "Résolution / compte rendu", type: "textarea" },
      { name: "attachment_path", label: domain === "document" ? "Lien ou chemin du document" : "Pièce justificative", type: "text" },
      { name: "visibility", label: "Visibilité", type: "select", required: true, options: [
        { label: "Direction uniquement", value: "internal" }, { label: "Équipe", value: "team" },
        { label: "Public", value: "public" },
      ] },
    ];
    const open = rows.filter((row) => !["resolved", "closed", "cancelled"].includes(text(row.status))).length;
    const critical = rows.filter((row) => row.severity === "critical" && !["resolved", "closed"].includes(text(row.status))).length;
    return buildData(query, ["Intitulé", "Catégorie", "Responsable", "Criticité", "Échéance", "Statut"], rows.map((row) => [
      text(row.title), text(row.category), profileNames.get(text(row.owner_profile_id)) ?? "Non affecté",
      text(row.severity), date(row.due_at), text(row.status),
    ]), rows.map((row) => text(row.id)), [
      { label: "Éléments", value: String(rows.length), detail: "Événement actif", tone: "blue" },
      { label: "Ouverts", value: String(open), detail: "À traiter", tone: "amber" },
      { label: "Critiques", value: String(critical), detail: "Action prioritaire", tone: critical ? "red" : "green" },
    ], mutation("event_operations", rows, fields));
  }

  private async organizerSponsorDirectory(query: RealErpQuery, context: Context) {
    const organizationId = context.activeOrganizationId ?? context.organizationIds[0] ?? null;
    const result = organizationId
      ? await this.supabase.from("sponsors").select("*").eq("managing_organization_id", organizationId).order("name")
      : { data: [], error: null };
    if (result.error) throw result.error;
    const rows = asRows(result.data);
    const fields: RealErpData["fields"] = [
      { name: "name", label: "Partenaire", type: "text", required: true },
      { name: "contact_name", label: "Contact", type: "text" },
      { name: "contact_email", label: "Email", type: "text" },
      { name: "contact_phone", label: "Téléphone", type: "text" },
      { name: "website_url", label: "Site web", type: "text" },
      { name: "tier", label: "Niveau", type: "select", options: [
        { label: "Prospect", value: "prospect" }, { label: "Bronze", value: "bronze" },
        { label: "Argent", value: "silver" }, { label: "Or", value: "gold" },
        { label: "Titre", value: "title" },
      ] },
      { name: "notes", label: "Notes", type: "textarea" },
      { name: "is_active", label: "État", type: "select", required: true, options: [
        { label: "Actif", value: "true" }, { label: "Inactif", value: "false" },
      ] },
    ];
    return buildData(query, ["Partenaire", "Contact", "Email", "Téléphone", "Niveau", "État"], rows.map((row) => [
      text(row.name), text(row.contact_name), text(row.contact_email), text(row.contact_phone), text(row.tier), row.is_active ? "Actif" : "Inactif",
    ]), rows.map((row) => text(row.id)), [
      { label: "Partenaires", value: String(rows.length), detail: "Répertoire commercial", tone: "blue" },
      { label: "Actifs", value: String(rows.filter((row) => row.is_active).length), detail: "Contacts disponibles", tone: "green" },
    ], mutation("sponsors", rows, fields));
  }

  private async organizerSponsorPipeline(query: RealErpQuery, context: Context) {
    const organizationId = context.activeOrganizationId ?? context.organizationIds[0] ?? null;
    const eventId = await this.activeEventId(context);
    const [pipelineResult, sponsorsResult, profilesResult] = await Promise.all([
      organizationId && eventId
        ? this.supabase.from("sponsor_pipeline").select("*").eq("organization_id", organizationId).eq("event_id", eventId).order("updated_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      organizationId ? this.supabase.from("sponsors").select("id,name").eq("managing_organization_id", organizationId).eq("is_active", true).order("name") : Promise.resolve({ data: [], error: null }),
      this.supabase.from("profiles").select("id,full_name,email").order("full_name"),
    ]);
    const error = pipelineResult.error ?? sponsorsResult.error ?? profilesResult.error;
    if (error) throw error;
    const rows = asRows(pipelineResult.data);
    const sponsorNames = new Map((sponsorsResult.data ?? []).map((item) => [item.id, item.name]));
    const ownerNames = new Map((profilesResult.data ?? []).map((item) => [item.id, item.full_name]));
    const fields: RealErpData["fields"] = [
      { name: "sponsor_id", label: "Sponsor", type: "select", required: true, options: (sponsorsResult.data ?? []).map((item) => ({ label: item.name, value: item.id })) },
      { name: "stage", label: "Étape", type: "select", required: true, options: [
        { label: "Prospect", value: "lead" }, { label: "Contacté", value: "contacted" },
        { label: "Qualifié", value: "qualified" }, { label: "Proposition", value: "proposal" },
        { label: "Négociation", value: "negotiation" }, { label: "Gagné", value: "won" },
        { label: "Perdu", value: "lost" }, { label: "Archivé", value: "archived" },
      ] },
      { name: "estimated_value", label: "Valeur estimée", type: "number" },
      { name: "currency_code", label: "Devise", type: "select", options: [{ label: "Ariary", value: "MGA" }, { label: "Euro", value: "EUR" }, { label: "Dollar", value: "USD" }] },
      { name: "probability_percent", label: "Probabilité (%)", type: "number" },
      { name: "next_action_at", label: "Prochaine action", type: "datetime-local" },
      { name: "owner_profile_id", label: "Responsable", type: "select", options: [
        { label: "Non affecté", value: "" },
        ...(profilesResult.data ?? []).map((item) => ({ label: `${item.full_name} · ${item.email}`, value: item.id })),
      ] },
      { name: "notes", label: "Notes / prochaine action", type: "textarea" },
      { name: "lost_reason", label: "Motif de perte", type: "textarea" },
    ];
    const weighted = rows.reduce((sum, row) => sum + Number(row.estimated_value ?? 0) * Number(row.probability_percent ?? 0) / 100, 0);
    return buildData(query, ["Sponsor", "Étape", "Valeur", "Probabilité", "Responsable", "Prochaine action"], rows.map((row) => [
      sponsorNames.get(text(row.sponsor_id)) ?? text(row.sponsor_id), text(row.stage), money(row.estimated_value),
      `${text(row.probability_percent)} %`, ownerNames.get(text(row.owner_profile_id)) ?? "Non affecté", date(row.next_action_at),
    ]), rows.map((row) => text(row.id)), [
      { label: "Opportunités", value: String(rows.length), detail: "Pipeline événement", tone: "blue" },
      { label: "Valeur pondérée", value: money(weighted), detail: "Prévision commerciale", tone: "green" },
      { label: "À relancer", value: String(rows.filter((row) => row.next_action_at && new Date(String(row.next_action_at)) < new Date() && !["won","lost","archived"].includes(text(row.stage))).length), detail: "Actions échues", tone: "amber" },
    ], mutation("sponsor_pipeline", rows, fields));
  }

  private async organizerSponsorPackages(query: RealErpQuery, context: Context) {
    const eventId = await this.activeEventId(context);
    const result = eventId ? await this.supabase.from("sponsor_packages").select("*").eq("event_id", eventId).order("price", { ascending: false }) : { data: [], error: null };
    if (result.error) throw result.error;
    const rows = asRows(result.data);
    const fields: RealErpData["fields"] = [
      { name: "name", label: "Package", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "price", label: "Prix", type: "number", required: true },
      { name: "currency_code", label: "Devise", type: "select", options: [{ label: "Ariary", value: "MGA" }, { label: "Euro", value: "EUR" }, { label: "Dollar", value: "USD" }] },
      { name: "capacity", label: "Nombre disponible", type: "number" },
      { name: "benefits", label: "Avantages inclus", type: "textarea" },
      { name: "valid_from", label: "Disponible à partir de", type: "datetime-local" },
      { name: "valid_until", label: "Disponible jusqu’au", type: "datetime-local" },
      { name: "status", label: "Statut", type: "select", required: true, options: [
        { label: "Brouillon", value: "draft" }, { label: "Publié", value: "published" },
        { label: "Complet", value: "closed" }, { label: "Archivé", value: "archived" },
      ] },
    ];
    return buildData(query, ["Package", "Prix", "Alloués / capacité", "Validité", "Statut"], rows.map((row) => [
      text(row.name), money(row.price), `${text(row.allocated_count)} / ${text(row.capacity)}`,
      `${date(row.valid_from)} → ${date(row.valid_until)}`, text(row.status),
    ]), rows.map((row) => text(row.id)), [
      { label: "Packages", value: String(rows.length), detail: "Offres disponibles", tone: "blue" },
      { label: "Publiés", value: String(rows.filter((row) => row.status === "published").length), detail: "Commercialisables", tone: "green" },
    ], mutation("sponsor_packages", rows, fields));
  }

  private async organizerSponsorContracts(query: RealErpQuery, context: Context) {
    const eventId = await this.activeEventId(context);
    const [agreementsResult, sponsorsResult, packagesResult, contractsResult] = await Promise.all([
      eventId ? this.supabase.from("event_sponsors").select("id,sponsor_id,amount,status").eq("event_id", eventId) : Promise.resolve({ data: [], error: null }),
      this.supabase.from("sponsors").select("id,name"),
      eventId ? this.supabase.from("sponsor_packages").select("id,name,price").eq("event_id", eventId) : Promise.resolve({ data: [], error: null }),
      eventId ? this.supabase.from("sponsor_contracts").select("*,event_sponsors!inner(event_id)").eq("event_sponsors.event_id", eventId).order("updated_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
    ]);
    const error = agreementsResult.error ?? sponsorsResult.error ?? packagesResult.error ?? contractsResult.error;
    if (error) throw error;
    const rows = asRows(contractsResult.data);
    const sponsorNames = new Map((sponsorsResult.data ?? []).map((item) => [item.id, item.name]));
    const agreements = new Map((agreementsResult.data ?? []).map((item) => [item.id, item]));
    const packageNames = new Map((packagesResult.data ?? []).map((item) => [item.id, item.name]));
    const fields: RealErpData["fields"] = [
      { name: "event_sponsor_id", label: "Sponsor de l’événement", type: "select", required: true, options: (agreementsResult.data ?? []).map((item) => ({ label: sponsorNames.get(item.sponsor_id ?? "") ?? item.id, value: item.id })) },
      { name: "package_id", label: "Package", type: "select", options: [{ label: "Sur mesure", value: "" }, ...(packagesResult.data ?? []).map((item) => ({ label: `${item.name} · ${money(item.price)}`, value: item.id }))] },
      { name: "reference", label: "Référence", type: "text", required: true },
      { name: "title", label: "Objet du contrat", type: "text", required: true },
      { name: "amount", label: "Montant", type: "number", required: true },
      { name: "currency_code", label: "Devise", type: "select", options: [{ label: "Ariary", value: "MGA" }, { label: "Euro", value: "EUR" }, { label: "Dollar", value: "USD" }] },
      { name: "starts_on", label: "Début", type: "date", required: true },
      { name: "ends_on", label: "Fin", type: "date", required: true },
      { name: "status", label: "Statut", type: "select", required: true, options: [
        { label: "Brouillon", value: "draft" }, { label: "Envoyé", value: "sent" },
        { label: "Négociation", value: "negotiation" }, { label: "Signé", value: "signed" },
        { label: "Actif", value: "active" }, { label: "Terminé", value: "completed" },
        { label: "Résilié", value: "terminated" },
      ] },
      { name: "payment_status", label: "Paiement", type: "select", options: [
        { label: "En attente", value: "pending" }, { label: "Partiel", value: "partial" },
        { label: "Payé", value: "paid" }, { label: "En retard", value: "overdue" },
        { label: "Remboursé", value: "refunded" },
      ] },
      { name: "document_path", label: "Contrat signé", type: "text" },
      { name: "terms", label: "Conditions", type: "textarea" },
      { name: "terminated_reason", label: "Motif de résiliation", type: "textarea" },
    ];
    return buildData(query, ["Référence", "Sponsor", "Package", "Montant", "Période", "Statut", "Paiement"], rows.map((row) => {
      const agreement = agreements.get(text(row.event_sponsor_id));
      return [text(row.reference), sponsorNames.get(agreement?.sponsor_id ?? "") ?? "Sponsor", packageNames.get(text(row.package_id)) ?? "Sur mesure", money(row.amount), `${date(row.starts_on)} → ${date(row.ends_on)}`, text(row.status), text(row.payment_status)];
    }), rows.map((row) => text(row.id)), [
      { label: "Contrats", value: String(rows.length), detail: "Événement actif", tone: "blue" },
      { label: "Actifs / signés", value: String(rows.filter((row) => ["signed","active"].includes(text(row.status))).length), detail: "Engagements en cours", tone: "green" },
      { label: "Valeur", value: money(rows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0)), detail: "Montant contractuel", tone: "blue" },
    ], mutation("sponsor_contracts", rows, fields));
  }

  private async organizerSponsorVisibility(query: RealErpQuery, context: Context) {
    return this.organizerSponsorExecution(query, context, "visibility");
  }

  private async organizerSponsorActivations(query: RealErpQuery, context: Context) {
    return this.organizerSponsorExecution(query, context, "activation");
  }

  private async organizerSponsorDeliverables(query: RealErpQuery, context: Context) {
    return this.organizerSponsorExecution(query, context, "deliverable");
  }

  private async organizerSponsorExecution(query: RealErpQuery, context: Context, kind: "visibility" | "activation" | "deliverable") {
    const eventId = await this.activeEventId(context);
    const [agreementsResult, sponsorsResult, profilesResult] = await Promise.all([
      eventId ? this.supabase.from("event_sponsors").select("id,sponsor_id").eq("event_id", eventId) : Promise.resolve({ data: [], error: null }),
      this.supabase.from("sponsors").select("id,name"),
      this.supabase.from("profiles").select("id,full_name,email").order("full_name"),
    ]);
    const baseError = agreementsResult.error ?? sponsorsResult.error ?? profilesResult.error;
    if (baseError) throw baseError;
    const agreementIds = (agreementsResult.data ?? []).map((item) => item.id);
    const sponsorNames = new Map((sponsorsResult.data ?? []).map((item) => [item.id, item.name]));
    const agreementLabels = new Map((agreementsResult.data ?? []).map((item) => [item.id, sponsorNames.get(item.sponsor_id ?? "") ?? item.id]));
    const agreementOptions = (agreementsResult.data ?? []).map((item) => ({ label: agreementLabels.get(item.id) ?? item.id, value: item.id }));
    if (kind === "visibility") {
      const result = agreementIds.length ? await this.supabase.from("sponsor_visibility_items").select("*").in("event_sponsor_id", agreementIds).order("updated_at", { ascending: false }) : { data: [], error: null };
      if (result.error) throw result.error;
      const rows = asRows(result.data);
      const fields: RealErpData["fields"] = [
        { name: "event_sponsor_id", label: "Sponsor", type: "select", required: true, options: agreementOptions },
        { name: "channel", label: "Canal", type: "select", required: true, options: ["venue","ring","digital","social","press","broadcast","ticketing","merchandising"].map((value) => ({ label: value, value })) },
        { name: "placement", label: "Emplacement / support", type: "text", required: true },
        { name: "starts_at", label: "Début", type: "datetime-local" }, { name: "ends_at", label: "Fin", type: "datetime-local" },
        { name: "target_impressions", label: "Impressions cibles", type: "number" }, { name: "actual_impressions", label: "Impressions réelles", type: "number" },
        { name: "target_reach", label: "Portée cible", type: "number" }, { name: "actual_reach", label: "Portée réelle", type: "number" },
        { name: "status", label: "Statut", type: "select", options: ["planned","live","completed","cancelled"].map((value) => ({ label: value, value })) },
        { name: "evidence_path", label: "Preuve", type: "text" },
      ];
      return buildData(query, ["Sponsor", "Canal", "Emplacement", "Impressions", "Portée", "Statut"], rows.map((row) => [
        agreementLabels.get(text(row.event_sponsor_id)) ?? "Sponsor", text(row.channel), text(row.placement),
        `${text(row.actual_impressions)} / ${text(row.target_impressions)}`, `${text(row.actual_reach)} / ${text(row.target_reach)}`, text(row.status),
      ]), rows.map((row) => text(row.id)), undefined, mutation("sponsor_visibility", rows, fields));
    }
    if (kind === "activation") {
      const result = agreementIds.length ? await this.supabase.from("sponsor_activations").select("*").in("event_sponsor_id", agreementIds).order("updated_at", { ascending: false }) : { data: [], error: null };
      if (result.error) throw result.error;
      const rows = asRows(result.data);
      const fields: RealErpData["fields"] = [
        { name: "event_sponsor_id", label: "Sponsor", type: "select", required: true, options: agreementOptions },
        { name: "title", label: "Activation", type: "text", required: true },
        { name: "activation_type", label: "Type", type: "select", options: ["booth","sampling","contest","content","hospitality","appearance","other"].map((value) => ({ label: value, value })) },
        { name: "description", label: "Description", type: "textarea" }, { name: "location", label: "Lieu", type: "text" },
        { name: "starts_at", label: "Début", type: "datetime-local" }, { name: "ends_at", label: "Fin", type: "datetime-local" },
        { name: "budget", label: "Budget", type: "number" }, { name: "target_contacts", label: "Contacts cibles", type: "number" }, { name: "actual_contacts", label: "Contacts réels", type: "number" },
        { name: "owner_profile_id", label: "Responsable", type: "select", options: [{ label: "Non affecté", value: "" }, ...(profilesResult.data ?? []).map((item) => ({ label: `${item.full_name} · ${item.email}`, value: item.id }))] },
        { name: "status", label: "Statut", type: "select", options: ["draft","approved","scheduled","live","completed","cancelled"].map((value) => ({ label: value, value })) },
        { name: "evidence_path", label: "Preuve", type: "text" },
      ];
      return buildData(query, ["Sponsor", "Activation", "Type", "Lieu", "Contacts", "Statut"], rows.map((row) => [
        agreementLabels.get(text(row.event_sponsor_id)) ?? "Sponsor", text(row.title), text(row.activation_type), text(row.location), `${text(row.actual_contacts)} / ${text(row.target_contacts)}`, text(row.status),
      ]), rows.map((row) => text(row.id)), undefined, mutation("sponsor_activations", rows, fields));
    }
    const result = agreementIds.length ? await this.supabase.from("event_sponsor_deliverables").select("*").in("event_sponsor_id", agreementIds).order("due_at") : { data: [], error: null };
    if (result.error) throw result.error;
    const rows = asRows(result.data);
    const fields: RealErpData["fields"] = [
      { name: "event_sponsor_id", label: "Sponsor", type: "select", required: true, options: agreementOptions },
      { name: "title", label: "Livrable", type: "text", required: true }, { name: "description", label: "Description", type: "textarea" },
      { name: "due_at", label: "Échéance", type: "datetime-local" }, { name: "estimated_value", label: "Valeur estimée", type: "number" },
      { name: "status", label: "Statut", type: "select", options: [
        { label: "À faire", value: "todo" }, { label: "En cours", value: "in_progress" },
        { label: "Livré", value: "delivered" }, { label: "Validé", value: "validated" },
        { label: "Annulé", value: "cancelled" },
      ] },
      { name: "evidence_path", label: "Preuve de livraison", type: "text" },
    ];
    return buildData(query, ["Sponsor", "Livrable", "Échéance", "Valeur", "Statut", "Preuve"], rows.map((row) => [
      agreementLabels.get(text(row.event_sponsor_id)) ?? "Sponsor", text(row.title), date(row.due_at), money(row.estimated_value), text(row.status), text(row.evidence_path),
    ]), rows.map((row) => text(row.id)), [
      { label: "Livrables", value: String(rows.length), detail: "Engagements contractuels", tone: "blue" },
      { label: "Validés", value: String(rows.filter((row) => row.status === "validated").length), detail: "Acceptés", tone: "green" },
      { label: "En retard", value: String(rows.filter((row) => row.due_at && new Date(String(row.due_at)) < new Date() && !["validated","cancelled"].includes(text(row.status))).length), detail: "Action requise", tone: "amber" },
    ], mutation("sponsor_deliverables", rows, fields));
  }

  private async ticketTypes(query: RealErpQuery, context: Context) {
    const eventId = await this.activeEventId(context);
    const result = eventId ? await this.supabase.from("ticket_types").select("*").eq("event_id", eventId).order("name") : { data: [], error: null };
    if (result.error) throw result.error;
    const rows = asRows(result.data);
    const fields: RealErpData["fields"] = [
      { name: "name", label: "Nom", type: "text", required: true }, { name: "code", label: "Code", type: "text" }, { name: "category", label: "Catégorie", type: "text" }, { name: "zone", label: "Zone", type: "text" },
      { name: "price", label: "Prix (Ar)", type: "number", required: true }, { name: "total_quantity", label: "Quota", type: "number", required: true }, { name: "max_per_order", label: "Max / commande", type: "number" },
      { name: "sales_start", label: "Début des ventes", type: "datetime-local" }, { name: "sales_end", label: "Fin des ventes", type: "datetime-local" }, { name: "status", label: "Statut", type: "select", options: [{ label: "Brouillon", value: "draft" }, { label: "Actif", value: "active" }, { label: "Publié", value: "published" }] },
    ];
    return buildData(query, ["Billet", "Code", "Zone", "Prix", "Vendus / quota", "Statut"], rows.map((row) => [text(row.name), text(row.code), text(row.zone), money(row.price), `${text(row.sold_quantity)} / ${text(row.total_quantity)}`, text(row.status)]), rows.map((row) => text(row.id)), undefined, mutation("ticket_types", rows, fields));
  }

  private async ticketSales(query: RealErpQuery, context: Context) {
    const eventId = await this.activeEventId(context);
    const [salesResult, typesResult] = await Promise.all([
      eventId ? this.supabase.from("ticket_sales").select("*").eq("event_id", eventId).order("sold_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
      eventId ? this.supabase.from("ticket_types").select("id,name,price,total_quantity,sold_quantity,status").eq("event_id", eventId).order("name") : Promise.resolve({ data: [], error: null }),
    ]);
    const error = salesResult.error ?? typesResult.error;
    if (error) throw error;
    const rows = asRows(salesResult.data);
    const typeNames = new Map((typesResult.data ?? []).map((item) => [item.id, item.name]));
    const fields: RealErpData["fields"] = [
      { name: "ticket_type_id", label: "Type de billet", type: "select", required: true, options: (typesResult.data ?? []).filter((item) => ["active", "published"].includes(item.status)).map((item) => ({ label: `${item.name} · ${money(item.price)} · ${item.sold_quantity ?? 0}/${item.total_quantity}`, value: item.id })) },
      { name: "buyer_name", label: "Acheteur", type: "text", required: true },
      { name: "buyer_email", label: "Email", type: "text" }, { name: "buyer_phone", label: "Téléphone", type: "text" },
      { name: "quantity", label: "Quantité", type: "number", required: true },
      { name: "payment_status", label: "Paiement", type: "select", required: true, options: [{ label: "Payé", value: "paid" }, { label: "En attente", value: "pending" }, { label: "Terminé", value: "completed" }] },
    ];
    const quantity = rows.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0);
    const revenue = rows.filter((row) => ["paid", "completed", "succeeded"].includes(text(row.payment_status))).reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0);
    return buildData(query, ["Acheteur", "Billet", "Quantité", "Montant", "Paiement", "Date"], rows.map((row) => [
      text(row.buyer_name), typeNames.get(text(row.ticket_type_id)) ?? text(row.ticket_type_id), text(row.quantity), money(row.total_amount), text(row.payment_status), date(row.sold_at),
    ]), rows.map((row) => text(row.id)), [
      { label: "Billets vendus", value: quantity.toLocaleString("fr-FR"), detail: "Toutes transactions", tone: "blue" },
      { label: "Recettes payées", value: money(revenue), detail: "Paiements confirmés", tone: "green" },
      { label: "Transactions", value: String(rows.length), detail: "Événement actif", tone: "blue" },
    ], mutation("ticket_sales", rows, fields, { create: true, update: false, delete: false }));
  }

  private async eventInvitations(query: RealErpQuery, context: Context) {
    const eventId = await this.activeEventId(context);
    const [invitationsResult, profilesResult] = await Promise.all([
      eventId ? this.supabase.from("event_invitations").select("*").eq("event_id", eventId).order("sent_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
      this.supabase.from("profiles").select("id,full_name,email").order("full_name"),
    ]);
    const error = invitationsResult.error ?? profilesResult.error;
    if (error) throw error;
    const rows = asRows(invitationsResult.data);
    const names = new Map((profilesResult.data ?? []).map((item) => [item.id, item.full_name]));
    const fields: RealErpData["fields"] = [
      { name: "invitation_type", label: "Type d’invitation", type: "select", required: true, options: [{ label: "Invité", value: "guest" }, { label: "VIP", value: "vip" }, { label: "Presse", value: "media" }, { label: "Partenaire", value: "partner" }, { label: "Officiel", value: "official" }] },
      { name: "mention", label: "Nom ou mention", type: "text", required: true },
      { name: "role", label: "Rôle sur place", type: "text", required: true },
      { name: "invitee_profile_id", label: "Profil associé", type: "select", options: [{ label: "Sans compte associé", value: "" }, ...(profilesResult.data ?? []).map((item) => ({ label: `${item.full_name} · ${item.email}`, value: item.id }))] },
      { name: "status", label: "Statut", type: "select", required: true, options: [{ label: "Envoyée", value: "sent" }, { label: "Acceptée", value: "accepted" }, { label: "Refusée", value: "declined" }, { label: "Annulée", value: "cancelled" }] },
    ];
    return buildData(query, ["Invitation", "Profil", "Type", "Rôle", "Statut", "Envoi"], rows.map((row) => [
      text(row.mention), names.get(text(row.invitee_profile_id)) ?? "Externe", text(row.invitation_type), text(row.role), text(row.status), date(row.sent_at),
    ]), rows.map((row) => text(row.id)), undefined, mutation("event_invitations", rows, fields));
  }

  private async eventAccessLogs(query: RealErpQuery, context: Context) {
    const eventId = await this.activeEventId(context);
    const [logsResult, ticketsResult] = await Promise.all([
      eventId ? this.supabase.from("event_access_logs").select("*").eq("event_id", eventId).order("occurred_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
      eventId ? this.supabase.from("tickets").select("id,buyer_name,ticket_type").eq("event_id", eventId).order("purchased_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
    ]);
    const error = logsResult.error ?? ticketsResult.error;
    if (error) throw error;
    const rows = asRows(logsResult.data);
    const tickets = new Map((ticketsResult.data ?? []).map((item) => [item.id, `${item.buyer_name} · ${item.ticket_type}`]));
    const fields: RealErpData["fields"] = [
      { name: "ticket_id", label: "Billet", type: "select", required: true, options: (ticketsResult.data ?? []).map((item) => ({ label: `${item.buyer_name} · ${item.ticket_type} · ${item.id.slice(0, 8)}`, value: item.id })) },
      { name: "zone", label: "Zone d’accès", type: "text" },
      { name: "result", label: "Résultat", type: "select", required: true, options: [{ label: "Accepté", value: "accepted" }, { label: "Utilisé", value: "used" }, { label: "Refusé", value: "refused" }, { label: "Sortie", value: "exit" }] },
      { name: "manual", label: "Saisie", type: "select", options: [{ label: "Scan", value: "false" }, { label: "Manuelle", value: "true" }] },
    ];
    return buildData(query, ["Billet", "Zone", "Résultat", "Mode", "Opérateur", "Date"], rows.map((row) => [
      tickets.get(text(row.ticket_id)) ?? text(row.ticket_id), text(row.zone), text(row.result), row.manual ? "Manuel" : "Scan", text(row.operator_profile_id), date(row.occurred_at),
    ]), rows.map((row) => text(row.id)), [
      { label: "Contrôles", value: String(rows.length), detail: "Passages enregistrés", tone: "blue" },
      { label: "Acceptés", value: String(rows.filter((row) => ["accepted", "used"].includes(text(row.result))).length), detail: "Accès valides", tone: "green" },
      { label: "Doublons", value: String(rows.filter((row) => row.result === "duplicate").length), detail: "Tentatives détectées", tone: "amber" },
    ], mutation("event_access_logs", rows, fields, { create: true, update: false, delete: false }));
  }

  private async ticketRefunds(query: RealErpQuery, context: Context) {
    const eventId = await this.activeEventId(context);
    const salesResult = eventId ? await this.supabase.from("ticket_sales").select("id,buyer_name,total_amount,payment_status").eq("event_id", eventId).order("sold_at", { ascending: false }) : { data: [], error: null };
    if (salesResult.error) throw salesResult.error;
    const saleIds = (salesResult.data ?? []).map((item) => item.id);
    const refundsResult = saleIds.length ? await this.supabase.from("ticket_refunds").select("*").in("ticket_sale_id", saleIds).order("created_at", { ascending: false }) : { data: [], error: null };
    if (refundsResult.error) throw refundsResult.error;
    const rows = asRows(refundsResult.data);
    const sales = new Map((salesResult.data ?? []).map((item) => [item.id, item]));
    const fields: RealErpData["fields"] = [
      { name: "ticket_sale_id", label: "Vente", type: "select", required: true, options: (salesResult.data ?? []).map((item) => ({ label: `${item.buyer_name ?? "Acheteur"} · ${money(item.total_amount)} · ${item.id.slice(0, 8)}`, value: item.id })) },
      { name: "amount", label: "Montant demandé", type: "number", required: true },
      { name: "reason", label: "Motif", type: "textarea", required: true },
      { name: "status", label: "Décision", type: "select", required: true, options: [{ label: "Demandé", value: "requested" }, { label: "Approuvé", value: "approved" }, { label: "Refusé", value: "rejected" }, { label: "Traité", value: "processed" }, { label: "Échec", value: "failed" }] },
      { name: "processed_amount", label: "Montant traité", type: "number" },
      { name: "external_reference", label: "Référence externe", type: "text" },
    ];
    return buildData(query, ["Vente", "Demandé", "Traité", "Motif", "Statut", "Date"], rows.map((row) => [
      text(sales.get(text(row.ticket_sale_id))?.buyer_name), money(row.amount), money(row.processed_amount), text(row.reason), text(row.status), date(row.created_at),
    ]), rows.map((row) => text(row.id)), [
      { label: "Demandes", value: String(rows.length), detail: "Remboursements", tone: "blue" },
      { label: "À traiter", value: String(rows.filter((row) => ["requested", "approved"].includes(text(row.status))).length), detail: "Action requise", tone: "amber" },
      { label: "Traités", value: money(rows.filter((row) => row.status === "processed").reduce((sum, row) => sum + Number(row.processed_amount ?? 0), 0)), detail: "Montant remboursé", tone: "green" },
    ], mutation("ticket_refunds", rows, fields, { create: true, update: true, delete: false }));
  }

  private async eventStaff(query: RealErpQuery, context: Context) {
    const eventId = await this.activeEventId(context);
    let staffRequest = eventId ? this.supabase.from("staff_assignments").select("*").eq("event_id", eventId) : null;
    if (staffRequest && /benevole|volunteer/.test(normalize(query.tab))) staffRequest = staffRequest.eq("role", "volunteer");
    else if (staffRequest && query.moduleId === "team") staffRequest = staffRequest.neq("role", "volunteer");
    const [result, profilesResult] = await Promise.all([
      staffRequest ? staffRequest.order("staff_name") : Promise.resolve({ data: [], error: null }),
      this.supabase.from("profiles").select("id,full_name,email").order("full_name"),
    ]);
    const error = result.error ?? profilesResult.error;
    if (error) throw error;
    const rows = asRows(result.data);
    const fields: RealErpData["fields"] = [
      { name: "profile_id", label: "Profil associé", type: "select", options: [{ label: "Personne externe", value: "" }, ...(profilesResult.data ?? []).map((item) => ({ label: `${item.full_name} · ${item.email}`, value: item.id }))] },
      { name: "staff_name", label: "Nom complet", type: "text", required: true }, { name: "phone", label: "Téléphone", type: "text" },
      { name: "role", label: "Fonction", type: "select", required: true, options: [{ label: "Staff", value: "staff" }, { label: "Bénévole", value: "volunteer" }, { label: "Sécurité", value: "security" }, { label: "Médical", value: "medical" }, { label: "Accueil", value: "reception" }, { label: "Logistique", value: "logistics" }, { label: "Média", value: "media" }] },
      { name: "zone", label: "Zone", type: "text" }, { name: "starts_at", label: "Début", type: "datetime-local" }, { name: "ends_at", label: "Fin", type: "datetime-local" },
      { name: "availability_status", label: "Disponibilité", type: "select", options: [{ label: "À confirmer", value: "unknown" }, { label: "Disponible", value: "available" }, { label: "Indisponible", value: "unavailable" }] },
      { name: "compensation_amount", label: "Indemnité (Ar)", type: "number" },
      { name: "status", label: "Statut", type: "select", options: [{ label: "Invité", value: "invited" }, { label: "Confirmé", value: "confirmed" }, { label: "Présent", value: "checked_in" }, { label: "Terminé", value: "completed" }, { label: "Annulé", value: "cancelled" }] },
    ];
    return buildData(query, ["Personne", "Fonction", "Zone", "Disponibilité", "Horaire", "Indemnité", "Statut"], rows.map((row) => [text(row.staff_name), text(row.role), text(row.zone), text(row.availability_status), `${date(row.starts_at)} → ${date(row.ends_at)}`, money(row.compensation_amount), text(row.status)]), rows.map((row) => text(row.id)), [
      { label: "Équipe", value: String(rows.length), detail: "Affectations actives", tone: "blue" },
      { label: "Confirmés", value: String(rows.filter((row) => ["confirmed", "checked_in", "completed"].includes(text(row.status))).length), detail: "Présence validée", tone: "green" },
      { label: "Indisponibles", value: String(rows.filter((row) => row.availability_status === "unavailable").length), detail: "À remplacer", tone: "amber" },
    ], mutation("staff_assignments", rows, fields));
  }

  private async eventOfficials(query: RealErpQuery, context: Context) {
    const eventId = await this.activeEventId(context);
    let request = eventId ? this.supabase.from("event_official_assignments").select("*").eq("event_id", eventId) : null;
    const tab = normalize(query.tab);
    if (request && /arbitre|referee/.test(tab)) request = request.eq("role", "referee");
    if (request && /juge|judge/.test(tab)) request = request.eq("role", "judge");
    const [result, profilesResult, availabilityResult] = await Promise.all([
      request ? request.order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
      this.officialProfiles(),
      eventId ? this.supabase.from("official_availability").select("*").eq("event_id", eventId) : Promise.resolve({ data: [], error: null }),
    ]);
    const error = result.error ?? profilesResult.error ?? availabilityResult.error;
    if (error) throw error;
    const rows = asRows(result.data);
    const names = new Map((profilesResult.data ?? []).map((item) => [item.profile_id, item.full_name]));
    const availability = new Map((availabilityResult.data ?? []).map((item) => [item.official_profile_id, item.availability_status]));
    const fields: RealErpData["fields"] = [
      { name: "profile_id", label: "Profil officiel", type: "select", options: [{ label: "Mention externe", value: "" }, ...(profilesResult.data ?? []).map((item) => ({ label: item.full_name, value: item.profile_id }))] },
      { name: "mention", label: "Nom / mention", type: "text" },
      { name: "role", label: "Fonction", type: "select", required: true, options: [{ label: "Arbitre", value: "referee" }, { label: "Juge", value: "judge" }, { label: "Chronométreur", value: "timekeeper" }, { label: "Médecin", value: "doctor" }, { label: "Superviseur", value: "supervisor" }, { label: "Annonceur", value: "announcer" }] },
      { name: "status", label: "Statut", type: "select", required: true, options: [{ label: "Invité", value: "invited" }, { label: "Confirmé", value: "confirmed" }, { label: "Refusé", value: "declined" }, { label: "Annulé", value: "cancelled" }] },
    ];
    return buildData(query, ["Officiel", "Fonction", "Disponibilité", "Statut"], rows.map((row) => [
      names.get(text(row.profile_id)) ?? text(row.mention), text(row.role), availability.get(text(row.profile_id)) ?? (row.profile_id ? "Demande non créée" : "Non applicable"), text(row.status),
    ]), rows.map((row) => text(row.id)), undefined, mutation("event_official_assignments", rows, fields));
  }

  private async fightOfficialAssignments(query: RealErpQuery, context: Context) {
    const eventId = await this.activeEventId(context);
    const fightsResult = eventId ? await this.supabase.from("fights").select("id,fight_order,weight_category").eq("event_id", eventId).order("fight_order") : { data: [], error: null };
    if (fightsResult.error) throw fightsResult.error;
    const fightIds = (fightsResult.data ?? []).map((item) => item.id);
    const [assignmentsResult, profilesResult] = await Promise.all([
      fightIds.length ? this.supabase.from("fight_official_assignments").select("*").in("fight_id", fightIds).order("assigned_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
      this.officialProfiles(),
    ]);
    const error = assignmentsResult.error ?? profilesResult.error;
    if (error) throw error;
    const rows = asRows(assignmentsResult.data);
    const names = new Map((profilesResult.data ?? []).map((item) => [item.profile_id, item.full_name]));
    const fights = new Map((fightsResult.data ?? []).map((item) => [item.id, `#${item.fight_order} · ${item.weight_category}`]));
    const fields: RealErpData["fields"] = [
      { name: "fight_id", label: "Combat", type: "select", required: true, options: (fightsResult.data ?? []).map((item) => ({ label: `#${item.fight_order} · ${item.weight_category}`, value: item.id })) },
      { name: "user_id", label: "Officiel", type: "select", required: true, options: (profilesResult.data ?? []).map((item) => ({ label: item.full_name, value: item.profile_id })) },
      { name: "role", label: "Fonction", type: "select", required: true, options: [{ label: "Arbitre", value: "referee" }, { label: "Juge", value: "judge" }, { label: "Chronométreur", value: "timekeeper" }, { label: "Médecin", value: "doctor" }, { label: "Superviseur", value: "supervisor" }] },
      { name: "position", label: "Position", type: "number" },
      { name: "status", label: "Statut", type: "select", options: [{ label: "Affecté", value: "assigned" }, { label: "Confirmé", value: "confirmed" }, { label: "Refusé", value: "declined" }, { label: "Terminé", value: "completed" }] },
    ];
    return buildData(query, ["Combat", "Officiel", "Fonction", "Position", "Statut"], rows.map((row) => [
      fights.get(text(row.fight_id)) ?? text(row.fight_id), names.get(text(row.user_id)) ?? text(row.user_id), text(row.role), text(row.position), text(row.status),
    ]), rows.map((row) => text(row.id)), undefined, mutation("fight_official_assignments", rows, fields));
  }

  private async eventAccreditations(query: RealErpQuery, context: Context) {
    const eventId = await this.activeEventId(context);
    const [result, profilesResult] = await Promise.all([
      eventId ? this.supabase.from("event_accreditations").select("*").eq("event_id", eventId).order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
      this.supabase.from("profiles").select("id,full_name,email").order("full_name"),
    ]);
    const error = result.error ?? profilesResult.error;
    if (error) throw error;
    const rows = asRows(result.data);
    const fields: RealErpData["fields"] = [
      { name: "profile_id", label: "Profil associé", type: "select", options: [{ label: "Titulaire externe", value: "" }, ...(profilesResult.data ?? []).map((item) => ({ label: `${item.full_name} · ${item.email}`, value: item.id }))] },
      { name: "holder_name", label: "Titulaire", type: "text", required: true }, { name: "badge_code", label: "Code badge (auto si vide)", type: "text" },
      { name: "accreditation_type", label: "Type", type: "select", required: true, options: [{ label: "Staff", value: "staff" }, { label: "Bénévole", value: "volunteer" }, { label: "Officiel", value: "official" }, { label: "Presse", value: "media" }, { label: "VIP", value: "vip" }, { label: "Partenaire", value: "partner" }] },
      { name: "access_zones", label: "Zones séparées par des virgules", type: "text" },
      { name: "valid_from", label: "Valide à partir de", type: "datetime-local" }, { name: "valid_until", label: "Valide jusqu’au", type: "datetime-local" },
      { name: "status", label: "Statut", type: "select", required: true, options: [{ label: "Brouillon", value: "draft" }, { label: "Émise", value: "issued" }, { label: "Active", value: "active" }, { label: "Suspendue", value: "suspended" }, { label: "Révoquée", value: "revoked" }, { label: "Expirée", value: "expired" }] },
    ];
    return buildData(query, ["Badge", "Titulaire", "Type", "Zones", "Validité", "Statut"], rows.map((row) => [
      text(row.badge_code), text(row.holder_name), text(row.accreditation_type), Array.isArray(row.access_zones) ? row.access_zones.join(", ") : text(row.access_zones), `${date(row.valid_from)} → ${date(row.valid_until)}`, text(row.status),
    ]), rows.map((row) => text(row.id)), [
      { label: "Badges", value: String(rows.length), detail: "Accréditations créées", tone: "blue" },
      { label: "Actifs", value: String(rows.filter((row) => ["issued", "active"].includes(text(row.status))).length), detail: "Accès autorisés", tone: "green" },
      { label: "Suspendus / révoqués", value: String(rows.filter((row) => ["suspended", "revoked"].includes(text(row.status))).length), detail: "Accès bloqués", tone: "amber" },
    ], mutation("event_accreditations", rows, fields));
  }

  private async eventFinance(query: RealErpQuery, context: Context, type?: "revenue" | "expense") {
    const eventId = await this.activeEventId(context);
    let request = eventId ? this.supabase.from("event_transactions").select("*").eq("event_id", eventId) : null;
    if (request && type) request = request.eq("transaction_type", type);
    const result = request ? await request.order("created_at", { ascending: false }) : { data: [], error: null };
    if (result.error) throw result.error;
    const rows = asRows(result.data);
    const income = rows.filter((row) => row.transaction_type === "revenue").reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
    const expense = rows.filter((row) => row.transaction_type !== "revenue").reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
    const fields: RealErpData["fields"] = [
      { name: "description", label: "Libellé", type: "text", required: true }, { name: "category_code", label: "Catégorie", type: "text", required: true },
      { name: "transaction_type", label: "Type", type: "select", options: [{ label: "Recette", value: "revenue" }, { label: "Dépense", value: "expense" }] }, { name: "amount", label: "Montant (Ar)", type: "number", required: true },
      { name: "due_at", label: "Échéance", type: "datetime-local" },
      { name: "occurred_at", label: "Date d’opération", type: "datetime-local" },
      { name: "reference", label: "Référence", type: "text" },
      { name: "status", label: "Statut", type: "select", options: [
        { label: "Prévu", value: "planned" }, { label: "Engagé", value: "committed" },
        { label: "En attente", value: "pending" }, { label: "Payé", value: "paid" },
        { label: "Échoué", value: "failed" }, { label: "Annulé", value: "cancelled" },
      ] },
    ];
    return buildData(query, ["Libellé", "Catégorie", "Type", "Montant", "Date", "Statut"], rows.map((row) => [text(row.description), text(row.category_code), text(row.transaction_type), money(row.amount), date(row.occurred_at), text(row.status)]), rows.map((row) => text(row.id)), [{ label: "Recettes", value: money(income), detail: "Événement actif", tone: "green" }, { label: "Dépenses", value: money(expense), detail: "Événement actif", tone: "red" }, { label: "Solde", value: money(income - expense), detail: "Disponible", tone: "blue" }], mutation("event_transactions", rows, fields));
  }
  private async eventBudget(query: RealErpQuery, context: Context) {
    const eventId = await this.activeEventId(context);
    const budget = eventId ? await this.supabase.from("event_budgets").select("*").eq("event_id", eventId).order("version", { ascending: false }).limit(1).maybeSingle() : { data: null, error: null };
    if (budget.error) throw budget.error;
    const result = budget.data ? await this.supabase.from("event_budget_lines").select("*").eq("event_budget_id", budget.data.id).order("position") : { data: [], error: null };
    if (result.error) throw result.error;
    const rows: Row[] = asRows(result.data).map((row): Row => ({
      ...row,
      budget_name: budget.data?.name ?? "Budget principal",
      budget_status: budget.data?.status ?? "draft",
      currency_code: budget.data?.currency_code ?? "MGA",
    }));
    const fields: RealErpData["fields"] = [
      { name: "budget_name", label: "Nom du budget", type: "text", required: true },
      { name: "line_type", label: "Type", type: "select", required: true, options: [{ label: "Recette", value: "revenue" }, { label: "Dépense", value: "expense" }] },
      { name: "category_code", label: "Catégorie", type: "text", required: true },
      { name: "label", label: "Ligne budgétaire", type: "text", required: true },
      { name: "forecast_amount", label: "Prévision", type: "number", required: true },
      { name: "currency_code", label: "Devise", type: "select", options: [{ label: "Ariary", value: "MGA" }, { label: "Euro", value: "EUR" }, { label: "Dollar", value: "USD" }] },
      { name: "budget_status", label: "Statut du budget", type: "select", options: [
        { label: "Brouillon", value: "draft" }, { label: "Soumis", value: "submitted" },
        { label: "Approuvé", value: "approved" }, { label: "Clôturé", value: "closed" }, { label: "Archivé", value: "archived" },
      ] },
      { name: "notes", label: "Notes", type: "textarea" },
    ];
    const revenue = rows.filter((row) => row.line_type === "revenue").reduce((sum, row) => sum + Number(row.forecast_amount ?? 0), 0);
    const expense = rows.filter((row) => row.line_type === "expense").reduce((sum, row) => sum + Number(row.forecast_amount ?? 0), 0);
    return buildData(query, ["Ligne", "Type", "Catégorie", "Prévision", "Engagé", "Réel", "Budget"], rows.map((row) => [
      text(row.label), text(row.line_type), text(row.category_code), money(row.forecast_amount), money(row.committed_amount), money(row.actual_amount), text(row.budget_status),
    ]), rows.map((row) => text(row.id)), [
      { label: "Recettes prévues", value: money(revenue), detail: text(budget.data?.status), tone: "green" },
      { label: "Dépenses prévues", value: money(expense), detail: `Version ${text(budget.data?.version)}`, tone: "red" },
      { label: "Résultat prévisionnel", value: money(revenue-expense), detail: "Budget courant", tone: "blue" },
    ], mutation("event_budget_lines", rows, fields));
  }

  private async eventInvoices(query: RealErpQuery, context: Context) {
    const eventId = await this.activeEventId(context);
    const [result, organizations] = await Promise.all([
      eventId ? this.supabase.from("event_invoices").select("*").eq("event_id", eventId).order("due_date") : Promise.resolve({ data: [], error: null }),
      this.supabase.from("organizations").select("id,name").order("name"),
    ]);
    const error = result.error ?? organizations.error;
    if (error) throw error;
    const rows = asRows(result.data);
    const fields: RealErpData["fields"] = [
      { name: "invoice_number", label: "Numéro", type: "text", required: true },
      { name: "direction", label: "Nature", type: "select", required: true, options: [{ label: "Facture client", value: "receivable" }, { label: "Facture fournisseur", value: "payable" }] },
      { name: "counterparty_name", label: "Client / fournisseur", type: "text", required: true },
      { name: "counterparty_email", label: "Email", type: "text" },
      { name: "counterparty_organization_id", label: "Organisation liée", type: "select", options: [{ label: "Aucune", value: "" }, ...(organizations.data ?? []).map((item) => ({ label: item.name, value: item.id }))] },
      { name: "description", label: "Objet", type: "textarea", required: true },
      { name: "issue_date", label: "Émission", type: "date", required: true }, { name: "due_date", label: "Échéance", type: "date", required: true },
      { name: "subtotal", label: "Sous-total", type: "number", required: true }, { name: "tax_amount", label: "Taxes", type: "number" },
      { name: "currency_code", label: "Devise", type: "select", options: [{ label: "Ariary", value: "MGA" }, { label: "Euro", value: "EUR" }, { label: "Dollar", value: "USD" }] },
      { name: "status", label: "Statut", type: "select", options: [
        { label: "Brouillon", value: "draft" }, { label: "Émise", value: "issued" }, { label: "Partielle", value: "partial" },
        { label: "Payée", value: "paid" }, { label: "En retard", value: "overdue" }, { label: "Annulée", value: "cancelled" },
      ] },
      { name: "document_path", label: "Document", type: "text" }, { name: "notes", label: "Notes", type: "textarea" },
    ];
    return buildData(query, ["Numéro", "Tiers", "Nature", "Total", "Payé", "Échéance", "Statut"], rows.map((row) => [
      text(row.invoice_number), text(row.counterparty_name), text(row.direction), money(row.total_amount), money(row.amount_paid), date(row.due_date), text(row.status),
    ]), rows.map((row) => text(row.id)), [
      { label: "Factures", value: String(rows.length), detail: "Événement actif", tone: "blue" },
      { label: "Reste à régler", value: money(rows.reduce((sum, row) => sum + Number(row.total_amount ?? 0)-Number(row.amount_paid ?? 0), 0)), detail: "Créances et dettes", tone: "amber" },
    ], mutation("event_invoices", rows, fields));
  }

  private async eventInvoicePayments(query: RealErpQuery, context: Context) {
    const eventId = await this.activeEventId(context);
    const invoices = eventId ? await this.supabase.from("event_invoices").select("id,invoice_number,counterparty_name,total_amount,amount_paid,status").eq("event_id", eventId) : { data: [], error: null };
    if (invoices.error) throw invoices.error;
    const invoiceIds = (invoices.data ?? []).map((item) => item.id);
    const result = invoiceIds.length ? await this.supabase.from("event_invoice_payments").select("*").in("invoice_id", invoiceIds).order("paid_at", { ascending: false }) : { data: [], error: null };
    if (result.error) throw result.error;
    const rows = asRows(result.data);
    const labels = new Map((invoices.data ?? []).map((item) => [item.id, `${item.invoice_number} · ${item.counterparty_name}`]));
    const fields: RealErpData["fields"] = [
      { name: "invoice_id", label: "Facture", type: "select", required: true, options: (invoices.data ?? []).filter((item) => ["issued","partial","overdue"].includes(item.status)).map((item) => ({ label: `${item.invoice_number} · reste ${money(Number(item.total_amount)-Number(item.amount_paid))}`, value: item.id })) },
      { name: "amount", label: "Montant", type: "number", required: true },
      { name: "method", label: "Mode", type: "select", required: true, options: ["cash","bank_transfer","mobile_money","card","cheque","other"].map((value) => ({ label: value, value })) },
      { name: "reference", label: "Référence", type: "text" }, { name: "paid_at", label: "Date", type: "datetime-local" },
      { name: "notes", label: "Notes", type: "textarea" },
    ];
    return buildData(query, ["Facture", "Montant", "Mode", "Référence", "Date"], rows.map((row) => [
      labels.get(text(row.invoice_id)) ?? text(row.invoice_id), money(row.amount), text(row.method), text(row.reference), date(row.paid_at),
    ]), rows.map((row) => text(row.id)), [
      { label: "Paiements", value: String(rows.length), detail: "Écritures immuables", tone: "blue" },
      { label: "Total réglé", value: money(rows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0)), detail: "Factures", tone: "green" },
    ], mutation("event_invoice_payments", rows, fields, { create: true, update: false, delete: false }));
  }

  private async eventFinanceOverview(query: RealErpQuery, context: Context) {
    const eventId = await this.activeEventId(context);
    const [transactions, invoices, budgets] = eventId ? await Promise.all([
      this.supabase.from("event_transactions").select("*").eq("event_id", eventId),
      this.supabase.from("event_invoices").select("*").eq("event_id", eventId),
      this.supabase.from("event_budgets").select("id,status").eq("event_id", eventId),
    ]) : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }];
    const error = transactions.error ?? invoices.error ?? budgets.error;
    if (error) throw error;
    const rows = asRows(transactions.data);
    const revenue = rows.filter((row) => row.transaction_type==="revenue" && row.status==="paid").reduce((sum,row)=>sum+Number(row.amount??0),0);
    const expense = rows.filter((row) => row.transaction_type==="expense" && row.status==="paid").reduce((sum,row)=>sum+Number(row.amount??0),0);
    const committed = rows.filter((row) => ["committed","pending"].includes(text(row.status))).reduce((sum,row)=>sum+Number(row.amount??0),0);
    const outstanding = asRows(invoices.data).reduce((sum,row)=>sum+Number(row.total_amount??0)-Number(row.amount_paid??0),0);
    const summary: Row[] = [
      { id:"revenue", indicator:"Recettes encaissées", amount:revenue, detail:"Transactions payées" },
      { id:"expense", indicator:"Dépenses payées", amount:expense, detail:"Transactions payées" },
      { id:"balance", indicator:"Trésorerie nette", amount:revenue-expense, detail:"Solde réalisé" },
      { id:"commitments", indicator:"Engagements ouverts", amount:committed, detail:"À traiter" },
      { id:"invoices", indicator:"Factures à solder", amount:outstanding, detail:"Restes à payer" },
    ];
    return buildData(query, ["Indicateur","Montant","Détail"], summary.map((row)=>[text(row.indicator),money(row.amount),text(row.detail)]), summary.map((row)=>text(row.id)), [
      { label:"Solde réalisé",value:money(revenue-expense),detail:"Trésorerie événement",tone:revenue-expense>=0?"green":"red" },
      { label:"Engagements",value:money(committed),detail:"À décaisser/encaisser",tone:"amber" },
      { label:"Budgets",value:String((budgets.data??[]).length),detail:"Versions enregistrées",tone:"blue" },
    ]);
  }

  /*
   * INDESY CRUD FALLBACK P0
   *
   * Un handler absent produit un etat non modifiable explicite.
   * Il ne lit et n'ecrit aucune entite metier de remplacement.
   */
  private unsupported(
    query: RealErpQuery,
  ): RealErpData {
    return {
      ...buildData(
        query,
        [],
        [],
        [],
        [
          {
            label: "Etat",
            value: "INDISPONIBLE",
            detail: "Aucun handler metier explicite",
            tone: "amber",
          },
        ],
      ),
      action: "Indisponible",
      implementationStatus: "unavailable",
      emptyMessage:
        "Ce module n'est pas encore relie a une autorite metier.",
    };
  }

  private async workspaceRecords(query: RealErpQuery, context: Context) {
    const result = await this.supabase
      .from("erp_workspace_records")
      .select("*")
      .eq("owner_profile_id", context.userId)
      .eq("role_slug", query.role)
      .eq("module_id", query.moduleId)
      .eq("tab_id", query.tab)
      .order("updated_at", { ascending: false });
    if (result.error) throw result.error;
    const rows = asRows(result.data);
    const fields: RealErpData["fields"] = [
      { name: "title", label: "Intitulé", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "status", label: "Statut", type: "select", required: true, options: [
        { label: "Brouillon", value: "draft" }, { label: "À faire", value: "todo" },
        { label: "En cours", value: "in_progress" }, { label: "Bloqué", value: "blocked" },
        { label: "Terminé", value: "completed" }, { label: "Archivé", value: "archived" },
      ] },
      { name: "priority", label: "Priorité", type: "select", required: true, options: [
        { label: "Basse", value: "low" }, { label: "Normale", value: "normal" },
        { label: "Haute", value: "high" }, { label: "Critique", value: "critical" },
      ] },
      { name: "due_at", label: "Échéance", type: "datetime-local" },
    ];
    const completed = rows.filter((row) => row.status === "completed").length;
    const urgent = rows.filter((row) => ["high", "critical"].includes(text(row.priority)) && row.status !== "completed").length;
    return buildData(query, ["Intitulé", "Statut", "Priorité", "Échéance", "Mise à jour"], rows.map((row) => [
      text(row.title), text(row.status), text(row.priority), date(row.due_at), date(row.updated_at),
    ]), rows.map((row) => text(row.id)), [
      { label: "Éléments", value: String(rows.length), detail: "Registre opérationnel", tone: "blue" },
      { label: "Terminés", value: String(completed), detail: "Travail finalisé", tone: "green" },
      { label: "Prioritaires", value: String(urgent), detail: "À traiter", tone: urgent ? "amber" : "blue" },
    ], mutation("workspace_records", rows, fields));
  }

  private async identity(query: RealErpQuery, context: Context) {
    const [profile, organizations] = await Promise.all([
      this.supabase.from("profiles").select("id,full_name,email,phone,city_id,is_verified").eq("id", context.userId).maybeSingle(),
      context.organizationIds.length ? this.supabase.from("organizations").select("id,name,type,status,email,phone,is_verified").in("id", context.organizationIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (profile.error) throw profile.error;
    if (organizations.error) throw organizations.error;
    const rows: Row[] = [
      ...(profile.data ? [{ id: profile.data.id, name: profile.data.full_name, type: "Profil personnel", status: profile.data.is_verified ? "Vérifié" : "Non vérifié", email: profile.data.email, phone: profile.data.phone }] : []),
      ...asRows(organizations.data).map((row) => ({ ...row, name: row.name, type: row.type, status: row.is_verified ? "Vérifiée" : row.status })),
    ];
    return buildData(query, ["Entité", "Type", "Email", "Téléphone", "Statut"], rows.map((row) => [text(row.name), text(row.type), text(row.email), text(row.phone), text(row.status)]), rows.map((row) => text(row.id)));
  }
}
