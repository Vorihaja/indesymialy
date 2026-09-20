'use client';

import { useState } from 'react';
import {
  Bell, CalendarDays, Check, ChevronRight, Clock3, Heart, MessageCircle,
  Play, Radio, ShoppingBag, Star, TicketCheck, Trophy, Users,
} from 'lucide-react';
import { OrganizerToast, type OrganizerToastState } from '@/modules/organizer-erp/components/OrganizerFeedback';

type Navigate = (moduleId: string, tab?: string) => void;

export function FanOverview({ onNavigate }: { onNavigate: Navigate }) {
  const [toast, setToast] = useState<OrganizerToastState>(null);
  const [prediction, setPrediction] = useState<'red' | 'blue' | null>('red');
  const [reminder, setReminder] = useState(false);
  const [favorites, setFavorites] = useState(new Set(['Tiana Rakoto', 'Dojo Sakura']));

  const toggleFavorite = (name: string) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return <div className='grid gap-3'>
    <OrganizerToast toast={toast} onClose={() => setToast(null)} />

    <section className='grid gap-3 xl:grid-cols-[1.5fr_1fr]'>
      <article className='relative overflow-hidden border border-[#3b3034] bg-[#151113]'>
        <div className='absolute inset-y-0 left-0 w-[3px] bg-[#ff1638]' />
        <header className='flex flex-wrap items-center justify-between gap-2 border-b border-[#342d31] px-4 py-3'>
          <div className='flex items-center gap-2'><span className='h-2 w-2 rounded-full bg-[#ff2f49] animate-pulse' /><span className='text-[8px] font-bold uppercase tracking-[0.14em] text-[#ff4058]'>Prochain événement</span></div>
          <span className='flex items-center gap-1.5 text-[8px] text-zinc-500'><Clock3 size={11} />18 jours · 08:42:16</span>
        </header>
        <div className='p-4'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div><strong className='block text-[16px] font-semibold'>Mahajanga Fight Night Vol.3</strong><span className='mt-1 block text-[9px] text-zinc-500'>30 août 2026 · Stade Rabemananjara</span></div>
            <span className='border border-[#167EFF]/50 bg-blue-500/10 px-2 py-1 text-[8px] font-bold uppercase text-[#4094FF]'>Main card</span>
          </div>

          <div className='my-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-y border-[#342d31] py-4'>
            <button type='button' onClick={() => setToast({ message: 'Profil public de Tiana Rakoto.', tone: 'info' })} className='text-left'>
              <span className='text-[7px] font-bold uppercase tracking-[0.1em] text-[#ff4058]'>Coin rouge</span>
              <strong className='mt-1 block text-[13px] text-zinc-100 hover:text-[#ff4058]'>Tiana Rakoto</strong>
              <span className='text-[8px] text-zinc-500'>11–2–1 · Dojo Sakura</span>
            </button>
            <span className='font-mono text-[9px] text-zinc-700'>VS</span>
            <button type='button' onClick={() => setToast({ message: 'Profil public d’Andriamahefa Nomena.', tone: 'info' })} className='text-right'>
              <span className='text-[7px] font-bold uppercase tracking-[0.1em] text-[#3d92ff]'>Coin bleu</span>
              <strong className='mt-1 block text-[13px] text-zinc-100 hover:text-[#3d92ff]'>Andriamahefa Nomena</strong>
              <span className='text-[8px] text-zinc-500'>9–3–0 · Boeny Fight Club</span>
            </button>
          </div>

          <div className='flex flex-wrap gap-2'>
            <button type='button' onClick={() => onNavigate('live')} className='flex h-8 items-center gap-2 bg-[#ff1638] px-3 text-[9px] font-semibold text-white hover:bg-[#e23245]'><Radio size={13} />Ouvrir le Live Center</button>
            <button type='button' onClick={() => { setReminder((current) => !current); setToast({ message: reminder ? 'Rappel désactivé.' : 'Rappel activé pour le 30 août.', tone: 'info' }); }} className={`flex h-8 items-center gap-2 border px-3 text-[9px] font-semibold ${reminder ? 'border-[#087cff] bg-blue-500/10 text-[#3d92ff]' : 'border-[#3a3e46] text-zinc-300'}`}><Bell size={13} />{reminder ? 'Rappel activé' : 'Me rappeler'}</button>
          </div>
        </div>
      </article>

      <article className='border border-[#303238] bg-[#151619]'>
        <header className='flex items-center justify-between border-b border-[#303238] px-3 py-2'><span className='flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-400'><TicketCheck size={13} className='text-[#3d92ff]' />Mon billet</span><span className='text-[8px] text-emerald-400'>Confirmé</span></header>
        <div className='p-4'>
          <span className='text-[7px] font-bold uppercase tracking-[0.12em] text-zinc-600'>MFN Vol.3 · Zone Premium</span>
          <strong className='mt-2 block text-[18px] font-semibold'>Tribune B · Rang 04</strong>
          <div className='mt-3 grid grid-cols-2 gap-px bg-[#303238]'>
            <div className='bg-[#111214] p-2.5'><span className='text-[7px] uppercase text-zinc-600'>Porte</span><strong className='mt-1 block text-[11px]'>P2</strong></div>
            <div className='bg-[#111214] p-2.5'><span className='text-[7px] uppercase text-zinc-600'>Ouverture</span><strong className='mt-1 block text-[11px]'>17:30</strong></div>
          </div>
          <button type='button' onClick={() => onNavigate('tickets', 'Mes billets')} className='mt-3 flex h-8 w-full items-center justify-between border border-[#343840] px-3 text-[9px] font-semibold text-zinc-300 hover:bg-white/[0.04]'>Afficher le billet<ChevronRight size={13} /></button>
        </div>
      </article>
    </section>

    <section className='grid grid-cols-2 gap-px border border-[#303238] bg-[#303238] md:grid-cols-3 xl:grid-cols-6'>
      {[
        ['Combattants suivis', '18', '4 combattent ce mois', Users, 'text-[#3d92ff]'],
        ['Événements à venir', '6', '2 billets réservés', CalendarDays, 'text-[#ff4058]'],
        ['Pronostics réussis', '68 %', '34 sur 50', Trophy, 'text-emerald-400'],
        ['Points supporter', '8 420', 'Niveau Or', Star, 'text-amber-400'],
        ['Contenus sauvés', '42', '8 nouvelles vidéos', Play, 'text-[#3d92ff]'],
        ['Commandes', '7', '1 en livraison', ShoppingBag, 'text-emerald-400'],
      ].map(([label, value, detail, Icon, color]) => {
        const MetricIcon = Icon as typeof Users;
        return <button key={String(label)} type='button' onClick={() => setToast({ message: `${label} : ${value}`, tone: 'info' })} className='bg-[#151619] p-3 text-left hover:bg-[#191b1f]'><MetricIcon size={13} className={String(color)} /><span className='mt-2 block text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600'>{String(label)}</span><strong className='mt-1 block text-[17px] font-semibold'>{String(value)}</strong><span className='text-[7px] text-zinc-600'>{String(detail)}</span></button>;
      })}
    </section>

    <section className='grid gap-3 xl:grid-cols-[1fr_1fr_1fr]'>
      <article className='border border-[#303238] bg-[#151619]'>
        <header className='flex items-center justify-between border-b border-[#303238] px-3 py-2'><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-400'>Mon pronostic</span><button type='button' onClick={() => onNavigate('community', 'Pronostics')} className='text-[8px] text-[#3d92ff]'>Tous</button></header>
        <div className='p-3'>
          <strong className='block text-[10px]'>Qui remportera le Main Event ?</strong>
          <div className='mt-3 grid grid-cols-2 gap-2'>
            <button type='button' onClick={() => setPrediction('red')} className={`min-h-14 border p-2 text-left ${prediction === 'red' ? 'border-[#ff1638] bg-red-500/10' : 'border-[#343840]'}`}><span className='text-[7px] uppercase text-[#ff4058]'>Coin rouge</span><strong className='mt-1 block text-[9px]'>Tiana Rakoto</strong><span className='text-[8px] text-zinc-600'>54 % communauté</span></button>
            <button type='button' onClick={() => setPrediction('blue')} className={`min-h-14 border p-2 text-left ${prediction === 'blue' ? 'border-[#087cff] bg-blue-500/10' : 'border-[#343840]'}`}><span className='text-[7px] uppercase text-[#3d92ff]'>Coin bleu</span><strong className='mt-1 block text-[9px]'>A. Nomena</strong><span className='text-[8px] text-zinc-600'>46 % communauté</span></button>
          </div>
          <button type='button' disabled={!prediction} onClick={() => setToast({ message: 'Pronostic enregistré · +25 points potentiels.' })} className='mt-2 flex h-8 w-full items-center justify-center gap-2 bg-[#087cff] text-[9px] font-semibold text-white disabled:opacity-40'><Check size={12} />Valider mon pronostic</button>
        </div>
      </article>

      <article className='border border-[#303238] bg-[#151619]'>
        <header className='flex items-center justify-between border-b border-[#303238] px-3 py-2'><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-400'>Mes favoris</span><button type='button' onClick={() => onNavigate('following')} className='text-[8px] text-[#3d92ff]'>Gérer</button></header>
        <div className='divide-y divide-[#292c31]'>{[
          ['Tiana Rakoto', 'Combattante · #3 national'],
          ['Dojo Sakura', 'Club · Analamanga'],
          ['Andry Tahina', 'Combattant · #6 national'],
          ['MFN Promotion', 'Organisateur · 8 événements'],
        ].map(([name, detail]) => <div key={name} className='flex min-h-11 items-center gap-2.5 px-3'><button type='button' onClick={() => setToast({ message: `Profil public : ${name}`, tone: 'info' })} className='min-w-0 flex-1 text-left'><strong className='block truncate text-[9px] text-zinc-300'>{name}</strong><span className='text-[7px] text-zinc-600'>{detail}</span></button><button type='button' onClick={() => toggleFavorite(name)} className={favorites.has(name) ? 'text-[#ff4058]' : 'text-zinc-700 hover:text-zinc-300'} aria-label={favorites.has(name) ? `Retirer ${name} des favoris` : `Ajouter ${name} aux favoris`}><Heart size={14} fill={favorites.has(name) ? 'currentColor' : 'none'} /></button></div>)}</div>
      </article>

      <article className='border border-[#303238] bg-[#151619]'>
        <header className='flex items-center justify-between border-b border-[#303238] px-3 py-2'><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-400'>Récompenses</span><span className='text-[8px] text-amber-400'>Niveau Or</span></header>
        <div className='p-3'>
          <div className='flex items-end justify-between'><div><span className='text-[7px] uppercase text-zinc-600'>Solde actuel</span><strong className='mt-1 block text-[21px] font-semibold text-amber-400'>8 420 pts</strong></div><Star size={28} className='text-amber-400' /></div>
          <div className='mt-3 h-1.5 bg-[#292c31]'><div className='h-full w-[84%] bg-amber-500' /></div>
          <div className='mt-1 flex justify-between text-[7px] text-zinc-600'><span>Or</span><span>1 580 pts avant Platine</span></div>
          <button type='button' onClick={() => onNavigate('rewards', 'Avantages')} className='mt-3 flex h-8 w-full items-center justify-between border border-[#343840] px-3 text-[9px] text-zinc-300 hover:bg-white/[0.04]'>Voir mes avantages<ChevronRight size={13} /></button>
        </div>
      </article>
    </section>

    <section className='grid gap-3 lg:grid-cols-[1.4fr_1fr]'>
      <article className='border border-[#303238] bg-[#151619]'>
        <header className='flex items-center justify-between border-b border-[#303238] px-3 py-2'><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-400'>Pour vous</span><button type='button' onClick={() => onNavigate('content', 'Pour vous')} className='text-[8px] text-[#3d92ff]'>Tout afficher</button></header>
        <div className='grid gap-px bg-[#292c31] sm:grid-cols-3'>{[
          ['Road to MFN · Épisode 3', 'Tiana Rakoto', '08:42', 'Vidéo'],
          ['Analyse du Main Event', 'Indesy Editorial', '6 min', 'Article'],
          ['Les clés du weight cut', 'Coach Hery', '12 min', 'Interview'],
        ].map(([title, author, duration, type]) => <button key={title} type='button' onClick={() => setToast({ message: `${title} · lecture ouverte`, tone: 'info' })} className='bg-[#151619] p-3 text-left hover:bg-[#191b1f]'><div className='grid h-16 place-items-center border border-[#292c31] bg-[#101114]'><Play size={18} className='text-[#ff4058]' /></div><span className='mt-2 block text-[7px] uppercase text-[#3d92ff]'>{type} · {duration}</span><strong className='mt-1 block text-[9px] text-zinc-300'>{title}</strong><span className='text-[7px] text-zinc-600'>{author}</span></button>)}</div>
      </article>
      <article className='border border-[#303238] bg-[#151619]'>
        <header className='flex items-center justify-between border-b border-[#303238] px-3 py-2'><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-400'>Communauté</span><MessageCircle size={13} className='text-[#3d92ff]' /></header>
        <div className='divide-y divide-[#292c31]'>{[
          ['Discussion Main Event MFN', '184 nouveaux messages'],
          ['Pronostics Fight Week', '2 842 participants'],
          ['Supporters Dojo Sakura', '38 membres en ligne'],
        ].map(([title, detail]) => <button key={title} type='button' onClick={() => onNavigate('community', 'Discussions')} className='flex min-h-12 w-full items-center gap-2.5 px-3 text-left hover:bg-white/[0.025]'><MessageCircle size={13} className='text-zinc-600' /><span className='min-w-0 flex-1'><strong className='block truncate text-[9px] text-zinc-300'>{title}</strong><span className='text-[7px] text-zinc-600'>{detail}</span></span><ChevronRight size={12} className='text-zinc-700' /></button>)}</div>
      </article>
    </section>
  </div>;
}
