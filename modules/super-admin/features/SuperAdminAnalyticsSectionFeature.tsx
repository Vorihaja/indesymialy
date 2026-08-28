"use client";

import {
  SuperAdminBarChart,
  SuperAdminGrowthChart,
} from "../components/SuperAdminCharts";

import {
  formatBytes,
  formatMoney,
  formatNumber,
  formatPercent,
} from "../components/formatters";

import {
  SuperAdminKpiCard,
} from "../components/SuperAdminKpiCard";

import {
  SuperAdminErrorState,
  SuperAdminLoadingState,
  SuperAdminPanel,
} from "../components/SuperAdminStates";

import {
  useSuperAdminAnalytics,
} from "../hooks/useSuperAdminAnalytics";

import type {
  SuperAdminAnalyticsSection,
} from "../types";

function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2588ff]">
        {eyebrow}
      </p>

      <h1 className="mt-2 text-2xl font-black sm:text-3xl">
        {title}
      </h1>

      <p className="mt-2 max-w-4xl text-sm text-zinc-500">
        {description}
      </p>
    </header>
  );
}

export function SuperAdminAnalyticsSectionFeature({
  section,
}: {
  section: SuperAdminAnalyticsSection;
}) {
  const {
    data,
    loading,
    error,
  } = useSuperAdminAnalytics();

  if (loading) {
    return <SuperAdminLoadingState />;
  }

  if (error || !data) {
    return (
      <SuperAdminErrorState
        message={
          error ??
          "Aucune donnée disponible."
        }
      />
    );
  }

  const {
    overview,
    sport,
    business,
    community,
    system,
  } = data;

  if (section === "growth") {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Growth Analytics"
          title="Croissance"
          description="Mesure l’évolution réelle des inscriptions, combattants, événements et activité de communication."
        />

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SuperAdminKpiCard
            label="Nouveaux utilisateurs"
            value={formatNumber(
              overview.newUsers,
            )}
            trend={
              overview.newUsersGrowth
            }
          />

          <SuperAdminKpiCard
            label="Nouveaux combattants"
            value={formatNumber(
              overview.newFighters,
            )}
          />

          <SuperAdminKpiCard
            label="Nouveaux événements"
            value={formatNumber(
              overview.newEvents,
            )}
            trend={
              overview.newEventsGrowth
            }
          />

          <SuperAdminKpiCard
            label="Messages"
            value={formatNumber(
              overview.messages,
            )}
            trend={
              overview.messagesGrowth
            }
          />
        </section>

        <SuperAdminPanel
          title="Évolution quotidienne"
        >
          <SuperAdminGrowthChart
            data={data.growthSeries}
          />
        </SuperAdminPanel>
      </div>
    );
  }

  if (section === "users") {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="People Analytics"
          title="Utilisateurs"
          description="Analyse quantitative des profils et de leur répartition. Aucun compte individuel n’est administré depuis cette page."
        />

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SuperAdminKpiCard
            label="Utilisateurs"
            value={formatNumber(
              overview.totalUsers,
            )}
          />

          <SuperAdminKpiCard
            label="Nouveaux"
            value={formatNumber(
              overview.newUsers,
            )}
            trend={
              overview.newUsersGrowth
            }
          />

          <SuperAdminKpiCard
            label="Profils vérifiés"
            value={formatNumber(
              overview.verifiedUsers,
            )}
          />

          <SuperAdminKpiCard
            label="Taux de vérification"
            value={formatPercent(
              overview.verifiedUserRate,
            )}
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <SuperAdminPanel
            title="Répartition par rôle"
          >
            <SuperAdminBarChart
              data={
                data.breakdowns.roles
              }
            />
          </SuperAdminPanel>

          <SuperAdminPanel
            title="Répartition géographique"
          >
            <SuperAdminBarChart
              data={
                data.breakdowns.regions
              }
            />
          </SuperAdminPanel>
        </div>
      </div>
    );
  }

  if (section === "sport") {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Sport Analytics"
          title="Performance sportive"
          description="Indicateurs consolidés sur les combattants, clubs, événements, combats et disciplines."
        />

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SuperAdminKpiCard
            label="Combattants"
            value={formatNumber(
              overview.fighters,
            )}
          />

          <SuperAdminKpiCard
            label="Clubs"
            value={formatNumber(
              overview.clubs,
            )}
          />

          <SuperAdminKpiCard
            label="Combats"
            value={formatNumber(
              overview.fights,
            )}
          />

          <SuperAdminKpiCard
            label="Événements"
            value={formatNumber(
              overview.events,
            )}
          />

          <SuperAdminKpiCard
            label="Readiness moyen"
            value={formatPercent(
              sport.averageReadiness,
            )}
          />

          <SuperAdminKpiCard
            label="Combats terminés"
            value={formatNumber(
              sport.fightsCompleted,
            )}
            detail={`${formatPercent(
              sport.fightCompletionRate,
            )} des combats créés sur la période`}
          />

          <SuperAdminKpiCard
            label="Événements terminés"
            value={formatNumber(
              sport.eventsCompleted,
            )}
          />

          <SuperAdminKpiCard
            label="Événements annulés"
            value={formatNumber(
              sport.eventsCancelled,
            )}
          />
        </section>

        <SuperAdminPanel
          title="Activité par discipline"
          subtitle="Volume de combats enregistrés"
        >
          <SuperAdminBarChart
            data={
              data.breakdowns.disciplines
            }
          />
        </SuperAdminPanel>
      </div>
    );
  }

  if (section === "business") {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Business Analytics"
          title="Business"
          description="Flux financiers réellement enregistrés : billetterie, événements, sponsoring et abonnements."
        />

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SuperAdminKpiCard
            label="Recettes billetterie"
            value={formatMoney(
              business.ticketRevenue,
            )}
            trend={
              overview.ticketRevenueGrowth
            }
          />

          <SuperAdminKpiCard
            label="Billets vendus"
            value={formatNumber(
              business.ticketsSold,
            )}
          />

          <SuperAdminKpiCard
            label="Recettes événements"
            value={formatMoney(
              business.eventRevenue,
            )}
          />

          <SuperAdminKpiCard
            label="Dépenses événements"
            value={formatMoney(
              business.eventExpenses,
            )}
          />

          <SuperAdminKpiCard
            label="Résultat événements"
            value={formatMoney(
              business.eventNet,
            )}
          />

          <SuperAdminKpiCard
            label="Sponsoring"
            value={formatMoney(
              business.sponsoringValue,
            )}
          />

          <SuperAdminKpiCard
            label="Abonnements actifs"
            value={formatNumber(
              business.activeSubscriptions,
            )}
          />

          <SuperAdminKpiCard
            label="Valeur abonnements"
            value={formatMoney(
              business.activeSubscriptionValue,
            )}
            detail="Snapshot actuel : la table subscriptions ne possède pas encore de date d’historisation."
          />
        </section>
      </div>
    );
  }

  if (section === "community") {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Community Analytics"
          title="Community"
          description="Indicateurs de communication actuellement mesurables dans le schéma de production."
        />

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SuperAdminKpiCard
            label="Messages"
            value={formatNumber(
              community.messages,
            )}
            trend={
              overview.messagesGrowth
            }
          />

          <SuperAdminKpiCard
            label="Conversations créées"
            value={formatNumber(
              community.conversationsCreated,
            )}
          />
        </section>

        {!community.socialPublishingAvailable && (
          <div className="border border-amber-500/20 bg-amber-500/5 p-5">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-amber-400">
              Indesy Korana
            </p>

            <p className="mt-2 max-w-3xl text-sm text-amber-100/70">
              Les tables de publications, commentaires et réactions ne sont pas encore présentes dans le contrat Supabase actuel. Aucun chiffre fictif n’est affiché.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (section === "organizations") {
    const verificationRate =
      overview.organizations > 0
        ? (
            overview.verifiedOrganizations /
            overview.organizations
          ) *
          100
        : 0;

    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Organization Analytics"
          title="Organisations"
          description="Vue exécutive des organisations et clubs enregistrés dans l’écosystème."
        />

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SuperAdminKpiCard
            label="Organisations"
            value={formatNumber(
              overview.organizations,
            )}
          />

          <SuperAdminKpiCard
            label="Organisations vérifiées"
            value={formatNumber(
              overview.verifiedOrganizations,
            )}
          />

          <SuperAdminKpiCard
            label="Taux de vérification"
            value={formatPercent(
              verificationRate,
            )}
          />

          <SuperAdminKpiCard
            label="Clubs"
            value={formatNumber(
              overview.clubs,
            )}
          />
        </section>
      </div>
    );
  }

  if (section === "geography") {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Geographic Analytics"
          title="Géographie"
          description="Implantation des utilisateurs à travers les régions actives de Madagascar."
        />

        <SuperAdminPanel
          title="Utilisateurs par région"
        >
          <SuperAdminBarChart
            data={
              data.breakdowns.regions
            }
            limit={23}
          />
        </SuperAdminPanel>
      </div>
    );
  }

  if (section === "performance") {
    const organizationVerificationRate =
      overview.organizations > 0
        ? (
            overview.verifiedOrganizations /
            overview.organizations
          ) *
          100
        : 0;

    const eventMargin =
      business.eventRevenue > 0
        ? (
            business.eventNet /
            business.eventRevenue
          ) *
          100
        : null;

    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Executive Scorecard"
          title="Performance"
          description="Concentration des principaux ratios mesurables à partir des données actuellement disponibles."
        />

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SuperAdminKpiCard
            label="Croissance utilisateurs"
            value={
              overview.newUsersGrowth ===
              null
                ? "N/D"
                : formatPercent(
                    overview.newUsersGrowth,
                  )
            }
          />

          <SuperAdminKpiCard
            label="Vérification utilisateurs"
            value={formatPercent(
              overview.verifiedUserRate,
            )}
          />

          <SuperAdminKpiCard
            label="Vérification organisations"
            value={formatPercent(
              organizationVerificationRate,
            )}
          />

          <SuperAdminKpiCard
            label="Readiness événements"
            value={formatPercent(
              sport.averageReadiness,
            )}
          />

          <SuperAdminKpiCard
            label="Complétion combats"
            value={formatPercent(
              sport.fightCompletionRate,
            )}
          />

          <SuperAdminKpiCard
            label="Marge événements"
            value={formatPercent(
              eventMargin,
            )}
          />

          <SuperAdminKpiCard
            label="Croissance billetterie"
            value={
              overview.ticketRevenueGrowth ===
              null
                ? "N/D"
                : formatPercent(
                    overview.ticketRevenueGrowth,
                  )
            }
          />

          <SuperAdminKpiCard
            label="Croissance messages"
            value={
              overview.messagesGrowth ===
              null
                ? "N/D"
                : formatPercent(
                    overview.messagesGrowth,
                  )
            }
          />
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System Analytics"
        title="Système"
        description="Indicateurs PostgreSQL directement mesurables depuis l’infrastructure actuelle."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SuperAdminKpiCard
          label="Taille base de données"
          value={formatBytes(
            system.databaseSizeBytes,
          )}
        />

        <SuperAdminKpiCard
          label="Connexions PostgreSQL"
          value={formatNumber(
            system.databaseConnections,
          )}
        />

        <SuperAdminKpiCard
          label="Cache hit ratio"
          value={formatPercent(
            system.databaseCacheHitRate,
          )}
        />
      </section>

      <div className="border border-[#272a31] bg-[#111318] p-5 text-sm text-zinc-500">
        Uptime applicatif, latence HTTP, erreurs Vercel et disponibilité réseau ne sont pas simulés. Ils nécessiteront une source de monitoring réelle avant d’apparaître ici.
      </div>
    </div>
  );
}
