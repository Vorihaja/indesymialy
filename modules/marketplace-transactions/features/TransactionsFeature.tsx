"use client";

import { TransactionStatus } from "../components/TransactionStatus";
import { useMarketplaceTransactions } from "../hooks";

export function TransactionsFeature() {
  const data = useMarketplaceTransactions();

  if (data.loading) {
    return (
      <p className="rounded-[2px] border border-[#303238] bg-[#151619] p-5 text-sm text-zinc-500">
        Chargement des transactions…
      </p>
    );
  }

  return (
    <section className="space-y-4 text-zinc-100">
      <header className="border-b border-[#303238] pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
          Registre financier
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
          Transactions Marketplace
        </h1>
      </header>

      <div className="space-y-2">
        {data.transactions.map((item) => (
          <article
            key={item.id}
            className="grid items-center gap-3 rounded-[2px] border border-[#303238] bg-[#151619] p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
          >
            <span className="text-sm text-zinc-300">
              Commande {item.orderId}
            </span>
            <strong className="text-sm text-white">
              {item.amount.toLocaleString()} Ar
            </strong>
            <TransactionStatus transaction={item} />
          </article>
        ))}
        {!data.transactions.length && (
          <p className="rounded-[2px] border border-dashed border-[#303238] bg-[#101114] p-8 text-center text-sm text-zinc-500">
            Aucune transaction.
          </p>
        )}
      </div>
    </section>
  );
}
