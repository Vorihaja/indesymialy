"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/modules/auth/hooks";
import { useMarketplaceStore } from "@/modules/marketplace-core";
import { ProductCard } from "../components/ProductCard";
import { useCatalog } from "../hooks/useCatalog";

const explain = (cause: unknown) =>
  cause instanceof Error ? cause.message : "L'action n'a pas pu être enregistrée.";

export function FavoritesFeature() {
  const auth = useAuth();
  const data = useCatalog();
  const store = useMarketplaceStore();
  const [actionError, setActionError] = useState<string | null>(null);

  const mutate = async (operation: () => Promise<unknown>) => {
    try {
      setActionError(null);
      await operation();
    } catch (cause) {
      setActionError(explain(cause));
    }
  };

  if (auth.loading || data.loading) {
    return <main className="mx-auto max-w-[1500px] px-3 py-5 sm:px-5"><p>Chargement des favoris…</p></main>;
  }

  if (!auth.authenticated) {
    return (
      <main className="mx-auto grid min-h-72 max-w-[1500px] place-items-center px-3 py-5 text-center sm:px-5">
        <div>
          <h1 className="text-lg font-semibold">Connexion requise</h1>
          <p className="mt-2 text-sm text-zinc-500">Connectez-vous pour consulter et enregistrer vos favoris persistants.</p>
          <Link href="/auth" className="mt-4 inline-flex bg-[#c82335] px-4 py-2 text-sm font-semibold text-white">Se connecter</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1500px] px-3 py-5 sm:px-5">
      <header className="mb-4 border-b border-zinc-200 pb-3 dark:border-[#303238]">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c82335]">Sélection personnelle</span>
        <h1 className="mt-1 text-xl font-semibold">Mes favoris</h1>
        <p className="mt-1 text-xs text-zinc-500">{data.favoriteItems.length} offre(s) enregistrée(s).</p>
      </header>

      {(data.error || actionError) && (
        <p role="alert" className="mb-4 border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
          {actionError ?? data.error}
        </p>
      )}

      {data.favoriteItems.length ? (
        <section className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),320px))] justify-center gap-3 sm:justify-start">
          {data.favoriteItems.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              favorite
              onFavorite={() => void mutate(() => data.toggleFavorite(product.id))}
              onAdd={() => void mutate(() => store.useCase.addToCart(product.id, 1, "sale"))}
            />
          ))}
        </section>
      ) : (
        <section className="grid min-h-64 place-items-center border border-dashed border-zinc-300 text-center dark:border-[#343840]">
          <div>
            <strong>Aucun favori</strong>
            <p className="mt-1 text-sm text-zinc-500">Enregistrez des offres depuis le catalogue pour les retrouver ici.</p>
          </div>
        </section>
      )}
    </main>
  );
}
