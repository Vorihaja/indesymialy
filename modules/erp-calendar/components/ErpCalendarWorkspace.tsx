'use client';

import { useMemo, useState } from 'react';
import {
  CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Filter, Link2,
  List, MapPin, Plus, RefreshCw, Search, Settings2, X,
} from 'lucide-react';
import { getCalendarMock } from '../mocks/calendar.mock';
import type { ErpCalendarEvent, ErpCalendarEventType, ErpCalendarRole } from '../types';

const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
const dayLabel = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
const typeLabels: Record<ErpCalendarEventType, string> = { sport: 'Sport', meeting: 'Réunion', deadline: 'Échéance', travel: 'Déplacement', medical: 'Médical', commercial: 'Business' };
const typeColors: Record<ErpCalendarEventType, string> = { sport: '#ff1638', meeting: '#087cff', deadline: '#f59e0b', travel: '#8b98a9', medical: '#22c55e', commercial: '#287bd8' };

function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function monthCells(cursor: Date) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function SmallButton({ children, active = false, onClick, title }: { children: React.ReactNode; active?: boolean; onClick?: () => void; title?: string }) {
  return <button type='button' title={title} onClick={onClick} className={`inline-flex h-8 items-center justify-center gap-1.5 border px-2.5 text-[11px] font-semibold transition-colors ${active ? 'border-[#2588ff] bg-[#087cff] text-white' : 'border-[var(--erp-border)] bg-[var(--erp-panel)] text-[var(--erp-text-secondary)] hover:border-[var(--erp-border-strong)] hover:bg-[var(--erp-panel-muted)] hover:text-[var(--erp-text)]'}`}>{children}</button>;
}

function EventLine({ event, compact = false }: { event: ErpCalendarEvent; compact?: boolean }) {
  return <button type='button' className={`group flex w-full min-w-0 items-start gap-2 border-l-2 px-2 text-left hover:bg-[var(--erp-panel-muted)] ${compact ? 'py-1' : 'py-2'}`} style={{ borderLeftColor: typeColors[event.type] }}>
    <span className='w-9 flex-none pt-px text-[10px] font-semibold text-[var(--erp-muted)]'>{event.start}</span>
    <span className='min-w-0 flex-1'><strong className='block truncate text-[11px] font-semibold text-[var(--erp-text)]'>{event.title}</strong>{!compact && <span className='mt-0.5 flex items-center gap-1 truncate text-[10px] text-[var(--erp-muted)]'><MapPin size={10} />{event.location}</span>}</span>
  </button>;
}

