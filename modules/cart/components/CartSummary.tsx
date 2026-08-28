import type { CartSummary as Summary } from "../types";

export function CartSummaryPanel({ summary }: { summary: Summary }) {
  return (
    <section className="border border-[#303238] bg-[#151619]">
      <header className="border-b border-[#303238] px-3 py-2">
        <span className="text-[7px] font-bold uppercase tracking-[0.12em] text-[#3d92ff]">
          Commande
        </span>
        <h2 className="mt-0.5 text-[10px] font-semibold text-zinc-200">
          Récapitulatif
        </h2>
      </header>
      <div className="grid gap-2 p-3 text-[8px]">
        <div className="flex justify-between text-zinc-500">
          <span>Sous-total</span>
          <span className="font-semibold text-zinc-300">
            {summary.subtotal.toLocaleString()} Ar
          </span>
        </div>
        <div className="flex justify-between text-zinc-500">
          <span>Frais estimés</span>
          <span className="font-semibold text-zinc-300">
            {summary.fees.toLocaleString()} Ar
          </span>
        </div>
        <div className="mt-1 flex items-end justify-between border-t border-[#303238] pt-3">
          <span className="text-[9px] font-semibold text-zinc-300">Total</span>
          <strong className="text-[17px] font-semibold text-zinc-100">
            {summary.total.toLocaleString()} Ar
          </strong>
        </div>
      </div>
    </section>
  );
}

export const CartSummary = CartSummaryPanel;
