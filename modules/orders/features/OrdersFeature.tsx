"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckoutForm } from "../components/CheckoutForm";
import { useOrders } from "../hooks";
import type { MarketplaceOrder, OrderStatus } from "../types";

const statuses: OrderStatus[] = [
  "draft",
  "pending",
  "confirmed",
  "prepared",
  "shipped",
  "ready_for_pickup",
  "delivered",
  "cancelled",
  "refunded",
];

const statusLabels: Record<OrderStatus, string> = {
  draft: "Brouillon",
  pending: "En attente",
  confirmed: "Confirmée",
  prepared: "Préparée",
  shipped: "Expédiée",
  ready_for_pickup: "Prête au retrait",
  delivered: "Livrée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

const fulfillmentLabels = {
  delivery: "Livraison",
  pickup: "Retrait",
} as const;

const statusStyles: Record<OrderStatus, string> = {
  draft: "border-[#454952] bg-[#202226] text-zinc-300",
  pending: "border-[#71581b] bg-[#241d0c] text-amber-300",
  confirmed: "border-[#24557f] bg-[#0d1d2b] text-blue-300",
  prepared: "border-[#24557f] bg-[#0d1d2b] text-blue-300",
  shipped: "border-[#334b86] bg-[#111b35] text-indigo-300",
  ready_for_pickup: "border-[#4e3973] bg-[#1b1329] text-violet-300",
  delivered: "border-[#1d5b43] bg-[#0d2119] text-emerald-300",
  cancelled: "border-[#5f1c28] bg-[#220d12] text-[#ff7a8b]",
  refunded: "border-[#70411f] bg-[#25160c] text-orange-300",
};

const selectClass =
  "h-9 border border-[#343840] bg-[#0d0e10] px-2.5 text-[9px] text-zinc-100 outline-none focus:border-[#2588ff]";

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex border px-2 py-1 text-[7px] font-semibold uppercase tracking-[0.06em] ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

export function OrdersFeature({
  mode = "list",
  orderId,
  seller = false,
}: {
  mode?: "list" | "detail" | "checkout";
  orderId?: string;
  seller?: boolean;
}) {
  const data = useOrders();
  const [order, setOrder] = useState<MarketplaceOrder | null>(null);

  useEffect(() => {
    if (orderId) void data.detail(orderId).then(setOrder);
  }, [orderId]);

  if (mode === "checkout") {
    return (
      <main className="mx-auto max-w-4xl bg-[#090a0c] px-3 py-5 sm:px-5">
        <header className="mb-4 border-b border-[#303238] pb-3">
          <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
            Validation
          </span>
          <h1 className="mt-1 text-[18px] font-semibold text-zinc-100">
            Finaliser la commande
          </h1>
          <p className="mt-1 text-[8px] text-zinc-600">
            Confirmez vos coordonnées, le mode de remise et le paiement.
          </p>
        </header>
        <CheckoutForm
          onSubmit={async (input) => {
            await data.checkout(input);
          }}
        />
      </main>
    );
  }

  if (data.loading) {
    return (
      <main className="mx-auto max-w-[1250px] bg-[#090a0c] px-3 py-5 sm:px-5">
        <p className="border border-[#303238] bg-[#151619] p-6 text-[9px] text-zinc-500">
          Chargement des commandes…
        </p>
      </main>
    );
  }

  if (mode === "detail") {
    return order ? (
      <main className="mx-auto max-w-[1150px] bg-[#090a0c] px-3 py-5 sm:px-5">
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-[#303238] pb-3">
          <div>
            <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
              Suivi de commande
            </span>
            <h1 className="mt-1 text-[18px] font-semibold text-zinc-100">
              Commande {order.id}
            </h1>
            <p className="mt-1 text-[8px] text-zinc-600">
              {order.customerName} · {fulfillmentLabels[order.fulfillment]} ·{" "}
              {order.total.toLocaleString()} Ar
            </p>
          </div>
          <StatusBadge status={order.status} />
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="border border-[#303238] bg-[#151619]">
            <header className="border-b border-[#303238] px-3 py-2">
              <span className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                Contenu
              </span>
              <h2 className="mt-0.5 text-[10px] font-semibold text-zinc-200">
                Articles commandés
              </h2>
            </header>
            {order.lines.map((line) => (
              <article
                key={line.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-[#292c31] p-3 last:border-b-0"
              >
                <div>
                  <strong className="text-[9px] font-semibold text-zinc-200">
                    {line.title}
                  </strong>
                  <span className="mt-0.5 block text-[7px] text-zinc-600">
                    {line.quantity} unité(s)
                  </span>
                </div>
                <strong className="text-[9px] text-zinc-200">
                  {line.total.toLocaleString()} Ar
                </strong>
              </article>
            ))}
          </section>

          <aside className="h-max border border-[#303238] bg-[#151619]">
            <header className="border-b border-[#303238] px-3 py-2">
              <span className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                Traçabilité
              </span>
              <h2 className="mt-0.5 text-[10px] font-semibold text-zinc-200">
                Historique
              </h2>
            </header>
            <div className="divide-y divide-[#292c31]">
              {order.statusHistory.map((entry, index) => (
                <p
                  key={`${entry.changedAt}-${index}`}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-[8px]"
                >
                  <span className="text-zinc-300">
                    {statusLabels[entry.status]}
                  </span>
                  <span className="text-zinc-600">{entry.changedAt}</span>
                </p>
              ))}
            </div>
            {seller && (
              <div className="border-t border-[#303238] p-3">
                <label className="grid gap-1">
                  <span className="text-[7px] font-bold uppercase text-zinc-600">
                    Mettre à jour le statut
                  </span>
                  <select
                    value={order.status}
                    onChange={(event) =>
                      void data.updateStatus(
                        order.id,
                        event.target.value as OrderStatus,
                      )
                    }
                    className={selectClass}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </aside>
        </div>
      </main>
    ) : (
      <main className="mx-auto max-w-[1150px] bg-[#090a0c] px-3 py-5 sm:px-5">
        <p className="border border-[#303238] bg-[#151619] p-6 text-[9px] text-zinc-500">
          Commande introuvable.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1250px] bg-[#090a0c] px-3 py-5 sm:px-5">
      <header className="mb-4 border-b border-[#303238] pb-3">
        <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
          Historique d’achat
        </span>
        <h1 className="mt-1 text-[18px] font-semibold text-zinc-100">
          Commandes
        </h1>
        <p className="mt-1 text-[8px] text-zinc-600">
          Suivez la préparation, l’expédition et la livraison.
        </p>
      </header>

      <section className="overflow-x-auto border border-[#303238] bg-[#151619]">
        <table className="w-full min-w-[680px] text-left">
          <thead className="bg-[#111214] text-[7px] uppercase tracking-[0.06em] text-zinc-600">
            <tr>
              <th className="h-8 border-b border-[#303238] px-3">Commande</th>
              <th className="h-8 border-b border-[#303238] px-3">Client</th>
              <th className="h-8 border-b border-[#303238] px-3">Total</th>
              <th className="h-8 border-b border-[#303238] px-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {data.orders.map((item) => (
              <tr
                key={item.id}
                className="border-b border-[#292c31] text-[8px] text-zinc-400 last:border-b-0 hover:bg-white/[0.02]"
              >
                <td className="h-11 px-3">
                  <Link
                    href={`${seller ? "/dashboard/vendeur/orders" : "/marketplace/orders"}/${item.id}`}
                    className="font-semibold text-[#3d92ff] hover:text-[#72b2ff]"
                  >
                    {item.id}
                  </Link>
                </td>
                <td className="px-3">{item.customerName}</td>
                <td className="px-3 font-semibold text-zinc-200">
                  {item.total.toLocaleString()} Ar
                </td>
                <td className="px-3">
                  <StatusBadge status={item.status} />
                </td>
              </tr>
            ))}
            {!data.orders.length && (
              <tr>
                <td
                  colSpan={4}
                  className="p-8 text-center text-[9px] text-zinc-600"
                >
                  Aucune commande.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
