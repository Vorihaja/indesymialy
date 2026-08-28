'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Pause, Play, Radio, RotateCcw, Send, ShieldCheck } from 'lucide-react';
import { OrganizerDialog, OrganizerToast, organizerButtonClass, organizerPrimaryButtonClass, type OrganizerToastState } from '@/modules/organizer-erp/components/OrganizerFeedback';
import type { UniversalRoleDefinition } from '../types';

export function UniversalLiveView({ definition }: { definition: UniversalRoleDefinition }) {
  const [seconds, setSeconds] = useState(168);
  const [running, setRunning] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState<OrganizerToastState>(null);
  const [checks, setChecks] = useState([
    ['Équipe opérationnelle', true],
    ['Systèmes synchronisés', true],
    ['Canaux de communication', true],
    ['Contrôle prioritaire', false],
  ] as Array<[string, boolean]>);

  useEffect(() => {
    if (!running || seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [running, seconds]);

  const timer = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const tone = { red: 'text-[#ff4058]', green: 'text-emerald-400', blue: 'text-[#3d92ff]' };

  return <div className='grid gap-3'>
    <OrganizerToast toast={toast} onClose={() => setToast(null)} />
    <section className='flex flex-wrap items-center justify-between gap-3 border border-[#ff1638]/50 bg-[#151012] px-3 py-2'>
      <div className='flex items-center gap-3'><span className='flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#ff2f49]'><span className='h-2 w-2 rounded-full bg-[#ff2f49] animate-pulse' />Live</span><span className='h-4 w-px bg-[#343036]' /><div><strong className='block text-[11px] font-semibold'>{definition.live.title}</strong><span className='text-[8px] text-zinc-500'>{definition.live.subtitle}</span></div></div>
      <div className='flex items-center gap-3'><span className='font-mono text-[14px] font-semibold'>19:42:18</span><button type='button' onClick={() => setDialogOpen(true)} className='flex h-8 items-center gap-2 border border-[#ff1638]/60 px-3 text-[9px] font-semibold text-[#ff4058] hover:bg-red-500/10'><AlertTriangle size={13} />Signaler</button></div>
    </section>

    <section className='grid gap-px border border-[#303238] bg-[#303238] sm:grid-cols-2 xl:grid-cols-6'>
      {definition.live.secondary.map((metric) => <article key={metric.label} className='bg-[#151619] px-3 py-2'><span className='text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-500'>{metric.label}</span><strong className={`mt-1 block truncate text-[15px] font-semibold ${metric.tone ? tone[metric.tone] : 'text-white'}`}>{metric.value}</strong><span className='text-[7px] text-zinc-600'>Mise à jour temps réel</span></article>)}
    </section>

    <section className='grid gap-3 xl:grid-cols-[1.45fr_1fr]'>
      <article className='border border-[#303238] bg-[#121316]'>
        <header className='flex items-center justify-between border-b border-[#303238] px-3 py-2'><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-[#ff4058]'>Centre opérationnel</span><span className='flex items-center gap-1 text-[8px] text-zinc-500'><Radio size={11} />Flux synchronisé</span></header>
        <div className='grid min-h-[260px] place-items-center p-4 text-center'>
          <div><span className='text-[8px] font-bold uppercase tracking-[0.15em] text-zinc-500'>{definition.live.metricLabel}</span><strong className='mt-2 block text-[36px] font-semibold tracking-[-0.05em]'>{definition.live.metric}</strong><div className='my-5 border-y border-[#303238] py-3'><span className='text-[8px] uppercase text-zinc-600'>Cycle opérationnel</span><strong className={`mt-1 block font-mono text-[38px] leading-none ${seconds <= 30 ? 'text-[#ff4058]' : 'text-[#3d92ff]'}`}>{timer}</strong></div><div className='flex flex-wrap justify-center gap-2'><button type='button' onClick={() => setRunning((current) => !current)} className={organizerPrimaryButtonClass}>{running ? <Pause size={13} /> : <Play size={13} />}{running ? 'Pause' : 'Reprendre'}</button><button type='button' onClick={() => { setSeconds(300); setRunning(false); }} className={organizerButtonClass}><RotateCcw size={13} />Réinitialiser</button><button type='button' onClick={() => setToast({ message: 'Cycle suivant préparé.', tone: 'info' })} className={organizerButtonClass}>Cycle suivant</button></div></div>
        </div>
      </article>
      <div className='grid gap-3'>
        <article className='border border-[#303238] bg-[#151619]'>
          <header className='flex items-center justify-between border-b border-[#303238] px-3 py-2'><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-400'>Checklist opérationnelle</span><span className='text-[8px] text-zinc-600'>{checks.filter(([, done]) => done).length}/{checks.length}</span></header>
          <div className='divide-y divide-[#292c31]'>{checks.map(([label, done], index) => <button key={label} type='button' onClick={() => setChecks((current) => current.map((item, itemIndex) => itemIndex === index ? [item[0], !item[1]] : item))} className='flex min-h-10 w-full items-center gap-2.5 px-3 text-left hover:bg-white/[0.025]'><span className={`grid h-4 w-4 place-items-center border ${done ? 'border-emerald-500 bg-emerald-500 text-black' : 'border-amber-500'}`}>{done && <Check size={11} />}</span><span className={`text-[9px] ${done ? 'text-zinc-500' : 'font-semibold text-amber-400'}`}>{label}</span></button>)}</div>
        </article>
        <article className='border border-[#303238] bg-[#151619]'>
          <header className='flex items-center gap-2 border-b border-[#303238] px-3 py-2'><ShieldCheck size={13} className='text-[#3d92ff]' /><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-400'>État du dispositif</span></header>
          <div className='grid grid-cols-2 gap-px bg-[#292c31]'>{[['Canal principal', 'Connecté'], ['Équipe', definition.workspaceStatus], ['Dernière synchro', 'À l’instant'], ['Incidents actifs', '1']].map(([label, value]) => <button key={label} type='button' onClick={() => setToast({ message: `${label} : ${value}`, tone: 'info' })} className='bg-[#151619] p-3 text-left hover:bg-[#191b1f]'><span className='block text-[7px] uppercase text-zinc-600'>{label}</span><strong className='mt-1 block truncate text-[9px] text-zinc-300'>{value}</strong></button>)}</div>
        </article>
      </div>
    </section>

    <OrganizerDialog open={dialogOpen} eyebrow={`${definition.label} · LIVE`} title='Créer un signalement' description='Le signalement mock est transmis aux responsables du workspace.' onClose={() => setDialogOpen(false)} footer={<><button type='button' onClick={() => setDialogOpen(false)} className={organizerButtonClass}>Annuler</button><button type='button' disabled={!message.trim()} onClick={() => { setDialogOpen(false); setMessage(''); setToast({ message: 'Signalement transmis aux responsables.', tone: 'warning' }); }} className={organizerPrimaryButtonClass}><Send size={13} />Transmettre</button></>}>
      <label className='grid gap-1'><span className='text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-500'>Description</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={5} autoFocus className='border border-[#343840] bg-[#101114] p-2.5 text-[10px] text-white outline-none focus:border-[#ff1638]' placeholder='Décris précisément la situation…' /></label>
    </OrganizerDialog>
  </div>;
}
