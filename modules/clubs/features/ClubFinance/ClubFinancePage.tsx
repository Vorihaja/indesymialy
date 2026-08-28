"use client";

import { useState } from "react";
import { useClubFinance } from "../../hooks/useClubFinance";
import FinanceSummary from "../../components/FinanceSummary";

const panelClass = "rounded-[2px] border border-[#303238] bg-[#151619] p-4";
const controlClass = "h-10 w-full rounded-[2px] border border-[#303238] bg-[#0f1012] px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[#3d92ff]";
const primaryActionClass = "h-10 rounded-[2px] border border-[#ff1638] bg-[#ff1638] px-4 text-sm font-bold text-white transition hover:bg-[#d91d35]";
const secondaryActionClass = "rounded-[2px] border border-[#3d92ff] bg-[#3d92ff]/10 px-4 py-2 text-sm font-semibold text-[#78b5ff] transition hover:bg-[#3d92ff]/20 hover:text-white";

export default function ClubFinancePage({ organizationId }: { organizationId: string }) {
  const { transactions, revenue, loading, error, refresh, recordPayment } = useClubFinance(organizationId);
  const [type, setType] = useState("income");
  const [category, setCategory] = useState("");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");

  async function submit() {
    const value = Number(amount);
    if (!category || !label || !Number.isFinite(value) || value <= 0) return;
    await recordPayment({ organization_id: organizationId, transaction_type: type, category, label, amount: value, transaction_date: new Date().toISOString().slice(0, 10) });
  }

  return (
    <section className="space-y-4 text-zinc-100">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#303238] pb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#3d92ff]">Espace club</p>
          <h1 className="mt-1 text-2xl font-bold">Finances</h1>
          <p className="mt-1 text-sm text-zinc-400">Opérations du club.</p>
        </div>
        <button className={secondaryActionClass} onClick={refresh}>Actualiser</button>
      </div>
      <div className={`grid gap-3 sm:grid-cols-2 xl:grid-cols-[150px_1fr_1fr_160px_auto] ${panelClass}`}>
        <label className="grid gap-1.5 text-xs font-semibold text-zinc-300">Type<select className={controlClass} value={type} onChange={(event) => setType(event.target.value)}><option value="income">Entrée</option><option value="expense">Dépense</option></select></label>
        <label className="grid gap-1.5 text-xs font-semibold text-zinc-300">Catégorie<input className={controlClass} value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Catégorie"/></label>
        <label className="grid gap-1.5 text-xs font-semibold text-zinc-300">Libellé<input className={controlClass} value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Libellé"/></label>
        <label className="grid gap-1.5 text-xs font-semibold text-zinc-300">Montant<input className={controlClass} type="number" min="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Montant"/></label>
        <button className={`${primaryActionClass} self-end`} onClick={() => void submit()}>Enregistrer</button>
      </div>
      {loading ? <p className={panelClass}>Chargement...</p> : error ? <p role="alert" className="rounded-[2px] border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-300">{error}</p> : <FinanceSummary transactions={transactions} revenue={revenue}/>}
    </section>
  );
}
