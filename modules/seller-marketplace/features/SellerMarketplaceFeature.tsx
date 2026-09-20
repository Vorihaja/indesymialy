"use client";

import Link from "next/link";

import {
  ArrowRight,
  Boxes,
  CreditCard,
  ExternalLink,
  Package,
  RefreshCw,
  ShoppingCart,
  Truck,
  Users,
  WalletCards,
  Warehouse,
} from "lucide-react";

import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";

import {
  useSellerMarketplace,
} from "../hooks/useSellerMarketplace";

/*
 * MARKETPLACE_COCKPIT_READ_ONLY
 * MULTI_CURRENCY_SAFE
 * CROSS_CURRENCY_SUM_FALSE
 * AUTHORITY_PERFORMANCE=marketplace_seller_performance_snapshot
 * AUTHORITY_LEDGER=marketplace_seller_revenue_snapshot
 */

function money(
  amount: number,
  currency: string,
) {
  try {
    return new Intl.NumberFormat(
      "fr-FR",
      {
        style: "currency",
        currency,
        maximumFractionDigits:
          currency === "MGA"
            ? 0
            : 2,
      },
    ).format(
      amount,
    );
  }
  catch {
    return `${amount.toLocaleString("fr-FR")} ${currency}`;
  }
}

function integer(
  value: number,
) {
  return new Intl.NumberFormat(
    "fr-FR",
    {
      maximumFractionDigits: 0,
    },
  ).format(
    value,
  );
}

const quickLinks = [
  {
    label: "Catalogue",
    detail:
      "Produits, catégories, variantes, médias et tarifs",
    href:
      "/dashboard/vendeur/products",
    icon:
      Package,
  },
  {
    label: "Commandes",
    detail:
      "Préparation et cycle commercial",
    href:
      "/dashboard/vendeur/orders",
    icon:
      ShoppingCart,
  },
  {
    label: "Stock",
    detail:
      "Inventaire, mouvements et alertes",
    href:
      "/dashboard/vendeur/inventory",
    icon:
      Warehouse,
  },
  {
    label: "Clients",
    detail:
      "CRM, fidélité, segments et litiges",
    href:
      "/dashboard/vendeur/customers",
    icon:
      Users,
  },
  {
    label: "Livraison",
    detail:
      "Expéditions, transporteurs, zones et retours",
    href:
      "/dashboard/vendeur/delivery",
    icon:
      Truck,
  },
  {
    label: "Promotions",
    detail:
      "Campagnes, codes, bundles et partenariats",
    href:
      "/dashboard/vendeur/promotions",
    icon:
      Boxes,
  },
  {
    label: "Finances",
    detail:
      "Revenus, transactions et ledger",
    href:
      "/dashboard/vendeur/finance",
    icon:
      WalletCards,
  },
  {
    label: "Performance",
    detail:
      "Ventes, produits, clients et conversion",
    href:
      "/dashboard/vendeur/performance",
    icon:
      CreditCard,
  },
] as const;

