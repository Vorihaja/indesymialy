'use client';

import { useState } from 'react';
import {
  ArrowRight, CalendarDays, Check, ChevronRight, CircleAlert, Clock3, Dumbbell,
  HeartPulse, MessageSquare, Scale, ShieldCheck, Swords, Target, TrendingUp,
} from 'lucide-react';
import type { FighterModuleId } from '../types';
import { OrganizerToast, type OrganizerToastState } from '@/modules/organizer-erp/components/OrganizerFeedback';

const kpis = [
  { label: 'Record professionnel', value: '11–2–1', detail: '7 finishes', tone: 'red' },
  { label: 'Classement national', value: '#3', detail: '+2 places', tone: 'blue' },
  { label: 'Poids actuel', value: '72,1 kg', detail: 'objectif 70,3 kg', tone: 'amber' },
  { label: 'Forme globale', value: '86 / 100', detail: '+7 pts ce mois', tone: 'green' },
  { label: 'Camp de combat', value: '64 %', detail: '18 jours restants', tone: 'blue' },
  { label: 'Revenus 2026', value: '22,1 M Ar', detail: '+18 % vs 2025', tone: 'green' },
] as const;

const toneBorder = { red: 'border-l-[#ff1638]', blue: 'border-l-[#087cff]', amber: 'border-l-amber-500', green: 'border-l-emerald-500' };

