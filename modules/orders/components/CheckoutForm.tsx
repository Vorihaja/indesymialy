"use client";

import { useRef, useState } from "react";
import type { CheckoutInput, FulfillmentMethod, PaymentMethod } from "../types";

const methods: PaymentMethod[] = [
  { id: "cash", label: "Paiement à la remise", type: "cash", enabled: true },
  { id: "mobile", label: "Mobile money — confirmation en attente", type: "mobile_money", enabled: true },
  { id: "card", label: "Carte bancaire — non configurée", type: "card", enabled: false },
];
const fieldClass = "h-10 w-full border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-[#c82335] dark:border-[#343840] dark:bg-[#0d0e10]";
const explain = (cause: unknown) => cause instanceof Error ? cause.message : "Le checkout a échoué.";

export function CheckoutForm({ onSubmit }: { onSubmit: (input: CheckoutInput) => Promise<void> }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [fulfillment, setFulfillment] = useState<FulfillmentMethod>("delivery");
  const [method, setMethod] = useState(methods[0]);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submittingRef.current) return;
    try {
      submittingRef.current = true;
      setPending(true);
      setError(null);
      await onSubmit({ customerName: name.trim(), customerEmail: email.trim(), customerPhone: phone.trim(), address: address.trim(), fulfillment, paymentMethod: method, idempotencyKey });
    } catch (cause) {
      setError(explain(cause));
      submittingRef.current = false;
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="border border-zinc-200 bg-white dark:border-[#303238] dark:bg-[#151619]">
      <header className="border-b border-zinc-200 px-4 py-3 dark:border-[#303238]"><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#c82335]">Informations de commande</span><h2 className="mt-1 font-semibold">Coordonnées et remise</h2></header>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <label className="grid gap-1 text-xs">Nom complet<input required value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} /></label>
        <label className="grid gap-1 text-xs">Adresse e-mail<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} /></label>
        <label className="grid gap-1 text-xs">Téléphone<input value={phone} onChange={(event) => setPhone(event.target.value)} className={fieldClass} /></label>
        <label className="grid gap-1 text-xs">Mode de remise<select value={fulfillment} onChange={(event) => setFulfillment(event.target.value as FulfillmentMethod)} className={fieldClass}><option value="delivery">Livraison</option><option value="pickup">Retrait</option></select></label>
        <label className="grid gap-1 text-xs sm:col-span-2">{fulfillment === "delivery" ? "Adresse de livraison" : "Point de retrait (facultatif)"}<textarea required={fulfillment === "delivery"} value={address} onChange={(event) => setAddress(event.target.value)} className={`${fieldClass} min-h-20 py-2`} /></label>
        <label className="grid gap-1 text-xs sm:col-span-2">Mode de paiement<select value={method.id} onChange={(event) => setMethod(methods.find((item) => item.id === event.target.value) ?? methods[0])} className={fieldClass}>{methods.map((item) => <option key={item.id} value={item.id} disabled={!item.enabled}>{item.label}</option>)}</select></label>
        <p className="text-xs text-amber-700 dark:text-amber-300 sm:col-span-2">Le checkout enregistre une commande non payée. Aucun paiement n&apos;est confirmé par cette interface.</p>
        {error && <p role="alert" className="border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300 sm:col-span-2">{error}</p>}
      </div>
      <footer className="border-t border-zinc-200 p-4 dark:border-[#303238]"><button type="submit" disabled={pending} className="h-11 w-full bg-[#c82335] px-4 text-sm font-semibold text-white hover:bg-[#ad1d2e] disabled:cursor-wait disabled:opacity-60">{pending ? "Enregistrement…" : "Créer la commande — paiement en attente"}</button></footer>
    </form>
  );
}
