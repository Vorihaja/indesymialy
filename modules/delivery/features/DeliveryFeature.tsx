"use client";

import { DeliveryStatus } from "../components/DeliveryStatus";
import { useDeliveries } from "../hooks";
import type { FulfillmentMethod } from "../types";

const methodLabels: Record<FulfillmentMethod, string> = {
  delivery: "Livraison",
  pickup: "Retrait",
};

export function DeliveryFeature() {
  const data = useDeliveries();

  if (data.loading) {
    return (
      <p className="rounded-[2px] border border-[#303238] bg-[#151619] p-5 text-sm text-zinc-500">
        Chargement des livraisons…
      </p>
    );
  }

  return (
    <section className="space-y-4 text-zinc-100">
      <header className="border-b border-[#303238] pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
          Logistique vendeur
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
          Livraisons et retraits
        </h1>
      </header>

      <div className="space-y-2">
        {data.deliveries.map((item) => (
          <article
            key={item.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-[2px] border border-[#303238] bg-[#151619] p-4"
          >
            <div>
              <strong className="text-sm text-white">
                Commande {item.orderId}
              </strong>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                {methodLabels[item.method]} · {item.address}
              </p>
            </div>
            <DeliveryStatus delivery={item} />
          </article>
        ))}
        {!data.deliveries.length && (
          <p className="rounded-[2px] border border-dashed border-[#303238] bg-[#101114] p-8 text-center text-sm text-zinc-500">
            Aucune livraison.
          </p>
        )}
      </div>
    </section>
  );
}
