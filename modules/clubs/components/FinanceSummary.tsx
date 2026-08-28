"use client";

import type { ClubTransaction } from "../types";

interface FinanceSummaryProps {
  transactions: ClubTransaction[];
  revenue: number;
}

export default function FinanceSummary({
  transactions,
  revenue,
}: FinanceSummaryProps) {
  const expenses = transactions.reduce((total, transaction) => {
    if (transaction.transaction_type === "expense") {
      return total + transaction.amount;
    }
    return total;
  }, 0);

  return (
    <div className="space-y-3 rounded-[2px] border border-[#303238] bg-[#151619] p-4 text-zinc-100">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#3d92ff]">Synthèse</p>
        <h3 className="mt-1 text-lg font-semibold">Situation financière</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[2px] border border-[#303238] bg-[#0f1012] p-3">
          <p className="text-xs uppercase tracking-[.08em] text-zinc-500">Revenus</p>
          <p className="mt-1 text-xl font-bold text-emerald-300">{revenue}</p>
        </div>
        <div className="rounded-[2px] border border-[#303238] bg-[#0f1012] p-3">
          <p className="text-xs uppercase tracking-[.08em] text-zinc-500">Dépenses</p>
          <p className="mt-1 text-xl font-bold text-red-300">{expenses}</p>
        </div>
      </div>
      <div className="border-t border-[#303238] pt-3">
        <p className="text-xs font-semibold uppercase tracking-[.08em] text-zinc-500">
          Transactions récentes :
        </p>
        {transactions.slice(0, 5).map((transaction) => (
          <div
            key={transaction.id}
            className="flex justify-between gap-3 border-b border-[#303238] py-2 text-sm last:border-b-0"
          >
            <span className="text-zinc-300">{transaction.label}</span>
            <span className={transaction.transaction_type === "expense" ? "font-semibold text-red-300" : "font-semibold text-emerald-300"}>
              {transaction.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
