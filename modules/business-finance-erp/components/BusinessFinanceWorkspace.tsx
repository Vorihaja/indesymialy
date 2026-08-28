'use client';

import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Download, Filter, Plus, WalletCards, X } from 'lucide-react';
import { createBusinessFinanceMock } from '../mocks';
import type { BusinessTransaction } from '../types';

type FinanceTab = 'overview' | 'income' | 'expenses' | 'transactions';
const currency = (value: number) => `${new Intl.NumberFormat('fr-FR').format(value)} Ar`;
const fieldClass = 'h-9 w-full border border-[#343840] bg-[#0d0e10] px-2.5 text-[10px] text-zinc-100 outline-none focus:border-[#3983da]';
const buttonClass = 'inline-flex h-8 items-center justify-center gap-1.5 border border-[#343840] bg-[#16181c] px-3 text-[9px] font-semibold text-zinc-200 hover:bg-[#1d2024]';
const primaryClass = 'inline-flex h-8 items-center justify-center gap-1.5 border border-[#b91f30] bg-[#c82335] px-3 text-[9px] font-semibold text-white hover:bg-[#db2b3e]';

export function BusinessFinanceWorkspace({ entityName, roleLabel }: { entityName: string; roleLabel: string }) {
  const initial = useMemo(() => createBusinessFinanceMock(roleLabel), [roleLabel]);
  const [transactions, setTransactions] = useState(initial);
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-08-31');
  const [appliedPeriod, setAppliedPeriod] = useState({ start: '2026-08-01', end: '2026-08-31' });
  const [dialog, setDialog] = useState<'Recette' | 'Dépense' | null>(null);
  const [toast, setToast] = useState('');

  const filtered = transactions.filter((item) => item.date >= appliedPeriod.start && item.date <= appliedPeriod.end);
  const settled = filtered.filter((item) => item.status === 'Confirmé');
  const income = settled.filter((item) => item.type === 'Recette').reduce((sum, item) => sum + item.amount, 0);
  const expenses = settled.filter((item) => item.type === 'Dépense').reduce((sum, item) => sum + item.amount, 0);
  const balance = income - expenses;
  const pending = filtered.filter((item) => item.status === 'En attente').reduce((sum, item) => sum + item.amount, 0);
  const displayed = activeTab === 'income' ? filtered.filter((item) => item.type === 'Recette') : activeTab === 'expenses' ? filtered.filter((item) => item.type === 'Dépense') : filtered;
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2400); };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!dialog) return; const form = new FormData(event.currentTarget);
    const transaction: BusinessTransaction = { id: `trx-${Date.now()}`, date: String(form.get('date')), type: dialog, category: String(form.get('category')), label: String(form.get('label')), reference: String(form.get('reference')), amount: Number(form.get('amount')), method: String(form.get('method')), status: String(form.get('status')) as BusinessTransaction['status'] };
    setTransactions((current) => [transaction, ...current]); setDialog(null); notify(`${dialog} enregistrée avec succès.`);
  };

  const exportCsv = () => {
    const rows = [['Date', 'Type', 'Catégorie', 'Libellé', 'Référence', 'Montant', 'Moyen', 'Statut'], ...displayed.map((item) => [item.date, item.type, item.category, item.label, item.reference, String(item.amount), item.method, item.status])];
    const blob = new Blob([rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(';')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `finances-${entityName.toLowerCase().replaceAll(' ', '-')}.csv`; anchor.click(); URL.revokeObjectURL(url); notify('Export financier généré.');
  };

  return <div className='grid gap-3'>
    <header className='flex flex-wrap items-center justify-between gap-3 border border-[#2d3036] bg-[#121316] px-3 py-2'>
      <div><span className='block text-[7px] font-bold uppercase tracking-[0.14em] text-zinc-600'>{roleLabel} · suivi du business</span><h2 className='text-[12px] font-semibold text-white'>{entityName} · Finances</h2></div>
      <div className='flex gap-2'><button type='button' className={buttonClass} onClick={() => setDialog('Dépense')}><ArrowDownRight size={12} className='text-red-400' /> Ajouter une dépense</button><button type='button' className={primaryClass} onClick={() => setDialog('Recette')}><Plus size={12} /> Ajouter une recette</button></div>
    </header>

    <section className='flex flex-wrap items-end gap-2 border border-[#2d3036] bg-[#111215] p-2.5'>
      <label className='grid gap-1'><span className='text-[7px] font-bold uppercase text-zinc-600'>Du</span><input type='date' value={startDate} onChange={(event) => setStartDate(event.target.value)} className={`${fieldClass} !h-8`} /></label>
      <label className='grid gap-1'><span className='text-[7px] font-bold uppercase text-zinc-600'>Au</span><input type='date' value={endDate} onChange={(event) => setEndDate(event.target.value)} className={`${fieldClass} !h-8`} /></label>
      <button type='button' className={buttonClass} onClick={() => { setAppliedPeriod({ start: startDate, end: endDate }); notify('Période financière appliquée.'); }}><Filter size={11} /> Appliquer</button>
      <div className='min-w-3 flex-1' /><span className='text-[8px] text-zinc-600'>{filtered.length} opérations sur la période</span><button type='button' className={buttonClass} onClick={exportCsv}><Download size={11} /> Exporter CSV</button>
    </section>

    <section className='grid grid-cols-2 border-l border-t border-[#2d3036] lg:grid-cols-4'>
      <Metric label='Total recettes' value={currency(income)} detail={`${settled.filter((item) => item.type === 'Recette').length} encaissements`} tone='green' icon={<ArrowUpRight size={12} />} />
      <Metric label='Total dépenses' value={currency(expenses)} detail={`${settled.filter((item) => item.type === 'Dépense').length} décaissements`} tone='red' icon={<ArrowDownRight size={12} />} />
      <Metric label='Solde disponible' value={currency(balance)} detail='Recettes − dépenses confirmées' tone={balance >= 0 ? 'blue' : 'red'} icon={<WalletCards size={12} />} />
      <Metric label='À encaisser' value={currency(pending)} detail='Opérations en attente' tone='amber' icon={<ArrowUpRight size={12} />} />
    </section>

    <nav className='flex overflow-x-auto border border-[#2d3036] bg-[#111215]'>{([['overview', 'Synthèse'], ['income', 'Recettes'], ['expenses', 'Dépenses'], ['transactions', 'Toutes les transactions']] as Array<[FinanceTab, string]>).map(([id, label]) => <button key={id} type='button' onClick={() => setActiveTab(id)} className={`h-9 flex-none border-b-2 px-3 text-[9px] font-semibold ${activeTab === id ? 'border-[#ff1638] text-white' : 'border-transparent text-zinc-500 hover:text-zinc-200'}`}>{label}</button>)}</nav>

    {activeTab === 'overview' && <div className='grid gap-3 lg:grid-cols-[1.35fr_.65fr]'><TransactionTable rows={displayed.slice(0, 6)} onConfirm={(id) => { setTransactions((current) => current.map((item) => item.id === id ? { ...item, status: 'Confirmé' } : item)); notify('Transaction confirmée.'); }} /><section className='border border-[#2d3036] bg-[#121316]'><header className='border-b border-[#2d3036] p-3'><span className='text-[7px] font-bold uppercase tracking-[0.12em] text-zinc-600'>Répartition</span><h3 className='text-[10px] font-semibold text-white'>Dépenses par catégorie</h3></header><div className='grid gap-3 p-3'>{['Personnel', 'Opérations', 'Équipement', 'Déplacement'].map((category, index) => { const values = [38, 29, 19, 14]; return <div key={category}><div className='mb-1 flex justify-between text-[8px]'><span className='text-zinc-400'>{category}</span><strong className='text-zinc-200'>{values[index]} %</strong></div><div className='h-1.5 bg-[#292c31]'><div className='h-full bg-[#2588ff]' style={{ width: `${values[index]}%` }} /></div></div>; })}</div></section></div>}
    {activeTab !== 'overview' && <TransactionTable rows={displayed} onConfirm={(id) => { setTransactions((current) => current.map((item) => item.id === id ? { ...item, status: 'Confirmé' } : item)); notify('Transaction confirmée.'); }} />}

    {dialog && <div className='fixed inset-0 z-[220] grid place-items-center bg-black/75 p-4' role='dialog' aria-modal='true' onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}><div className='w-full max-w-lg border border-[#3a3e46] bg-[#121316]'><header className='flex h-11 items-center justify-between border-b border-[#30333a] px-3'><div><span className='block text-[7px] font-bold uppercase tracking-[0.14em] text-[#e23a4b]'>Nouvelle opération</span><strong className='text-[11px] text-white'>{dialog}</strong></div><button type='button' onClick={() => setDialog(null)} className='grid h-7 w-7 place-items-center border border-[#343840] text-zinc-400'><X size={13} /></button></header><form onSubmit={submit} className='grid gap-3 p-4 sm:grid-cols-2'><Field label='Date'><input name='date' type='date' required className={fieldClass} /></Field><Field label='Montant (Ar)'><input name='amount' type='number' min='1' required className={fieldClass} /></Field><Field label='Catégorie'><input name='category' required className={fieldClass} /></Field><Field label='Référence'><input name='reference' required className={fieldClass} /></Field><div className='sm:col-span-2'><Field label='Libellé'><input name='label' required className={fieldClass} /></Field></div><Field label='Moyen'><select name='method' className={fieldClass}>{['Virement', 'Mobile money', 'Carte', 'Espèces'].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label='Statut'><select name='status' className={fieldClass}><option>Confirmé</option><option>En attente</option></select></Field><div className='sm:col-span-2 flex justify-end gap-2 border-t border-[#30333a] pt-3'><button type='button' onClick={() => setDialog(null)} className={buttonClass}>Annuler</button><button className={primaryClass}>Enregistrer</button></div></form></div></div>}
    {toast && <div className='fixed bottom-4 right-4 z-[230] border border-emerald-700 bg-emerald-950 px-4 py-3 text-[9px] text-emerald-200 shadow-xl'>{toast}</div>}
  </div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className='grid gap-1'><span className='text-[8px] font-bold uppercase tracking-[0.08em] text-zinc-500'>{label}</span>{children}</label>; }

function Metric({ label, value, detail, tone, icon }: { label: string; value: string; detail: string; tone: 'green' | 'red' | 'blue' | 'amber'; icon: ReactNode }) {
  const color = tone === 'green' ? 'text-emerald-400 border-l-emerald-500' : tone === 'red' ? 'text-red-400 border-l-red-500' : tone === 'amber' ? 'text-amber-400 border-l-amber-500' : 'text-blue-400 border-l-blue-500';
  return <article className={`min-h-[82px] border-b border-r border-[#2d3036] border-l-2 bg-[#141518] p-3 ${color}`}><span className='flex items-center gap-1.5 text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600'>{icon}{label}</span><strong className={`mt-1.5 block truncate text-[19px] font-semibold ${color.split(' ')[0]}`}>{value}</strong><span className='text-[8px] text-zinc-600'>{detail}</span></article>;
}

function TransactionTable({ rows, onConfirm }: { rows: BusinessTransaction[]; onConfirm: (id: string) => void }) {
  return <section className='min-w-0 border border-[#2d3036] bg-[#121316]'><header className='border-b border-[#2d3036] p-3'><span className='text-[7px] font-bold uppercase tracking-[0.12em] text-zinc-600'>Registre financier</span><h3 className='text-[10px] font-semibold text-white'>Transactions de la période</h3></header><div className='overflow-x-auto'><table className='w-full min-w-[780px] border-collapse text-left'><thead className='bg-[#181a1e] text-[7px] uppercase tracking-[0.1em] text-zinc-600'><tr>{['Date', 'Type', 'Libellé', 'Référence', 'Montant', 'Moyen', 'Statut', 'Action'].map((head) => <th key={head} className='h-8 border-b border-[#30333a] px-3'>{head}</th>)}</tr></thead><tbody>{rows.map((item) => <tr key={item.id} className='border-b border-[#25282e] text-[9px] text-zinc-300 hover:bg-white/[0.02]'><td className='h-10 px-3'>{item.date}</td><td className={`px-3 font-semibold ${item.type === 'Recette' ? 'text-emerald-400' : 'text-red-400'}`}>{item.type}</td><td className='px-3'><strong className='block text-zinc-100'>{item.label}</strong><span className='text-[8px] text-zinc-600'>{item.category}</span></td><td className='px-3'>{item.reference}</td><td className={`px-3 font-semibold ${item.type === 'Recette' ? 'text-emerald-400' : 'text-red-400'}`}>{item.type === 'Recette' ? '+' : '−'} {currency(item.amount)}</td><td className='px-3'>{item.method}</td><td className='px-3'><span className={`border px-1.5 py-1 text-[8px] ${item.status === 'Confirmé' ? 'border-emerald-800 text-emerald-300' : 'border-amber-800 text-amber-300'}`}>{item.status}</span></td><td className='px-3'>{item.status === 'En attente' ? <button type='button' className='text-[8px] text-blue-400' onClick={() => onConfirm(item.id)}>Confirmer</button> : <span className='text-[8px] text-zinc-700'>Rapproché</span>}</td></tr>)}</tbody></table></div></section>;
}
