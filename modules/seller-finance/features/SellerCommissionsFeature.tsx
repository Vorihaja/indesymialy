"use client";

import {
  CircleOff,
  RefreshCw,
  Scale,
  ShieldCheck,
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


export function SellerCommissionsFeature() {
  const revenue =
    useSellerRevenue();


  if (revenue.loading) {
    return (
      <div className="min-h-[420px]">
        <IndesyDualOrbitLoader
          variant="data"
          label="Vérification des commissions"
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
            "Impossible de vérifier le ledger vendeur."}
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


  const expenseEntries =
    revenue.data.entries.filter(
      (entry) =>
        entry.entryType ===
        "expense",
    );


  return (
    <div className="grid gap-4 text-zinc-100">
      <header className="flex flex-col gap-3 border-b border-[#303238] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#3d92ff]">
            Politique Marketplace
          </p>

          <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.035em] text-white">
            Commissions
          </h1>

          <p className="mt-1 max-w-3xl text-[9px] leading-4 text-zinc-500">
            Aucun moteur de commission Marketplace n’est actuellement
            configuré dans l’autorité financière vendeur.
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
          <CircleOff
            size={16}
            className="text-zinc-500"
          />

          <p className="mt-3 text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
            Modèle de commission
          </p>

          <strong className="mt-1 block text-[13px] text-white">
            Non configuré
          </strong>
        </article>

        <article className="bg-[#151619] p-4">
          <Scale
            size={16}
            className="text-zinc-500"
          />

          <p className="mt-3 text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
            Taux Marketplace
          </p>

          <strong className="mt-1 block text-[13px] text-white">
            Non défini
          </strong>
        </article>

        <article className="bg-[#151619] p-4">
          <ShieldCheck
            size={16}
            className="text-zinc-500"
          />

          <p className="mt-3 text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
            Net après commission
          </p>

          <strong className="mt-1 block text-[13px] text-white">
            Non calculé
          </strong>
        </article>
      </section>


      <section className="border border-amber-900/40 bg-amber-950/10 p-4">
        <strong className="text-[10px] text-amber-300">
          Aucune commission fictive
        </strong>

        <p className="mt-2 text-[9px] leading-5 text-zinc-500">
          Les sorties du ledger ne sont pas reclassées automatiquement
          comme commissions. Elles peuvent correspondre notamment à des
          remboursements ou restitutions. Aucun taux, frais plateforme ou
          montant vendeur net n’est déduit artificiellement.
        </p>
      </section>


      <section className="grid gap-3">
        {revenue.data.currencies.map(
          (currency) => (
            <article
              key={currency.currency}
              className="border border-[#303238] bg-[#111214] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                    Ledger · {currency.currency}
                  </span>

                  <strong className="mt-1 block text-[12px] text-white">
                    Solde des écritures
                  </strong>
                </div>

                <strong
                  className={
                    currency.net >= 0
                      ? "text-[15px] text-[#72b2ff]"
                      : "text-[15px] text-red-400"
                  }
                >
                  {money(
                    currency.net,
                    currency.currency,
                  )}
                </strong>
              </div>

              <div className="mt-3 grid gap-px border border-[#303238] bg-[#303238] sm:grid-cols-2">
                <div className="bg-[#151619] p-3">
                  <span className="text-[7px] uppercase text-zinc-600">
                    Revenus
                  </span>

                  <strong className="mt-1 block text-[10px] text-emerald-400">
                    {money(
                      currency.revenue,
                      currency.currency,
                    )}
                  </strong>
                </div>

                <div className="bg-[#151619] p-3">
                  <span className="text-[7px] uppercase text-zinc-600">
                    Sorties
                  </span>

                  <strong className="mt-1 block text-[10px] text-red-400">
                    {money(
                      currency.expense,
                      currency.currency,
                    )}
                  </strong>
                </div>
              </div>
            </article>
          ),
        )}
      </section>


      <footer className="border border-[#303238] bg-[#111214] p-4">
        <p className="text-[9px] leading-5 text-zinc-500">
          Écritures de sortie actuellement visibles dans le ledger :
          {" "}
          <strong className="text-zinc-300">
            {expenseEntries.length}
          </strong>.
          Elles restent classées selon leur véritable nature comptable,
          jamais comme « commission » par défaut.
        </p>
      </footer>
    </div>
  );
}