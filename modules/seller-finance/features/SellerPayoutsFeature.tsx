"use client";

import {
  ArrowDownToLine,
  Ban,
  Landmark,
  RefreshCw,
  WalletCards,
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
    return `${amount} ${currency}`;
  }
}


export function SellerPayoutsFeature() {
  const revenue =
    useSellerRevenue();


  if (revenue.loading) {
    return (
      <div className="min-h-[420px]">
        <IndesyDualOrbitLoader
          variant="data"
          label="Chargement des versements"
        />
      </div>
    );
  }


  if (!revenue.data) {
    return (
      <section className="border border-[#303238] bg-[#111214] p-6">
        <p className="text-[10px] font-semibold text-red-400">
          Données financières indisponibles
        </p>

        <p className="mt-2 text-[9px] text-zinc-500">
          {revenue.error ??
            "Impossible de charger les écritures vendeur."}
        </p>

        <button
          type="button"
          onClick={() =>
            void revenue
              .refresh()
              .catch(
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


  const recentEntries =
    revenue.data.entries.slice(
      0,
      12,
    );


  return (
    <div className="grid gap-4 text-zinc-100">
      <header className="flex flex-col gap-3 border-b border-[#303238] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#3d92ff]">
            Flux vendeur
          </p>

          <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.035em] text-white">
            Versements
          </h1>

          <p className="mt-1 max-w-3xl text-[9px] leading-4 text-zinc-500">
            Le modèle financier actuel crédite directement le compte
            comptable de l’organisation vendeuse lors d’un paiement
            Marketplace confirmé.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void revenue
              .refresh()
              .catch(
                () => undefined,
              )
          }
          className="inline-flex h-8 items-center gap-1.5 border border-[#303238] bg-[#151619] px-3 text-[8px] font-semibold text-zinc-400 hover:border-[#3d92ff]/50 hover:text-white"
        >
          <RefreshCw size={11} />
          Actualiser
        </button>
      </header>


      <section className="grid gap-px border border-[#303238] bg-[#303238] md:grid-cols-3">
        <article className="bg-[#151619] p-4">
          <WalletCards
            size={16}
            className="text-[#72b2ff]"
          />

          <p className="mt-3 text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
            Crédit vendeur
          </p>

          <strong className="mt-1 block text-[12px] text-white">
            Ledger direct
          </strong>
        </article>

        <article className="bg-[#151619] p-4">
          <Landmark
            size={16}
            className="text-zinc-500"
          />

          <p className="mt-3 text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
            Payout bancaire
          </p>

          <strong className="mt-1 block text-[12px] text-white">
            Non configuré
          </strong>
        </article>

        <article className="bg-[#151619] p-4">
          <Ban
            size={16}
            className="text-zinc-500"
          />

          <p className="mt-3 text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
            Demande de retrait
          </p>

          <strong className="mt-1 block text-[12px] text-white">
            Non disponible
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
                    Devise · {currency.currency}
                  </span>

                  <strong className="mt-1 block text-[11px] text-white">
                    Solde Marketplace comptabilisé
                  </strong>
                </div>

                <ArrowDownToLine
                  size={15}
                  className="text-[#72b2ff]"
                />
              </header>

              <div className="grid md:grid-cols-3">
                <div className="border-b border-[#303238] p-4 md:border-b-0 md:border-r">
                  <span className="text-[7px] uppercase text-zinc-600">
                    Crédits
                  </span>

                  <strong className="mt-1 block text-[13px] text-emerald-400">
                    {money(
                      currency.revenue,
                      currency.currency,
                    )}
                  </strong>
                </div>

                <div className="border-b border-[#303238] p-4 md:border-b-0 md:border-r">
                  <span className="text-[7px] uppercase text-zinc-600">
                    Sorties
                  </span>

                  <strong className="mt-1 block text-[13px] text-red-400">
                    {money(
                      currency.expense,
                      currency.currency,
                    )}
                  </strong>
                </div>

                <div className="p-4">
                  <span className="text-[7px] uppercase text-zinc-600">
                    Solde
                  </span>

                  <strong
                    className={
                      currency.net >= 0
                        ? "mt-1 block text-[13px] text-[#72b2ff]"
                        : "mt-1 block text-[13px] text-red-400"
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
              Aucun solde Marketplace
            </p>
          </div>
        ) : null}
      </section>


      <section className="border border-amber-900/40 bg-amber-950/10 p-4">
        <strong className="text-[10px] text-amber-300">
          Pas de faux versement
        </strong>

        <p className="mt-2 text-[9px] leading-5 text-zinc-500">
          Indesy ne crée pas ici de demande de retrait, de virement,
          de settlement ou de payout fictif. Ces opérations nécessiteront
          une véritable autorité de décaissement et l’intégration d’un
          prestataire de paiement.
        </p>
      </section>


      <section className="border border-[#303238] bg-[#111214]">
        <header className="border-b border-[#303238] px-4 py-3">
          <strong className="text-[10px] text-white">
            Dernières écritures Marketplace
          </strong>
        </header>

        <div className="divide-y divide-[#292c31]">
          {recentEntries.map(
            (entry) => (
              <article
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <strong className="text-[9px] text-zinc-200">
                    {entry.description}
                  </strong>

                  <p className="mt-1 text-[8px] text-zinc-600">
                    {entry.entryType ===
                    "revenue"
                      ? "Crédit"
                      : "Sortie"}
                    {entry.orderId
                      ? ` · commande ${entry.orderId.slice(0, 8)}`
                      : ""}
                  </p>
                </div>

                <strong
                  className={
                    entry.entryType ===
                    "revenue"
                      ? "text-[10px] text-emerald-400"
                      : "text-[10px] text-red-400"
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
                </strong>
              </article>
            ),
          )}

          {!recentEntries.length ? (
            <div className="p-8 text-center text-[9px] text-zinc-600">
              Aucune écriture.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}