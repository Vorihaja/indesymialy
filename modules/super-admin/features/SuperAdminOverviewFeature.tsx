"use client";

import {
  SuperAdminBarChart,
  SuperAdminGrowthChart,
} from "../components/SuperAdminCharts";

import {
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

export function SuperAdminOverviewFeature() {
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
    governance,
  } = data;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2588ff]">
          Executive Overview
        </p>

        <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
          Vue d’ensemble de l’écosystème
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Pilotage global basé exclusivement sur les données réelles disponibles.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SuperAdminKpiCard
          label="Utilisateurs"
          value={formatNumber(
            overview.totalUsers,
          )}
          detail={`${formatNumber(
            overview.newUsers,
          )} nouveaux sur la période`}
          trend={
            overview.newUsersGrowth
          }
        />

        <SuperAdminKpiCard
          label="Combattants"
          value={formatNumber(
            overview.fighters,
          )}
          detail={`${formatNumber(
            overview.newFighters,
          )} nouveaux`}
        />

        <SuperAdminKpiCard
          label="Événements"
          value={formatNumber(
            overview.events,
          )}
          detail={`${formatNumber(
            overview.newEvents,
          )} créés sur la période`}
          trend={
            overview.newEventsGrowth
          }
        />

        <SuperAdminKpiCard
          label="Recettes billetterie"
          value={formatMoney(
            overview.ticketRevenue,
          )}
          detail={`${formatNumber(
            overview.ticketsSold,
          )} billets vendus`}
          trend={
            overview.ticketRevenueGrowth
          }
        />

        <SuperAdminKpiCard
          label="Organisations"
          value={formatNumber(
            overview.organizations,
          )}
          detail={`${formatNumber(
            overview.clubs,
          )} clubs`}
        />

        <SuperAdminKpiCard
          label="Vérification utilisateurs"
          value={formatPercent(
            overview.verifiedUserRate,
          )}
          detail={`${formatNumber(
            overview.verifiedUsers,
          )} profils vérifiés`}
        />

        <SuperAdminKpiCard
          label="Messages"
          value={formatNumber(
            overview.messages,
          )}
          detail="Messages envoyés sur la période"
          trend={
            overview.messagesGrowth
          }
        />

        <SuperAdminKpiCard
          label="Administrateurs"
          value={formatNumber(
            governance.administrators,
          )}
          detail="Comptes avec accès Admin"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <SuperAdminPanel
          title="Croissance de l’écosystème"
          subtitle="Nouvelles créations quotidiennes"
        >
          <SuperAdminGrowthChart
            data={data.growthSeries}
          />
        </SuperAdminPanel>

        <SuperAdminPanel
          title="Répartition des rôles"
          subtitle="Profils disposant de rôles métier"
        >
          <SuperAdminBarChart
            data={
              data.breakdowns.roles
            }
            limit={10}
          />
        </SuperAdminPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SuperAdminPanel
          title="Performance sportive"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <SuperAdminKpiCard
              label="Readiness événements"
              value={formatPercent(
                sport.averageReadiness,
              )}
            />

            <SuperAdminKpiCard
              label="Combats terminés"
              value={formatPercent(
                sport.fightCompletionRate,
              )}
              detail={`${formatNumber(
                sport.fightsCompleted,
              )} / ${formatNumber(
                sport.fightsCreated,
              )}`}
            />
          </div>
        </SuperAdminPanel>

        <SuperAdminPanel
          title="Performance financière"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <SuperAdminKpiCard
              label="Résultat événements"
              value={formatMoney(
                business.eventNet,
              )}
              detail={`${formatMoney(
                business.eventRevenue,
              )} recettes`}
            />

            <SuperAdminKpiCard
              label="Sponsoring"
              value={formatMoney(
                business.sponsoringValue,
              )}
              detail="Valeur enregistrée sur la période"
            />
          </div>
        </SuperAdminPanel>
      </div>

      <SuperAdminPanel
        title="Implantation géographique"
        subtitle="Utilisateurs enregistrés par région"
      >
        <SuperAdminBarChart
          data={
            data.breakdowns.regions
          }
          limit={12}
        />
      </SuperAdminPanel>
    </div>
  );
}
