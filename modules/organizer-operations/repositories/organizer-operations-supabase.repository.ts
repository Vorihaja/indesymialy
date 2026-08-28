import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  Database,
} from "@/infrastructure/supabase/database.types";

import {
  normalizeOrganizerOperationsError,
  OrganizerOperationsError,
} from "../errors";

import type {
  OrganizerActivity,
  OrganizerAlert,
  OrganizerContext,
  OrganizerDashboardSnapshot,
  OrganizerEventBrief,
  OrganizerMetric,
  OrganizerOperationalStatus,
  OrganizerReadinessDomain,
  OrganizerSection,
  OrganizerSectionSnapshot,
} from "../types";

import type {
  OrganizerOperationsPersistentRepository,
} from "./organizer-operations.repository";

type FightRow =
  Database["public"]["Tables"]["fights"]["Row"];

type Tone =
  OrganizerMetric["tone"];

const formatNumber =
  new Intl.NumberFormat(
    "fr-FR",
  );

const formatMoney =
  new Intl.NumberFormat(
    "fr-FR",
    {
      notation: "compact",
      maximumFractionDigits: 1,
    },
  );

function metric(
  id: string,
  label: string,
  value: string,
  detail: string,
  source: string,
  tone?: Tone,
): OrganizerMetric {
  return {
    id,
    label,
    value,
    detail,
    source,
    tone,
    connected: true,
  };
}

function unavailable(
  id: string,
  label: string,
  reason: string,
  source =
    "Schéma incomplet",
): OrganizerMetric {
  return {
    id,
    label,
    value: "N/C",
    detail: reason,
    source,
    tone: "warning",
    connected: false,
  };
}

function eventStatus(
  status: string | null,
): OrganizerEventBrief["status"] {
  return status === "live"
    ? "live"
    : "upcoming";
}

