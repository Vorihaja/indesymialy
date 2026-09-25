"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modules/auth/hooks";
import { useCart } from "@/modules/cart";
import { CartSummaryPanel } from "@/modules/cart/components/CartSummary";
import { CheckoutForm } from "../components/CheckoutForm";
import { useOrders } from "../hooks";

export function CheckoutFeature() {
  const auth = useAuth();
  const cart = useCart();
  const orders = useOrders(false);
  const router = useRouter();

  if (auth.loading || cart.loading) return <main className="mx-auto max-w-5xl p-4 py-8"><p>Chargement du checkout…</p></main>;
  if (!auth.authenticated) return <main className="mx-auto grid min-h-72 max-w-5xl place-items-center p-4 text-center"><div><h1 className="text-lg font-semibold">Connexion requise</h1><p className="mt-2 text-sm text-zinc-500">Le checkout utilise votre panier persistant.</p><Link href="/auth" className="mt-4 inline-flex bg-[#c82335] px-4 py-2 text-white">Se connecter</Link></div></main>;

  return (
    <main className="mx-auto max-w-5xl p-4 py-8">
      <header className="mb-5"><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c82335]">Finalisation sécurisée</span><h1 className="mt-1 text-2xl font-semibold">Checkout</h1></header>
      {(cart.error || orders.error) && <p role="alert" className="mb-4 border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">{cart.error ?? orders.error}</p>}
      {!cart.items.length ? <section className="border border-dashed border-zinc-300 p-10 text-center dark:border-[#343840]"><strong>Votre panier est vide</strong><p className="mt-2 text-sm text-zinc-500">Ajoutez un produit disponible avant de poursuivre.</p><Link href="/marketplace" className="mt-4 inline-flex bg-[#c82335] px-4 py-2 text-white">Retour au catalogue</Link></section> : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.85fr)]">
          <section className="space-y-3"><h2 className="font-semibold">Commande persistée</h2>{cart.items.map((item) => <article key={item.id} className="flex justify-between gap-4 border-b border-zinc-200 py-2 text-sm dark:border-[#303238]"><span>{item.product.title} × {item.quantity}</span><span className="shrink-0 text-zinc-500">{item.product.sellerName}</span></article>)}<CartSummaryPanel summary={cart.summary} /><p className="text-xs text-zinc-500">Les frais définitifs sont calculés par le backend selon la remise choisie.</p></section>
          <CheckoutForm onSubmit={async (input) => { const order = await orders.checkout(input); router.push(`/marketplace/orders/${order.id}`); }} />
        </div>
      )}
    </main>
  );
}
