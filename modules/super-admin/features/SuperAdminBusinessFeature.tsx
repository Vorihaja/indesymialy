"use client";

import {
  SuperAdminBarChart,
} from "../components/SuperAdminCharts";

import {
  SuperAdminBusinessTrendChart,
} from "../components/SuperAdminBusinessTrendChart";

import {
  SuperAdminKpiCard,
} from "../components/SuperAdminKpiCard";

import {
  SuperAdminErrorState,
  SuperAdminLoadingState,
  SuperAdminPanel,
} from "../components/SuperAdminStates";

import {
  formatNumber,
} from "../components/formatters";

import {
  useSuperAdminBusinessAnalytics,
} from "../hooks/useSuperAdminBusinessAnalytics";

function money(
  value: number,
  currency: string | null,
): string {

  if (!currency) {
    return formatNumber(
      value,
    );
  }

  if (
    currency.toUpperCase() ===
    "MGA"
  ) {

    return `${Math.round(
      value,
    ).toLocaleString(
      "fr-FR",
    )} Ar`;

  }

  try {

    return new Intl.NumberFormat(
      "fr-FR",
      {
        style: "currency",
        currency:
          currency.toUpperCase(),
        maximumFractionDigits: 2,
      },
    ).format(
      value,
    );

  } catch {

    return `${formatNumber(
      value,
    )} ${currency}`;

  }
}

function chart(
  values: {
    label: string;
    value: number;
  }[],
) {

  return values.map(
    (item) => ({
      label:
        item.label,

      value:
        item.value,
    }),
  );
}

