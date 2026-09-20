import type {
  DeliveryRecord,
} from "../types";

const statusLabels:
  Record<
    DeliveryRecord["status"],
    string
  > = {
  pending: "En attente",
  prepared: "Préparée",
  in_transit: "En transit",
  ready: "Prête",
  completed: "Terminée",
  failed: "Échec / annulée",
};

const statusStyles:
  Record<
    DeliveryRecord["status"],
    string
  > = {
  pending:
    "border-amber-800/70 bg-amber-950/40 text-amber-300",

  prepared:
    "border-blue-800/70 bg-blue-950/40 text-blue-300",

  in_transit:
    "border-sky-800/70 bg-sky-950/40 text-sky-300",

  ready:
    "border-emerald-800/70 bg-emerald-950/40 text-emerald-300",

  completed:
    "border-emerald-800/70 bg-emerald-950/40 text-emerald-300",

  failed:
    "border-red-800/70 bg-red-950/40 text-red-300",
};

export function DeliveryStatus({
  delivery,
}: {
  delivery: DeliveryRecord;
}) {
  return (
    <span
      className={`inline-flex border px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.08em] ${statusStyles[delivery.status]}`}
    >
      {statusLabels[delivery.status]}
    </span>
  );
}