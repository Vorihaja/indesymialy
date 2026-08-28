'use client';

import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, CalendarRange, RotateCcw, WalletCards } from 'lucide-react';
import type { OrganizerModuleMock } from '@/modules/organizer-erp/types';
import { ModuleDataView } from '@/modules/organizer-erp/components/ModuleDataView';
import { fighterFinanceLedger } from '../mocks/finance-ledger.mock';

const settledStatuses = new Set(['Reçu', 'Payé', 'Validé']);
const mockToday = '2026-08-11';

function formatAr(value: number) {
  return `${value.toLocaleString('fr-FR')} Ar`;
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

function shiftDate(date: string, days: number) {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function DatePicker({ value, onChange, min, max }: { value: string; onChange: (value: string) => void; min?: string; max?: string }) {
  return <input type='date' value={value} min={min} max={max} onChange={(event) => onChange(event.target.value)} onClick={(event) => event.currentTarget.showPicker()} onKeyDown={(event) => event.preventDefault()} onPaste={(event) => event.preventDefault()} className='h-8 cursor-pointer border border-[#343840] bg-[#101114] px-2 text-[9px] text-zinc-200 outline-none focus:border-[#087cff]' />;
}

export function FighterFinanceView({ data, tab, onTabChange }: {
  data: OrganizerModuleMock;
  tab: string;
  onTabChange: (tab: string) => void;
}) {
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');

  const filteredEntries = useMemo(() => fighterFinanceLedger.filter((entry) => entry.date >= startDate && entry.date <= endDate), [endDate, startDate]);
  const settledEntries = filteredEntries.filter((entry) => settledStatuses.has(entry.status));
  const income = settledEntries.filter((entry) => entry.type === 'Recette').reduce((sum, entry) => sum + entry.amount, 0);
  const expenses = settledEntries.filter((entry) => entry.type === 'Dépense').reduce((sum, entry) => sum + entry.amount, 0);
  const balance = income - expenses;
  const pendingIncome = filteredEntries.filter((entry) => entry.type === 'Recette' && !settledStatuses.has(entry.status)).reduce((sum, entry) => sum + entry.amount, 0);

  const filteredData = useMemo<OrganizerModuleMock>(() => {
    const relevant = tab === 'Revenus'
      ? filteredEntries.filter((entry) => entry.type === 'Recette')
      : tab === 'Dépenses'
        ? filteredEntries.filter((entry) => entry.type === 'Dépense')
        : filteredEntries;
    if (!['Synthèse', 'Revenus', 'Dépenses'].includes(tab)) return data;
    const columns = tab === 'Synthèse'
      ? ['Date', 'Opération', 'Type', 'Catégorie', 'Montant net', 'Statut']
      : tab === 'Revenus'
        ? ['Date', 'Source', 'Référence', 'Brut', 'Retenues', 'Net', 'Statut']
        : ['Date', 'Dépense', 'Catégorie', 'Prestataire', 'Montant', 'Statut'];
    const rows = relevant.map((entry) => tab === 'Synthèse'
      ? [dateLabel(entry.date), entry.label, entry.type, entry.category, formatAr(entry.amount), entry.status]
      : tab === 'Revenus'
        ? [dateLabel(entry.date), entry.source, entry.reference, formatAr(entry.gross), formatAr(entry.fees), formatAr(entry.amount), entry.status]
        : [dateLabel(entry.date), entry.label, entry.category, entry.source, formatAr(entry.amount), entry.status]);
    return { ...data, columns, rows };
  }, [data, filteredEntries, tab]);

  const setPreset = (preset: '30' | '90' | 'year' | 'all') => {
    if (preset === '30' || preset === '90') {
      setEndDate(mockToday);
      setStartDate(shiftDate(mockToday, preset === '30' ? -29 : -89));
      return;
    }
    setStartDate(preset === 'year' ? '2026-01-01' : '2025-01-01');
    setEndDate(preset === 'year' ? '2026-12-31' : '2027-12-31');
  };

  return <div className='grid gap-3'>
    <section className='border border-[#303238] bg-[#151619]'>
      <header className='flex flex-wrap items-end justify-between gap-3 border-b border-[#303238] px-3 py-2'>
        <div><span className='flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-400'><CalendarRange size={13} className='text-[#3d92ff]' />Période financière</span><p className='mt-1 text-[8px] text-zinc-600'>Les montants disponibles incluent uniquement les recettes reçues et les dépenses payées ou validées.</p></div>
        <div className='flex flex-wrap items-end gap-1.5'>
          <label className='grid gap-1'><span className='text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600'>Du</span><DatePicker value={startDate} max={endDate} onChange={setStartDate} /></label>
          <label className='grid gap-1'><span className='text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600'>Au</span><DatePicker value={endDate} min={startDate} onChange={setEndDate} /></label>
          <button type='button' onClick={() => setPreset('30')} className='h-8 border border-[#343840] px-2.5 text-[8px] font-semibold text-zinc-400 hover:text-white'>30 jours</button>
          <button type='button' onClick={() => setPreset('90')} className='h-8 border border-[#343840] px-2.5 text-[8px] font-semibold text-zinc-400 hover:text-white'>90 jours</button>
          <button type='button' onClick={() => setPreset('year')} className='h-8 border border-[#087cff] bg-blue-500/10 px-2.5 text-[8px] font-semibold text-[#3d92ff]'>2026</button>
          <button type='button' onClick={() => setPreset('all')} className='grid h-8 w-8 place-items-center border border-[#343840] text-zinc-500 hover:text-white' aria-label='Afficher toute la période'><RotateCcw size={12} /></button>
        </div>
      </header>
      <div className='grid gap-px bg-[#303238] sm:grid-cols-2 xl:grid-cols-4'>
        <article className='border-l-2 border-l-emerald-500 bg-[#151619] px-3 py-2.5'><span className='flex items-center gap-1.5 text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-500'><ArrowUpRight size={11} className='text-emerald-400' />Total recettes</span><strong className='mt-1.5 block text-[19px] font-semibold text-emerald-400'>{formatAr(income)}</strong><span className='text-[8px] text-zinc-600'>Recettes encaissées · {settledEntries.filter((entry) => entry.type === 'Recette').length} opérations</span></article>
        <article className='border-l-2 border-l-[#ff1638] bg-[#151619] px-3 py-2.5'><span className='flex items-center gap-1.5 text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-500'><ArrowDownRight size={11} className='text-[#ff4058]' />Total dépenses</span><strong className='mt-1.5 block text-[19px] font-semibold text-[#ff4058]'>{formatAr(expenses)}</strong><span className='text-[8px] text-zinc-600'>Dépenses décaissées · {settledEntries.filter((entry) => entry.type === 'Dépense').length} opérations</span></article>
        <article className='border-l-2 border-l-[#087cff] bg-[#151619] px-3 py-2.5'><span className='flex items-center gap-1.5 text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-500'><WalletCards size={11} className='text-[#3d92ff]' />Solde disponible</span><strong className={`mt-1.5 block text-[19px] font-semibold ${balance >= 0 ? 'text-[#3d92ff]' : 'text-[#ff4058]'}`}>{formatAr(balance)}</strong><span className='text-[8px] text-zinc-600'>Recettes moins dépenses réalisées</span></article>
        <article className='border-l-2 border-l-amber-500 bg-[#151619] px-3 py-2.5'><span className='text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-500'>À recevoir</span><strong className='mt-1.5 block text-[19px] font-semibold text-amber-400'>{formatAr(pendingIncome)}</strong><span className='text-[8px] text-zinc-600'>{filteredEntries.length} mouvements sur la période</span></article>
      </div>
      <footer className='flex h-8 items-center justify-between border-t border-[#303238] px-3 text-[8px] text-zinc-600'><span>Période : {dateLabel(startDate)} → {dateLabel(endDate)}</span><span>{filteredEntries.length} écritures filtrées</span></footer>
    </section>
    <ModuleDataView key={`finance-${tab}-${startDate}-${endDate}`} data={filteredData} tab={tab} onTabChange={onTabChange} hideKpis />
  </div>;
}