export function SellerMarketplaceFeature() {
  const marketplace =
    useSellerMarketplace(
      30,
    );

  if (
    marketplace.loading
  ) {
    return (
      <div className="min-h-[480px]">
        <IndesyDualOrbitLoader
          variant="data"
          label="Chargement du cockpit Marketplace"
        />
      </div>
    );
  }

  if (
    !marketplace.data
  ) {
    return (
      <section className="grid min-h-[360px] place-items-center border border-[#303238] bg-[#111214] p-6 text-center">
        <div className="max-w-lg">
          <ShoppingCart
            size={26}
            className="mx-auto text-zinc-700"
          />

          <h2 className="mt-4 text-sm font-black text-white">
            Cockpit Marketplace indisponible
          </h2>

          <p className="mt-2 text-[10px] leading-5 text-zinc-500">
            {marketplace.error ??
              "Les données Marketplace n’ont pas pu être chargées."}
          </p>

          <button
            type="button"
            onClick={() =>
              void marketplace.refresh()
            }
            className="mt-5 inline-flex h-8 items-center gap-2 border border-[#303238] px-3 text-[9px] font-semibold text-zinc-300 hover:border-[#3d92ff] hover:text-white"
          >
            <RefreshCw
              size={11}
            />
            Réessayer
          </button>
        </div>
      </section>
    );
  }

  const {
    performance,
    ledger,
  } =
    marketplace.data;

  const topProducts =
    performance.products.slice(
      0,
      5,
    );

  const topCustomers =
    performance.customersRanking.slice(
      0,
      5,
    );

  return (
    <div
      className="grid gap-4 text-zinc-100"
      data-marketplace-contract="MULTI_CURRENCY_SAFE"
    >
      <header className="border border-[#303238] bg-[#111214]">
        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#ed1b2f]">
              Cockpit commercial
            </p>

            <h1 className="mt-2 text-xl font-black text-white">
              Marketplace
            </h1>

            <p className="mt-2 max-w-3xl text-[10px] leading-5 text-zinc-500">
              Vue transversale des opérations Marketplace de votre organisation.
              Chaque donnée reste pilotée par son module d’autorité.
            </p>

            <p className="mt-2 text-[8px] text-zinc-700">
              30 derniers jours · les montants restent séparés par devise.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void marketplace.refresh()
              }
              className="inline-flex h-8 items-center gap-2 border border-[#303238] px-3 text-[9px] font-semibold text-zinc-400 hover:border-[#3d92ff] hover:text-white"
            >
              <RefreshCw
                size={11}
              />
              Actualiser
            </button>

            <Link
              href="/marketplace"
              className="inline-flex h-8 items-center gap-2 border border-[#3d92ff]/40 px-3 text-[9px] font-semibold text-[#61a5ff] hover:bg-[#3d92ff]/5"
            >
              <ExternalLink
                size={11}
              />
              Marketplace publique
            </Link>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-px border border-[#303238] bg-[#303238] lg:grid-cols-6">
        {[
          [
            "COMMANDES",
            integer(
              performance.orders,
            ),
          ],
          [
            "PAYÉES",
            integer(
              performance.paidOrders,
            ),
          ],
          [
            "CLIENTS",
            integer(
              performance.customers,
            ),
          ],
          [
            "RÉCURRENTS",
            integer(
              performance.repeatCustomers,
            ),
          ],
          [
            "PANIERS",
            integer(
              performance.carts,
            ),
          ],
          [
            "CONVERSION",
            `${performance.conversionRate.toFixed(2)} %`,
          ],
        ].map(
          (
            [
              label,
              value,
            ],
          ) => (
            <article
              key={
                String(
                  label,
                )
              }
              className="bg-[#111214] p-4"
            >
              <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                {label}
              </p>

              <strong className="mt-2 block text-lg font-black text-white">
                {value}
              </strong>
            </article>
          ),
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="border border-[#303238] bg-[#111214]">
          <header className="border-b border-[#303238] px-4 py-3">
            <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500">
              Volume commercial
            </p>

            <p className="mt-1 text-[8px] text-zinc-700">
              Commandes ventilées par devise.
            </p>
          </header>

          <div className="divide-y divide-[#292c31]">
            {performance.currencies.map(
              (
                currency,
              ) => (
                <div
                  key={
                    currency.currency
                  }
                  className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3"
                >
                  <div>
                    <strong className="text-[11px] text-white">
                      {currency.currency}
                    </strong>

                    <p className="mt-1 text-[8px] text-zinc-600">
                      {integer(
                        currency.orders,
                      )} commandes · panier moyen{" "}
                      {money(
                        currency.averageOrder,
                        currency.currency,
                      )}
                    </p>
                  </div>

                  <strong className="text-right text-[11px] text-zinc-200">
                    {money(
                      currency.total,
                      currency.currency,
                    )}
                  </strong>
                </div>
              ),
            )}

            {!performance.currencies.length ? (
              <div className="p-8 text-center text-[9px] text-zinc-600">
                Aucun volume commercial sur la période.
              </div>
            ) : null}
          </div>
        </article>

        <article className="border border-[#303238] bg-[#111214]">
          <header className="border-b border-[#303238] px-4 py-3">
            <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500">
              Ledger Marketplace
            </p>

            <p className="mt-1 text-[8px] text-zinc-700">
              Écritures issues de financial_entries, séparées par devise.
            </p>
          </header>

          <div className="divide-y divide-[#292c31]">
            {ledger.currencies.map(
              (
                currency,
              ) => (
                <div
                  key={
                    currency.currency
                  }
                  className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3"
                >
                  <div>
                    <strong className="text-[11px] text-white">
                      {currency.currency}
                    </strong>

                    <p className="mt-1 text-[8px] text-zinc-600">
                      Revenus{" "}
                      {money(
                        currency.revenue,
                        currency.currency,
                      )} · sorties{" "}
                      {money(
                        currency.expense,
                        currency.currency,
                      )}
                    </p>
                  </div>

                  <strong
                    className={
                      currency.net >= 0
                        ? "text-right text-[11px] text-emerald-400"
                        : "text-right text-[11px] text-red-400"
                    }
                  >
                    {money(
                      currency.net,
                      currency.currency,
                    )}
                  </strong>
                </div>
              ),
            )}

            {!ledger.currencies.length ? (
              <div className="p-8 text-center text-[9px] text-zinc-600">
                Aucune écriture financière Marketplace.
              </div>
            ) : null}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="border border-[#303238] bg-[#111214]">
          <header className="border-b border-[#303238] px-4 py-3">
            <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500">
              Produits les plus actifs
            </p>
          </header>

          <div className="divide-y divide-[#292c31]">
            {topProducts.map(
              (
                product,
              ) => (
                <div
                  key={
                    product.productId
                  }
                  className="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_auto]"
                >
                  <div>
                    <strong className="text-[9px] text-white">
                      {product.title}
                    </strong>

                    <p className="mt-1 text-[8px] text-zinc-600">
                      {integer(
                        product.orders,
                      )} commandes ·{" "}
                      {integer(
                        product.units,
                      )} unités
                    </p>
                  </div>

                  <div className="grid text-right text-[8px] text-zinc-400">
                    {product.amounts.map(
                      (
                        amount,
                      ) => (
                        <span
                          key={
                            amount.currency
                          }
                        >
                          {money(
                            amount.revenue,
                            amount.currency,
                          )}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              ),
            )}

            {!topProducts.length ? (
              <div className="p-8 text-center text-[9px] text-zinc-600">
                Aucun produit vendu sur la période.
              </div>
            ) : null}
          </div>
        </article>

        <article className="border border-[#303238] bg-[#111214]">
          <header className="border-b border-[#303238] px-4 py-3">
            <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500">
              Clients les plus actifs
            </p>
          </header>

          <div className="divide-y divide-[#292c31]">
            {topCustomers.map(
              (
                customer,
              ) => (
                <div
                  key={
                    customer.customerId
                  }
                  className="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_auto]"
                >
                  <div>
                    <strong className="text-[9px] text-white">
                      {customer.name}
                    </strong>

                    <p className="mt-1 text-[8px] text-zinc-600">
                      {integer(
                        customer.orders,
                      )} commandes
                    </p>
                  </div>

                  <div className="grid text-right text-[8px] text-zinc-400">
                    {customer.amounts.map(
                      (
                        amount,
                      ) => (
                        <span
                          key={
                            amount.currency
                          }
                        >
                          {money(
                            amount.revenue,
                            amount.currency,
                          )}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              ),
            )}

            {!topCustomers.length ? (
              <div className="p-8 text-center text-[9px] text-zinc-600">
                Aucun client actif sur la période.
              </div>
            ) : null}
          </div>
        </article>
      </section>

      <section className="border border-[#303238] bg-[#111214]">
        <header className="border-b border-[#303238] px-4 py-3">
          <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500">
            Conversion des paniers
          </p>
        </header>

        <div className="grid grid-cols-2 gap-px bg-[#292c31] md:grid-cols-4">
          {[
            [
              "Paniers",
              integer(
                performance.carts,
              ),
            ],
            [
              "Convertis",
              integer(
                performance.convertedCarts,
              ),
            ],
            [
              "Abandonnés",
              integer(
                performance.abandonedCarts,
              ),
            ],
            [
              "Taux",
              `${performance.conversionRate.toFixed(2)} %`,
            ],
          ].map(
          (
            [
              label,
              value,
            ],
          ) => (
              <article
                key={
                  label
                }
                className="bg-[#111214] p-4"
              >
                <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  {label}
                </p>

                <strong className="mt-2 block text-lg text-white">
                  {value}
                </strong>
              </article>
            ),
          )}
        </div>
      </section>

      <section className="border border-[#303238] bg-[#111214]">
        <header className="border-b border-[#303238] px-4 py-3">
          <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500">
            Dernières écritures Marketplace
          </p>
        </header>

        <div className="divide-y divide-[#292c31]">
          {ledger.entries.map(
            (
              entry,
            ) => (
              <div
                key={
                  entry.id
                }
                className="grid gap-2 px-4 py-3 md:grid-cols-[1fr_auto]"
              >
                <div>
                  <strong className="text-[9px] text-zinc-200">
                    {entry.description}
                  </strong>

                  <p className="mt-1 text-[8px] text-zinc-600">
                    {entry.occurredAt
                      ? new Date(
                          entry.occurredAt,
                        ).toLocaleString(
                          "fr-FR",
                        )
                      : "Date indisponible"}

                    {entry.orderId
                      ? ` · commande ${entry.orderId.slice(0, 8)}`
                      : ""}
                  </p>
                </div>

                <strong
                  className={
                    entry.entryType ===
                    "expense"
                      ? "text-[10px] text-red-400"
                      : "text-[10px] text-emerald-400"
                  }
                >
                  {entry.entryType ===
                  "expense"
                    ? "− "
                    : "+ "}

                  {money(
                    entry.amount,
                    entry.currency,
                  )}
                </strong>
              </div>
            ),
          )}

          {!ledger.entries.length ? (
            <div className="p-8 text-center text-[9px] text-zinc-600">
              Aucune écriture récente.
            </div>
          ) : null}
        </div>
      </section>

      <section className="border border-[#303238] bg-[#111214]">
        <header className="border-b border-[#303238] px-4 py-3">
          <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500">
            Piloter la Marketplace
          </p>

          <p className="mt-1 text-[8px] text-zinc-700">
            Les actions restent dans leurs modules métiers respectifs.
          </p>
        </header>

        <div className="grid md:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map(
            (
              item,
            ) => {
              const Icon =
                item.icon;

              return (
                <Link
                  key={
                    item.label
                  }
                  href={
                    item.href
                  }
                  className="group border-b border-r border-[#292c31] p-4 hover:bg-[#151619]"
                >
                  <div className="flex items-start justify-between">
                    <span className="grid size-8 place-items-center border border-[#303238] bg-[#151619] text-zinc-500 group-hover:text-[#61a5ff]">
                      <Icon
                        size={13}
                      />
                    </span>

                    <ArrowRight
                      size={12}
                      className="text-zinc-700 group-hover:text-white"
                    />
                  </div>

                  <strong className="mt-4 block text-[10px] text-white">
                    {item.label}
                  </strong>

                  <p className="mt-1 text-[8px] leading-4 text-zinc-600">
                    {item.detail}
                  </p>
                </Link>
              );
            },
          )}
        </div>
      </section>

      <footer className="flex flex-wrap justify-between gap-2 border border-[#303238] bg-[#0d0f12] px-4 py-3 text-[8px] text-zinc-700">
        <span>
          Lecture seule · aucune autorité Marketplace dupliquée
        </span>

        <span>
          Actualisé le{" "}
          {new Date(
            marketplace.data.generatedAt,
          ).toLocaleString(
            "fr-FR",
          )}
        </span>
      </footer>
    </div>
  );
}