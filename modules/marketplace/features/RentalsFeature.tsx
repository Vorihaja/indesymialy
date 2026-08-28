"use client";

import { useOrders } from "@/modules/orders";

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  pending: "En attente",
  active: "En cours",
  returned: "Restituée",
  confirmed: "Confirmée",
  prepared: "Préparée",
  shipped: "Expédiée",
  ready_for_pickup: "Prête au retrait",
  delivered: "Livrée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

export function RentalsFeature() {
  const data = useOrders();
  const rentals = data.orders.flatMap((order) =>
    order.lines
      .filter((line) => line.mode === "rental")
      .map((line) => ({ order, line })),
  );

  if (data.loading) {
    return (
      <main className="mx-auto max-w-[1500px] bg-[#090a0c] px-3 py-5 sm:px-5">
        <p className="border border-[#303238] bg-[#151619] p-6 text-[9px] text-zinc-500">
          Chargement des locations…
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1500px] bg-[#090a0c] px-3 py-5 sm:px-5">
      <header className="mb-4 border-b border-[#303238] pb-3">
        <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
          Vos réservations
        </span>
        <h1 className="mt-1 text-[18px] font-semibold text-zinc-100">
          Locations
        </h1>
        <p className="mt-1 text-[8px] text-zinc-600">
          Suivez les périodes de location et l’état de chaque commande.
        </p>
      </header>

      {rentals.length ? (
        <section className="border border-[#303238] bg-[#151619]">
          <div className="hidden h-8 grid-cols-[minmax(0,1fr)_190px_150px_150px] items-center border-b border-[#303238] px-3 text-[7px] font-bold uppercase text-zinc-600 sm:grid">
            <span>Article</span>
            <span>Période</span>
            <span>Location</span>
            <span>Commande</span>
          </div>
          {rentals.map(({ order, line }) => (
            <article
              key={line.id}
              className="grid gap-2 border-b border-[#292c31] p-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_190px_150px_150px] sm:items-center"
            >
              <strong className="text-[9px] font-semibold text-zinc-200">
                {line.title}
              </strong>
              <span className="text-[8px] text-zinc-500">
                {line.rental?.startDate} → {line.rental?.endDate}
                <small className="mt-0.5 block text-[7px]">
                  {line.rental?.days} jour(s)
                </small>
              </span>
              <span className="w-fit border border-blue-800/60 bg-blue-950/30 px-2 py-1 text-[7px] font-semibold uppercase text-blue-300">
                {statusLabels[line.rental?.status ?? "pending"] ??
                  line.rental?.status}
              </span>
              <span className="w-fit border border-[#454952] bg-[#202226] px-2 py-1 text-[7px] font-semibold uppercase text-zinc-300">
                {statusLabels[order.status] ?? order.status}
              </span>
            </article>
          ))}
        </section>
      ) : (
        <section className="grid min-h-64 place-items-center border border-dashed border-[#343840] bg-[#111214] text-center">
          <div>
            <strong className="text-[11px] font-semibold text-zinc-300">
              Aucune location
            </strong>
            <p className="mt-1 text-[8px] text-zinc-600">
              Vos prochaines réservations apparaîtront ici.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
