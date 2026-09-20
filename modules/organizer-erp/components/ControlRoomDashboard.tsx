'use client';

import { useEffect, useState } from 'react';
import { Activity, Ambulance, Pause, Play, Plus, Radio, ShieldCheck, SkipForward, TriangleAlert, Users } from 'lucide-react';
import { controlRoomMock } from '../mocks/control-room.mock';
import { OrganizerDialog, OrganizerToast, organizerButtonClass, organizerPrimaryButtonClass, type OrganizerToastState } from './OrganizerFeedback';
import { OrganizerProfileLink } from './OrganizerProfileLink';

const signalColors: Record<string, string> = { red: 'border-l-[#ff1638] text-[#ff4058]', blue: 'border-l-[#087cff] text-[#3d92ff]', green: 'border-l-emerald-500 text-emerald-400', amber: 'border-l-amber-500 text-amber-400' };

export function ControlRoomDashboard() {
  const fight = controlRoomMock.currentFight;
  const [nextFightPair = '', nextFightTime = ''] = controlRoomMock.nextFight.split(' · ');
  const [nextRed = 'Combattant rouge', nextBlue = 'Combattant bleu'] = nextFightPair.split(' vs ');
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(168);
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [incident, setIncident] = useState('');
  const [incidents, setIncidents] = useState(2);
  const [feed, setFeed] = useState(controlRoomMock.feed);
  const [toast, setToast] = useState<OrganizerToastState>(null);

  useEffect(() => {
    if (paused || seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [paused, seconds]);

  const timerLabel = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const currentTime = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const reportIncident = () => {
    if (!incident.trim()) return;
    setIncidents((current) => current + 1);
    setFeed((current) => [[currentTime(), 'Incident', incident.trim()], ...current]);
    setIncident('');
    setIncidentOpen(false);
    setToast({ message: 'Incident ajouté au flux opérationnel.', tone: 'warning' });
  };

  const advanceFight = () => {
    setSeconds(300);
    setPaused(true);
    setFeed((current) => [[currentTime(), 'Fight Live', 'Combat suivant placé en attente de lancement'], ...current]);
    setAdvanceOpen(false);
    setToast({ message: 'Combat suivant préparé. Chronomètre en pause.' });
  };

  return <div className='grid gap-3'>
    <OrganizerToast toast={toast} onClose={() => setToast(null)} />
    <section className='flex flex-wrap items-center justify-between gap-4 border border-[#3a3033] bg-[#151214] px-3 py-2'><div><span className='text-[7px] font-bold uppercase tracking-[0.14em] text-zinc-500'>Jour J · Poste de commandement</span><h2 className='mt-0.5 text-[13px] font-semibold uppercase tracking-[0.025em]'>{controlRoomMock.event}</h2></div><div className='flex items-center gap-4'><div className='text-right'><span className='block text-[7px] uppercase tracking-[0.12em] text-zinc-500'>Heure locale</span><strong className='font-mono text-[17px]'>{controlRoomMock.time}</strong></div><span className='flex h-7 items-center gap-2 border border-[#294D7A] bg-[#167EFF]/10 px-2.5 text-[8px] font-bold uppercase tracking-[0.14em] text-[#4094FF]'><span className='h-2 w-2 rounded-full bg-[#ff2f49] animate-pulse' />Live</span></div></section>

    <div className='flex flex-wrap items-center justify-between gap-2 border border-[#303238] bg-[#111214] px-3 py-2'><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-600'>Commandes Fight Live · prototype local</span><div className='flex flex-wrap gap-2'><button type='button' onClick={() => { setPaused((current) => !current); setToast({ message: paused ? 'Chronomètre relancé.' : 'Chronomètre mis en pause.', tone: 'info' }); }} className={organizerButtonClass}>{paused ? <Play size={13} /> : <Pause size={13} />}{paused ? 'Reprendre' : 'Pause'}</button><button type='button' onClick={() => setIncidentOpen(true)} className={organizerButtonClass}><TriangleAlert size={13} />Signaler un incident</button><button type='button' onClick={() => setAdvanceOpen(true)} className={organizerPrimaryButtonClass}><SkipForward size={13} />Combat suivant</button></div></div>

    <div className='grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,.6fr)]'>
      <section className='border border-[#3a3033] bg-[#141416]'><header className='flex h-10 items-center justify-between border-b border-[#30292b] px-3'><span className='flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[#ff4058]'><Radio size={14} />Combat actuel</span><span className='text-[8px] text-zinc-500'>{paused ? 'Chronomètre en pause' : 'Fight Live synchronisé'}</span></header><div className='grid md:grid-cols-[1fr_170px_1fr]'><div className='border-b border-[#30292b] p-5 md:border-b-0 md:border-r'><span className='text-[8px] font-bold uppercase tracking-[0.14em] text-[#ff4058]'>Coin rouge</span><strong className='mt-3 block text-[20px] font-semibold'><OrganizerProfileLink name={fight.red} role='combattant' /></strong></div><div className='grid place-items-center border-b border-[#30292b] bg-[#0b0b0d] p-4 text-center md:border-b-0 md:border-r'><div><span className='text-[9px] font-bold text-zinc-500'>{fight.round}</span><strong className='mt-1 block font-mono text-[36px] font-semibold tracking-[-0.06em]'>{timerLabel}</strong></div></div><div className='p-5 text-right'><span className='text-[8px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]'>Coin bleu</span><strong className='mt-3 block text-[20px] font-semibold'><OrganizerProfileLink name={fight.blue} role='combattant' /></strong></div></div><footer className='flex h-10 items-center justify-between border-t border-[#30292b] px-3 text-[9px]'><span className='text-zinc-500'>Prochain combat</span><strong className='flex items-center gap-1'><OrganizerProfileLink name={nextRed} role='combattant' /><span className='text-zinc-600'>vs</span><OrganizerProfileLink name={nextBlue} role='combattant' /><span className='ml-1 text-zinc-500'>· {nextFightTime}</span></strong></footer></section>

      <section className='border border-[#303238] bg-[#151619] p-4'><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500'>Spectateurs présents</span><strong className='mt-2 block text-[28px] font-semibold tracking-[-0.04em]'>{controlRoomMock.attendance}</strong><div className='mt-3 h-1 bg-[#292c31]'><div className='h-full w-[84%] bg-[#087cff]' /></div><div className='mt-5 grid grid-cols-2 gap-px bg-[#303238]'>{[['Entrée Nord','642'],['Entrée Sud','514'],['VIP','214'],['Backstage','96']].map(([label,value]) => <div key={label} className='bg-[#111215] p-2'><span className='block text-[8px] text-zinc-500'>{label}</span><strong className='text-[14px]'>{value}</strong></div>)}</div></section>
    </div>

    <section className='grid grid-cols-2 gap-px border border-[#303238] bg-[#303238] md:grid-cols-3 xl:grid-cols-6'>{controlRoomMock.signals.map(([label,value,tone]) => <article key={label} className={`min-h-[82px] border-l-2 bg-[#151619] p-3 ${signalColors[tone]}`}><span className='text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-500'>{label}</span><strong className='mt-2 block text-[20px] font-semibold'>{label === 'Incidents' ? incidents : value}</strong></article>)}</section>

    <div className='grid gap-3 lg:grid-cols-[1fr_340px]'><section className='border border-[#303238] bg-[#151619]'><header className='flex h-10 items-center gap-2 border-b border-[#303238] px-3 text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-400'><Activity size={14} className='text-[#3d92ff]' />Flux opérationnel</header><div className='divide-y divide-[#292c31]'>{feed.map(([time,module,event]) => <div key={`${time}-${event}`} className='grid min-h-10 grid-cols-[50px_80px_1fr] items-center px-3 text-[9px]'><span className='font-mono text-zinc-500'>{time}</span><span className={module === 'Incident' ? 'text-[#ff4058]' : 'text-[#3d92ff]' }>{module}</span><span>{event}</span></div>)}</div></section><section className='grid gap-px border border-[#303238] bg-[#303238]'>{[[ShieldCheck,'Sécurité','Toutes zones couvertes'],[Ambulance,'Médical','Ambulance et médecin prêts'],[Users,'Officiels','1 juge attendu à 20:15']].map(([Icon,label,detail]) => { const SignalIcon = Icon as typeof ShieldCheck; return <button type='button' onClick={() => setToast({ message: `${String(label)} · ${String(detail)}`, tone: 'info' })} key={String(label)} className='flex items-center gap-3 bg-[#151619] p-3 text-left hover:bg-white/[0.025]'><SignalIcon size={16} className='text-emerald-500' /><div><strong className='block text-[10px]'>{String(label)}</strong><span className='text-[8px] text-zinc-500'>{String(detail)}</span></div></button>; })}</section></div>

    <OrganizerDialog open={incidentOpen} eyebrow='Control Room' title='Signaler un incident' description='L’incident sera ajouté au flux mock et au compteur de la session.' onClose={() => setIncidentOpen(false)} footer={<><button type='button' onClick={() => setIncidentOpen(false)} className={organizerButtonClass}>Annuler</button><button type='button' disabled={!incident.trim()} onClick={reportIncident} className={organizerPrimaryButtonClass}><Plus size={13} />Ajouter au flux</button></>}><label className='grid gap-1'><span className='text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-500'>Description de l’incident</span><textarea autoFocus value={incident} onChange={(event) => setIncident(event.target.value)} className='min-h-28 resize-y border border-[#343840] bg-[#101114] p-3 text-[10px] text-white outline-none focus:border-[#ff1638]' placeholder='Décrire brièvement la situation, la zone et le responsable…' /></label></OrganizerDialog>

    <OrganizerDialog open={advanceOpen} eyebrow='Fight Live' title='Passer au combat suivant ?' description={controlRoomMock.nextFight} onClose={() => setAdvanceOpen(false)} footer={<><button type='button' onClick={() => setAdvanceOpen(false)} className={organizerButtonClass}>Annuler</button><button type='button' onClick={advanceFight} className={organizerPrimaryButtonClass}><SkipForward size={13} />Préparer le combat</button></>}><p className='text-[10px] leading-5 text-zinc-400'>Le chronomètre sera replacé à 05:00 et mis en pause. Cette commande reste strictement locale au prototype.</p></OrganizerDialog>
  </div>;
}