function formatEventDateLabel(
  value: string | null,
): string {
  if (!value) {
    return "Date à définir";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Date invalide";
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(parsed);
}

function eventCountdownLabel(
  value: string | null,
): string {
  if (!value) {
    return "DATE À DÉFINIR";
  }

  const start = new Date(value);

  if (Number.isNaN(start.getTime())) {
    return "DATE INVALIDE";
  }

  const now = new Date();
  const sameDay =
    start.getFullYear() === now.getFullYear() &&
    start.getMonth() === now.getMonth() &&
    start.getDate() === now.getDate();

  if (sameDay) {
    return "AUJOURD’HUI";
  }

  const difference =
    start.getTime() - now.getTime();

  if (difference > 0) {
    const days = Math.max(
      1,
      Math.ceil(
        difference /
          (24 * 60 * 60 * 1000),
      ),
    );

    return `J-${days}`;
  }

  return "DATE PASSÉE";
}

function percentage(
  current: number,
  total: number,
) {
  if (!total) {
    return 0;
  }

  return Math.round(
    (current / total) *
      100,
  );
}

function domainTone(
  value: number | null,
): OrganizerReadinessDomain["tone"] {
  if (value === null) {
    return "warning";
  }

  if (value >= 90) {
    return "success";
  }

  if (value >= 65) {
    return "info";
  }

  if (value >= 35) {
    return "warning";
  }

  return "danger";
}

export class OrganizerOperationsSupabaseRepository
  implements OrganizerOperationsPersistentRepository
{
  constructor(
    private readonly supabase:
      SupabaseClient<Database>,
  ) {}

  async getDashboard(
    context: OrganizerContext,
  ): Promise<OrganizerDashboardSnapshot> {
    try {
      const eventsResult =
        await this.supabase
          .from("events")
          .select("*")
          .eq(
            "organizer_id",
            context.organizationId,
          )
          .order(
            "updated_at",
            {
              ascending: false,
            },
          );

      if (eventsResult.error) {
        throw eventsResult.error;
      }

      const events =
        eventsResult.data ?? [];

      const eventIds =
        events.map(
          (event) =>
            event.id,
        );

      const activeEvent =
        context.activeEventId
          ? events.find(
              (event) =>
                event.id ===
                context.activeEventId,
            ) ?? null
          : null;

      const activeEventId =
        activeEvent?.id ?? null;

      const allFightsResult =
        eventIds.length
          ? await this.supabase
              .from("fights")
              .select("*")
              .in(
                "event_id",
                eventIds,
              )
              .order(
                "fight_order",
              )
          : {
              data:
                [] as FightRow[],
              error: null,
            };

      const allChecklistsResult =
        eventIds.length
          ? await this.supabase
              .from(
                "event_checklists",
              )
              .select(
                "id,event_id,task_name,is_completed,critical_blocking",
              )
              .in(
                "event_id",
                eventIds,
              )
          : {
              data: [],
              error: null,
            };

      if (
        allFightsResult.error
      ) {
        throw allFightsResult.error;
      }

      if (
        allChecklistsResult.error
      ) {
        throw allChecklistsResult.error;
      }

      const allFights =
        allFightsResult.data ??
        [];

      const allChecklists =
        allChecklistsResult.data ??
        [];

      const activeFights =
        activeEventId
          ? allFights.filter(
              (fight) =>
                fight.event_id ===
                activeEventId &&
                ![
                  "cancelled",
                  "archived",
                ].includes(
                  fight.status ??
                    "",
                ),
            )
          : [];

      const activeFightIds =
        activeFights.map(
          (fight) =>
            fight.id,
        );

      const activeChecklists =
        activeEventId
          ? allChecklists.filter(
              (item) =>
                item.event_id ===
                activeEventId,
            )
          : [];

      const [
        ticketSalesResult,
        ticketTypesResult,
        sponsorsResult,
        staffResult,
        fightCardResult,
      ] = activeEventId
        ? await Promise.all([
            this.supabase
              .from(
                "ticket_sales",
              )
              .select(
                "event_id,quantity,total_amount,payment_status,sold_at",
              )
              .eq(
                "event_id",
                activeEventId,
              ),

            this.supabase
              .from(
                "ticket_types",
              )
              .select(
                "event_id,total_quantity,sold_quantity",
              )
              .eq(
                "event_id",
                activeEventId,
              ),

            this.supabase
              .from(
                "event_sponsors",
              )
              .select(
                "id,event_id,amount,visibility_score",
              )
              .eq(
                "event_id",
                activeEventId,
              ),

            this.supabase
              .from(
                "staff_assignments",
              )
              .select(
                "id,event_id,status,role,assigned_at,staff_name",
              )
              .eq(
                "event_id",
                activeEventId,
              ),

            this.supabase
              .from("fight_card")
              .select(
                "id,event_id,is_confirmed",
              )
              .eq(
                "event_id",
                activeEventId,
              ),
          ])
        : [
            {
              data: [],
              error: null,
            },
            {
              data: [],
              error: null,
            },
            {
              data: [],
              error: null,
            },
            {
              data: [],
              error: null,
            },
            {
              data: [],
              error: null,
            },
          ];

      const firstError = [
        ticketSalesResult.error,
        ticketTypesResult.error,
        sponsorsResult.error,
        staffResult.error,
        fightCardResult.error,
      ].find(Boolean);

      if (firstError) {
        throw firstError;
      }

      const officialsResult =
        activeFightIds.length
          ? await this.supabase
              .from(
                "fight_official_assignments",
              )
              .select(
                "id,fight_id,status,role,assigned_at",
              )
              .in(
                "fight_id",
                activeFightIds,
              )
          : {
              data: [],
              error: null,
            };

      const statisticsResult =
        activeFightIds.length
          ? await this.supabase
              .from(
                "fight_statistics",
              )
              .select(
                "fight_id",
              )
              .in(
                "fight_id",
                activeFightIds,
              )
          : {
              data: [],
              error: null,
            };

      if (
        officialsResult.error
      ) {
        throw officialsResult.error;
      }

      if (
        statisticsResult.error
      ) {
        throw statisticsResult.error;
      }

      const ticketSales =
        ticketSalesResult.data ??
        [];

      const ticketTypes =
        ticketTypesResult.data ??
        [];

      const sponsors =
        sponsorsResult.data ??
        [];

      const staff =
        staffResult.data ??
        [];

      const fightCard =
        fightCardResult.data ??
        [];

      const officials =
        officialsResult.data ??
        [];

      const statistics =
        statisticsResult.data ??
        [];

      const sold =
        ticketSales.reduce(
          (sum, sale) =>
            sum +
            (sale.quantity ??
              0),
          0,
        );

      const paidStatuses =
        new Set([
          "paid",
          "completed",
          "succeeded",
        ]);

      const paidRevenue =
        ticketSales
          .filter((sale) =>
            paidStatuses.has(
              (
                sale.payment_status ??
                ""
              ).toLowerCase(),
            ),
          )
          .reduce(
            (sum, sale) =>
              sum +
              (sale.total_amount ??
                0),
            0,
          );

      const capacity =
        ticketTypes.reduce(
          (sum, type) =>
            sum +
            type.total_quantity,
          0,
        );

      const confirmedStaff =
        staff.filter(
          (item) =>
            item.status ===
              "confirmed" ||
            item.status ===
              "completed",
        ).length;

      const confirmedOfficials =
        officials.filter(
          (item) =>
            item.status ===
              "confirmed" ||
            item.status ===
              "accepted",
        ).length;

      const critical =
        activeChecklists.filter(
          (item) =>
            item.critical_blocking &&
            !item.is_completed,
        );

      const completedTasks =
        activeChecklists.filter(
          (item) =>
            item.is_completed,
        ).length;

      const checklistReadiness =
        percentage(
          completedTasks,
          activeChecklists.length,
        );

      const confirmedCard =
        fightCard.filter(
          (item) =>
            item.is_confirmed,
        ).length;

      const fightReadiness =
        fightCard.length
          ? percentage(
              confirmedCard,
              fightCard.length,
            )
          : activeFights.length
            ? 50
            : 0;

      const ticketReadiness =
        ticketTypes.length
          ? 100
          : 0;

      const teamReadiness =
        staff.length
          ? percentage(
              confirmedStaff,
              staff.length,
            )
          : 0;

      const partnerReadiness =
        sponsors.length
          ? 100
          : 0;

      const performanceReadiness =
        activeFights.length
          ? percentage(
              activeFights.filter(
                (fight) =>
                  Boolean(
                    fight.winner_id,
                  ),
              ).length,
              activeFights.length,
            )
          : 0;

      const readinessDomains:
        OrganizerReadinessDomain[] =
        [
          {
            id: "events",
            label:
              "Événement",
            value:
              activeEvent
                ? 100
                : 0,
            detail:
              activeEvent
                ? "Événement actif sélectionné."
                : "Aucun événement actif.",
            href:
              "/dashboard/organisateur/events",
            connected: true,
            tone:
              activeEvent
                ? "success"
                : "danger",
          },

          {
            id: "fight-center",
            label:
              "Fight Center",
            value:
              fightReadiness,
            detail:
              fightCard.length
                ? `${confirmedCard}/${fightCard.length} entrée(s) Fight Card confirmée(s).`
                : `${activeFights.length} combat(s) persisté(s).`,
            href:
              "/dashboard/organisateur/fight-cards",
            connected: true,
            tone:
              domainTone(
                fightReadiness,
              ),
          },

          {
            id: "ticketing",
            label:
              "Billetterie",
            value:
              ticketReadiness,
            detail:
              ticketTypes.length
                ? `${ticketTypes.length} type(s) de billet configuré(s).`
                : "Aucun type de billet configuré.",
            href:
              "/dashboard/organisateur/ticketing",
            connected: true,
            tone:
              domainTone(
                ticketReadiness,
              ),
          },

          {
            id: "team",
            label:
              "Équipe",
            value:
              teamReadiness,
            detail:
              `${confirmedStaff}/${staff.length} membre(s) du staff confirmé(s).`,
            href:
              "/dashboard/organisateur/staff",
            connected: true,
            tone:
              domainTone(
                teamReadiness,
              ),
          },

          {
            id: "partners",
            label:
              "Partenaires",
            value:
              partnerReadiness,
            detail:
              `${sponsors.length} sponsor(s) rattaché(s) à l’événement.`,
            href:
              "/dashboard/organisateur/sponsors",
            connected: true,
            tone:
              domainTone(
                partnerReadiness,
              ),
          },

          {
            id: "operations",
            label:
              "Opérations",
            value:
              activeChecklists.length
                ? checklistReadiness
                : 0,
            detail:
              activeChecklists.length
                ? `${completedTasks}/${activeChecklists.length} tâche(s) terminée(s).`
                : "Aucune checklist persistée.",
            href:
              "/dashboard/organisateur/checklists",
            connected: true,
            tone:
              domainTone(
                activeChecklists.length
                  ? checklistReadiness
                  : 0,
              ),
          },

          {
            id: "finance",
            label:
              "Finances",
            value: null,
            detail:
              "Revenus billetterie disponibles, mais dépenses événementielles non encore reliées à event_id.",
            href:
              "/dashboard/organisateur/finance",
            connected: false,
            tone: "warning",
          },

          {
            id: "performance",
            label:
              "Performance",
            value:
              performanceReadiness,
            detail:
              activeFights.length
                ? `${activeFights.filter((fight) => Boolean(fight.winner_id)).length}/${activeFights.length} résultat(s) disponible(s).`
                : "Aucun combat à analyser.",
            href:
              "/dashboard/organisateur/statistics",
            connected: true,
            tone:
              domainTone(
                performanceReadiness,
              ),
          },
        ];

      const preparationValues =
        readinessDomains
          .filter((domain) =>
            [
              "events",
              "fight-center",
              "ticketing",
              "team",
              "partners",
              "operations",
            ].includes(
              domain.id,
            ),
          )
          .map(
            (domain) =>
              domain.value,
          )
          .filter(
            (
              value,
            ): value is number =>
              value !== null,
          );

      const readiness =
        preparationValues.length
          ? Math.round(
              preparationValues.reduce(
                (
                  sum,
                  value,
                ) =>
                  sum + value,
                0,
              ) /
                preparationValues.length,
            )
          : 0;

      const fillRate =
        capacity
          ? percentage(
              sold,
              capacity,
            )
          : 0;

      const metrics:
        OrganizerMetric[] = [
        unavailable(
          "today",
          "Événements aujourd’hui",
          "La table events ne contient pas encore de date métier exploitable.",
          "events: date absente",
        ),

        unavailable(
          "upcoming",
          "Événements à venir",
          "Impossible de calculer la chronologie sans date métier.",
          "events: date absente",
        ),

        metric(
          "fights",
          "Combats programmés",
          formatNumber.format(
            activeFights.length,
          ),
          "Combats non annulés de l’événement actif.",
          "fights.event_id,status",
          "info",
        ),

        metric(
          "tickets",
          "Billets vendus",
          formatNumber.format(
            sold,
          ),
          "Quantité de billets vendus pour l’événement actif.",
          "ticket_sales.quantity",
          "success",
        ),

        metric(
          "revenue",
          "Chiffre d’affaires",
          `${formatMoney.format(
            paidRevenue,
          )} Ar`,
          "Ventes dont le paiement est confirmé.",
          "ticket_sales.total_amount,payment_status",
          "success",
        ),

        metric(
          "fill",
          "Remplissage",
          `${fillRate} %`,
          capacity
            ? `${formatNumber.format(
                Math.max(
                  capacity -
                    sold,
                  0,
                ),
              )} place(s) théorique(s) restante(s).`
            : "Aucun quota de billet configuré.",
          "ticket_types + ticket_sales",
          capacity
            ? "info"
            : "warning",
        ),

        metric(
          "sponsors",
          "Sponsors actifs",
          formatNumber.format(
            sponsors.length,
          ),
          "Sponsors rattachés à l’événement actif.",
          "event_sponsors.event_id",
          sponsors.length
            ? "success"
            : "warning",
        ),

        metric(
          "staff",
          "Staff confirmé",
          `${confirmedStaff}/${staff.length}`,
          "Affectations staff confirmées ou terminées.",
          "staff_assignments.status",
          staff.length &&
          confirmedStaff ===
            staff.length
            ? "success"
            : "warning",
        ),

        metric(
          "officials",
          "Officiels confirmés",
          `${confirmedOfficials}/${officials.length}`,
          "Affectations arbitrales confirmées.",
          "fight_official_assignments.status",
          officials.length &&
          confirmedOfficials ===
            officials.length
            ? "success"
            : "warning",
        ),

        unavailable(
          "payments",
          "Paiements en attente",
          "Aucune dette ou échéance fournisseur reliée directement à l’événement.",
          "transactions sans event_id",
        ),

        metric(
          "critical",
          "Alertes critiques",
          formatNumber.format(
            critical.length,
          ),
          "Tâches bloquantes non terminées.",
          "event_checklists.critical_blocking,is_completed",
          critical.length
            ? "danger"
            : "success",
        ),
      ];

      const eventFightCounts =
        new Map<
          string,
          number
        >();

      allFights.forEach(
        (fight) => {
          if (!fight.event_id) {
            return;
          }

          eventFightCounts.set(
            fight.event_id,
            (
              eventFightCounts.get(
                fight.event_id,
              ) ?? 0
            ) + 1,
          );
        },
      );

      const eventChecklist =
        new Map<
          string,
          {
            completed: number;
            total: number;
          }
        >();

      allChecklists.forEach(
        (item) => {
          if (!item.event_id) {
            return;
          }

          const current =
            eventChecklist.get(
              item.event_id,
            ) ?? {
              completed: 0,
              total: 0,
            };

          current.total += 1;

          if (
            item.is_completed
          ) {
            current.completed +=
              1;
          }

          eventChecklist.set(
            item.event_id,
            current,
          );
        },
      );

      const eventBriefs:
        OrganizerEventBrief[] =
        events.map(
          (event) => {
            const progress =
              eventChecklist.get(
                event.id,
              );

            return {
              id: event.id,

              name:
                event.title,

              dateLabel:
                formatEventDateLabel(
                  event.starts_at,
                ),

              venue:
                event.venue ??
                "Lieu non renseigné",

              status:
                eventStatus(
                  event.status,
                ),

              readiness:
                progress?.total
                  ? percentage(
                      progress.completed,
                      progress.total,
                    )
                  : 0,

              fights:
                eventFightCounts.get(
                  event.id,
                ) ?? 0,

              href:
                `/dashboard/organisateur/events/${event.id}`,
            };
          },
        );

      const alerts:
        OrganizerAlert[] =
        critical
          .slice(0, 4)
          .map((item) => ({
            id: item.id,

            title:
              item.task_name,

            detail:
              "Tâche critique persistée et non terminée.",

            severity:
              "critical",

            href:
              "/dashboard/organisateur/checklists",
          }));

      if (
        officials.length >
        confirmedOfficials
      ) {
        alerts.push({
          id:
            "officials-pending",

          title:
            "Officiels à confirmer",

          detail:
            `${
              officials.length -
              confirmedOfficials
            } confirmation(s) encore requise(s).`,

          severity:
            "warning",

          href:
            "/dashboard/organisateur/officials",
        });
      }

      if (
        staff.length >
        confirmedStaff
      ) {
        alerts.push({
          id:
            "staff-pending",

          title:
            "Staff incomplet",

          detail:
            `${
              staff.length -
              confirmedStaff
            } affectation(s) staff non confirmée(s).`,

          severity:
            "warning",

          href:
            "/dashboard/organisateur/staff",
        });
      }

      if (
        capacity &&
        fillRate >= 90
      ) {
        alerts.push({
          id:
            "capacity-high",

          title:
            "Capacité élevée",

          detail:
            `Le remplissage théorique atteint ${fillRate} %.`,

          severity:
            "info",

          href:
            "/dashboard/organisateur/ticketing",
        });
      }

      if (
        activeEvent &&
        !fightCard.length &&
        !activeFights.length
      ) {
        alerts.push({
          id:
            "fight-card-empty",

          title:
            "Fight Card non préparée",

          detail:
            "Aucun combat ni entrée Fight Card n’est encore enregistré.",

          severity:
            "warning",

          href:
            "/dashboard/organisateur/fight-cards",
        });
      }

      const activities:
        OrganizerActivity[] =
        events
          .slice(0, 5)
          .map(
            (event) => ({
              id:
                `event-${event.id}`,

              label:
                event.id ===
                activeEventId
                  ? "Événement actif"
                  : "Événement",

              detail:
                `${event.title} · statut ${event.status ?? "non défini"}`,

              time:
                event.updated_at
                  ? new Date(
                      event.updated_at,
                    ).toLocaleString(
                      "fr-FR",
                    )
                  : "Date indisponible",

              status:
                event.status ===
                "published"
                  ? "success"
                  : event.status ===
                      "live"
                    ? "danger"
                    : "info",
            }),
          );

      const liveFight =
        activeFights.find(
          (fight) =>
            fight.status ===
            "live",
        );

      const liveReady =
        Boolean(
          liveFight ||
            statistics.length,
        );

      const operationalStatus:
        OrganizerOperationalStatus[] =
        [
          {
            id:
              "fight-center",

            label:
              "Fight Center",

            value:
              fightCard.length
                ? `${confirmedCard}/${fightCard.length}`
                : `${activeFights.length}`,

            detail:
              fightCard.length
                ? "opposition(s) confirmée(s)"
                : "combat(s) programmé(s)",

            href:
              "/dashboard/organisateur/fight-cards",

            tone:
              domainTone(
                fightReadiness,
              ),

            connected: true,
          },

          {
            id:
              "ticketing",

            label:
              "Billetterie",

            value:
              capacity
                ? `${sold}/${capacity}`
                : `${sold}`,

            detail:
              capacity
                ? `${fillRate} % de remplissage`
                : "billet(s) vendu(s)",

            href:
              "/dashboard/organisateur/ticketing",

            tone:
              capacity
                ? fillRate >= 90
                  ? "warning"
                  : "info"
                : "warning",

            connected: true,
          },

          {
            id: "team",

            label:
              "Équipe",

            value:
              `${confirmedStaff}/${staff.length}`,

            detail:
              "staff confirmé",

            href:
              "/dashboard/organisateur/staff",

            tone:
              domainTone(
                teamReadiness,
              ),

            connected: true,
          },

          {
            id:
              "officials",

            label:
              "Officiels",

            value:
              `${confirmedOfficials}/${officials.length}`,

            detail:
              "affectations confirmées",

            href:
              "/dashboard/organisateur/officials",

            tone:
              officials.length &&
              confirmedOfficials ===
                officials.length
                ? "success"
                : "warning",

            connected: true,
          },

          {
            id:
              "partners",

            label:
              "Partenaires",

            value:
              formatNumber.format(
                sponsors.length,
              ),

            detail:
              "sponsor(s) actif(s)",

            href:
              "/dashboard/organisateur/sponsors",

            tone:
              sponsors.length
                ? "success"
                : "warning",

            connected: true,
          },

          {
            id:
              "finance",

            label:
              "Finances",

            value:
              `${formatMoney.format(
                paidRevenue,
              )} Ar`,

            detail:
              "CA encaissé · dépenses non connectées",

            href:
              "/dashboard/organisateur/finance",

            tone: "info",

            connected: true,
          },

          {
            id:
              "control-room",

            label:
              "Régie Live",

            value:
              liveReady
                ? "PRÊT"
                : "À CONFIGURER",

            detail:
              "Fight Live, scoring et résultats",

            href:
              "/dashboard/organisateur/fight-live",

            tone:
              liveReady
                ? "success"
                : "warning",

            connected: true,
          },
        ];

      return {
        generatedAt:
          new Date().toLocaleString(
            "fr-FR",
          ),

        eventName:
          activeEvent?.title ??
          "Aucun événement actif",

        eventCountdown:
          eventCountdownLabel(
            activeEvent?.starts_at ?? null,
          ),

        activeEvent:
          activeEvent
            ? {
                id:
                  activeEvent.id,

                name:
                  activeEvent.title,

                venue:
                  activeEvent.venue ??
                  "Lieu non renseigné",

                status:
                  activeEvent.status ??
                  "non défini",

                dateLabel:
                  formatEventDateLabel(
                    activeEvent.starts_at,
                  ),

                countdown:
                  eventCountdownLabel(
                    activeEvent.starts_at,
                  ),
              }
            : null,

        readiness,

        readinessDomains,

        operationalStatus,

        quickActions: [],

        metrics,

        events:
          eventBriefs,

        alerts,

        checklist:
          activeChecklists.length
            ? [
                {
                  id:
                    "persisted",

                  label:
                    "Tâches persistées",

                  completed:
                    completedTasks,

                  total:
                    activeChecklists.length,

                  critical:
                    critical.length,
                },
              ]
            : [],

        activities,

        weather: {
          status:
            "Non connecté",

          temperature:
            "N/C",

          wind: "N/C",

          confidence:
            "Aucune source météo persistée",
        },

        liveReady,

        context,
      };
    } catch (reason) {
      throw normalizeOrganizerOperationsError(
        reason,
      );
    }
  }

  async getSection(
    context: OrganizerContext,
    section: OrganizerSection,
  ): Promise<
    Partial<OrganizerSectionSnapshot>
  > {
    try {
      const dashboard =
        await this.getDashboard(
          context,
        );

      const byId =
        new Map(
          dashboard.metrics.map(
            (item) => [
              item.id,
              item,
            ],
          ),
        );

      const selected = (
        ...ids: string[]
      ) =>
        ids
          .map(
            (id) =>
              byId.get(id),
          )
          .filter(
            (
              item,
            ): item is OrganizerMetric =>
              Boolean(item),
          );

      const activeEventId =
        context.activeEventId;

      if (
        section ===
        "ticketing"
      ) {
        const rows =
          activeEventId
            ? await this.supabase
                .from(
                  "ticket_types",
                )
                .select(
                  "id,name,price,total_quantity,sold_quantity",
                )
                .eq(
                  "event_id",
                  activeEventId,
                )
                .order("price")
            : {
                data: [],
                error: null,
              };

        if (rows.error) {
          throw rows.error;
        }

        return {
          metrics: selected(
            "tickets",
            "revenue",
            "fill",
            "payments",
          ),

          readiness:
            Number.parseInt(
              byId.get("fill")
                ?.value ?? "0",
              10,
            ) || 0,

          records:
            (
              rows.data ?? []
            ).map(
              (row) => ({
                id: row.id,

                title:
                  row.name,

                detail:
                  `${formatNumber.format(
                    row.price,
                  )} Ar · ${
                    row.sold_quantity ??
                    0
                  }/${row.total_quantity}`,

                status:
                  (
                    row.sold_quantity ??
                    0
                  ) >=
                  row.total_quantity
                    ? "Complet"
                    : "En vente",
              }),
            ),
        };
      }

      if (
        section ===
        "sponsors"
      ) {
        const links =
          activeEventId
            ? await this.supabase
                .from(
                  "event_sponsors",
                )
                .select(
                  "id,sponsor_id,amount,visibility_score,contract_start,contract_end",
                )
                .eq(
                  "event_id",
                  activeEventId,
                )
            : {
                data: [],
                error: null,
              };

        if (links.error) {
          throw links.error;
        }

        const sponsorIds =
          (
            links.data ?? []
          )
            .map(
              (item) =>
                item.sponsor_id,
            )
            .filter(
              (
                id,
              ): id is string =>
                Boolean(id),
            );

        const names =
          sponsorIds.length
            ? await this.supabase
                .from(
                  "sponsors",
                )
                .select(
                  "id,name,tier,is_active",
                )
                .in(
                  "id",
                  sponsorIds,
                )
            : {
                data: [],
                error: null,
              };

        if (names.error) {
          throw names.error;
        }

        const bySponsor =
          new Map(
            (
              names.data ?? []
            ).map(
              (item) => [
                item.id,
                item,
              ],
            ),
          );

        return {
          metrics: [
            byId.get(
              "sponsors",
            ) as OrganizerMetric,

            unavailable(
              "pipeline",
              "Pipeline",
              "Aucune table de prospection.",
            ),

            unavailable(
              "deliverables",
              "Livrables",
              "Aucune table de livrables.",
            ),

            unavailable(
              "payments",
              "Paiements",
              "Aucune table de paiements sponsor.",
            ),
          ],

          readiness: 0,

          records:
            (
              links.data ?? []
            ).map(
              (row) => ({
                id: row.id,

                title:
                  row.sponsor_id
                    ? bySponsor.get(
                        row.sponsor_id,
                      )?.name ??
                      "Sponsor"
                    : "Sponsor",

                detail:
                  `${formatNumber.format(
                    row.amount,
                  )} Ar · visibilité ${
                    row.visibility_score ??
                    "N/C"
                  }`,

                status:
                  row.contract_start ||
                  row.contract_end
                    ? "Sous contrat"
                    : "Rattaché",
              }),
            ),
        };
      }

      if (
        section ===
          "staff" ||
        section ===
          "volunteers"
      ) {
        const rows =
          activeEventId
            ? await this.supabase
                .from(
                  "staff_assignments",
                )
                .select(
                  "id,staff_name,role,status,assigned_at,phone",
                )
                .eq(
                  "event_id",
                  activeEventId,
                )
                .order(
                  "assigned_at",
                )
            : {
                data: [],
                error: null,
              };

        if (rows.error) {
          throw rows.error;
        }

        const filtered =
          section ===
          "volunteers"
            ? (
                rows.data ?? []
              ).filter(
                (row) =>
                  row.role
                    .toLowerCase()
                    .includes(
                      "bénévole",
                    ) ||
                  row.role
                    .toLowerCase()
                    .includes(
                      "volunteer",
                    ),
              )
            : rows.data ?? [];

        return {
          metrics: [
            byId.get(
              "staff",
            ) as OrganizerMetric,

            unavailable(
              "availability",
              "Disponibilités",
              "Colonne absente.",
            ),

            unavailable(
              "checkin",
              "Check-in",
              "Table absente.",
            ),

            unavailable(
              "staff-payments",
              "Paiements",
              "Table absente.",
            ),
          ],

          readiness: 0,

          records:
            filtered.map(
              (row) => ({
                id: row.id,

                title:
                  row.staff_name,

                detail:
                  `${row.role} · ${
                    row.assigned_at
                      ? new Date(
                          row.assigned_at,
                        ).toLocaleString(
                          "fr-FR",
                        )
                      : "horaire N/C"
                  }`,

                status:
                  row.status ??
                  "invité",
              }),
            ),
        };
      }

      if (
        section ===
          "officials" ||
        section ===
          "referees" ||
        section ===
          "judges"
      ) {
        const fights =
          activeEventId
            ? await this.supabase
                .from("fights")
                .select(
                  "id,fight_order",
                )
                .eq(
                  "event_id",
                  activeEventId,
                )
            : {
                data: [],
                error: null,
              };

        if (fights.error) {
          throw fights.error;
        }

        const fightIds =
          (
            fights.data ?? []
          ).map(
            (fight) =>
              fight.id,
          );

        const rows =
          fightIds.length
            ? await this.supabase
                .from(
                  "fight_official_assignments",
                )
                .select(
                  "id,fight_id,user_id,role,status,position",
                )
                .in(
                  "fight_id",
                  fightIds,
                )
            : {
                data: [],
                error: null,
              };

        if (rows.error) {
          throw rows.error;
        }

        const fightOrder =
          new Map(
            (
              fights.data ?? []
            ).map(
              (fight) => [
                fight.id,
                fight.fight_order,
              ],
            ),
          );

        const filtered =
          section ===
          "referees"
            ? (
                rows.data ?? []
              ).filter(
                (row) =>
                  row.role
                    .toLowerCase()
                    .includes(
                      "referee",
                    ) ||
                  row.role
                    .toLowerCase()
                    .includes(
                      "arbitre",
                    ),
              )
            : section ===
                "judges"
              ? (
                  rows.data ??
                  []
                ).filter(
                  (row) =>
                    row.role
                      .toLowerCase()
                      .includes(
                        "judge",
                      ) ||
                    row.role
                      .toLowerCase()
                      .includes(
                        "juge",
                      ),
                )
              : rows.data ?? [];

        return {
          metrics: [
            byId.get(
              "officials",
            ) as OrganizerMetric,

            metric(
              "fights",
              "Combats couverts",
              byId.get(
                "fights",
              )?.value ?? "0",
              "Combats de l’événement actif.",
              "fights.event_id",
            ),

            unavailable(
              "documents",
              "Documents",
              "Table absente.",
            ),

            unavailable(
              "fees",
              "Rémunérations",
              "Table absente.",
            ),
          ],

          readiness: 0,

          records:
            filtered.map(
              (row) => ({
                id: row.id,

                title:
                  row.role,

                detail:
                  `Combat ${
                    fightOrder.get(
                      row.fight_id,
                    ) ?? "N/C"
                  } · position ${
                    row.position ??
                    "N/C"
                  } · utilisateur ${row.user_id}`,

                status:
                  row.status ??
                  "assigné",

                href:
                  `/dashboard/organisateur/fight-live/${row.fight_id}/officials`,
              }),
            ),
        };
      }

      if (
        section ===
        "checklists"
      ) {
        const rows =
          activeEventId
            ? await this.supabase
                .from(
                  "event_checklists",
                )
                .select(
                  "id,task_name,is_completed,critical_blocking",
                )
                .eq(
                  "event_id",
                  activeEventId,
                )
            : {
                data: [],
                error: null,
              };

        if (rows.error) {
          throw rows.error;
        }

        const checklist =
          dashboard.checklist[0];

        return {
          metrics: [
            byId.get(
              "critical",
            ) as OrganizerMetric,

            metric(
              "total",
              "Tâches persistées",
              String(
                checklist?.total ??
                  0,
              ),
              "Instances event_checklists.",
              "event_checklists.event_id",
            ),

            metric(
              "done",
              "Terminées",
              String(
                checklist?.completed ??
                  0,
              ),
              "État opérationnel persistant.",
              "event_checklists.is_completed",
              "success",
            ),

            unavailable(
              "categories",
              "Catégories",
              "Colonne catégorie absente.",
            ),
          ],

          readiness:
            checklist?.total
              ? percentage(
                  checklist.completed,
                  checklist.total,
                )
              : 0,

          records:
            (
              rows.data ?? []
            ).map(
              (row) => ({
                id: row.id,

                title:
                  row.task_name,

                detail:
                  row.critical_blocking
                    ? "Bloquante"
                    : "Standard",

                status:
                  row.is_completed
                    ? "Terminée"
                    : "À faire",
              }),
            ),
        };
      }

      if (
        section === "budget"
      ) {
        return {
          metrics: [
            unavailable(
              "budget",
              "Budget événement",
              "transactions ne contient pas event_id.",
            ),

            byId.get(
              "revenue",
            ) as OrganizerMetric,

            byId.get(
              "sponsors",
            ) as OrganizerMetric,

            unavailable(
              "expenses",
              "Dépenses événement",
              "Aucune relation événement fiable.",
            ),
          ],

          readiness: 0,
        };
      }

      if (
        section ===
          "reports" ||
        section ===
          "statistics"
      ) {
        return {
          metrics: selected(
            "tickets",
            "revenue",
            "sponsors",
            "fights",
          ),

          readiness: 0,
        };
      }

      if (
        section ===
        "competitions"
      ) {
        return {
          metrics: [
            metric(
              "events",
              "Événements",
              String(
                dashboard.events
                  .length,
              ),
              "Événements de l’organisation.",
              "events.organizer_id",
            ),

            unavailable(
              "today",
              "Aujourd’hui",
              "Date absente.",
            ),

            unavailable(
              "formats",
              "Formats",
              "Colonne absente.",
            ),

            unavailable(
              "timeline",
              "Timeline",
              "Table dédiée absente.",
            ),
          ],

          readiness: 0,
        };
      }

      if (
        section ===
        "fighters"
      ) {
        const fights =
          activeEventId
            ? await this.supabase
                .from("fights")
                .select(
                  "fighter_red_id,fighter_blue_id",
                )
                .eq(
                  "event_id",
                  activeEventId,
                )
            : {
                data: [],
                error: null,
              };

        if (fights.error) {
          throw fights.error;
        }

        const ids = [
          ...new Set(
            (
              fights.data ?? []
            )
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
        ];

        const rows =
          ids.length
            ? await this.supabase
                .from("fighters")
                .select(
                  "id,full_name,nickname,current_weight_kg,weight_class,status,medical_clearance_expiry",
                )
                .in("id", ids)
            : {
                data: [],
                error: null,
              };

        if (rows.error) {
          throw rows.error;
        }

        return {
          metrics: [
            metric(
              "fighters",
              "Combattants engagés",
              String(
                (
                  rows.data ?? []
                ).length,
              ),
              "Combattants de l’événement actif.",
              "fights → fighters",
            ),

            metric(
              "medical",
              "Certificats renseignés",
              String(
                (
                  rows.data ?? []
                ).filter(
                  (row) =>
                    row.medical_clearance_expiry,
                ).length,
              ),
              "Échéances médicales disponibles.",
              "fighters.medical_clearance_expiry",
            ),

            unavailable(
              "licenses",
              "Licences",
              "Aucune relation de licence dans le contrat actuel.",
            ),

            unavailable(
              "availability",
              "Disponibilités",
              "Table absente.",
            ),
          ],

          readiness: 0,

          records:
            (
              rows.data ?? []
            ).map(
              (row) => ({
                id: row.id,

                title:
                  row.nickname
                    ? `${row.full_name} · ${row.nickname}`
                    : row.full_name,

                detail:
                  `${
                    row.weight_class ??
                    "catégorie N/C"
                  } · ${
                    row.current_weight_kg ??
                    "N/C"
                  } kg`,

                status:
                  row.status ??
                  "non défini",
              }),
            ),
        };
      }

      if (
        section ===
        "clubs"
      ) {
        const rows =
          await this.supabase
            .from("clubs")
            .select(
              "id,name,organization_id,region_id,is_official_federated",
            )
            .order("name");

        if (rows.error) {
          throw rows.error;
        }

        return {
          metrics: [
            metric(
              "clubs",
              "Clubs consultables",
              String(
                (
                  rows.data ?? []
                ).length,
              ),
              "Référentiel clubs visible.",
              "clubs",
            ),

            metric(
              "official",
              "Clubs officiels",
              String(
                (
                  rows.data ?? []
                ).filter(
                  (row) =>
                    row.is_official_federated,
                ).length,
              ),
              "Statut fédéré.",
              "clubs.is_official_federated",
            ),

            unavailable(
              "delegations",
              "Délégations",
              "Aucune relation club-événement.",
            ),

            unavailable(
              "accreditations",
              "Accréditations",
              "Table absente.",
            ),
          ],

          readiness: 0,

          records:
            (
              rows.data ?? []
            ).map(
              (row) => ({
                id: row.id,

                title:
                  row.name,

                detail:
                  `Région ${row.region_id} · organisation ${
                    row.organization_id ??
                    "N/C"
                  }`,

                status:
                  row.is_official_federated
                    ? "Officiel"
                    : "Référencé",
              }),
            ),
        };
      }

      if (
        [
          "fight-cards",
          "fights",
          "results",
          "categories",
        ].includes(section)
      ) {
        if (!activeEventId) {
          throw new OrganizerOperationsError(
            "EVENT_NOT_FOUND",
          );
        }

        const [
          cardResult,
          fightsResult,
        ] = await Promise.all([
          this.supabase
            .from(
              "fight_card",
            )
            .select(
              "id,is_confirmed,fighter_a_id,fighter_b_id,tag",
            )
            .eq(
              "event_id",
              activeEventId,
            ),

          this.supabase
            .from("fights")
            .select(
              "id,status,winner_id,weight_category,fighter_red_id,fighter_blue_id,fight_order,scheduled_rounds",
            )
            .eq(
              "event_id",
              activeEventId,
            ),
        ]);

        if (
          cardResult.error
        ) {
          throw cardResult.error;
        }

        if (
          fightsResult.error
        ) {
          throw fightsResult.error;
        }

        const card =
          cardResult.data ?? [];

        const fights =
          fightsResult.data ??
          [];

        const fighterIds = [
          ...card.flatMap(
            (item) => [
              item.fighter_a_id,
              item.fighter_b_id,
            ],
          ),

          ...fights.flatMap(
            (item) => [
              item.fighter_red_id,
              item.fighter_blue_id,
            ],
          ),
        ].filter(
          (
            id,
          ): id is string =>
            Boolean(id),
        );

        const fighterRows =
          fighterIds.length
            ? await this.supabase
                .from("fighters")
                .select(
                  "id,full_name",
                )
                .in(
                  "id",
                  fighterIds,
                )
            : {
                data: [],
                error: null,
              };

        if (
          fighterRows.error
        ) {
          throw fighterRows.error;
        }

        const fighterNames =
          new Map(
            (
              fighterRows.data ??
              []
            ).map(
              (fighter) => [
                fighter.id,
                fighter.full_name,
              ],
            ),
          );

        const records =
          section === "results"
            ? fights.map(
                (fight) => ({
                  id:
                    fight.id,

                  title:
                    fight.weight_category?.trim() ||
                    "Catégorie N/C",

                  detail:
                    fight.winner_id
                      ? `Vainqueur ${
                          fighterNames.get(
                            fight.winner_id,
                          ) ??
                          fight.winner_id
                        }`
                      : "Résultat non publié",

                  status:
                    fight.status ??
                    "planifié",

                  href:
                    `/dashboard/organisateur/fight-live/${fight.id}/result`,
                }),
              )
            : section ===
                  "fights" ||
                section ===
                  "categories"
              ? fights.map(
                  (fight) => ({
                    id:
                      fight.id,

                    title:
                      `${
                        fight.fighter_red_id
                          ? fighterNames.get(
                              fight.fighter_red_id,
                            ) ??
                            "Coin rouge"
                          : "Coin rouge N/C"
                      } vs ${
                        fight.fighter_blue_id
                          ? fighterNames.get(
                              fight.fighter_blue_id,
                            ) ??
                            "Coin bleu"
                          : "Coin bleu N/C"
                      }`,

                    detail:
                      `${fight.weight_category?.trim() || "Catégorie N/C"} · ${
                        fight.scheduled_rounds ??
                        "N/C"
                      } rounds · ordre ${fight.fight_order}`,

                    status:
                      fight.status ??
                      "planifié",

                    href:
                      `/dashboard/organisateur/fight-live/${fight.id}`,
                  }),
                )
              : card.map(
                  (entry) => ({
                    id:
                      entry.id,

                    title:
                      `${
                        entry.fighter_a_id
                          ? fighterNames.get(
                              entry.fighter_a_id,
                            ) ??
                            "Coin rouge"
                          : "Coin rouge N/C"
                      } vs ${
                        entry.fighter_b_id
                          ? fighterNames.get(
                              entry.fighter_b_id,
                            ) ??
                            "Coin bleu"
                          : "Coin bleu N/C"
                      }`,

                    detail:
                      entry.tag,

                    status:
                      entry.is_confirmed
                        ? "Confirmé"
                        : "Planifié",
                  }),
                );

        return {
          metrics: [
            metric(
              "entries",
              "Fight Card",
              String(
                card.length,
              ),
              "Entrées persistées.",
              "fight_card.event_id",
            ),

            metric(
              "confirmed",
              "Confirmés",
              String(
                card.filter(
                  (item) =>
                    item.is_confirmed,
                ).length,
              ),
              "Entrées confirmées.",
              "fight_card.is_confirmed",
              "success",
            ),

            metric(
              "fights",
              "Combats",
              String(
                fights.length,
              ),
              "Combats persistés.",
              "fights.event_id",
            ),

            metric(
              "results",
              "Résultats",
              String(
                fights.filter(
                  (item) =>
                    item.winner_id,
                ).length,
              ),
              "Combats avec vainqueur.",
              "fights.winner_id",
            ),
          ],

          readiness:
            card.length
              ? percentage(
                  card.filter(
                    (item) =>
                      item.is_confirmed,
                  ).length,
                  card.length,
                )
              : 0,

          records,
        };
      }

      if (
        section ===
        "settings"
      ) {
        return {
          metrics: [
            metric(
              "organization",
              "Organisation",
              "Connectée",
              "Identité chargée depuis organizations.",
              "organizations.id",
              "success",
            ),

            metric(
              "permissions",
              "Permissions",
              String(
                context.permissions
                  .length,
              ),
              "Permissions du profil actif.",
              "role_permissions → permissions",
            ),

            unavailable(
              "production",
              "Production",
              "Préférences absentes.",
            ),

            unavailable(
              "notifications",
              "Notifications",
              "Préférences absentes.",
            ),
          ],

          readiness: 50,
        };
      }

      return {
        metrics: [
          unavailable(
            "one",
            "Stockage",
            "Capacité non persistable dans le schéma actuel.",
          ),

          unavailable(
            "two",
            "Données",
            "Table ou relation absente.",
          ),

          unavailable(
            "three",
            "Workflow",
            "Template mémoire explicite.",
          ),

          unavailable(
            "four",
            "Runtime",
            "Connexion future requise.",
          ),
        ],

        readiness: 0,
      };
    } catch (reason) {
      throw normalizeOrganizerOperationsError(
        reason,
      );
    }
  }
}