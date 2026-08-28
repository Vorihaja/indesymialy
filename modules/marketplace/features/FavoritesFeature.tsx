"use client";

import { useMarketplaceStore } from "@/modules/marketplace-core";
import { ProductCard } from "../components/ProductCard";
import { useCatalog } from "../hooks/useCatalog";

export function FavoritesFeature() {
  const data = useCatalog();
  const store = useMarketplaceStore();
  const items = [
    ...data.result.items,
    ...data.result.recommended,
    ...data.result.recent,
  ].filter(
    (item, index, array) =>
      data.favorites.includes(item.id) &&
      array.findIndex((value) => value.id === item.id) === index,
  );

  if (data.loading) {
    return (
      <main className="mx-auto max-w-[1500px] bg-[#090a0c] px-3 py-5 sm:px-5">
        <p className="border border-[#303238] bg-[#151619] p-6 text-[9px] text-zinc-500">
          Chargement des favoris…
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1500px] bg-[#090a0c] px-3 py-5 sm:px-5">
      <header className="mb-4 border-b border-[#303238] pb-3">
        <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
          Sélection personnelle
        </span>
        <h1 className="mt-1 text-[18px] font-semibold text-zinc-100">
          Mes favoris
        </h1>
        <p className="mt-1 text-[8px] text-zinc-600">
          {items.length} offre(s) enregistrée(s) pour plus tard.
        </p>
      </header>

      {items.length ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              favorite
              onFavorite={() => void data.toggleFavorite(product.id)}
              onAdd={() =>
                void store.useCase.addToCart(
                  product.id,
                  1,
                  product.type === "rental" ? "rental" : "sale",
                )
              }
            />
          ))}
        </section>
      ) : (
        <section className="grid min-h-64 place-items-center border border-dashed border-[#343840] bg-[#111214] text-center">
          <div>
            <strong className="text-[11px] font-semibold text-zinc-300">
              Aucun favori
            </strong>
            <p className="mt-1 text-[8px] text-zinc-600">
              Enregistrez des offres depuis le catalogue pour les retrouver ici.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
