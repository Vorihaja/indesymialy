"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createMarketplaceUseCase,
  type MarketplaceProduct,
  type RentalSelection,
} from "@/modules/marketplace-core";

const typeLabels: Record<MarketplaceProduct["type"], string> = {
  sale: "Vente",
  rental: "Location",
  used: "Occasion",
};

const conditionLabels: Record<MarketplaceProduct["condition"], string> = {
  new: "Neuf",
  excellent: "Excellent état",
  good: "Bon état",
  used: "D'occasion",
};

const dateClass =
  "h-9 border border-[#343840] bg-[#0d0e10] px-2.5 text-[9px] text-zinc-100 outline-none focus:border-[#2588ff]";

export function ProductDetailFeature({ id }: { id: string }) {
  const useCase = useMemo(() => createMarketplaceUseCase(), []);
  const [product, setProduct] = useState<MarketplaceProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void useCase
      .product(id)
      .then(setProduct)
      .finally(() => setLoading(false));
  }, [id, useCase]);

  if (loading) {
    return (
      <main className="mx-auto max-w-[1500px] px-3 py-5 sm:px-5">
        <p className="border border-[#303238] bg-[#151619] p-6 text-[9px] text-zinc-500">
          Chargement du produit…
        </p>
      </main>
    );
  }
  if (!product) {
    return (
      <main className="mx-auto max-w-[1500px] px-3 py-5 sm:px-5">
        <p className="border border-[#303238] bg-[#151619] p-6 text-[9px] text-zinc-500">
          Produit introuvable.
        </p>
      </main>
    );
  }

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  const days =
    start && end
      ? Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000))
      : 1;
  const rental: RentalSelection | undefined =
    product.type === "rental"
      ? {
          startDate,
          endDate,
          days,
          depositAmount: product.depositAmount ?? 0,
          status: "pending",
        }
      : undefined;
  const amount =
    product.type === "rental"
      ? (product.rentalPricePerDay ?? 0) * days
      : (product.salePrice ?? 0);

  return (
    <main className="mx-auto max-w-[1500px] px-3 py-5 sm:px-5">
      <header className="mb-3 border-b border-[#303238] pb-3">
        <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
          Fiche produit
        </span>
        <h1 className="mt-1 text-[18px] font-semibold text-zinc-100">
          {product.title}
        </h1>
      </header>

      <section className="grid gap-px border border-[#303238] bg-[#303238] lg:grid-cols-[1.05fr_.95fr]">
        <div className="grid min-h-72 place-items-center bg-[#101114] p-3 sm:p-5">
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.title}
              className="max-h-[500px] w-full object-cover"
            />
          ) : (
            <span className="text-[9px] uppercase tracking-[0.08em] text-zinc-600">
              Aucune image
            </span>
          )}
        </div>

        <div className="bg-[#151619] p-4 sm:p-6">
          <div className="flex flex-wrap gap-1.5">
            <span className="border border-blue-800/60 bg-blue-950/30 px-2 py-1 text-[7px] font-bold uppercase text-blue-300">
              {typeLabels[product.type]}
            </span>
            <span className="border border-[#383c44] bg-[#111214] px-2 py-1 text-[7px] font-bold uppercase text-zinc-400">
              {conditionLabels[product.condition]}
            </span>
          </div>

          <p className="mt-3 text-[8px] font-semibold uppercase tracking-[0.1em] text-zinc-600">
            {product.category} · {product.location}
          </p>
          <p className="mt-2 text-[10px] leading-5 text-zinc-400">
            {product.description}
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-px border border-[#303238] bg-[#303238]">
            <div className="bg-[#111214] p-3">
              <dt className="text-[7px] font-bold uppercase text-zinc-600">
                Vendeur
              </dt>
              <dd className="mt-1 text-[9px] font-semibold text-zinc-200">
                {product.sellerName}
              </dd>
            </div>
            <div className="bg-[#111214] p-3">
              <dt className="text-[7px] font-bold uppercase text-zinc-600">
                Stock disponible
              </dt>
              <dd className="mt-1 text-[9px] font-semibold text-zinc-200">
                {product.stock}
              </dd>
            </div>
          </dl>

          {product.type === "rental" && (
            <div className="mt-4 grid gap-3 border-l-2 border-[#2588ff] bg-[#0c1724] p-3 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-[7px] font-bold uppercase text-zinc-500">
                  Début de location
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className={dateClass}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[7px] font-bold uppercase text-zinc-500">
                  Fin de location
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className={dateClass}
                />
              </label>
              <p className="flex justify-between text-[8px] text-zinc-500 sm:col-span-2">
                <span>{days} jour(s)</span>
                <span>
                  Caution : {(product.depositAmount ?? 0).toLocaleString()} Ar
                </span>
              </p>
            </div>
          )}

          <div className="my-4 border-y border-[#303238] py-3">
            <span className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
              Total estimé
            </span>
            <strong className="mt-1 block text-[22px] font-semibold text-zinc-100">
              {amount.toLocaleString()} Ar
            </strong>
          </div>

          <button
            onClick={() =>
              void useCase
                .addToCart(
                  product.id,
                  1,
                  product.type === "rental" ? "rental" : "sale",
                  rental,
                )
                .then(() => setMessage("Produit ajouté au panier."))
            }
            className="h-10 w-full border border-[#b91f30] bg-[#c82335] px-4 text-[9px] font-semibold uppercase tracking-[0.08em] text-white hover:bg-[#ad1d2e]"
          >
            Ajouter au panier
          </button>

          {message && (
            <p
              role="status"
              className="mt-3 border border-[#1d5b43] bg-[#0d2119] p-3 text-[9px] text-emerald-300"
            >
              {message}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
