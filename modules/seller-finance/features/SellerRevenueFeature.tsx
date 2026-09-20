"use client";

import Link from "next/link";

import {
  useMemo,
  useState,
} from "react";

import {
  RefreshCw,
  Search,
} from "lucide-react";

import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";

import {
  useSellerRevenue,
} from "../hooks/useSellerFinance";

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
    ).format(amount);
  }
  catch {
    return `${amount.toLocaleString("fr-FR")} ${currency}`;
  }
}

function methodLabel(
  value: string | null,
) {
  switch (value) {
    case "cash":
      return "À la remise";

    case "mobile_money":
      return "Mobile Money";

    case "card":
      return "Carte";

    case "bank_transfer":
      return "Virement";

    default:
      return "—";
  }
}

function shortId(
  value: string,
) {
  return value.length > 10
    ? value.slice(0, 8)
    : value;
}

export function SellerRevenueFeature() {
  const revenue =
    useSellerRevenue();

  const [
    search,
    setSearch,
  ] =
    useState("");

  const filtered =
    useMemo(
      () => {
        const entries =
          revenue.data?.entries ??
          [];

        const needle =
          search
            .trim()
            .toLocaleLowerCase(
              "fr",
            );

        if (!needle) {
          return entries;
        }

        return entries.filter(
          (entry) =>
            [
              entry.description,
              entry.reference ??
                "",
              entry.providerReference ??
                "",
              entry.orderId ??
                "",
              entry.paymentMethod ??
                "",
            ]
              .join(" ")
              .toLocaleLowerCase(
                "fr",
              )
              .includes(
                needle,
              ),
        );
      },
      [
        revenue.data?.entries,
        search,
      ],
    );

  if (
    revenue.loading ||
    revenue.data === null
  ) {
    return (
      <div className="min-h-[420px]">
        <IndesyDualOrbitLoader
          variant="data"
          label="Chargement des revenus"
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4 text-zinc-100">
      <header className="flex flex-col gap-3 border-b border-[#303238] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#3d92ff]">
            Comptabilité vendeur
          </p>

          <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.035em] text-white">
            Revenus
          </h1>

          <p className="mt-1 max-w-3xl text-[9px] leading-5 text-zinc-600">
            Revenus Marketplace réellement comptabilisés dans le ledger financier.
          </p>
        </div>

        <button
          type="button"
          onClick={
            () =>
              void revenue
                .refresh()
                .catch(
                  () => undefined,
                )
          }
          className="inline-flex h-8 items-center gap-1.5 border border-[#303238] bg-[#151619] px-3 text-[8px] font-semibold text-zinc-400 hover:border-[#3d92ff]/50 hover:text-white"
        >
          <RefreshCw
            size={11}
          />

          Actualiser
        </button>
      </header>

      {revenue.error ? (
        <div
          role="alert"
          className="border border-blue-500/30 bg-blue-500/5 px-3 py-2 text-[9px] text-blue-400"
        >
          {revenue.error}
        </div>
      ) : null}

      {revenue.data.currencies.length ? (
        <section className="grid gap-3">
          {revenue.data.currencies.map(
            (summary) => (
              <article
                key={summary.currency}
                className="border border-[#303238] bg-[#111214]"
              >
                <header className="flex items-center justify-between border-b border-[#303238] px-4 py-3">
                  <div>
                    <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                      Devise
                    </p>

                    <strong className="mt-1 block text-[12px] text-white">
                      {summary.currency}
                    </strong>
                  </div>

                  <span className="text-[8px] text-zinc-600">
                    Ledger Marketplace
                  </span>
                </header>

                <div className="grid sm:grid-cols-3">
                  <div className="border-b border-[#303238] p-4 sm:border-b-0 sm:border-r">
                    <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                      Revenus crédités
                    </p>

                    <strong className="mt-2 block text-lg text-emerald-400">
                      {money(
                        summary.revenue,
                        summary.currency,
                      )}
                    </strong>
                  </div>

                  <div className="border-b border-[#303238] p-4 sm:border-b-0 sm:border-r">
                    <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                      Sorties / restitutions
                    </p>

                    <strong className="mt-2 block text-lg text-red-400">
                      {money(
                        summary.expense,
                        summary.currency,
                      )}
                    </strong>
                  </div>

                  <div className="p-4">
                    <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                      Solde des écritures
                    </p>

                    <strong
                      className={
                        summary.net >= 0
                          ? "mt-2 block text-lg text-[#72b2ff]"
                          : "mt-2 block text-lg text-red-400"
                      }
                    >
                      {money(
                        summary.net,
                        summary.currency,
                      )}
                    </strong>
                  </div>
                </div>
              </article>
            ),
          )}
        </section>
      ) : (
        <section className="border border-[#303238] bg-[#111214] p-8 text-center">
          <p className="text-[10px] font-semibold text-zinc-400">
            Aucun revenu comptabilisé
          </p>

          <p className="mt-2 text-[8px] text-zinc-600">
            Un paiement Marketplace payé crée automatiquement ses écritures financières.
          </p>
        </section>
      )}

      <section className="border border-[#303238] bg-[#111214]">
        <div className="border-b border-[#303238] p-3">
          <label className="relative block max-w-xl">
            <Search
              size={12}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
            />

            <input
              value={search}
              onChange={
                (event) =>
                  setSearch(
                    event.target.value,
                  )
              }
              placeholder="Commande, référence, description..."
              className="h-9 w-full border border-[#303238] bg-[#0d0f12] pl-8 pr-3 text-[9px] text-zinc-300 outline-none focus:border-[#3d92ff]"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-[#303238] bg-[#151619] text-left text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                <th className="px-4 py-3">
                  Date
                </th>

                <th className="px-3 py-3">
                  Nature
                </th>

                <th className="px-3 py-3">
                  Description
                </th>

                <th className="px-3 py-3">
                  Montant
                </th>

                <th className="px-3 py-3">
                  Commande
                </th>

                <th className="px-3 py-3">
                  Paiement
                </th>

                <th className="px-3 py-3">
                  Référence
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#292c31]">
              {filtered.map(
                (entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-[#151619]"
                  >
                    <td className="px-4 py-3 text-[8px] text-zinc-600">
                      {new Date(
                        entry.occurredAt,
                      ).toLocaleString(
                        "fr-FR",
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={
                          entry.entryType ===
                          "revenue"
                            ? "border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[8px] font-semibold text-emerald-400"
                            : "border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-[8px] font-semibold text-blue-400"
                        }
                      >
                        {entry.entryType ===
                        "revenue"
                          ? "Crédit"
                          : "Débit"}
                      </span>
                    </td>

                    <td className="max-w-[300px] px-3 py-3 text-[8px] text-zinc-400">
                      {entry.description}
                    </td>

                    <td
                      className={
                        entry.entryType ===
                        "revenue"
                          ? "px-3 py-3 text-[10px] font-semibold text-emerald-400"
                          : "px-3 py-3 text-[10px] font-semibold text-red-400"
                      }
                    >
                      {entry.entryType ===
                      "revenue"
                        ? "+"
                        : "-"}
                      {money(
                        entry.amount,
                        entry.currency,
                      )}
                    </td>

                    <td className="px-3 py-3">
                      {entry.orderId ? (
                        <Link
                          href={`/dashboard/vendeur/orders/${entry.orderId}`}
                          className="text-[8px] font-semibold text-[#3d92ff] hover:text-[#72b2ff]"
                        >
                          {shortId(
                            entry.orderId,
                          )}
                        </Link>
                      ) : (
                        <span className="text-[8px] text-zinc-700">
                          —
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-3 text-[8px] text-zinc-500">
                      {methodLabel(
                        entry.paymentMethod,
                      )}
                    </td>

                    <td className="max-w-[220px] truncate px-3 py-3 text-[8px] text-zinc-600">
                      {entry.providerReference ??
                        entry.reference ??
                        "—"}
                    </td>
                  </tr>
                ),
              )}

              {!filtered.length ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-[9px] text-zinc-600"
                  >
                    Aucune écriture correspondante.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <div className="border border-[#3d92ff]/20 bg-[#3d92ff]/5 px-3 py-2 text-[8px] leading-5 text-zinc-500">
        Les commandes et leurs totaux ne sont pas utilisées comme autorité comptable de cette page. Seules les écritures du ledger financier issues des paiements Marketplace réellement payés sont comptabilisées.
      </div>
    </div>
  );
}