export function ErpCalendarWorkspace({ role }: { role: ErpCalendarRole }) {
  const mock = useMemo(() => getCalendarMock(role), [role]);
  const [events, setEvents] = useState(mock.events);
  const [cursor, setCursor] = useState(new Date(2026, 7, 1));
  const [view, setView] = useState<'month' | 'week' | 'list'>('month');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | ErpCalendarEventType>('all');
  const [composer, setComposer] = useState(false);
  const [integration, setIntegration] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [form, setForm] = useState({ title: '', date: '2026-08-13', start: '09:00', end: '10:00', type: 'meeting' as ErpCalendarEventType, location: '' });

  const filtered = events.filter((event) => (filter === 'all' || event.type === filter) && `${event.title} ${event.location}`.toLowerCase().includes(query.toLowerCase()));
  const upcoming = [...filtered].sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
  const cells = monthCells(cursor);
  const move = (amount: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + amount, 1));
  const saveEvent = () => {
    if (!form.title.trim() || !form.date) return;
    setEvents((current) => [...current, { ...form, id: `local-${Date.now()}`, context: mock.owner, status: 'confirmed', source: 'Agenda personnel' }]);
    setComposer(false);
    setForm((current) => ({ ...current, title: '', location: '' }));
  };

  return <div className='mx-auto grid w-full max-w-[1540px] gap-3 text-[var(--erp-text)]'>
    <header className='flex flex-wrap items-center justify-between gap-2 border border-[var(--erp-border)] bg-[var(--erp-surface)] px-3 py-2'>
      <div className='min-w-[180px]'>
        <span className='block text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--erp-muted)]'>Agenda partagé</span>
        <strong className='block text-[14px] font-semibold capitalize'>{monthLabel.format(cursor)}</strong>
        <span className='text-[10px] text-[var(--erp-muted)]'>{mock.owner}</span>
      </div>
      <div className='flex flex-wrap items-center gap-1.5'>
        <SmallButton title='Mois précédent' onClick={() => move(-1)}><ChevronLeft size={14} /></SmallButton>
        <SmallButton onClick={() => setCursor(new Date(2026, 7, 1))}>Aujourd’hui</SmallButton>
        <SmallButton title='Mois suivant' onClick={() => move(1)}><ChevronRight size={14} /></SmallButton>
        <span className='mx-1 hidden h-5 w-px bg-[var(--erp-border)] sm:block' />
        <SmallButton active={view === 'month'} onClick={() => setView('month')}><CalendarDays size={13} />Mois</SmallButton>
        <SmallButton active={view === 'week'} onClick={() => setView('week')}><Clock3 size={13} />Semaine</SmallButton>
        <SmallButton active={view === 'list'} onClick={() => setView('list')}><List size={13} />Liste</SmallButton>
        <SmallButton onClick={() => setIntegration(!integration)}><Link2 size={13} />Google</SmallButton>
        <button type='button' onClick={() => setComposer(true)} className='inline-flex h-8 items-center gap-1.5 border border-[#ff1638] bg-[#ff1638] px-3 text-[11px] font-semibold text-white hover:bg-[#b91f31]'><Plus size={14} />Ajouter</button>
      </div>
    </header>

    <div className='flex flex-wrap items-center gap-2 border-x border-b border-[var(--erp-border)] bg-[var(--erp-panel-muted)] px-3 py-2'>
      <label className='flex h-8 min-w-[210px] flex-1 items-center gap-2 border border-[var(--erp-border)] bg-[var(--erp-panel)] px-2 text-[var(--erp-muted)]'><Search size={13} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder='Rechercher dans l’agenda' className='min-w-0 flex-1 border-0 bg-transparent text-[11px] text-[var(--erp-text)] outline-none' /></label>
      <label className='flex h-8 items-center gap-2 border border-[var(--erp-border)] bg-[var(--erp-panel)] px-2 text-[10px] text-[var(--erp-muted)]'><Filter size={12} /><select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className='border-0 bg-transparent text-[11px] text-[var(--erp-text)] outline-none'><option value='all'>Tous les types</option>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <span className='ml-auto text-[10px] text-[var(--erp-muted)]'>{filtered.length} rendez-vous</span>
    </div>

    {integration && <section className='grid gap-3 border border-[#326dba] bg-[color-mix(in_srgb,var(--erp-panel)_92%,#087cff)] p-3 md:grid-cols-[1fr_auto]'>
      <div><span className='flex items-center gap-2 text-[11px] font-semibold'><CalendarDays size={15} className='text-[#5596e7]' />Google Calendar</span><p className='mt-1 text-[11px] text-[var(--erp-text-secondary)]'>{googleConnected ? 'Compte connecté en mode prototype. La synchronisation serveur OAuth sera activée lors de la phase d’intégration.' : 'Préparez la synchronisation de cet agenda avec votre calendrier Google. Aucune donnée n’est envoyée pendant cette phase UI.'}</p></div>
      <div className='flex items-center gap-2'><SmallButton onClick={() => setGoogleConnected(!googleConnected)}>{googleConnected ? <><Check size={13} />Connecté</> : <><Link2 size={13} />Connecter le compte</>}</SmallButton><button type='button' onClick={() => setIntegration(false)} className='p-1 text-[var(--erp-muted)] hover:text-[var(--erp-text)]' aria-label='Fermer'><X size={15} /></button></div>
    </section>}

    <div className='grid min-h-[540px] gap-3 xl:grid-cols-[minmax(0,1fr)_280px]'>
      <section className='min-w-0 border border-[var(--erp-border)] bg-[var(--erp-panel)]'>
        {view === 'month' && <div className='min-w-[690px] overflow-x-auto'>
          <div className='grid grid-cols-7 border-b border-[var(--erp-border)] bg-[var(--erp-panel-muted)]'>{weekdays.map((day) => <div key={day} className='px-2 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--erp-muted)]'>{day}</div>)}</div>
          <div className='grid grid-cols-7'>{cells.map((date) => {
            const key = isoDate(date); const dayEvents = filtered.filter((event) => event.date === key); const outside = date.getMonth() !== cursor.getMonth(); const today = key === '2026-08-12';
            return <button key={key} type='button' onClick={() => { setForm((current) => ({ ...current, date: key })); setComposer(true); }} className={`min-h-[92px] border-b border-r border-[var(--erp-border)] p-1.5 text-left align-top hover:bg-[var(--erp-panel-muted)] ${outside ? 'opacity-35' : ''}`}><span className={`mb-1 grid h-5 w-5 place-items-center text-[10px] font-semibold ${today ? 'rounded-full bg-[#ff1638] text-white' : 'text-[var(--erp-text-secondary)]'}`}>{date.getDate()}</span>{dayEvents.slice(0, 3).map((event) => <div key={event.id} className='mb-1 truncate border-l-2 bg-[var(--erp-panel-muted)] px-1.5 py-1 text-[9px] text-[var(--erp-text-secondary)]' style={{ borderLeftColor: typeColors[event.type] }}><b className='mr-1'>{event.start}</b>{event.title}</div>)}</button>;
          })}</div>
        </div>}
        {view === 'week' && <div className='grid min-w-[760px] grid-cols-7 overflow-x-auto'>{cells.slice(7, 14).map((date) => { const key = isoDate(date); return <div key={key} className='min-h-[520px] border-r border-[var(--erp-border)]'><div className='border-b border-[var(--erp-border)] bg-[var(--erp-panel-muted)] p-2 text-center text-[10px] font-semibold capitalize'>{dayLabel.format(date)}</div><div className='grid gap-1 p-1'>{filtered.filter((event) => event.date === key).map((event) => <EventLine key={event.id} event={event} />)}</div></div>; })}</div>}
        {view === 'list' && <div>{upcoming.length ? upcoming.map((event) => <div key={event.id} className='grid border-b border-[var(--erp-border)] px-3 py-2 sm:grid-cols-[110px_minmax(0,1fr)_150px_110px] sm:items-center'><span className='text-[10px] font-semibold capitalize text-[var(--erp-muted)]'>{dayLabel.format(new Date(`${event.date}T12:00:00`))}</span><EventLine event={event} /><span className='truncate text-[10px] text-[var(--erp-muted)]'>{event.context}</span><span className='mt-1 w-max border border-[var(--erp-border)] px-1.5 py-0.5 text-[9px] text-[var(--erp-text-secondary)] sm:mt-0'>{typeLabels[event.type]}</span></div>) : <div className='grid min-h-[360px] place-items-center text-[11px] text-[var(--erp-muted)]'>Aucun rendez-vous pour ces filtres.</div>}</div>}
      </section>

      <aside className='grid content-start gap-3'>
        <section className='border border-[var(--erp-border)] bg-[var(--erp-panel)]'><div className='flex items-center justify-between border-b border-[var(--erp-border)] px-3 py-2'><strong className='text-[10px] uppercase tracking-[0.1em]'>À venir</strong><span className='text-[9px] text-[var(--erp-muted)]'>Août 2026</span></div><div className='divide-y divide-[var(--erp-border)]'>{upcoming.slice(0, 5).map((event) => <div key={event.id} className='p-2'><span className='mb-1 block text-[9px] font-semibold capitalize text-[var(--erp-muted)]'>{dayLabel.format(new Date(`${event.date}T12:00:00`))}</span><EventLine event={event} compact /></div>)}</div></section>
        <section className='border border-[var(--erp-border)] bg-[var(--erp-panel)] p-3'><div className='flex items-center justify-between'><span className='flex items-center gap-2 text-[10px] font-semibold'><RefreshCw size={13} className='text-[#4d8fde]' />Synchronisation</span><span className={`h-2 w-2 rounded-full ${googleConnected ? 'bg-[#22c55e]' : 'bg-[var(--erp-muted)]'}`} /></div><p className='mt-2 text-[10px] leading-4 text-[var(--erp-muted)]'>{googleConnected ? 'Google Calendar · préparation active' : 'Agenda Indesy Mialy uniquement'}</p><button type='button' onClick={() => setIntegration(true)} className='mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#3d92ff] hover:text-[#79adf0]'><Settings2 size={12} />Gérer l’intégration</button></section>
      </aside>
    </div>

    {composer && <div className='fixed inset-0 z-[220] flex justify-end bg-black/60' onMouseDown={(event) => { if (event.currentTarget === event.target) setComposer(false); }}><section className='h-full w-full max-w-[420px] overflow-y-auto border-l border-[var(--erp-border-strong)] bg-[var(--erp-surface)] p-4 shadow-[-12px_0_35px_rgba(0,0,0,.28)]' aria-label='Ajouter un rendez-vous'><header className='flex items-start justify-between border-b border-[var(--erp-border)] pb-3'><div><span className='text-[9px] font-bold uppercase tracking-[0.13em] text-[var(--erp-muted)]'>Nouvelle entrée</span><h2 className='mt-1 text-[15px] font-semibold'>Ajouter à l’agenda</h2></div><button type='button' onClick={() => setComposer(false)} className='p-1 text-[var(--erp-muted)] hover:text-[var(--erp-text)]'><X size={17} /></button></header><div className='grid gap-3 py-4'>
      <label className='grid gap-1 text-[10px] font-semibold text-[var(--erp-text-secondary)]'>Titre<input autoFocus value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className='h-9 border border-[var(--erp-border)] bg-[var(--erp-panel)] px-2.5 text-[12px] text-[var(--erp-text)] outline-none focus:border-[#2588ff]' placeholder='Nom du rendez-vous' /></label>
      <div className='grid grid-cols-2 gap-2'><label className='grid gap-1 text-[10px] font-semibold text-[var(--erp-text-secondary)]'>Date<input type='date' value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className='h-9 border border-[var(--erp-border)] bg-[var(--erp-panel)] px-2 text-[11px] text-[var(--erp-text)]' /></label><label className='grid gap-1 text-[10px] font-semibold text-[var(--erp-text-secondary)]'>Type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as ErpCalendarEventType })} className='h-9 border border-[var(--erp-border)] bg-[var(--erp-panel)] px-2 text-[11px] text-[var(--erp-text)]'>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
      <div className='grid grid-cols-2 gap-2'><label className='grid gap-1 text-[10px] font-semibold text-[var(--erp-text-secondary)]'>Début<input type='time' value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })} className='h-9 border border-[var(--erp-border)] bg-[var(--erp-panel)] px-2 text-[11px] text-[var(--erp-text)]' /></label><label className='grid gap-1 text-[10px] font-semibold text-[var(--erp-text-secondary)]'>Fin<input type='time' value={form.end} onChange={(event) => setForm({ ...form, end: event.target.value })} className='h-9 border border-[var(--erp-border)] bg-[var(--erp-panel)] px-2 text-[11px] text-[var(--erp-text)]' /></label></div>
      <label className='grid gap-1 text-[10px] font-semibold text-[var(--erp-text-secondary)]'>Lieu<input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className='h-9 border border-[var(--erp-border)] bg-[var(--erp-panel)] px-2.5 text-[12px] text-[var(--erp-text)] outline-none focus:border-[#2588ff]' placeholder='Lieu ou visioconférence' /></label>
      <div className='border border-[var(--erp-border)] bg-[var(--erp-panel-muted)] p-2.5 text-[10px] leading-4 text-[var(--erp-muted)]'>Cette entrée sera ajoutée à <b className='text-[var(--erp-text-secondary)]'>{mock.owner}</b>. La synchronisation Google sera disponible après configuration OAuth.</div>
    </div><footer className='flex justify-end gap-2 border-t border-[var(--erp-border)] pt-3'><SmallButton onClick={() => setComposer(false)}>Annuler</SmallButton><button type='button' onClick={saveEvent} className='inline-flex h-8 items-center gap-1.5 border border-[#087cff] bg-[#087cff] px-3 text-[11px] font-semibold text-white'><Check size={13} />Enregistrer</button></footer></section></div>}
  </div>;
}
