"use client";

import { useState } from "react";

import { StockBadge } from "../components/StockBadge";
import { useInventory } from "../hooks";

const adjustmentFieldClassName =
  "h-9 rounded-[2px] border border-[#303238] bg-[#0d0f12] px-2 text-xs text-zinc-200 outline-none transition-colors hover:border-[#454951] focus:border-[#3d92ff]";

export function InventoryFeature() {
  const data = useInventory();
  const [quantity, setQuantity] = useState("0");
  const [reason, setReason] = useState("Ajustement manuel");

  if (data.loading) {
    return (
      <p className="rounded-[2px] border border-[#303238] bg-[#151619] p-5 text-sm text-zinc-500">
        Chargement du stock…
      </p>
    );
  }

  return (
    <section className="space-y-4 text-zinc-100">
      <header className="border-b border-[#303238] pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
          Inventaire vendeur
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
          Stock
        </h1>
      </header>

      <div className="overflow-x-auto rounded-[2px] border border-[#303238] bg-[#151619]">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-[#101114] text-[10px] uppercase tracking-[0.1em] text-zinc-500">
            <tr>
              <th className="p-3">Produit</th>
              <th className="p-3">Disponible</th>
              <th className="p-3">Réservé</th>
              <th className="p-3">État</th>
              <th className="p-3">Ajustement</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr
                key={item.productId}
                className="border-t border-[#303238] text-zinc-300 transition-colors hover:bg-white/[0.02]"
              >
                <td className="p-3 font-semibold text-white">{item.title}</td>
                <td className="p-3">{item.available}</td>
                <td className="p-3">{item.reserved}</td>
                <td className="p-3">
                  <StockBadge item={item} />
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      aria-label={`Quantité à ajuster pour ${item.title}`}
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value)}
                      className={`w-20 ${adjustmentFieldClassName}`}
                    />
                    <input
                      aria-label={`Motif de l’ajustement pour ${item.title}`}
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      className={`min-w-44 flex-1 ${adjustmentFieldClassName}`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        void data.adjust(
                          item.productId,
                          Number(quantity),
                          reason,
                        )
                      }
                      className="h-9 rounded-[2px] border border-[#087cff] bg-[#087cff] px-3 text-xs font-bold text-white transition-colors hover:bg-[#2165c8]"
                    >
                      Ajuster
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!data.items.length && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-500">
                  Aucun stock.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
