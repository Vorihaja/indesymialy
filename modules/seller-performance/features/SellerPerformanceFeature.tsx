"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  Download,
  RefreshCw,
} from "lucide-react";

import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";

import {
  useSellerPerformance,
} from "../hooks/useSellerPerformance";

const box =
  "border border-[#303238] bg-[#141518]";

const input =
  "h-8 border border-[#343840] bg-[#0d0e10] px-2 text-[9px] text-zinc-100 outline-none focus:border-[#3983da]";

const button =
  "inline-flex h-8 items-center justify-center gap-1.5 border border-[#383c44] bg-[#191b1f] px-3 text-[9px] font-semibold text-zinc-200 hover:bg-[#202329]";

function isoStart(
  value: string,
) {
  return (
    new Date(
      value +
        "T00:00:00",
    ).toISOString()
  );
}

function isoEnd(
  value: string,
) {
  const date =
    new Date(
      value +
        "T00:00:00",
    );

  date.setDate(
    date.getDate() +
      1,
  );

  return date.toISOString();
}

function money(
  value: number,
  currency: string,
) {
  return (
    new Intl.NumberFormat(
      "fr-FR",
      {
        maximumFractionDigits:
          2,
      },
    ).format(value) +
    " " +
    (
      currency === "MGA"
        ? "Ar"
        : currency
    )
  );
}

