"use client";

import Link from "next/link";
import { CartSummary } from "../components/CartSummary";
import { useCart } from "../hooks";

export function CartFeature() {
  const cart = useCart();

  if (cart.loading) {
    return (
      <main className="mx-auto max-w-[1250px] bg-[#090a0c] px-3 py-5 sm:px-5">
        <p className="border border-[#303238] bg-[#151619] p-6 text-[9px] text-zinc-500">
          Chargement du panier…
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1250px] bg-[#090a0c] px-3 py-5 sm:px-5">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-[#303238] pb-3">
        <div>
          <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
            Votre sélection
          </span>
          <h1 className="mt-1 text-[18px] font-semibold text-zinc-100">
            Panier · {cart.summary.itemCount} article(s)
          </h1>
          <p className="mt-1 text-[8px] text-zinc-600">
            Vérifiez les articles et les quantités avant de poursuivre.
          </p>
        </div>
        {cart.items.length > 0 && (
          <button
            onClick={() => void cart.clear()}
            className="text-[8px] font-semibold uppercase tracking-[0.08em] text-[#ff596d] hover:text-[#ff7a8b]"
          >
            Vider le panier
          </button>
        )}
      </header>

      {cart.items.length ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="border border-[#303238] bg-[#151619]">
            <div className="hidden h-8 grid-cols-[minmax(0,1fr)_110px_90px] items-center border-b border-[#303238] px-3 text-[7px] font-bold uppercase text-zinc-600 sm:grid">
              <span>Article</span>
              <span>Quantité</span>
              <span>Action</span>
            </div>
            {cart.items.map((item) => (
              <article
                key={item.id}
                className="grid gap-3 border-b border-[#292c31] p-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_110px_90px] sm:items-center"
              >
                <div className="min-w-0">
                  <h2 className="truncate text-[9px] font-semibold text-zinc-200">
                    {item.product.title}
                  </h2>
                  <p className="mt-1 text-[7px] text-zinc-600">
                    {item.mode === "rental"
                      ? `Location · ${item.rental?.days ?? 1} jour(s)`
                      : "Vente"}
                  </p>
                </div>
                <div className="flex h-8 w-max items-center border border-[#383c44] bg-[#111214]">
                  <button
                    onClick={() => void cart.update(item, item.quantity - 1)}
                    className="grid h-full w-8 place-items-center text-zinc-500 hover:text-white"
                    aria-label="Réduire la quantité"
                  >
                    −
                  </button>
                  <span className="grid h-full w-8 place-items-center border-x border-[#383c44] text-[8px] text-zinc-200">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => void cart.update(item, item.quantity + 1)}
                    className="grid h-full w-8 place-items-center text-zinc-500 hover:text-white"
                    aria-label="Augmenter la quantité"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => void cart.remove(item.id)}
                  className="w-fit text-[8px] font-semibold uppercase tracking-[0.08em] text-[#ff596d] hover:text-[#ff7a8b]"
                >
                  Retirer
                </button>
              </article>
            ))}
          </section>

          <aside className="h-max">
            <CartSummary summary={cart.summary} />
            <Link
              href="/marketplace/checkout"
              className="mt-2 flex h-10 items-center justify-center border border-[#b91f30] bg-[#c82335] px-4 text-[9px] font-semibold uppercase tracking-[0.08em] text-white hover:bg-[#ad1d2e]"
            >
              Valider le panier
            </Link>
          </aside>
        </div>
      ) : (
        <section className="grid min-h-[320px] place-items-center border border-dashed border-[#343840] bg-[#111214] text-center">
          <div>
            <strong className="text-[11px] font-semibold text-zinc-300">
              Votre panier est vide
            </strong>
            <p className="mt-1 text-[8px] text-zinc-600">
              Découvrez les offres disponibles dans le catalogue.
            </p>
            <Link
              href="/marketplace"
              className="mt-4 inline-flex h-9 items-center border border-[#b91f30] bg-[#c82335] px-4 text-[9px] font-semibold text-white hover:bg-[#ad1d2e]"
            >
              Découvrir le catalogue
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