export function SuperAdminBusinessFeature() {

  const {
    data,
    loading,
    error,
  } =
    useSuperAdminBusinessAnalytics();

  if (loading) {
    return (
      <SuperAdminLoadingState />
    );
  }

  if (
    error ||
    !data
  ) {

    return (
      <SuperAdminErrorState
        message={
          error ??
          "Analytics Business indisponibles."
        }
      />
    );
  }

  const {
    headline,
    breakdowns,
  } = data;

  const currency =
    headline.primaryCurrency;

  return (
    <div className="space-y-6">

      <header>

        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2588ff]">
          Ecosystem Economics
        </p>

        <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
          Business
        </h1>

        <p className="mt-2 max-w-4xl text-sm text-zinc-500">
          Vue exécutive consolidée de la Marketplace, de la billetterie, du sponsoring et de l’activité financière officielle.
        </p>

      </header>


      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

        <SuperAdminKpiCard
          label="Volume Business"
          value={
            money(
              headline.businessVolume,
              currency,
            )
          }
          trend={
            headline.businessVolumeGrowth
          }
          detail="Marketplace GMV + billetterie payée + sponsoring payé, dans une même devise."
        />


        <SuperAdminKpiCard
          label="Marketplace GMV"
          value={
            money(
              headline.marketplaceGmv,
              currency,
            )
          }
          detail={`${formatNumber(
            headline.marketplacePaidOrders,
          )} commande(s) payée(s)`}
        />


        <SuperAdminKpiCard
          label="Billetterie"
          value={
            money(
              headline.ticketingRevenue,
              currency,
            )
          }
          detail={`${formatNumber(
            headline.ticketUnits,
          )} billet(s) payé(s)`}
        />


        <SuperAdminKpiCard
          label="Sponsoring"
          value={
            money(
              headline.sponsorshipValue,
              currency,
            )
          }
          detail={`${formatNumber(
            headline.paidSponsorContracts,
          )} contrat(s) payé(s) créé(s)`}
        />


        <SuperAdminKpiCard
          label="Transactions billetterie"
          value={
            formatNumber(
              headline.ticketTransactions,
            )
          }
        />


        <SuperAdminKpiCard
          label="Abonnements actifs"
          value={
            formatNumber(
              headline.activeSubscriptions,
            )
          }
          detail="Parc courant. Montant exclu du consolidé : devise et dates absentes du schéma."
        />


        <SuperAdminKpiCard
          label="Paiements ledger"
          value={
            formatNumber(
              headline.financialPayments,
            )
          }
          detail="Activité financial_payments. Non additionnée au volume afin d’éviter le double comptage."
        />


        <SuperAdminKpiCard
          label="Billetterie sans devise"
          value={
            formatNumber(
              headline.ticketSalesWithoutCurrency,
            )
          }
          detail="Ventes payées dont le type de billet ne permet pas d’identifier une devise."
        />

      </section>


      <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">

        <SuperAdminPanel
          title="Évolution Business"
          subtitle={
            currency
              ? `Volume quotidien · ${currency}`
              : "Aucune devise dominante sur la période"
          }
        >

          <SuperAdminBusinessTrendChart
            data={
              data.dailySeries
            }
          />

        </SuperAdminPanel>


        <SuperAdminPanel
          title="Mix Business"
          subtitle={
            currency
              ? `Répartition · ${currency}`
              : "Aucun volume"
          }
        >

          <SuperAdminBarChart
            data={
              chart(
                breakdowns.sources,
              )
            }
          />

        </SuperAdminPanel>

      </div>


      <div className="grid gap-6 xl:grid-cols-2">

        <SuperAdminPanel
          title="Volumes par devise"
          subtitle="Les devises ne sont jamais additionnées entre elles"
        >

          <div className="space-y-4">

            {breakdowns.currencies.map(
              (item) => (

                <div
                  key={
                    item.currency
                  }
                  className="border-b border-[#272a31] pb-4 last:border-b-0"
                >

                  <div className="flex items-center justify-between gap-4">

                    <strong className="text-xs text-zinc-200">
                      {item.currency}
                    </strong>

                    <strong className="text-sm text-white">
                      {money(
                        item.total,
                        item.currency,
                      )}
                    </strong>

                  </div>


                  <div className="mt-3 grid grid-cols-3 gap-3 text-[10px] text-zinc-600">

                    <div>
                      <span className="block">
                        Marketplace
                      </span>

                      <strong className="mt-1 block text-zinc-400">
                        {money(
                          item.marketplace,
                          item.currency,
                        )}
                      </strong>
                    </div>


                    <div>
                      <span className="block">
                        Billetterie
                      </span>

                      <strong className="mt-1 block text-zinc-400">
                        {money(
                          item.ticketing,
                          item.currency,
                        )}
                      </strong>
                    </div>


                    <div>
                      <span className="block">
                        Sponsoring
                      </span>

                      <strong className="mt-1 block text-zinc-400">
                        {money(
                          item.sponsorship,
                          item.currency,
                        )}
                      </strong>
                    </div>

                  </div>

                </div>

              ),
            )}

            {!breakdowns.currencies.length && (
              <p className="py-6 text-center text-sm text-zinc-600">
                Aucun volume monétaire enregistré.
              </p>
            )}

          </div>

        </SuperAdminPanel>


        <SuperAdminPanel
          title="Plans d’abonnement actifs"
          subtitle="Volumes uniquement — aucun montant consolidé"
        >

          <SuperAdminBarChart
            data={
              chart(
                breakdowns.subscriptionPlans,
              )
            }
          />

        </SuperAdminPanel>

      </div>


      <div className="grid gap-6 xl:grid-cols-2">

        <SuperAdminPanel
          title="Top événements"
          subtitle={
            currency
              ? `Billetterie payée · ${currency}`
              : "Aucune recette billetterie"
          }
        >

          <div className="space-y-3">

            {breakdowns.topEvents.map(
              (
                item,
                index,
              ) => (

                <div
                  key={
                    item.id ??
                    `${item.label}-${index}`
                  }
                  className="flex items-center justify-between gap-4 border-b border-[#272a31] pb-3 last:border-b-0"
                >

                  <div className="min-w-0">

                    <p className="truncate text-xs font-bold text-zinc-200">
                      {item.label}
                    </p>

                    <p className="mt-1 text-[10px] text-zinc-600">
                      {formatNumber(
                        item.units ??
                          0,
                      )} billet(s)
                    </p>

                  </div>


                  <strong className="shrink-0 text-xs text-white">
                    {money(
                      item.amount ??
                        0,
                      currency,
                    )}
                  </strong>

                </div>

              ),
            )}

            {!breakdowns.topEvents.length && (
              <p className="py-6 text-center text-sm text-zinc-600">
                Aucun événement générateur de billetterie sur cette période.
              </p>
            )}

          </div>

        </SuperAdminPanel>


        <SuperAdminPanel
          title="Top sponsors"
          subtitle={
            currency
              ? `Contrats payés créés · ${currency}`
              : "Aucun sponsoring payé"
          }
        >

          <div className="space-y-3">

            {breakdowns.topSponsors.map(
              (
                item,
                index,
              ) => (

                <div
                  key={
                    item.id ??
                    `${item.label}-${index}`
                  }
                  className="flex items-center justify-between gap-4 border-b border-[#272a31] pb-3 last:border-b-0"
                >

                  <div className="min-w-0">

                    <p className="truncate text-xs font-bold text-zinc-200">
                      {item.label}
                    </p>

                    <p className="mt-1 text-[10px] text-zinc-600">
                      {formatNumber(
                        item.contracts ??
                          0,
                      )} contrat(s)
                    </p>

                  </div>


                  <strong className="shrink-0 text-xs text-white">
                    {money(
                      item.amount ??
                        0,
                      currency,
                    )}
                  </strong>

                </div>

              ),
            )}

            {!breakdowns.topSponsors.length && (
              <p className="py-6 text-center text-sm text-zinc-600">
                Aucun contrat sponsoring payé sur cette période.
              </p>
            )}

          </div>

        </SuperAdminPanel>

      </div>


      <div className="grid gap-6 xl:grid-cols-2">

        <SuperAdminPanel
          title="Ledger financier par source"
          subtitle="financial_payments — observatoire uniquement"
        >

          <div className="space-y-3">

            {breakdowns.financialSources.map(
              (
                item,
                index,
              ) => (

                <div
                  key={
                    `${item.label}-${item.currency}-${index}`
                  }
                  className="flex items-center justify-between gap-4 border-b border-[#272a31] pb-3 last:border-b-0"
                >

                  <div>

                    <p className="text-xs font-bold text-zinc-200">
                      {item.label}
                    </p>

                    <p className="mt-1 text-[10px] text-zinc-600">
                      {formatNumber(
                        item.value,
                      )} paiement(s)
                    </p>

                  </div>


                  <strong className="text-xs text-white">
                    {money(
                      item.amount ??
                        0,
                      item.currency ??
                        null,
                    )}
                  </strong>

                </div>

              ),
            )}

            {!breakdowns.financialSources.length && (
              <p className="py-6 text-center text-sm text-zinc-600">
                Aucun mouvement financier officiel sur cette période.
              </p>
            )}

          </div>

        </SuperAdminPanel>


        <SuperAdminPanel
          title="Statuts du ledger"
          subtitle="Répartition des financial_payments"
        >

          <SuperAdminBarChart
            data={
              chart(
                breakdowns.financialStatuses,
              )
            }
          />

        </SuperAdminPanel>

      </div>


      <div className="border border-[#30343c] bg-[#111318] p-5">

        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">
          Règles de lecture
        </p>

        <p className="mt-3 max-w-6xl text-xs leading-5 text-zinc-600">
          Le Volume Business n’est pas le revenu net d’Indesy. La Marketplace est comptabilisée en GMV payé, la billetterie en ventes payées et le sponsoring en valeur de contrats dont payment_status = paid. Le sponsoring ne possède pas encore de paid_at dans sponsor_contracts : sa période analytique repose donc sur created_at. Les abonnements ne sont pas intégrés au montant consolidé car subscriptions ne stocke actuellement ni devise ni date.
        </p>

      </div>

    </div>
  );
}