export function SellerPerformanceFeature({
  tab,
}: {
  tab?: string;
}) {
  const today =
    useMemo(
      () =>
        new Date()
          .toISOString()
          .slice(
            0,
            10,
          ),
      [],
    );

  const startDefault =
    useMemo(
      () => {
        const value =
          new Date();

        value.setDate(
          value.getDate() -
            30,
        );

        return value
          .toISOString()
          .slice(
            0,
            10,
          );
      },
      [],
    );

  const [
    fromDate,
    setFromDate,
  ] =
    useState(
      startDefault,
    );

  const [
    toDate,
    setToDate,
  ] =
    useState(
      today,
    );

  const performance =
    useSellerPerformance(
      isoStart(
        fromDate,
      ),
      isoEnd(
        toDate,
      ),
    );

  const active =
    [
      "Produits",
      "Clients",
      "Conversion",
      "Rapports",
    ].includes(
      tab ?? "",
    )
      ? tab
      : "Ventes";

  if (performance.loading) {
    return (
      <IndesyDualOrbitLoader
        variant="section"
        label="Calcul des performances"
      />
    );
  }

  if (!performance.data) {
    return (
      <div className={`${box} p-5`}>
        <strong className="text-sm text-white">
          Performance indisponible
        </strong>

        <p className="mt-2 text-xs text-red-300">
          {performance.error ??
            "Impossible de charger les indicateurs."}
        </p>

        <button
          type="button"
          className={`${button} mt-4`}
          onClick={() =>
            void performance.refresh()
          }
        >
          <RefreshCw size={12} />
          Réessayer
        </button>
      </div>
    );
  }

  const data =
    performance.data;

  function downloadReport() {
    const rows = [
      [
        "type",
        "nom",
        "commandes",
        "unites",
        "devise",
        "montant",
      ],

      ...data.products.flatMap(
        (product) =>
          product.amounts.map(
            (amount) => [
              "produit",
              product.title,
              String(
                amount.orders,
              ),
              String(
                amount.units ??
                  product.units,
              ),
              amount.currency,
              String(
                amount.revenue,
              ),
            ],
          ),
      ),

      ...data.customersRanking.flatMap(
        (customer) =>
          customer.amounts.map(
            (amount) => [
              "client",
              customer.name,
              String(
                amount.orders,
              ),
              "",
              amount.currency,
              String(
                amount.revenue,
              ),
            ],
          ),
      ),
    ];

    const csv =
      rows
        .map(
          (row) =>
            row
              .map(
                (cell) =>
                  `"${cell.replaceAll(
                    '"',
                    '""',
                  )}"`,
              )
              .join(";"),
        )
        .join("\r\n");

    const blob =
      new Blob(
        [
          "\uFEFF",
          csv,
        ],
        {
          type:
            "text/csv;charset=utf-8",
        },
      );

    const url =
      URL.createObjectURL(
        blob,
      );

    const anchor =
      document.createElement(
        "a",
      );

    anchor.href =
      url;

    anchor.download =
      `performance-vendeur-${fromDate}-${toDate}.csv`;

    anchor.click();

    URL.revokeObjectURL(
      url,
    );
  }

  return (
    <div className="grid gap-3">
      <header className={`${box} flex flex-wrap items-end justify-between gap-3 p-3`}>
        <div>
          <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-zinc-600">
            Analytics vendeur
          </span>

          <h2 className="mt-1 text-[15px] font-semibold text-white">
            Performance · {active}
          </h2>

          <p className="mt-1 text-[9px] text-zinc-500">
            Calculée exclusivement depuis les commandes, lignes de commandes et paniers réels.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <label>
            <span className="mb-1 block text-[7px] uppercase text-zinc-600">
              Du
            </span>

            <input
              type="date"
              value={fromDate}
              max={toDate}
              onChange={(event) =>
                setFromDate(
                  event.target.value,
                )
              }
              className={input}
            />
          </label>

          <label>
            <span className="mb-1 block text-[7px] uppercase text-zinc-600">
              Au
            </span>

            <input
              type="date"
              value={toDate}
              min={fromDate}
              onChange={(event) =>
                setToDate(
                  event.target.value,
                )
              }
              className={input}
            />
          </label>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-px border border-[#303238] bg-[#303238] lg:grid-cols-6">
        {[
          [
            "COMMANDES",
            data.orders,
          ],
          [
            "PAYÉES",
            data.paidOrders,
          ],
          [
            "CLIENTS",
            data.customers,
          ],
          [
            "RÉCURRENTS",
            data.repeatCustomers,
          ],
          [
            "PANIERS",
            data.carts,
          ],
          [
            "CONVERSION",
            `${data.conversionRate.toFixed(2)} %`,
          ],
        ].map(
          ([label, value]) => (
            <div
              key={String(label)}
              className="bg-[#151619] p-3"
            >
              <span className="text-[7px] font-bold tracking-[0.12em] text-zinc-600">
                {label}
              </span>

              <strong className="mt-1 block text-xl text-white">
                {value}
              </strong>
            </div>
          ),
        )}
      </div>

      {active === "Ventes" && (
        <section className={box}>
          <header className="border-b border-[#303238] p-3">
            <strong className="text-[11px] text-white">
              Ventes payées par devise
            </strong>
          </header>

          <div className="grid gap-px bg-[#303238] md:grid-cols-2 xl:grid-cols-3">
            {data.currencies.map(
              (currency) => (
                <div
                  key={currency.currency}
                  className="bg-[#151619] p-4"
                >
                  <span className="text-[8px] font-bold text-zinc-600">
                    {currency.currency}
                  </span>

                  <strong className="mt-2 block text-lg text-white">
                    {money(
                      currency.total,
                      currency.currency,
                    )}
                  </strong>

                  <p className="mt-1 text-[9px] text-zinc-500">
                    {currency.orders} commandes · panier moyen{" "}
                    {money(
                      currency.averageOrder,
                      currency.currency,
                    )}
                  </p>
                </div>
              ),
            )}

            {!data.currencies.length && (
              <div className="bg-[#151619] p-8 text-center text-[10px] text-zinc-600">
                Aucune vente payée sur cette période.
              </div>
            )}
          </div>
        </section>
      )}

      {active === "Produits" && (
        <section className={box}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left">
              <thead className="bg-[#1a1c20] text-[7px] uppercase text-zinc-600">
                <tr>
                  <th className="h-9 px-3">
                    Produit
                  </th>

                  <th className="px-3">
                    Commandes
                  </th>

                  <th className="px-3">
                    Unités
                  </th>

                  <th className="px-3">
                    Revenus
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.products.map(
                  (product) => (
                    <tr
                      key={product.productId}
                      className="border-t border-[#292c31] text-[9px] text-zinc-300"
                    >
                      <td className="px-3 py-2.5 font-semibold text-white">
                        {product.title}
                      </td>

                      <td className="px-3">
                        {product.orders}
                      </td>

                      <td className="px-3">
                        {product.units}
                      </td>

                      <td className="px-3">
                        <div className="grid">
                          {product.amounts.map(
                            (amount) => (
                              <span
                                key={amount.currency}
                              >
                                {money(
                                  amount.revenue,
                                  amount.currency,
                                )}
                              </span>
                            ),
                          )}
                        </div>
                      </td>
                    </tr>
                  ),
                )}

                {!data.products.length && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-8 text-center text-[10px] text-zinc-600"
                    >
                      Aucun produit vendu sur cette période.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {active === "Clients" && (
        <section className={box}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead className="bg-[#1a1c20] text-[7px] uppercase text-zinc-600">
                <tr>
                  <th className="h-9 px-3">
                    Client
                  </th>

                  <th className="px-3">
                    Commandes payées
                  </th>

                  <th className="px-3">
                    Montants
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.customersRanking.map(
                  (customer) => (
                    <tr
                      key={customer.customerId}
                      className="border-t border-[#292c31] text-[9px] text-zinc-300"
                    >
                      <td className="px-3 py-2.5 font-semibold text-white">
                        {customer.name}
                      </td>

                      <td className="px-3">
                        {customer.orders}
                      </td>

                      <td className="px-3">
                        <div className="grid">
                          {customer.amounts.map(
                            (amount) => (
                              <span
                                key={amount.currency}
                              >
                                {money(
                                  amount.revenue,
                                  amount.currency,
                                )}
                              </span>
                            ),
                          )}
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {active === "Conversion" && (
        <section className={`${box} p-4`}>
          <strong className="text-[12px] text-white">
            Conversion panier → commande
          </strong>

          <p className="mt-2 max-w-3xl text-[9px] leading-5 text-zinc-500">
            Cet indicateur ne prétend pas mesurer les visites Marketplace.
            Il compare uniquement les paniers contenant des produits du vendeur aux paniers convertis en commande.
          </p>

          <div className="mt-4 grid gap-px border border-[#303238] bg-[#303238] sm:grid-cols-4">
            {[
              [
                "Paniers",
                data.carts,
              ],
              [
                "Convertis",
                data.convertedCarts,
              ],
              [
                "Abandonnés",
                data.abandonedCarts,
              ],
              [
                "Taux",
                `${data.conversionRate.toFixed(2)} %`,
              ],
            ].map(
              ([label, value]) => (
                <div
                  key={String(label)}
                  className="bg-[#151619] p-4"
                >
                  <span className="text-[7px] text-zinc-600">
                    {label}
                  </span>

                  <strong className="mt-1 block text-xl text-white">
                    {value}
                  </strong>
                </div>
              ),
            )}
          </div>
        </section>
      )}

      {active === "Rapports" && (
        <section className={`${box} p-4`}>
          <strong className="text-[12px] text-white">
            Rapport de performance
          </strong>

          <p className="mt-2 text-[9px] text-zinc-500">
            Export CSV des données réelles de la période sélectionnée.
            Aucun rapport fictif n’est stocké en base.
          </p>

          <button
            type="button"
            className={`${button} mt-4`}
            onClick={downloadReport}
          >
            <Download size={12} />
            Exporter CSV
          </button>
        </section>
      )}
    </div>
  );
}