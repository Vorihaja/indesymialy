import type { InventoryItem } from "../types";

export function StockBadge({ item }: { item: InventoryItem }) {
  const outOfStock = item.available === 0;
  const lowStock = !outOfStock && item.available <= item.lowStockThreshold;
  const state = outOfStock
    ? "Rupture"
    : lowStock
      ? "Stock faible"
      : "Disponible";
  const style = outOfStock
    ? "border-red-800/70 bg-red-950/40 text-red-300"
    : lowStock
      ? "border-amber-800/70 bg-amber-950/40 text-amber-300"
      : "border-emerald-800/70 bg-emerald-950/40 text-emerald-300";

  return (
    <span
      className={`inline-flex rounded-[2px] border px-2 py-1 text-[10px] font-semibold ${style}`}
    >
      {state}
    </span>
  );
}
