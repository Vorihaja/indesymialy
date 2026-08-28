"use client";

import {
  SuperAdminBarChart,
} from "../components/SuperAdminCharts";

import {
  SuperAdminKpiCard,
} from "../components/SuperAdminKpiCard";

import {
  SuperAdminMarketplaceTrendChart,
} from "../components/SuperAdminMarketplaceTrendChart";

import {
  SuperAdminErrorState,
  SuperAdminLoadingState,
  SuperAdminPanel,
} from "../components/SuperAdminStates";

import {
  formatNumber,
  formatPercent,
} from "../components/formatters";

import {
  useSuperAdminMarketplaceAnalytics,
} from "../hooks/useSuperAdminMarketplaceAnalytics";

function formatMarketplaceMoney(
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

function toChartData(
  values: {
    label: string;
    value: number;
  }[],
) {
  return values.map(
    (value) => ({
      label:
        value.label,

      value:
        value.value,
    }),
  );
}

export function SuperAdminMarketplaceFeature() {

  const {
    data,
    loading,
    error,
  } =
    useSuperAdminMarketplaceAnalytics();

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
          "Analytics Marketplace indisponibles."
        }
      />
    );
  }

  const {
    headline,
    funnel,
    commerce,
    breakdowns,
  } = data;

  const currency =
    headline.primaryCurrency;

  return (
    <div className="space-y-6">

      <header>

        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2588ff]">
          Indesy Bazar Analytics
        </p>

        <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
          Marketplace
        </h1>

        <p className="mt-2 max-w-4xl text-sm text-zinc-500">
          Performance commerciale consolidée à partir des commandes, paiements, produits, locations, stocks et vendeurs réels.
        </p>

      </header>


      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

        <SuperAdminKpiCard
          label="GMV Marketplace"
          value={
            formatMarketplaceMoney(
              headline.gmv,
              currency,
            )
          }
          detail="Somme des sous-totaux des commandes payées dans la devise principale."
          trend={
            headline.gmvGrowth
          }
        />


        <SuperAdminKpiCard
          label="Commandes"
          value={
            formatNumber(
              headline.orders,
            )
          }
          detail={`${formatNumber(
            headline.paidOrders,
          )} payées`}
          trend={
            headline.ordersGrowth
          }
        />


        <SuperAdminKpiCard
          label="Panier moyen"
          value={
            formatMarketplaceMoney(
              headline.averageOrderValue,
              currency,
            )
          }
          detail="Total moyen des commandes payées."
        />


        <SuperAdminKpiCard
          label="Taux de paiement"
          value={
            formatPercent(
              headline.paymentSuccessRate,
            )
          }
          detail="Commandes payées / commandes créées."
        />


        <SuperAdminKpiCard
          label="Acheteurs"
          value={
            formatNumber(
              headline.buyers,
            )
          }
          detail={`Repeat buyers : ${formatPercent(
            headline.repeatBuyerRate,
          )}`}
        />


        <SuperAdminKpiCard
          label="Vendeurs actifs"
          value={
            formatNumber(
              headline.sellers,
            )
          }
          detail="Organisations ayant au moins une commande payée."
        />


        <SuperAdminKpiCard
          label="Produits publiés"
          value={
            formatNumber(
              headline.publishedProducts,
            )
          }
          detail={`${formatNumber(
            headline.productsAdded,
          )} ajoutés sur la période`}
        />


        <SuperAdminKpiCard
          label="Stock faible"
          value={
            formatNumber(
              headline.lowStock,
            )
          }
          detail={`${formatNumber(
            headline.outOfStock,
          )} rupture(s)`}
        />

      </section>


      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">

        <SuperAdminPanel
          title="Évolution Marketplace"
          subtitle="Commandes et GMV quotidiens"
        >

          <SuperAdminMarketplaceTrendChart
            data={
              data.dailySeries
            }
          />

        </SuperAdminPanel>


        <SuperAdminPanel
          title="Statuts des commandes"
          subtitle="Commandes créées sur la période"
        >

          <SuperAdminBarChart
            data={
              toChartData(
                breakdowns.orderStatuses,
              )
            }
          />

        </SuperAdminPanel>

      </div>


      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

        <SuperAdminKpiCard
          label="Paniers créés"
          value={
            formatNumber(
              funnel.cartsCreated,
            )
          }
        />


        <SuperAdminKpiCard
          label="Checkouts"
          value={
            formatNumber(
              funnel.checkoutGroups,
            )
          }
          detail={`Checkout / paniers : ${formatPercent(
            funnel.checkoutRate,
          )}`}
        />


        <SuperAdminKpiCard
          label="Unités vendues"
          value={
            formatNumber(
              commerce.saleUnits,
            )
          }
        />


        <SuperAdminKpiCard
          label="Unités louées"
          value={
            formatNumber(
              commerce.rentalUnits,
            )
          }
        />


        <SuperAdminKpiCard
          label="Locations actives"
          value={
            formatNumber(
              commerce.activeRentals,
            )
          }
          detail={`${formatNumber(
            commerce.returnedRentals,
          )} restituées sur la période`}
        />


        <SuperAdminKpiCard
          label="Livraisons terminées"
          value={
            formatPercent(
              commerce.deliveryCompletionRate,
            )
          }
        />


        <SuperAdminKpiCard
          label="Unités disponibles"
          value={
            formatNumber(
              commerce.availableUnits,
            )
          }
          detail={`${formatNumber(
            commerce.reservedUnits,
          )} réservées`}
        />


        <SuperAdminKpiCard
          label="Frais enregistrés"
          value={
            formatMarketplaceMoney(
              commerce.fees,
              currency,
            )
          }
          detail="Frais associés aux commandes payées."
        />

      </section>


      <div className="grid gap-6 xl:grid-cols-2">

        <SuperAdminPanel
          title="Types d’offres"
          subtitle="Produits actuellement publiés"
        >

          <SuperAdminBarChart
            data={
              toChartData(
                breakdowns.listingTypes,
              )
            }
          />

        </SuperAdminPanel>


        <SuperAdminPanel
          title="Catégories"
          subtitle="Produits publiés par catégorie"
        >

          <SuperAdminBarChart
            data={
              toChartData(
                breakdowns.categories,
              )
            }
            limit={12}
          />

        </SuperAdminPanel>


        <SuperAdminPanel
          title="Méthodes de paiement"
          subtitle="Tentatives de paiement sur la période"
        >

          <SuperAdminBarChart
            data={
              toChartData(
                breakdowns.paymentMethods,
              )
            }
          />

        </SuperAdminPanel>


        <SuperAdminPanel
          title="Statuts de paiement"
        >

          <SuperAdminBarChart
            data={
              toChartData(
                breakdowns.paymentStatuses,
              )
            }
          />

        </SuperAdminPanel>

      </div>


      <div className="grid gap-6 xl:grid-cols-2">

        <SuperAdminPanel
          title="Top vendeurs"
          subtitle={
            currency
              ? `GMV payé · ${currency}`
              : "Aucune devise active sur la période"
          }
        >

          <div className="space-y-3">

            {breakdowns.topSellers.map(
              (
                seller,
                index,
              ) => (

                <div
                  key={
                    seller.id ??
                    `${seller.label}-${index}`
                  }
                  className="flex items-center justify-between gap-4 border-b border-[#24272e] pb-3 last:border-b-0"
                >

                  <div className="min-w-0">

                    <p className="truncate text-xs font-bold text-zinc-200">
                      {seller.label}
                    </p>

                    <p className="mt-1 text-[10px] text-zinc-600">
                      {formatNumber(
                        seller.orders ??
                          0,
                      )} commande(s)
                    </p>

                  </div>

                  <strong className="shrink-0 text-xs text-white">
                    {formatMarketplaceMoney(
                      seller.amount ??
                        0,
                      currency,
                    )}
                  </strong>

                </div>

              ),
            )}

            {!breakdowns.topSellers.length && (
              <p className="py-6 text-center text-sm text-zinc-600">
                Aucun vendeur actif sur cette période.
              </p>
            )}

          </div>

        </SuperAdminPanel>


        <SuperAdminPanel
          title="Top produits"
          subtitle={
            currency
              ? `Volume payé · ${currency}`
              : "Aucune vente payée sur la période"
          }
        >

          <div className="space-y-3">

            {breakdowns.topProducts.map(
              (
                product,
                index,
              ) => (

                <div
                  key={
                    product.id ??
                    `${product.label}-${index}`
                  }
                  className="flex items-center justify-between gap-4 border-b border-[#24272e] pb-3 last:border-b-0"
                >

                  <div className="min-w-0">

                    <p className="truncate text-xs font-bold text-zinc-200">
                      {product.label}
                    </p>

                    <p className="mt-1 text-[10px] text-zinc-600">
                      {formatNumber(
                        product.units ??
                          0,
                      )} unité(s)
                    </p>

                  </div>

                  <strong className="shrink-0 text-xs text-white">
                    {formatMarketplaceMoney(
                      product.amount ??
                        0,
                      currency,
                    )}
                  </strong>

                </div>

              ),
            )}

            {!breakdowns.topProducts.length && (
              <p className="py-6 text-center text-sm text-zinc-600">
                Aucun produit vendu sur cette période.
              </p>
            )}

          </div>

        </SuperAdminPanel>

      </div>


      <div className="grid gap-6 xl:grid-cols-2">

        <SuperAdminPanel
          title="Devises"
          subtitle="GMV payé par devise"
        >

          <div className="space-y-3">

            {breakdowns.currencies.map(
              (item) => (

                <div
                  key={
                    item.currency
                  }
                  className="flex items-center justify-between gap-4 border-b border-[#24272e] pb-3 last:border-b-0"
                >

                  <div>

                    <p className="text-xs font-black text-zinc-200">
                      {item.currency}
                    </p>

                    <p className="mt-1 text-[10px] text-zinc-600">
                      {formatNumber(
                        item.orders,
                      )} commande(s) payée(s)
                    </p>

                  </div>

                  <strong className="text-xs text-white">
                    {formatMarketplaceMoney(
                      item.gmv,
                      item.currency,
                    )}
                  </strong>

                </div>

              ),
            )}

            {!breakdowns.currencies.length && (
              <p className="py-6 text-center text-sm text-zinc-600">
                Aucun GMV enregistré.
              </p>
            )}

          </div>

        </SuperAdminPanel>


        <SuperAdminPanel
          title="Transactions Marketplace"
          subtitle="Type et devise conservés séparément"
        >

          <div className="space-y-3">

            {breakdowns.transactionTypes.map(
              (
                transaction,
                index,
              ) => (

                <div
                  key={
                    `${transaction.label}-${index}`
                  }
                  className="flex items-center justify-between gap-4 border-b border-[#24272e] pb-3 last:border-b-0"
                >

                  <div>

                    <p className="text-xs font-bold text-zinc-200">
                      {transaction.label}
                    </p>

                    <p className="mt-1 text-[10px] text-zinc-600">
                      {formatNumber(
                        transaction.value,
                      )} transaction(s)
                    </p>

                  </div>

                  <strong className="text-xs text-white">
                    {formatMarketplaceMoney(
                      transaction.amount ??
                        0,
                      transaction.currency ??
                        null,
                    )}
                  </strong>

                </div>

              ),
            )}

          </div>

        </SuperAdminPanel>

      </div>


      <div className="border border-[#272a31] bg-[#111318] p-5">

        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">
          Définitions
        </p>

        <p className="mt-3 max-w-5xl text-xs leading-5 text-zinc-600">
          Le GMV correspond au sous-total des commandes dont payment_status = paid. Les frais de commande sont suivis séparément. Les devises ne sont jamais additionnées entre elles : le KPI principal utilise la devise représentant le plus grand GMV de la période.
        </p>

      </div>

    </div>
  );
}
