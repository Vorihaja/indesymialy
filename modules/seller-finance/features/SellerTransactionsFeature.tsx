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
  useSellerTransactions,
} from "../hooks/useSellerFinance";

import type {
  SellerFinanceTransaction,
  SellerPaymentStatus,
  SellerTransactionType,
} from "../types";

type TypeFilter =
  | "all"
  | SellerTransactionType;

type PaymentFilter =
  | "all"
  | SellerPaymentStatus
  | "none";

const fieldClass =
  "h-9 border border-[#303238] bg-[#0d0f12] px-3 text-[9px] text-zinc-300 outline-none focus:border-[#3d92ff]";

function typeLabel(
  type:
    SellerTransactionType,
) {
  switch (type) {
    case "charge":
      return "Encaissement";

    case "refund":
      return "Remboursement";

    case "deposit":
      return "Dépôt";

    case "deposit_release":
      return "Restitution dépôt";
  }
}

function paymentLabel(
  value:
    SellerPaymentStatus | null,
) {
  switch (value) {
    case "paid":
      return "Payé";

    case "pending":
      return "En attente";

    case "failed":
      return "Échoué";

    case "refunded":
      return "Remboursé";

    case "cancelled":
      return "Annulé";

    default:
      return "Sans paiement";
  }
}

function methodLabel(
  value:
    SellerFinanceTransaction["paymentMethod"],
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

function shortId(
  value: string,
) {
  return value.length > 10
    ? value.slice(0, 8)
    : value;
}

export function SellerTransactionsFeature() {
  const transactions =
    useSellerTransactions();

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    typeFilter,
    setTypeFilter,
  ] =
    useState<TypeFilter>(
      "all",
    );

  const [
    paymentFilter,
    setPaymentFilter,
  ] =
    useState<PaymentFilter>(
      "all",
    );

  const filtered =
    useMemo(
      () => {
        const data =
          transactions.data ??
          [];

        const needle =
          search
            .trim()
            .toLocaleLowerCase(
              "fr",
            );

        return data.filter(
          (item) => {
            if (
              typeFilter !==
                "all" &&
              item.type !==
                typeFilter
            ) {
              return false;
            }

            if (
              paymentFilter ===
                "none" &&
              item.paymentStatus !==
                null
            ) {
              return false;
            }

            if (
              paymentFilter !==
                "all" &&
              paymentFilter !==
                "none" &&
              item.paymentStatus !==
                paymentFilter
            ) {
              return false;
            }

            if (!needle) {
              return true;
            }

            return [
              item.id,
              item.orderId,
              item.externalReference ??
                "",
              item.providerReference ??
                "",
              item.currency,
              item.type,
              item.paymentMethod ??
                "",
            ]
              .join(" ")
              .toLocaleLowerCase(
                "fr",
              )
              .includes(
                needle,
              );
          },
        );
      },
      [
        paymentFilter,
        search,
        transactions.data,
        typeFilter,
      ],
    );

  if (
    transactions.loading ||
    transactions.data === null
  ) {
    return (
      <div className="min-h-[420px]">
        <IndesyDualOrbitLoader
          variant="data"
          label="Chargement des transactions"
        />
      </div>
    );
  }

  const paid =
    transactions.data.filter(
      (item) =>
        item.paymentStatus ===
        "paid",
    ).length;

  const pending =
    transactions.data.filter(
      (item) =>
        item.paymentStatus ===
        "pending",
    ).length;

  const refunds =
    transactions.data.filter(
      (item) =>
        item.type === "refund" ||
        item.type === "deposit_release",
    ).length;

  return (
    <div className="grid gap-4 text-zinc-100">
      <header className="flex flex-col gap-3 border-b border-[#303238] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#3d92ff]">
            Finances vendeur
          </p>

          <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.035em] text-white">
            Transactions
          </h1>

          <p className="mt-1 max-w-3xl text-[9px] leading-5 text-zinc-600">
            Transactions commerciales et état réel du paiement associé.
          </p>
        </div>

        <button
          type="button"
          onClick={
            () =>
              void transactions
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

      {transactions.error ? (
        <div
          role="alert"
          className="border border-blue-500/30 bg-blue-500/5 px-3 py-2 text-[9px] text-blue-400"
        >
          {transactions.error}
        </div>
      ) : null}

      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <article className="border border-[#303238] bg-[#111214] p-4">
          <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
            Transactions
          </p>

          <strong className="mt-2 block text-2xl text-white">
            {transactions.data.length}
          </strong>
        </article>

        <article className="border border-[#303238] bg-[#111214] p-4">
          <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
            Paiements réussis
          </p>

          <strong className="mt-2 block text-2xl text-emerald-400">
            {paid}
          </strong>
        </article>

        <article className="border border-[#303238] bg-[#111214] p-4">
          <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
            En attente
          </p>

          <strong className="mt-2 block text-2xl text-amber-400">
            {pending}
          </strong>
        </article>

        <article className="border border-[#303238] bg-[#111214] p-4">
          <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
            Remboursements / restitutions
          </p>

          <strong className="mt-2 block text-2xl text-red-400">
            {refunds}
          </strong>
        </article>
      </section>

      <section className="border border-[#303238] bg-[#111214]">
        <div className="grid gap-2 border-b border-[#303238] p-3 lg:grid-cols-[1fr_180px_180px]">
          <label className="relative">
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
              placeholder="Commande, référence, transaction..."
              className={`${fieldClass} w-full pl-8`}
            />
          </label>

          <select
            value={
              typeFilter
            }
            onChange={
              (event) =>
                setTypeFilter(
                  event.target.value as
                    TypeFilter,
                )
            }
            className={fieldClass}
          >
            <option value="all">
              Tous les types
            </option>

            <option value="charge">
              Encaissements
            </option>

            <option value="refund">
              Remboursements
            </option>

            <option value="deposit">
              Dépôts
            </option>

            <option value="deposit_release">
              Restitutions
            </option>
          </select>

          <select
            value={
              paymentFilter
            }
            onChange={
              (event) =>
                setPaymentFilter(
                  event.target.value as
                    PaymentFilter,
                )
            }
            className={fieldClass}
          >
            <option value="all">
              Tous les paiements
            </option>

            <option value="paid">
              Payés
            </option>

            <option value="pending">
              En attente
            </option>

            <option value="failed">
              Échoués
            </option>

            <option value="refunded">
              Remboursés
            </option>

            <option value="cancelled">
              Annulés
            </option>

            <option value="none">
              Sans paiement
            </option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-[#303238] bg-[#151619] text-left text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                <th className="px-4 py-3">
                  Date
                </th>

                <th className="px-3 py-3">
                  Commande
                </th>

                <th className="px-3 py-3">
                  Type
                </th>

                <th className="px-3 py-3">
                  Montant
                </th>

                <th className="px-3 py-3">
                  Paiement
                </th>

                <th className="px-3 py-3">
                  Méthode
                </th>

                <th className="px-3 py-3">
                  Référence
                </th>

                <th className="px-3 py-3">
                  Transaction
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#292c31]">
              {filtered.map(
                (item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#151619]"
                  >
                    <td className="px-4 py-3 text-[8px] text-zinc-600">
                      {new Date(
                        item.createdAt,
                      ).toLocaleString(
                        "fr-FR",
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <Link
                        href={`/dashboard/vendeur/orders/${item.orderId}`}
                        className="text-[8px] font-semibold text-[#3d92ff] hover:text-[#72b2ff]"
                      >
                        {shortId(
                          item.orderId,
                        )}
                      </Link>
                    </td>

                    <td className="px-3 py-3 text-[8px] font-semibold text-zinc-300">
                      {typeLabel(
                        item.type,
                      )}
                    </td>

                    <td className="px-3 py-3 text-[10px] font-semibold text-white">
                      {money(
                        item.amount,
                        item.currency,
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <span className="border border-[#303238] bg-[#151619] px-2 py-1 text-[8px] font-semibold text-zinc-300">
                        {paymentLabel(
                          item.paymentStatus,
                        )}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-[8px] text-zinc-500">
                      {methodLabel(
                        item.paymentMethod,
                      )}
                    </td>

                    <td className="max-w-[220px] truncate px-3 py-3 text-[8px] text-zinc-500">
                      {item.providerReference ??
                        item.externalReference ??
                        "—"}
                    </td>

                    <td className="px-3 py-3 text-[8px] text-zinc-600">
                      {item.status}
                    </td>
                  </tr>
                ),
              )}

              {!filtered.length ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-[9px] text-zinc-600"
                  >
                    Aucune transaction correspondante.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
