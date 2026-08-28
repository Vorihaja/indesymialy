'use client';

import { useState } from 'react';
import { AlertTriangle, ArrowRight, Check, ChevronRight, CircleAlert, Clock3, Gauge, MessageSquare, Plus, Radio, TrendingUp } from 'lucide-react';
import { OrganizerDialog, OrganizerToast, organizerButtonClass, organizerPrimaryButtonClass, type OrganizerToastState } from '@/modules/organizer-erp/components/OrganizerFeedback';
import type { UniversalRoleDefinition } from '../types';

const toneBorder = { red: 'border-l-[#ff1638]', blue: 'border-l-[#087cff]', green: 'border-l-emerald-500', amber: 'border-l-amber-500' };
const severityTone = { critical: 'text-[#ff4058]', warning: 'text-amber-400', info: 'text-[#3d92ff]' };

export function UniversalOverview({ definition, onNavigate }: { definition: UniversalRoleDefinition; onNavigate: (moduleId: string, tab?: string) => void }) {
  const [toast, setToast] = useState<OrganizerToastState>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tasks, setTasks] = useState([
    { label: `Contrôler · ${definition.overview.alerts[0]?.label}`, done: false },
    { label: `Valider · ${definition.overview.focusTitle}`, done: false },
    { label: 'Préparer le rapport opérationnel', done: false },
    { label: 'Synchronisation quotidienne', done: true },
  ]);

  return <div className='grid gap-3'>
    <OrganizerToast toast={toast} onClose={() => setToast(null)} />
    <section className='grid grid-cols-2 gap-px border border-[#303238] bg-[#303238] md:grid-cols-3 xl:grid-cols-6'>
      {definition.overview.kpis.map((kpi) => <article key={kpi.label} className={`min-h-[74px] border-l-2 bg-[#151619] px-3 py-2 ${toneBorder[kpi.tone]}`}><span className='text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-500'>{kpi.label}</span><strong className='mt-1.5 block truncate text-[17px] font-semibold tracking-[-0.03em]'>{kpi.value}</strong><span className='mt-0.5 block truncate text-[8px] text-zinc-500'>{kpi.detail}</span></article>)}
    </section>

    <section className='grid gap-3 xl:grid-cols-[1.35fr_1fr_1fr]'>
      <article className='border border-[#303238] bg-[#151619]'>
        <header className='flex items-center justify-between border-b border-[#303238] px-3 py-2'><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-[#ff4058]'>{definition.overview.focusLabel}</span><span className='flex items-center gap-1 text-[8px] text-zinc-500'><Clock3 size={11} />Mise à jour instantanée</span></header>
        <div className='p-3'>
          <strong className='block text-[14px] font-semibold'>{definition.overview.focusTitle}</strong><span className='mt-1 block text-[9px] text-zinc-500'>{definition.overview.focusDetail}</span>
          <div className='mt-4 flex items-end justify-between gap-4'><div className='flex-1'><div className='mb-1.5 flex justify-between text-[8px]'><span className='uppercase tracking-[0.08em] text-zinc-500'>Readiness opérationnelle</span><strong className='font-mono text-zinc-300'>{definition.overview.readiness} %</strong></div><div className='h-1.5 bg-[#292c31]'><div className='h-full bg-[#ff1638]' style={{ width: `${definition.overview.readiness}%` }} /></div></div><Gauge size={34} className='text-[#3d92ff]' /></div>
          <div className='mt-4 flex flex-wrap gap-2'>{definition.overview.quickActions.slice(0, 2).map((action, index) => <button key={action.label} type='button' onClick={() => onNavigate(action.moduleId, action.tab)} className={index === 0 ? organizerPrimaryButtonClass : organizerButtonClass}>{index === 0 ? <ArrowRight size={13} /> : <Plus size={13} />}{action.label}</button>)}</div>
        </div>
      </article>

      <article className='border border-[#303238] bg-[#151619]'>
        <header className='flex items-center justify-between border-b border-[#303238] px-3 py-2'><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-400'>Alertes & décisions</span><button type='button' onClick={() => setDialogOpen(true)} className='text-[8px] text-[#3d92ff] hover:text-white'>Tout voir</button></header>
        <div className='divide-y divide-[#292c31]'>{definition.overview.alerts.map((alert) => <button key={alert.label} type='button' onClick={() => setToast({ message: `${alert.label} · action ouverte`, tone: alert.severity === 'critical' ? 'warning' : 'info' })} className='flex min-h-12 w-full items-center gap-2.5 px-3 text-left hover:bg-white/[0.025]'><CircleAlert size={14} className={severityTone[alert.severity]} /><span className='min-w-0 flex-1'><strong className='block truncate text-[9px] font-semibold text-zinc-300'>{alert.label}</strong><span className='block truncate text-[7px] text-zinc-600'>{alert.detail}</span></span><ChevronRight size={12} className='text-zinc-700' /></button>)}</div>
      </article>

      <article className='border border-[#303238] bg-[#151619]'>
        <header className='flex items-center justify-between border-b border-[#303238] px-3 py-2'><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-400'>Actions rapides</span><Radio size={12} className='text-[#ff4058]' /></header>
        <div className='grid gap-px bg-[#292c31]'>{definition.overview.quickActions.map((action) => <button key={action.label} type='button' onClick={() => onNavigate(action.moduleId, action.tab)} className='flex min-h-11 items-center justify-between bg-[#151619] px-3 text-left text-[9px] font-semibold text-zinc-400 hover:bg-[#191b1f] hover:text-white'><span>{action.label}</span><ArrowRight size={12} /></button>)}</div>
      </article>
    </section>

    <section className='grid gap-3 lg:grid-cols-2'>
      <article className='border border-[#303238] bg-[#151619]'>
        <header className='flex items-center justify-between border-b border-[#303238] px-3 py-2'><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-400'>Tâches prioritaires</span><span className='text-[8px] text-zinc-600'>{tasks.filter((task) => !task.done).length} restantes</span></header>
        <div className='divide-y divide-[#292c31]'>{tasks.map((task, index) => <button key={task.label} type='button' onClick={() => setTasks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, done: !item.done } : item))} className='flex min-h-10 w-full items-center gap-2.5 px-3 text-left hover:bg-white/[0.025]'><span className={`grid h-4 w-4 place-items-center border ${task.done ? 'border-emerald-500 bg-emerald-500 text-black' : 'border-[#454952]'}`}>{task.done && <Check size={11} />}</span><span className={`text-[9px] ${task.done ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>{task.label}</span></button>)}</div>
      </article>
      <article className='border border-[#303238] bg-[#151619]'>
        <header className='flex items-center justify-between border-b border-[#303238] px-3 py-2'><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-400'>Activité récente</span><TrendingUp size={12} className='text-emerald-400' /></header>
        <div className='divide-y divide-[#292c31]'>{definition.overview.activity.map((activity) => <button key={activity.label} type='button' onClick={() => setToast({ message: activity.label, tone: 'info' })} className='flex min-h-10 w-full items-center gap-2.5 px-3 text-left hover:bg-white/[0.025]'><MessageSquare size={12} className='text-zinc-600' /><span className='min-w-0 flex-1 truncate text-[9px] text-zinc-400'>{activity.label}</span><span className='text-[7px] text-zinc-600'>{activity.detail}</span><ChevronRight size={11} className='text-zinc-700' /></button>)}</div>
      </article>
    </section>

    <OrganizerDialog open={dialogOpen} eyebrow={definition.label} title='Centre des alertes' description='Toutes les alertes opérationnelles du workspace.' onClose={() => setDialogOpen(false)} footer={<button type='button' onClick={() => setDialogOpen(false)} className={organizerPrimaryButtonClass}>Fermer</button>}>
      <div className='divide-y divide-[#292c31] border border-[#303238]'>{definition.overview.alerts.map((alert) => <div key={alert.label} className='flex gap-3 p-3'><AlertTriangle size={14} className={severityTone[alert.severity]} /><div><strong className='block text-[10px] text-zinc-200'>{alert.label}</strong><span className='text-[8px] text-zinc-500'>{alert.detail}</span></div></div>)}</div>
    </OrganizerDialog>
  </div>;
}
