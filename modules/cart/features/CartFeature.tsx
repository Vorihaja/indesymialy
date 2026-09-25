"use client";

import Link from "next/link";
import { useAuth } from "@/modules/auth/hooks";
import { CartSummary } from "../components/CartSummary";
import { useCart } from "../hooks";

const unitPrice = (item: ReturnType<typeof useCart>["items"][number]) =>
  item.mode === "rental"
    ? (item.product.rentalPricePerDay ?? 0) * (item.rental?.days ?? 1)
    : item.product.salePrice ?? 0;

export function CartFeature() {
  const auth = useAuth();
  const cart = useCart();

  if (auth.loading || cart.loading) {
    return <main className="mx-auto max-w-[1250px] px-3 py-5 sm:px-5"><p>Chargement du panier…</p></main>;
  }

  if (!auth.authenticated) {
    return (
      <main className="mx-auto grid min-h-72 max-w-[1250px] place-items-center px-3 py-5 text-center sm:px-5">
        <div><h1 className="text-lg font-semibold">Connexion requise</h1><p className="mt-2 text-sm text-zinc-500">Votre panier persistant est disponible après connexion.</p><Link href="/auth" className="mt-4 inline-flex bg-[#c82335] px-4 py-2 text-sm font-semibold text-white">Se connecter</Link></div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1250px] px-3 py-5 sm:px-5">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-zinc-200 pb-3 dark:border-[#303238]">
        <div><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c82335]">Votre sélection</span><h1 className="mt-1 text-xl font-semibold">Panier · {cart.summary.itemCount} article(s)</h1><p className="mt-1 text-xs text-zinc-500">Les quantités et prix ci-dessous viennent du panier persistant.</p></div>
        {cart.items.length > 0 && <button type="button" disabled={cart.acting} onClick={() => void cart.clear().catch(() => undefined)} className="text-xs font-semibold uppercase text-[#c82335] disabled:opacity-50">Vider le panier</button>}
      </header>

      {cart.error && <p role="alert" className="mb-4 border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">{cart.error}</p>}

      {cart.items.length ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="divide-y divide-zinc-200 border border-zinc-200 bg-white dark:divide-[#292c31] dark:border-[#303238] dark:bg-[#151619]">
            {cart.items.map((item) => {
              const price = unitPrice(item);
              return (
                <article key={item.id} className="grid gap-3 p-3 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-center">
                  <div className="h-16 w-[72px] overflow-hidden bg-zinc-100 dark:bg-[#0d0f12]">
                    {item.product.images[0] ? <>
                      {/* Marketplace media can use persisted external URLs. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.product.images[0]} alt="" className="h-full w-full object-cover" />
                    </> : null}
                  </div>
                  <div className="min-w-0">
                    <Link href={`/marketplace/products/${item.product.id}`} className="truncate text-sm font-semibold hover:text-[#c82335]">{item.product.title}</Link>
                    <p className="mt-1 text-xs text-zinc-500">{item.product.sellerName} · {item.mode === "rental" ? `Location ${item.rental?.days ?? 1} jour(s)` : "Vente"}</p>
                    <p className="mt-1 text-xs"><span className="text-zinc-500">Prix unitaire </span>{price.toLocaleString("fr-FR")} Ar · <strong>{(price * item.quantity).toLocaleString("fr-FR")} Ar</strong></p>
                    {item.product.stock <= 0 && <p className="mt-1 text-xs text-red-600">Produit indisponible : retirez-le avant le paiement.</p>}
                  </div>
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <div className="flex h-9 items-center border border-zinc-300 dark:border-[#383c44]">
                      <button type="button" disabled={cart.acting} onClick={() => void cart.update(item, item.quantity - 1).catch(() => undefined)} aria-label="Réduire la quantité" className="h-full w-9 disabled:opacity-40">−</button>
                      <span className="grid h-full w-9 place-items-center border-x border-zinc-300 text-sm dark:border-[#383c44]">{item.quantity}</span>
                      <button type="button" disabled={cart.acting || item.quantity >= item.product.stock} onClick={() => void cart.update(item, item.quantity + 1).catch(() => undefined)} aria-label="Augmenter la quantité" className="h-full w-9 disabled:opacity-40">+</button>
                    </div>
                    <button type="button" disabled={cart.acting} onClick={() => void cart.remove(item.id).catch(() => undefined)} className="text-xs font-semibold text-[#c82335] disabled:opacity-40">Retirer</button>
                  </div>
                </article>
              );
            })}
          </section>
          <aside className="h-max"><CartSummary summary={cart.summary} /><Link href="/marketplace/checkout" aria-disabled={cart.items.some((item) => item.product.stock <= 0)} className="mt-2 flex h-10 items-center justify-center bg-[#c82335] px-4 text-sm font-semibold text-white hover:bg-[#ad1d2e]">Passer au checkout</Link></aside>
        </div>
      ) : (
        <section className="grid min-h-[300px] place-items-center border border-dashed border-zinc-300 text-center dark:border-[#343840]"><div><strong>Votre panier est vide</strong><p className="mt-1 text-sm text-zinc-500">Ajoutez une offre réelle depuis le catalogue.</p><Link href="/marketplace" className="mt-4 inline-flex bg-[#c82335] px-4 py-2 text-sm font-semibold text-white">Découvrir le catalogue</Link></div></section>
      )}
    </main>
  );
}