export function FighterOverview({ onNavigate }: { onNavigate: (id: FighterModuleId, tab?: string) => void }) {
  const [toast, setToast] = useState<OrganizerToastState>(null);
  const [tasks, setTasks] = useState([
    { label: 'Confirmer le rendez-vous ECG', due: 'Aujourd’hui · 14:00', done: false },
    { label: 'Valider le plan tactique Round 2', due: 'Aujourd’hui · 18:30', done: false },
    { label: 'Envoyer le BAT short au sponsor', due: 'Demain · 10:00', done: false },
    { label: 'Licence fédérale renouvelée', due: 'Terminé', done: true },
  ]);

  const toggleTask = (index: number) => {
    setTasks((current) => current.map((task, taskIndex) => taskIndex === index ? { ...task, done: !task.done } : task));
  };

  return (
    <div className='grid gap-3'>
      <OrganizerToast toast={toast} onClose={() => setToast(null)} />
      <section className='grid grid-cols-2 gap-px border border-[#303238] bg-[#303238] md:grid-cols-3 xl:grid-cols-6'>
        {kpis.map((kpi) => (
          <article key={kpi.label} className={`min-h-[74px] border-l-2 bg-[#151619] px-3 py-2 ${toneBorder[kpi.tone]}`}>
            <span className='text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-500'>{kpi.label}</span>
            <strong className='mt-1.5 block truncate text-[17px] font-semibold tracking-[-0.03em]'>{kpi.value}</strong>
            <span className='mt-0.5 block text-[8px] text-zinc-500'>{kpi.detail}</span>
          </article>
        ))}
      </section>

      <section className='grid gap-3 xl:grid-cols-[1.45fr_1fr_1fr]'>
        <article className='border border-[#303238] bg-[#151619]'>
          <header className='flex items-center justify-between border-b border-[#303238] px-3 py-2'>
            <span className='text-[8px] font-bold uppercase tracking-[0.12em] text-[#ff4058]'>Prochain combat</span>
            <span className='flex items-center gap-1.5 text-[8px] text-zinc-500'><Clock3 size={12} />18 jours · 08:42:16</span>
          </header>
          <div className='p-3'>
            <div className='flex items-center justify-between gap-4'>
              <div><strong className='text-[14px] font-semibold'>Mahajanga Fight Night Vol.3</strong><span className='mt-1 block text-[9px] text-zinc-500'>30 août 2026 · Stade Rabemananjara</span></div>
              <span className='border border-[#ff1638]/50 bg-[#ff1638]/10 px-2 py-1 text-[8px] font-bold uppercase text-[#ff4058]'>Main card</span>
            </div>
            <div className='my-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-y border-[#292c31] py-3'>
              <div><span className='text-[8px] uppercase text-zinc-500'>Coin rouge</span><button type='button' onClick={() => setToast({ message: 'Profil public de Tiana Rakoto ouvert.', tone: 'info' })} className='mt-1 block text-left text-[12px] font-semibold hover:text-[#3d92ff]'>Tiana Rakoto</button><span className='text-[8px] text-zinc-500'>11–2–1 · Dojo Sakura</span></div>
              <span className='font-mono text-[10px] text-zinc-600'>VS</span>
              <div className='text-right'><span className='text-[8px] uppercase text-zinc-500'>Coin bleu</span><button type='button' onClick={() => setToast({ message: 'Profil public d’Andriamahefa Nomena ouvert.', tone: 'info' })} className='mt-1 block w-full text-right text-[12px] font-semibold hover:text-[#3d92ff]'>Andriamahefa Nomena</button><span className='text-[8px] text-zinc-500'>9–3–0 · Boeny Fight Club</span></div>
            </div>
            <div className='flex flex-wrap gap-2'>
              <button type='button' onClick={() => onNavigate('fight-preparation', 'Camp')} className='flex h-8 items-center gap-2 bg-[#ff1638] px-3 text-[9px] font-semibold text-white hover:bg-[#e23245]'><Target size={13} />Ouvrir la préparation</button>
              <button type='button' onClick={() => onNavigate('fight-room')} className='flex h-8 items-center gap-2 border border-[#3a3e46] px-3 text-[9px] font-semibold text-zinc-300 hover:bg-white/[0.04]'><Swords size={13} />Fight Room</button>
            </div>
          </div>
        </article>

        <article className='border border-[#303238] bg-[#151619]'>
          <header className='border-b border-[#303238] px-3 py-2'><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-400'>Camp MFN Vol.3</span></header>
          <div className='grid gap-3 p-3'>
            {[['Préparation physique', 82], ['Plan tactique', 68], ['Poids', 77], ['Administratif', 92], ['Récupération', 73]].map(([label, value]) => <div key={String(label)}><div className='mb-1 flex justify-between text-[8px]'><span className='text-zinc-500'>{label}</span><strong className='font-mono text-zinc-300'>{value} %</strong></div><div className='h-1 bg-[#292c31]'><div className='h-full bg-[#087cff]' style={{ width: `${value}%` }} /></div></div>)}
          </div>
          <button type='button' onClick={() => onNavigate('fight-preparation', 'Camp')} className='flex h-9 w-full items-center justify-between border-t border-[#303238] px-3 text-[9px] text-zinc-400 hover:bg-white/[0.03] hover:text-white'>Voir le camp<ChevronRight size={13} /></button>
        </article>

        <article className='border border-[#303238] bg-[#151619]'>
          <header className='flex items-center justify-between border-b border-[#303238] px-3 py-2'><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-400'>Alertes & décisions</span><span className='text-[8px] text-[#ff4058]'>3 requises</span></header>
          <div className='divide-y divide-[#292c31]'>
            {[
              ['ECG pré-combat à compléter', 'Médical', HeartPulse],
              ['Invitation TCS 8 à étudier', 'Compétition', CalendarDays],
              ['BAT sponsor à valider', 'Sponsor', ShieldCheck],
              ['Hydratation sous la cible', 'Poids', Scale],
            ].map(([label, category, Icon]) => {
              const AlertIcon = Icon as typeof CircleAlert;
              return <button key={String(label)} type='button' onClick={() => setToast({ message: `${label} · action ouverte`, tone: 'warning' })} className='flex min-h-11 w-full items-center gap-2.5 px-3 text-left hover:bg-white/[0.025]'><AlertIcon size={14} className='text-amber-400' /><span className='min-w-0 flex-1'><strong className='block truncate text-[9px] font-semibold text-zinc-300'>{String(label)}</strong><span className='text-[8px] text-zinc-600'>{String(category)}</span></span><ChevronRight size={12} className='text-zinc-700' /></button>;
            })}
          </div>
        </article>
      </section>

      <section className='grid gap-3 xl:grid-cols-[1fr_1fr_1fr]'>
        <article className='border border-[#303238] bg-[#151619]'>
          <header className='flex items-center justify-between border-b border-[#303238] px-3 py-2'><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-400'>Aujourd’hui</span><Dumbbell size={13} className='text-[#3d92ff]' /></header>
          <div className='divide-y divide-[#292c31]'>
            {[['06:30', 'Conditionnement', 'Terminé'], ['14:00', 'Rendez-vous ECG', 'À venir'], ['17:30', 'Sparring MMA', 'Confirmé'], ['19:15', 'Débrief vidéo', 'Planifié']].map(([time, label, status]) => <button key={time} type='button' onClick={() => onNavigate(status === 'Terminé' ? 'training' : status === 'À venir' ? 'health' : 'training')} className='grid min-h-10 w-full grid-cols-[42px_1fr_auto] items-center gap-2 px-3 text-left hover:bg-white/[0.025]'><span className='font-mono text-[9px] text-zinc-500'>{time}</span><strong className='text-[9px] font-semibold text-zinc-300'>{label}</strong><span className='text-[8px] text-zinc-600'>{status}</span></button>)}
          </div>
        </article>

        <article className='border border-[#303238] bg-[#151619]'>
          <header className='flex items-center justify-between border-b border-[#303238] px-3 py-2'><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-400'>Poids · 7 jours</span><button type='button' onClick={() => onNavigate('health', 'Poids')} className='text-[8px] text-[#3d92ff] hover:text-white'>Détails</button></header>
          <div className='flex h-[154px] items-end gap-2 p-3'>
            {[74.1, 73.8, 73.4, 73.1, 72.9, 72.5, 72.1].map((weight, index) => <div key={weight} className='flex h-full flex-1 flex-col justify-end gap-1'><span className='text-center font-mono text-[7px] text-zinc-600'>{weight}</span><div className='bg-[#087cff]' style={{ height: `${36 + (weight - 70) * 14}%` }} /><span className='text-center text-[7px] text-zinc-600'>J-{6 - index}</span></div>)}
          </div>
        </article>

        <article className='border border-[#303238] bg-[#151619]'>
          <header className='flex items-center justify-between border-b border-[#303238] px-3 py-2'><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-400'>Tâches prioritaires</span><span className='text-[8px] text-zinc-600'>{tasks.filter((task) => !task.done).length} restantes</span></header>
          <div className='divide-y divide-[#292c31]'>{tasks.map((task, index) => <button key={task.label} type='button' onClick={() => toggleTask(index)} className='flex min-h-10 w-full items-center gap-2.5 px-3 text-left hover:bg-white/[0.025]'><span className={`grid h-4 w-4 flex-none place-items-center border ${task.done ? 'border-emerald-500 bg-emerald-500 text-black' : 'border-[#454952]'}`}>{task.done && <Check size={11} />}</span><span className='min-w-0 flex-1'><strong className={`block truncate text-[9px] ${task.done ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>{task.label}</strong><span className='text-[7px] text-zinc-600'>{task.due}</span></span></button>)}</div>
        </article>
      </section>

      <section className='grid gap-3 lg:grid-cols-2'>
        <article className='border border-[#303238] bg-[#151619]'>
          <header className='flex items-center justify-between border-b border-[#303238] px-3 py-2'><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-400'>Équipe active</span><button type='button' onClick={() => onNavigate('team')} className='text-[8px] text-[#3d92ff]'>Gérer</button></header>
          <div className='grid grid-cols-2 gap-px bg-[#292c31] sm:grid-cols-4'>{[['Hery Randria', 'Coach principal'], ['Feno Razaka', 'Préparateur'], ['Lalao Ramanana', 'Manager'], ['Dr Lova Rakoto', 'Médecin']].map(([name, role]) => <button key={name} type='button' onClick={() => setToast({ message: `Profil public de ${name}`, tone: 'info' })} className='bg-[#151619] p-3 text-left hover:bg-[#191b1f]'><span className='grid h-7 w-7 place-items-center rounded-full bg-[#252830] text-[9px] font-semibold text-zinc-300'>{name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><strong className='mt-2 block truncate text-[9px] text-zinc-300'>{name}</strong><span className='text-[7px] text-zinc-600'>{role}</span></button>)}</div>
        </article>
        <article className='border border-[#303238] bg-[#151619]'>
          <header className='flex items-center justify-between border-b border-[#303238] px-3 py-2'><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-400'>Activité récente</span><TrendingUp size={13} className='text-emerald-400' /></header>
          <div className='divide-y divide-[#292c31]'>{[
            ['Coach Hery a validé le plan tactique', 'Il y a 24 min'],
            ['Boeny Nutrition a approuvé la publication', 'Il y a 1 h'],
            ['Nouvelle invitation · Tana Combat Series 8', 'Il y a 3 h'],
            ['Dr Lova a ajouté un compte rendu', 'Hier · 18:42'],
          ].map(([event, time]) => <button key={event} type='button' onClick={() => setToast({ message: event, tone: 'info' })} className='flex min-h-10 w-full items-center gap-2 px-3 text-left hover:bg-white/[0.025]'><MessageSquare size={12} className='text-zinc-600' /><span className='min-w-0 flex-1 truncate text-[9px] text-zinc-400'>{event}</span><span className='text-[7px] text-zinc-600'>{time}</span><ArrowRight size={11} className='text-zinc-700' /></button>)}</div>
        </article>
      </section>
    </div>
  );
}
