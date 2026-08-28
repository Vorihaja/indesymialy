'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Clock3, HeartPulse, MessageSquare, Pause, Play, Radio, RotateCcw, ShieldCheck, Swords, Users } from 'lucide-react';
import { OrganizerDialog, OrganizerToast, organizerButtonClass, organizerPrimaryButtonClass, type OrganizerToastState } from '@/modules/organizer-erp/components/OrganizerFeedback';

function formatSeconds(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function FighterFightRoom() {
  const [running, setRunning] = useState(true);
  const [seconds, setSeconds] = useState(168);
  const [round, setRound] = useState(2);
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [incident, setIncident] = useState('');
  const [toast, setToast] = useState<OrganizerToastState>(null);
  const [checklist, setChecklist] = useState([
    ['Bandages contrôlés', true],
    ['Protège-dents', true],
    ['Gants officiels', true],
    ['Vaseline & glace', true],
    ['Document médical', false],
  ] as Array<[string, boolean]>);

  useEffect(() => {
    if (!running || seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [running, seconds]);

  const nextRound = () => {
    setRound((current) => Math.min(3, current + 1));
    setSeconds(300);
    setRunning(false);
    setToast({ message: 'Round suivant préparé. Le chronomètre est en pause.', tone: 'info' });
  };

  return (
    <div className='grid gap-3'>
      <OrganizerToast toast={toast} onClose={() => setToast(null)} />
      <section className='flex flex-wrap items-center justify-between gap-3 border border-[#ff1638]/50 bg-[#151012] px-3 py-2'>
        <div className='flex items-center gap-3'><span className='flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#ff2f49]'><span className='h-2 w-2 rounded-full bg-[#ff2f49] animate-pulse' />Live</span><span className='h-4 w-px bg-[#343036]' /><div><strong className='block text-[11px] font-semibold'>Mahajanga Fight Night Vol.3</strong><span className='text-[8px] text-zinc-500'>Stade Rabemananjara · Coin rouge</span></div></div>
        <div className='flex items-center gap-4'><span className='font-mono text-[16px] font-semibold'>19:42:18</span><button type='button' onClick={() => setIncidentOpen(true)} className='flex h-8 items-center gap-2 border border-[#ff1638]/60 px-3 text-[9px] font-semibold text-[#ff4058] hover:bg-red-500/10'><AlertTriangle size={13} />Signaler</button></div>
      </section>

      <section className='grid gap-px border border-[#303238] bg-[#303238] md:grid-cols-3 xl:grid-cols-6'>
        {[['Appel combattant', 'T-12 min', 'Confirmé'], ['Poids officiel', '70,2 kg', 'Validé'], ['Équipe au coin', '3 / 3', 'Prête'], ['Médical', 'Apte', 'Validé'], ['Équipement', '4 / 5', 'Contrôle'], ['Accès zone', 'Ouvert', 'Actif']].map(([label, value, detail]) => <article key={label} className='bg-[#151619] px-3 py-2'><span className='text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-500'>{label}</span><strong className='mt-1 block text-[16px] font-semibold'>{value}</strong><span className='text-[8px] text-emerald-400'>{detail}</span></article>)}
      </section>

      <section className='grid gap-3 xl:grid-cols-[1.45fr_1fr]'>
        <article className='border border-[#303238] bg-[#121316]'>
          <header className='flex items-center justify-between border-b border-[#303238] px-3 py-2'><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-[#ff4058]'>Combat actuel</span><span className='text-[8px] text-zinc-500'>Main card · Combat 8 / 12</span></header>
          <div className='grid min-h-[245px] place-items-center p-4'>
            <div className='w-full max-w-[720px]'>
              <div className='grid grid-cols-[1fr_auto_1fr] items-center gap-4'>
                <div><span className='text-[8px] uppercase tracking-[0.12em] text-[#ff4058]'>Coin rouge</span><strong className='mt-1 block text-[18px] font-semibold'>Tiana Rakoto</strong><span className='text-[9px] text-zinc-500'>11–2–1 · Dojo Sakura</span></div>
                <Swords size={24} className='text-zinc-700' />
                <div className='text-right'><span className='text-[8px] uppercase tracking-[0.12em] text-[#3d92ff]'>Coin bleu</span><strong className='mt-1 block text-[18px] font-semibold'>Andriamahefa Nomena</strong><span className='text-[9px] text-zinc-500'>9–3–0 · Boeny Fight Club</span></div>
              </div>
              <div className='mt-6 border-y border-[#303238] py-4 text-center'>
                <span className='text-[8px] font-bold uppercase tracking-[0.15em] text-zinc-500'>Round {round} / 3</span>
                <strong className={`mt-1 block font-mono text-[52px] font-semibold leading-none tracking-[-0.06em] ${seconds <= 30 ? 'text-[#ff2f49]' : 'text-white'}`}>{formatSeconds(seconds)}</strong>
              </div>
              <div className='mt-4 flex flex-wrap justify-center gap-2'>
                <button type='button' onClick={() => setRunning((current) => !current)} className={organizerPrimaryButtonClass}>{running ? <Pause size={13} /> : <Play size={13} />}{running ? 'Pause' : 'Reprendre'}</button>
                <button type='button' onClick={() => { setSeconds(300); setRunning(false); }} className={organizerButtonClass}><RotateCcw size={13} />Réinitialiser</button>
                <button type='button' onClick={nextRound} disabled={round === 3} className={organizerButtonClass}>Round suivant</button>
              </div>
            </div>
          </div>
        </article>

        <div className='grid gap-3'>
          <article className='border border-[#303238] bg-[#151619]'>
            <header className='flex items-center justify-between border-b border-[#303238] px-3 py-2'><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-400'>Checklist du coin</span><span className='text-[8px] text-zinc-600'>{checklist.filter(([, done]) => done).length}/{checklist.length}</span></header>
            <div className='divide-y divide-[#292c31]'>{checklist.map(([label, done], index) => <button key={label} type='button' onClick={() => setChecklist((current) => current.map((item, itemIndex) => itemIndex === index ? [item[0], !item[1]] : item))} className='flex min-h-9 w-full items-center gap-2.5 px-3 text-left hover:bg-white/[0.025]'><span className={`grid h-4 w-4 place-items-center border ${done ? 'border-emerald-500 bg-emerald-500 text-black' : 'border-amber-500'}`}>{done && <Check size={11} />}</span><span className={`text-[9px] ${done ? 'text-zinc-500' : 'font-semibold text-amber-400'}`}>{label}</span></button>)}</div>
          </article>
          <article className='border border-[#303238] bg-[#151619]'>
            <header className='border-b border-[#303238] px-3 py-2'><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-400'>Canaux directs</span></header>
            <div className='grid grid-cols-2 gap-px bg-[#292c31]'>
              {[[MessageSquare, 'Coach', 'Canal ouvert'], [HeartPulse, 'Médical', 'Prêt'], [ShieldCheck, 'Officiels', '11 / 12'], [Radio, 'Organisateur', 'En ligne']].map(([Icon, label, value]) => { const ChannelIcon = Icon as typeof MessageSquare; return <button key={String(label)} type='button' onClick={() => setToast({ message: `Canal ${label} ouvert.`, tone: 'info' })} className='bg-[#151619] p-3 text-left hover:bg-[#191b1f]'><ChannelIcon size={14} className='text-[#3d92ff]' /><strong className='mt-2 block text-[9px] text-zinc-300'>{String(label)}</strong><span className='text-[7px] text-zinc-600'>{String(value)}</span></button>; })}
            </div>
          </article>
        </div>
      </section>

      <section className='grid gap-3 lg:grid-cols-3'>
        <article className='border border-[#303238] bg-[#151619]'>
          <header className='flex items-center gap-2 border-b border-[#303238] px-3 py-2'><Clock3 size={13} className='text-[#3d92ff]' /><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-400'>Prochaines séquences</span></header>
          <div className='divide-y divide-[#292c31]'>{[['19:49', 'Fin combat estimée'], ['19:52', 'Contrôle médical'], ['19:57', 'Interview éventuelle'], ['20:08', 'Combat suivant']].map(([time, event]) => <div key={time} className='flex min-h-9 items-center gap-3 px-3'><span className='font-mono text-[8px] text-zinc-600'>{time}</span><span className='text-[9px] text-zinc-400'>{event}</span></div>)}</div>
        </article>
        <article className='border border-[#303238] bg-[#151619]'>
          <header className='flex items-center gap-2 border-b border-[#303238] px-3 py-2'><Users size={13} className='text-[#3d92ff]' /><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-400'>Équipe au coin</span></header>
          <div className='divide-y divide-[#292c31]'>{[['Hery Randria', 'Coach principal', 'Présent'], ['Feno Razaka', 'Second', 'Présent'], ['Miora Andry', 'Soins', 'Présente']].map(([name, role, status]) => <button key={name} type='button' onClick={() => setToast({ message: `Profil de ${name}`, tone: 'info' })} className='flex min-h-9 w-full items-center justify-between px-3 text-left hover:bg-white/[0.025]'><span><strong className='block text-[9px] text-zinc-300'>{name}</strong><span className='text-[7px] text-zinc-600'>{role}</span></span><span className='text-[8px] text-emerald-400'>{status}</span></button>)}</div>
        </article>
        <article className='border border-[#303238] bg-[#151619]'>
          <header className='flex items-center gap-2 border-b border-[#303238] px-3 py-2'><AlertTriangle size={13} className='text-amber-400' /><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-400'>Incidents</span></header>
          <div className='p-3'><strong className='block text-[18px] font-semibold'>0</strong><span className='text-[8px] text-zinc-600'>Aucun incident actif pour le combattant</span><button type='button' onClick={() => setIncidentOpen(true)} className='mt-3 flex h-8 items-center gap-2 border border-[#3a3e46] px-3 text-[9px] font-semibold text-zinc-300 hover:bg-white/[0.04]'><AlertTriangle size={13} />Nouveau signalement</button></div>
        </article>
      </section>

      <OrganizerDialog open={incidentOpen} eyebrow='Fight Room · LIVE' title='Signaler un incident' description='Le signalement mock sera transmis aux canaux organisateur, médical et coach.' onClose={() => setIncidentOpen(false)} footer={<><button type='button' onClick={() => setIncidentOpen(false)} className={organizerButtonClass}>Annuler</button><button type='button' disabled={!incident.trim()} onClick={() => { setIncidentOpen(false); setToast({ message: 'Incident transmis aux responsables.', tone: 'warning' }); setIncident(''); }} className={organizerPrimaryButtonClass}><AlertTriangle size={13} />Transmettre</button></>}>
        <label className='grid gap-1'><span className='text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-500'>Description</span><textarea value={incident} onChange={(event) => setIncident(event.target.value)} rows={5} autoFocus className='border border-[#343840] bg-[#101114] p-2.5 text-[10px] text-white outline-none focus:border-[#ff1638]' placeholder='Décris précisément la situation…' /></label>
      </OrganizerDialog>
    </div>
  );
}
