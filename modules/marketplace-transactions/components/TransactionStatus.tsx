import type { MarketplaceTransaction, PaymentStatus } from "../types";

const statusLabels: Record<PaymentStatus, string> = {
  unpaid: "Non payée",
  pending: "En attente",
  paid: "Payée",
  failed: "Échouée",
  refunded: "Remboursée",
};

const statusStyles: Record<PaymentStatus, string> = {
  unpaid: "border-orange-800/70 bg-orange-950/40 text-orange-300",
  pending: "border-amber-800/70 bg-amber-950/40 text-amber-300",
  paid: "border-emerald-800/70 bg-emerald-950/40 text-emerald-300",
  failed: "border-red-800/70 bg-red-950/40 text-red-300",
  refunded: "border-sky-800/70 bg-sky-950/40 text-sky-300",
};

export function TransactionStatus({
  transaction,
}: {
  transaction: MarketplaceTransaction;
}) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-[2px] border px-2 py-1 text-[10px] font-semibold ${statusStyles[transaction.paymentStatus]}`}
    >
      {statusLabels[transaction.paymentStatus]}
    </span>
  );
}
