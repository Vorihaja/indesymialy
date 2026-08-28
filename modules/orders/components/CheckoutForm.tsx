"use client";

import { useState } from "react";
import type {
  CheckoutInput,
  FulfillmentMethod,
  PaymentMethod,
} from "../types";

const methods: PaymentMethod[] = [
  {
    id: "cash",
    label: "Paiement à la remise",
    type: "cash",
    enabled: true,
  },
  {
    id: "mobile",
    label: "Paiement mobile (préparé)",
    type: "mobile_money",
    enabled: true,
  },
  {
    id: "card",
    label: "Carte bancaire (non connectée)",
    type: "card",
    enabled: false,
  },
];

const fieldClass =
  "h-9 w-full border border-[#343840] bg-[#0d0e10] px-2.5 text-[9px] text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-[#2588ff]";

function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`grid gap-1 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-[7px] font-bold uppercase tracking-[0.08em] text-zinc-600">
        {label}
      </span>
      {children}
    </label>
  );
}

export function CheckoutForm({
  onSubmit,
}: {
  onSubmit: (input: CheckoutInput) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [fulfillment, setFulfillment] =
    useState<FulfillmentMethod>("delivery");
  const [method, setMethod] = useState(methods[0]);
  const [success, setSuccess] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await onSubmit({
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      address,
      fulfillment,
      paymentMethod: method,
    });
    setSuccess(true);
  }

  if (success) {
    return (
      <section className="border border-[#1d5b43] bg-[#0d2119] p-6 text-center">
        <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-emerald-500">
          Enregistrement réussi
        </span>
        <h2 className="mt-1 text-[16px] font-semibold text-emerald-300">
          Commande confirmée
        </h2>
        <p className="mt-2 text-[9px] text-zinc-400">
          Votre commande provisoire a été enregistrée.
        </p>
      </section>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="border border-[#303238] bg-[#151619]"
    >
      <header className="border-b border-[#303238] px-3 py-2">
        <span className="text-[7px] font-bold uppercase tracking-[0.12em] text-[#3d92ff]">
          Informations de commande
        </span>
        <h2 className="mt-0.5 text-[10px] font-semibold text-zinc-200">
          Coordonnées et remise
        </h2>
      </header>

      <div className="grid gap-3 p-3 sm:grid-cols-2">
        <Field label="Nom complet">
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nom complet"
            className={fieldClass}
          />
        </Field>
        <Field label="Adresse e-mail">
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Adresse e-mail"
            className={fieldClass}
          />
        </Field>
        <Field label="Téléphone">
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Téléphone"
            className={fieldClass}
          />
        </Field>
        <Field label="Mode de remise">
          <select
            value={fulfillment}
            onChange={(event) =>
              setFulfillment(event.target.value as FulfillmentMethod)
            }
            className={fieldClass}
          >
            <option value="delivery">Livraison</option>
            <option value="pickup">Retrait</option>
          </select>
        </Field>
        <Field label="Adresse ou point de retrait" wide>
          <textarea
            required
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Adresse ou point de retrait"
            className={`min-h-20 resize-y py-2 ${fieldClass}`}
          />
        </Field>
        <Field label="Mode de paiement" wide>
          <select
            value={method.id}
            onChange={(event) =>
              setMethod(
                methods.find((item) => item.id === event.target.value) ??
                  methods[0],
              )
            }
            className={fieldClass}
          >
            {methods.map((item) => (
              <option key={item.id} value={item.id} disabled={!item.enabled}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <footer className="border-t border-[#303238] p-3">
        <button className="h-10 w-full border border-[#b91f30] bg-[#c82335] px-4 text-[9px] font-semibold uppercase tracking-[0.08em] text-white hover:bg-[#ad1d2e]">
          Confirmer sans paiement externe
        </button>
      </footer>
    </form>
  );
}
