"use client";

import {
  CircleDollarSign,
  RefreshCw,
  ReceiptText,
  RotateCcw,
  WalletCards,
} from "lucide-react";

import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";

import {
  useSellerRevenue,
  useSellerTransactions,
} from "../hooks/useSellerFinance";

import type {
  SellerTransactionType,
} from "../types";


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
    return `${amount} ${currency}`;
  }
}


function transactionLabel(
  type: SellerTransactionType,
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


export function SellerFinanceSummaryFeature() {
  const revenue =
    useSellerRevenue();

  const transactions =
    useSellerTransactions();


  if (
    revenue.loading ||
    transactions.loading
  ) {
    return (
      <div className="min-h-[420px]">
        <IndesyDualOrbitLoader
          variant="data"
          label="Chargement de la synthèse financière"
        />
      </div>
    );
  }


  if (
    !revenue.data ||
    !transactions.data
  ) {
    const message =
      revenue.error ??
      transactions.error ??
      "Les données financières sont indisponibles.";

    return (
      <section className="border border-[#303238] bg-[#111214] p-6">
        <p className="text-[10px] font-semibold text-red-400">
          Synthèse financière indisponible
        </p>

        <p className="mt-2 text-[9px] text-zinc-500">
          {message}
        </p>

        <button
          type="button"
          onClick={() =>
            void Promise.all([
              revenue.refresh(),
              transactions.refresh(),
            ]).catch(
              () => undefined,
            )
          }
          className="mt-4 inline-flex h-8 items-center gap-1.5 border border-[#303238] bg-[#151619] px-3 text-[8px] font-semibold text-zinc-300 hover:border-[#3d92ff]/50 hover:text-white"
        >
          <RefreshCw size={11} />
          Réessayer
        </button>
      </section>
    );
  }


  const transactionItems =
    transactions.data;

  const paidTransactions =
    transactionItems.filter(
      (transaction) =>
        transaction.paymentStatus ===
        "paid",
    );

  const pendingTransactions =
    transactionItems.filter(
      (transaction) =>
        transaction.paymentStatus ===
          "pending" ||
        transaction.status ===
          "pending",
    );

  const refundTransactions =
    transactionItems.filter(
      (transaction) =>
        transaction.type ===
          "refund" ||
        transaction.type ===
          "deposit_release",
    );


  return (
    <div className="grid gap-4 text-zinc-100">
      <header className="flex flex-col gap-3 border-b border-[#303238] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#3d92ff]">
            Comptabilité vendeur
          </p>

          <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.035em] text-white">
            Synthèse
          </h1>

          <p className="mt-1 max-w-3xl text-[9px] leading-4 text-zinc-500">
            Vue consolidée des transactions Marketplace et des écritures
            comptables réellement enregistrées pour l’organisation vendeuse.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void Promise.all([
              revenue.refresh(),
              transactions.refresh(),
            ]).catch(
              () => undefined,
            )
          }
          className="inline-flex h-8 items-center gap-1.5 border border-[#303238] bg-[#151619] px-3 text-[8px] font-semibold text-zinc-400 hover:border-[#3d92ff]/50 hover:text-white"
        >
          <RefreshCw size={11} />
          Actualiser
        </button>
      </header>


      <section className="grid grid-cols-2 gap-px border border-[#303238] bg-[#303238] lg:grid-cols-4">
        <article className="bg-[#151619] p-4">
          <span className="flex items-center gap-1.5 text-[7px] font-bold uppercase tracking-[0.12em] text-zinc-600">
            <ReceiptText size={11} />
            Transactions
          </span>

          <strong className="mt-2 block text-xl text-white">
            {transactionItems.length}
          </strong>
        </article>

        <article className="bg-[#151619] p-4">
          <span className="flex items-center gap-1.5 text-[7px] font-bold uppercase tracking-[0.12em] text-zinc-600">
            <CircleDollarSign size={11} />
            Paiements confirmés
          </span>

          <strong className="mt-2 block text-xl text-emerald-400">
            {paidTransactions.length}
          </strong>
        </article>

        <article className="bg-[#151619] p-4">
          <span className="flex items-center gap-1.5 text-[7px] font-bold uppercase tracking-[0.12em] text-zinc-600">
            <WalletCards size={11} />
            En attente
          </span>

          <strong className="mt-2 block text-xl text-amber-400">
            {pendingTransactions.length}
          </strong>
        </article>

        <article className="bg-[#151619] p-4">
          <span className="flex items-center gap-1.5 text-[7px] font-bold uppercase tracking-[0.12em] text-zinc-600">
            <RotateCcw size={11} />
            Remboursements / restitutions
          </span>

          <strong className="mt-2 block text-xl text-[#72b2ff]">
            {refundTransactions.length}
          </strong>
        </article>
      </section>


      <section className="grid gap-3">
        {revenue.data.currencies.map(
          (currency) => (
            <article
              key={currency.currency}
              className="border border-[#303238] bg-[#111214]"
            >
              <header className="flex items-center justify-between border-b border-[#303238] px-4 py-3">
                <div>
                  <span className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                    Devise
                  </span>

                  <strong className="ml-2 text-[11px] text-white">
                    {currency.currency}
                  </strong>
                </div>

                <span className="text-[8px] text-zinc-600">
                  financial_entries
                </span>
              </header>

              <div className="grid md:grid-cols-3">
                <div className="border-b border-[#303238] p-4 md:border-b-0 md:border-r">
                  <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                    Revenus comptabilisés
                  </p>

                  <strong className="mt-2 block text-lg text-emerald-400">
                    {money(
                      currency.revenue,
                      currency.currency,
                    )}
                  </strong>
                </div>

                <div className="border-b border-[#303238] p-4 md:border-b-0 md:border-r">
                  <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                    Sorties comptabilisées
                  </p>

                  <strong className="mt-2 block text-lg text-red-400">
                    {money(
                      currency.expense,
                      currency.currency,
                    )}
                  </strong>
                </div>

                <div className="p-4">
                  <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                    Solde des écritures
                  </p>

                  <strong
                    className={
                      currency.net >= 0
                        ? "mt-2 block text-lg text-[#72b2ff]"
                        : "mt-2 block text-lg text-red-400"
                    }
                  >
                    {money(
                      currency.net,
                      currency.currency,
                    )}
                  </strong>
                </div>
              </div>
            </article>
          ),
        )}

        {!revenue.data.currencies.length ? (
          <div className="border border-[#303238] bg-[#111214] p-8 text-center">
            <p className="text-[10px] font-semibold text-zinc-400">
              Aucune écriture Marketplace
            </p>

            <p className="mt-1 text-[8px] text-zinc-600">
              Les soldes apparaîtront après les premiers paiements comptabilisés.
            </p>
          </div>
        ) : null}
      </section>


      <section className="border border-blue-900/40 bg-blue-950/10 p-4">
        <strong className="text-[10px] text-[#72b2ff]">
          Lecture comptable
        </strong>

        <p className="mt-2 text-[9px] leading-5 text-zinc-500">
          Le solde affiché correspond aux écritures Marketplace du ledger.
          Il ne représente ni un « net après commission » ni un montant
          automatiquement disponible pour un versement bancaire.
        </p>
      </section>


      <section className="border border-[#303238] bg-[#111214]">
        <header className="border-b border-[#303238] px-4 py-3">
          <strong className="text-[10px] text-white">
            Transactions récentes
          </strong>
        </header>

        <div className="divide-y divide-[#292c31]">
          {transactionItems
            .slice(
              0,
              8,
            )
            .map(
              (transaction) => (
                <article
                  key={transaction.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <strong className="text-[9px] text-zinc-200">
                      {transactionLabel(
                        transaction.type,
                      )}
                    </strong>

                    <p className="mt-1 text-[8px] text-zinc-600">
                      {transaction.orderId
                        ? `Commande ${transaction.orderId.slice(0, 8)}`
                        : "Sans commande"}
                      {" · "}
                      {transaction.paymentStatus ??
                        transaction.status}
                    </p>
                  </div>

                  <strong className="text-[10px] text-white">
                    {money(
                      transaction.amount,
                      transaction.currency,
                    )}
                  </strong>
                </article>
              ),
            )}

          {!transactionItems.length ? (
            <div className="p-8 text-center text-[9px] text-zinc-600">
              Aucune transaction.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}