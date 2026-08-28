"use client";

import type {
  ComplianceAlert,
  FinanceSummary,
  ProfessionalRecord,
  RecordStatus,
} from "../types";

const statusStyle: Record<RecordStatus, string> = {
  draft: "border-[#454952] bg-[#202226] text-zinc-300",
  pending: "border-[#71581b] bg-[#241d0c] text-amber-300",
  active: "border-[#1d5b43] bg-[#0d2119] text-emerald-300",
  expired: "border-[#5f1c28] bg-[#220d12] text-[#ff7a8b]",
  suspended: "border-[#70411f] bg-[#25160c] text-orange-300",
  revoked: "border-[#5f1c28] bg-[#220d12] text-[#ff7a8b]",
  rejected: "border-[#5f1c28] bg-[#220d12] text-[#ff7a8b]",
  paid: "border-[#1d5b43] bg-[#0d2119] text-emerald-300",
  unpaid: "border-[#5f1c28] bg-[#220d12] text-[#ff7a8b]",
  cancelled: "border-[#454952] bg-[#202226] text-zinc-300",
};

export function StatusBadge({ status }: { status: RecordStatus }) {
  return (
    <span
      className={`inline-flex border px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] ${statusStyle[status]}`}
    >
      {status}
    </span>
  );
}

export function ProfessionalStats({
  finance,
  alerts,
  count,
}: {
  finance: FinanceSummary;
  alerts: ComplianceAlert[];
  count: number;
}) {
  const cards = [
    { label: "Dossiers", value: String(count), tone: "border-l-[#087cff]" },
    {
      label: "Revenus",
      value: `${finance.income.toLocaleString("fr-FR")} ${finance.currency}`,
      tone: "border-l-emerald-500",
    },
    {
      label: "Solde",
      value: `${finance.balance.toLocaleString("fr-FR")} ${finance.currency}`,
      tone: "border-l-[#087cff]",
    },
    {
      label: "Alertes",
      value: String(alerts.filter((item) => item.status === "open").length),
      tone: "border-l-[#ed1b2f]",
    },
  ];

  return (
    <section className="grid gap-px overflow-hidden border border-[#303238] bg-[#303238] sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.label}
          className={`min-h-[76px] border-l-2 bg-[#151619] px-3 py-2 ${card.tone}`}
        >
          <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-500">
            {card.label}
          </p>
          <p className="mt-1.5 truncate text-[18px] font-semibold tracking-[-0.03em] text-zinc-100">
            {card.value}
          </p>
        </article>
      ))}
    </section>
  );
}

export function ProfessionalTable({
  records,
  onRemove,
}: {
  records: ProfessionalRecord[];
  onRemove: (id: string) => void;
}) {
  if (!records.length) {
    return (
      <div className="border border-dashed border-[#454952] bg-[#111214] p-8 text-center text-[10px] text-zinc-500">
        Aucun dossier pour ces filtres.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-[#303238] bg-[#151619]">
      <table className="w-full min-w-[760px] text-left text-[10px]">
        <thead className="bg-[#111214] text-[8px] uppercase tracking-[0.08em] text-zinc-500">
          <tr>
            <th className="p-3">Dossier</th>
            <th className="p-3">Référence</th>
            <th className="p-3">Échéance</th>
            <th className="p-3">Confidentialité</th>
            <th className="p-3">Statut</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {records.map((item) => (
            <tr key={item.id} className="border-t border-[#292c31]">
              <td className="p-3">
                <strong className="font-semibold text-zinc-200">{item.title}</strong>
                <p className="mt-0.5 text-[9px] text-zinc-500">{item.subtitle}</p>
              </td>
              <td className="p-3 text-zinc-400">{item.reference ?? "—"}</td>
              <td className="p-3 text-zinc-400">{item.expiresAt ?? "—"}</td>
              <td className="p-3">
                <span className="border border-[#343840] bg-[#111214] px-2 py-1 text-[8px] uppercase text-zinc-400">
                  {item.visibility}
                </span>
              </td>
              <td className="p-3">
                <StatusBadge status={item.status} />
              </td>
              <td className="p-3">
                <button
                  onClick={() => onRemove(item.id)}
                  className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#ff596d] hover:text-[#ff7a8b]"
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ComplianceAlerts({ alerts }: { alerts: ComplianceAlert[] }) {
  return (
    <section className="border border-[#303238] bg-[#151619]">
      <header className="border-b border-[#303238] px-3 py-2">
        <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#3d92ff]">
          Suivi réglementaire
        </p>
        <h2 className="mt-0.5 text-[11px] font-semibold text-zinc-100">
          Alertes et échéances
        </h2>
      </header>
      <div className="divide-y divide-[#292c31]">
        {alerts.map((alert) => (
          <article
            key={alert.id}
            className="flex flex-wrap items-center justify-between gap-3 px-3 py-3"
          >
            <div>
              <strong className="text-[10px] font-semibold text-zinc-200">
                {alert.label}
              </strong>
              <p className="mt-0.5 text-[9px] text-zinc-500">
                Échéance : {alert.dueAt ?? "non définie"} · {alert.visibility}
              </p>
            </div>
            <span
              className={
                alert.severity === "critical"
                  ? "text-[9px] font-bold uppercase text-[#ff596d]"
                  : alert.severity === "warning"
                    ? "text-[9px] font-bold uppercase text-amber-300"
                    : "text-[9px] font-bold uppercase text-[#3d92ff]"
              }
            >
              {alert.severity}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
