'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, MessageSquarePlus, Plus, Save, Trash2 } from 'lucide-react';
import { OrganizerDialog, OrganizerToast, organizerButtonClass, organizerPrimaryButtonClass, type OrganizerToastState } from './OrganizerFeedback';
import { OrganizerTemporalField } from './OrganizerTemporalField';
import { TicketTypeForm, emptyTicketTypeDraft, type TicketTypeDraft } from './TicketTypeForm';
import { GeographySelector, type GeographyValue } from '@/modules/geography';
import type { CoorganizerCandidate } from '../real-data/organizer-event-workflow.repository';
import { DisciplineSelect } from '@/modules/disciplines';

type FightCardDraft = { segment: string; discipline: string; red: string; blue: string };
type AssignmentDraft = { name: string; role: string };
type ExpenseDraft = { label: string; amount: string };
type EventCoorganizerDraft = { organizationId: string; name: string; role: string; status: string };

export type EventWizardDraft = {
  event: { name: string; type: string; date: string; location: string; address: string; regionId: string; districtId: string; cityId: string; communeId: string };
  coorganizers: EventCoorganizerDraft[];
  fightCards: FightCardDraft[];
  officials: AssignmentDraft[];
  team: AssignmentDraft[];
  budget: string;
  expenses: ExpenseDraft[];
  tickets: TicketTypeDraft[];
};

const steps = ['Informations', 'Fight Card', 'Officiels', 'Équipe', 'Finances', 'Billetterie'];
const inputClass = 'h-9 w-full border border-[#343840] bg-[#101114] px-2.5 text-[10px] text-white outline-none focus:border-[#087cff]';
const labelClass = 'text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-500';

export function createEmptyEventWizardDraft(): EventWizardDraft {
  return {
    event: { name: '', type: 'Gala', date: '', location: '', address: '', regionId: '', districtId: '', cityId: '', communeId: '' },
    coorganizers: [],
    fightCards: [
      { segment: 'Main Event', discipline: 'MMA', red: '', blue: '' },
      { segment: 'Co-Main Event', discipline: 'Kickboxing', red: '', blue: '' },
      { segment: 'Carte principale', discipline: 'MMA', red: '', blue: '' },
    ],
    officials: [{ name: '', role: 'Arbitre central' }, { name: '', role: 'Juge' }],
    team: [{ name: '', role: 'Responsable opérations' }],
    budget: '',
    expenses: [{ label: '', amount: '' }],
    tickets: [{ ...emptyTicketTypeDraft }],
  };
}

function readinessValues(draft: EventWizardDraft): boolean[] {
  const hasEventIdentity = Boolean(draft.event.name.trim());
  const values = [
    hasEventIdentity,
    hasEventIdentity && Boolean(draft.event.type.trim()),
    Boolean(draft.event.date),
    Boolean(draft.event.location.trim()),
    Boolean(draft.event.address.trim()),
    Boolean(draft.event.regionId),
    Boolean(draft.event.cityId),
  ];

  draft.coorganizers.forEach((item) => {
    const started = Boolean(item.organizationId);
    values.push(started, started && Boolean(item.role.trim()));
  });
  draft.fightCards.forEach((item) => {
    const started = Boolean(item.red.trim() || item.blue.trim());
    values.push(started && Boolean(item.segment.trim()), started && Boolean(item.discipline.trim()), Boolean(item.red.trim()), Boolean(item.blue.trim()));
  });
  draft.officials.forEach((item) => {
    const started = Boolean(item.name.trim());
    values.push(started, started && Boolean(item.role.trim()));
  });
  draft.team.forEach((item) => {
    const started = Boolean(item.name.trim());
    values.push(started, started && Boolean(item.role.trim()));
  });
  values.push(Boolean(String(draft.budget).trim()));
  draft.expenses.forEach((item) => {
    const started = Boolean(item.label.trim() || String(item.amount).trim());
    values.push(started && Boolean(item.label.trim()), started && Boolean(String(item.amount).trim()));
  });
  draft.tickets.forEach((item) => {
    const started = Boolean(item.name.trim() || item.code.trim() || item.zone.trim() || String(item.price).trim() || String(item.quota).trim());
    values.push(
      started && Boolean(item.name.trim()),
      started && Boolean(item.code.trim()),
      started && Boolean(item.category.trim()),
      started && Boolean(item.zone.trim()),
      started && (Boolean(String(item.price).trim()) || item.category === 'Invitation'),
      started && Boolean(item.currency),
      started && Boolean(String(item.quota).trim()),
      started && Boolean(String(item.maxPerOrder).trim()),
      started && Boolean(item.salesStart),
      started && Boolean(item.salesEnd),
      started && item.channels.length > 0,
      started && Boolean(item.conditions.trim()),
      started && Boolean(item.status),
    );
  });
  return values;
}

export function calculateEventReadiness(draft: EventWizardDraft) {
  const values = readinessValues(draft);
  return Math.round((values.filter(Boolean).length / Math.max(1, values.length)) * 100);
}

export function createEventWizardDraftFromRow(row: string[]): EventWizardDraft {
  const draft = createEmptyEventWizardDraft();
  const knownDates: Record<string, string> = {
    'Mahajanga Fight Night Vol.3': '2026-08-30T19:00',
    'Tana Striking Series': '2026-09-18T18:30',
    'Boeny Grappling Open': '2026-10-04T09:00',
    'Moraingy National Cup': '2026-11-22T14:00',
    'Fight League Finals': '2026-12-12T18:00',
  };
  const disciplinesFromRow = (row[1] ?? 'MMA').split(',').map((item) => item.trim()).filter(Boolean);
  const fightCount = Math.max(1, Math.min(Number(row[5]) || 3, 12));
  draft.event = { ...draft.event, name: row[0] ?? '', type: 'Gala', date: knownDates[row[0] ?? ''] ?? '', location: row[3] ?? '' };
  draft.fightCards = Array.from({ length: fightCount }, (_, index) => ({ segment: index === 0 ? 'Main Event' : index === 1 ? 'Co-Main Event' : index < 5 ? 'Carte principale' : 'Préliminaire', discipline: disciplinesFromRow[index % Math.max(1, disciplinesFromRow.length)] ?? 'MMA', red: '', blue: '' }));
  return draft;
}

function slug(value: string) {
  return value.replace(/^@/, '').trim().normalize('NFD').replaceAll(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr').replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/^-|-$/g, '') || 'demo';
}

function MentionField({ label, value, role, onChange, onInvite }: { label: string; value: string; role: 'combattant' | 'arbitre' | 'juge' | 'coach' | 'fan'; onChange: (value: string) => void; onInvite: (value: string) => void }) {
  const valid = value.trim().startsWith('@') && value.trim().length > 1;
  return <label className='grid gap-1'><span className={labelClass}>{label}</span><div className='flex'><input value={value} onChange={(event) => onChange(event.target.value.startsWith('@') ? event.target.value : `@${event.target.value.replaceAll('@', '')}`)} className={`${inputClass} min-w-0 flex-1 border-r-0`} placeholder='@nom-de-la-personne' /><button type='button' disabled={!valid} onClick={() => onInvite(value)} className='grid h-9 w-10 flex-none place-items-center border border-[#343840] text-[#3d92ff] hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:text-zinc-700' title='Envoyer une invitation par message'><MessageSquarePlus size={14} /></button></div>{valid ? <Link href={`/social/profils/${role}/${slug(value)}`} target='_blank' rel='noreferrer' className='w-max text-[8px] text-[#3d92ff] hover:underline'>Voir le profil public</Link> : <span className='text-[8px] text-zinc-600'>Le nom doit être mentionné avec @.</span>}</label>;
}

export function EventCreationWizard({ open, initialValue, coorganizerCandidates = [], onClose, onSave }: { open: boolean; initialValue?: EventWizardDraft; coorganizerCandidates?: CoorganizerCandidate[]; onClose: () => void; onSave: (row: string[], mode: 'Brouillon' | 'Préparation', draft: EventWizardDraft) => void | Promise<void> }) {
  const seed = initialValue ?? createEmptyEventWizardDraft();
  const [step, setStep] = useState(0);
  const [event, setEvent] = useState({ ...seed.event });
  const [coorganizers, setCoorganizers] = useState<EventCoorganizerDraft[]>(seed.coorganizers.map(item => ({ ...item })));
  const [fightCards, setFightCards] = useState<FightCardDraft[]>(seed.fightCards.map((item) => ({ ...item })));
  const [officials, setOfficials] = useState<AssignmentDraft[]>(seed.officials.map((item) => ({ ...item })));
  const [team, setTeam] = useState<AssignmentDraft[]>(seed.team.map((item) => ({ ...item })));
  const [budget, setBudget] = useState(seed.budget);
  const [expenses, setExpenses] = useState<ExpenseDraft[]>(seed.expenses.map((item) => ({ ...item })));
  const [tickets, setTickets] = useState<TicketTypeDraft[]>(seed.tickets.map((item) => ({ ...item, channels: [...item.channels] })));
  const [toast, setToast] = useState<OrganizerToastState>(null);
  const [saving, setSaving] = useState(false);

  const readiness = useMemo(() => calculateEventReadiness({
    event, coorganizers, fightCards, officials, team, budget, expenses, tickets,
  }), [budget, coorganizers, event, expenses, fightCards, officials, team, tickets]);
  const totalExpenses = expenses.reduce((total, item) => total + (Number(item.amount) || 0), 0);
  const balance = (Number(budget) || 0) - totalExpenses;

  const invite = (mention: string) => setToast({ message: `Invitation envoyée par message à ${mention}.`, tone: 'info' });
  const updateFight = (index: number, patch: Partial<FightCardDraft>) => setFightCards((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const updateAssignment = (collection: 'officials' | 'team', index: number, patch: Partial<AssignmentDraft>) => {
    const setter = collection === 'officials' ? setOfficials : setTeam;
    setter((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };

  const eventRow = (mode: 'Brouillon' | 'Préparation') => {
    const eventDate = event.date ? new Date(event.date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : 'À définir';
    const eventDisciplines = Array.from(new Set(fightCards.map((item) => item.discipline).filter(Boolean))).join(', ') || 'À définir';
    return [event.name.trim() || 'Événement sans titre', eventDisciplines, eventDate, event.location.trim() || 'À définir', mode, String(fightCards.length), '0 %', `${readiness} %`];
  };

  const save = async (mode: 'Brouillon' | 'Préparation') => {
    const draft = { event: { ...event }, coorganizers: coorganizers.map(item => ({ ...item })), fightCards: fightCards.map((item) => ({ ...item })), officials: officials.map((item) => ({ ...item })), team: team.map((item) => ({ ...item })), budget, expenses: expenses.map((item) => ({ ...item })), tickets: tickets.map((item) => ({ ...item, channels: [...item.channels] })) };
    setSaving(true);
    try {
      await onSave(eventRow(mode), mode, draft);
      onClose();
    } catch (reason) {
      setToast({ message: reason instanceof Error ? reason.message : "L’enregistrement a échoué.", tone: 'warning' });
    } finally {
      setSaving(false);
    }
  };

  return <>
    <OrganizerToast toast={toast} onClose={() => setToast(null)} />
    <OrganizerDialog open={open} wide eyebrow={initialValue ? 'Modification événement' : 'Nouvel événement'} title={initialValue ? `Modifier · ${event.name || 'Événement'}` : 'Création guidée'} onClose={onClose} footer={<div className='flex w-full flex-wrap items-center justify-between gap-2'><button type='button' disabled={saving} onClick={() => void save('Brouillon')} className={organizerButtonClass}><Save size={13} />Enregistrer comme brouillon</button><div className='flex gap-2'>{step > 0 && <button type='button' onClick={() => setStep((current) => current - 1)} className={organizerButtonClass}><ArrowLeft size={13} />Précédent</button>}{step < steps.length - 1 ? <button type='button' onClick={() => setStep((current) => current + 1)} className={organizerPrimaryButtonClass}>Étape suivante <ArrowRight size={13} /></button> : <button type='button' disabled={saving} onClick={() => void save('Préparation')} className={organizerPrimaryButtonClass}><Check size={13} />{initialValue ? 'Enregistrer les modifications' : 'Créer l’événement'}</button>}</div></div>}>
      <div className='grid gap-4'>
        <div className='grid gap-2'><div className='flex items-center justify-between gap-3'><span className='text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500'>Readiness calculé</span><strong className='font-mono text-[16px] text-white'>{readiness} %</strong></div><div className='h-1.5 bg-[#292c31]'><div className='h-full bg-[#ff1638] transition-[width]' style={{ width: `${readiness}%` }} /></div></div>
        <nav className='grid grid-cols-2 gap-px border border-[#303238] bg-[#303238] sm:grid-cols-3 lg:grid-cols-6' aria-label='Étapes de création'>{steps.map((label, index) => <button type='button' key={label} onClick={() => setStep(index)} className={`min-h-11 bg-[#111214] px-2 text-left ${step === index ? 'border-b-2 border-[#ff1638] text-white' : 'text-zinc-600 hover:text-zinc-300'}`}><span className='block text-[8px] font-mono'>0{index + 1}</span><strong className='text-[9px] font-semibold'>{label}</strong></button>)}</nav>

        {step === 0 && <section className='grid gap-4'>
          <div className='grid gap-3 sm:grid-cols-2'>
            <label className='grid gap-1 sm:col-span-2'><span className={labelClass}>Nom de l’événement *</span><input autoFocus value={event.name} onChange={(input) => setEvent((current) => ({ ...current, name: input.target.value }))} className={inputClass} placeholder='Mahajanga Fight Night Vol.4' /></label>
            <label className='grid gap-1'><span className={labelClass}>Type d’événement *</span><select value={event.type} onChange={(input) => setEvent((current) => ({ ...current, type: input.target.value }))} className={inputClass}><option>Gala</option><option>Compétition</option><option>Championnat</option><option>Open</option><option>Exhibition</option><option>Stage</option></select></label>
            <label className='grid gap-1'><span className={labelClass}>Date et heure *</span><OrganizerTemporalField kind='datetime-local' value={event.date} onChange={(date) => setEvent((current) => ({ ...current, date }))} /></label>
          </div>
          <div className='border-t border-[#303238] pt-3'>
            <h3 className='mb-2 text-[10px] font-semibold text-zinc-200'>Localisation administrative</h3>
            <GeographySelector required value={{ regionId: event.regionId, districtId: event.districtId, cityId: event.cityId, communeId: event.communeId }} onChange={(geography: GeographyValue) => setEvent(current => ({ ...current, ...geography }))} />
            <div className='mt-3 grid gap-3 sm:grid-cols-2'><label className='grid gap-1'><span className={labelClass}>Salle / enceinte *</span><input value={event.location} onChange={(input) => setEvent((current) => ({ ...current, location: input.target.value }))} className={inputClass} placeholder='Stade Rabemananjara' /></label><label className='grid gap-1'><span className={labelClass}>Adresse précise</span><input value={event.address} onChange={(input) => setEvent((current) => ({ ...current, address: input.target.value }))} className={inputClass} placeholder='Quartier, rue, repère' /></label></div>
          </div>
          <div className='border-t border-[#303238] pt-3'>
            <div className='flex flex-wrap items-center justify-between gap-2'><div><h3 className='text-[10px] font-semibold text-zinc-200'>Coorganisation</h3><p className='mt-1 text-[9px] text-zinc-500'>Invitez une ou plusieurs organisations. L’accès de gestion devient actif après acceptation.</p></div><button type='button' onClick={() => setCoorganizers(current => [...current, { organizationId: '', name: '', role: 'Coorganisateur', status: 'pending' }])} className={organizerButtonClass}><Plus size={13} />Ajouter</button></div>
            <div className='mt-2 grid gap-2'>{coorganizers.map((item, index) => <div key={`${item.organizationId}-${index}`} className='grid gap-2 border border-[#303238] bg-[#111214] p-2 sm:grid-cols-[1fr_180px_auto]'><label className='grid gap-1'><span className={labelClass}>Organisation</span><select value={item.organizationId} onChange={input => { const candidate = coorganizerCandidates.find(value => value.id === input.target.value); setCoorganizers(current => current.map((value, itemIndex) => itemIndex === index ? { ...value, organizationId: input.target.value, name: candidate?.name ?? '' } : value)); }} className={inputClass}><option value=''>Sélectionner une organisation</option>{coorganizerCandidates.filter(candidate => !coorganizers.some((selected, selectedIndex) => selectedIndex !== index && selected.organizationId === candidate.id)).map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.name} · {candidate.type}</option>)}</select></label><label className='grid gap-1'><span className={labelClass}>Rôle</span><select value={item.role} onChange={input => setCoorganizers(current => current.map((value, itemIndex) => itemIndex === index ? { ...value, role: input.target.value } : value))} className={inputClass}><option>Coorganisateur</option><option>Producteur associé</option><option>Partenaire opérationnel</option><option>Organisation hôte</option></select></label><button type='button' onClick={() => setCoorganizers(current => current.filter((_, itemIndex) => itemIndex !== index))} className='mt-4 grid h-9 w-9 place-items-center border border-[#343840] text-zinc-600 hover:text-[#ff4058]' aria-label='Retirer le coorganisateur'><Trash2 size={13} /></button></div>)}</div>
          </div>
        </section>}

        {step === 1 && <section className='grid gap-2'><header className='flex items-center justify-between'><div><h3 className='text-[11px] font-semibold'>Fight Card multidisciplinaire</h3><p className='mt-1 text-[8px] text-zinc-600'>Chaque combat possède son segment, sa discipline et ses deux participants.</p></div><button type='button' onClick={() => setFightCards((current) => [...current, { segment: 'Préliminaire', discipline: 'MMA', red: '', blue: '' }])} className={organizerButtonClass}><Plus size={13} />Ajouter une carte</button></header>{fightCards.map((fight, index) => <article key={`${fight.segment}-${index}`} className='grid gap-3 border border-[#303238] bg-[#111214] p-3 lg:grid-cols-[150px_150px_1fr_1fr_auto]'><label className='grid gap-1'><span className={labelClass}>Segment</span><select value={fight.segment} onChange={(input) => updateFight(index, { segment: input.target.value })} className={inputClass}><option>Main Event</option><option>Co-Main Event</option><option>Carte principale</option><option>Préliminaire</option></select></label><label className='grid gap-1'><span className={labelClass}>Discipline</span><DisciplineSelect value={fight.discipline} onChange={(input) => updateFight(index, { discipline: input.target.value })} className={inputClass} /></label><MentionField label='Coin rouge' value={fight.red} role='combattant' onChange={(red) => updateFight(index, { red })} onInvite={invite} /><MentionField label='Coin bleu' value={fight.blue} role='combattant' onChange={(blue) => updateFight(index, { blue })} onInvite={invite} /><button type='button' disabled={fightCards.length <= 1} onClick={() => setFightCards((current) => current.filter((_, itemIndex) => itemIndex !== index))} className='mt-4 grid h-9 w-9 place-items-center border border-[#343840] text-zinc-600 hover:text-[#ff4058] disabled:opacity-30' aria-label='Supprimer cette carte'><Trash2 size={13} /></button></article>)}</section>}

        {step === 2 && <AssignmentStep title='Officiels assignés' description='Arbitres, juges, médecins et superviseurs affectés à l’événement.' items={officials} roles={['Arbitre central', 'Juge', 'Médecin', 'Superviseur', 'Chronométreur', 'Annonceur']} profileRole='arbitre' onChange={(index, patch) => updateAssignment('officials', index, patch)} onAdd={() => setOfficials((current) => [...current, { name: '', role: 'Juge' }])} onRemove={(index) => setOfficials((current) => current.filter((_, itemIndex) => itemIndex !== index))} onInvite={invite} />}
        {step === 3 && <AssignmentStep title='Équipe de production' description='Toutes les personnes désignées pour travailler sur l’événement.' items={team} roles={['Responsable opérations', 'Fight Manager', 'Billetterie', 'Sécurité', 'Logistique', 'Communication', 'Régie', 'Accueil']} profileRole='fan' onChange={(index, patch) => updateAssignment('team', index, patch)} onAdd={() => setTeam((current) => [...current, { name: '', role: 'Logistique' }])} onRemove={(index) => setTeam((current) => current.filter((_, itemIndex) => itemIndex !== index))} onInvite={invite} />}

        {step === 4 && <section className='grid gap-4'><div className='grid gap-3 sm:grid-cols-3'><label className='grid gap-1'><span className={labelClass}>Budget prévisionnel *</span><input type='number' min='0' value={budget} onChange={(input) => setBudget(input.target.value)} className={inputClass} placeholder='120000000' /></label><div className='border border-[#303238] bg-[#111214] p-3'><span className={labelClass}>Dépenses</span><strong className='mt-2 block text-[16px]'>{totalExpenses.toLocaleString('fr-FR')} Ar</strong></div><div className='border border-[#303238] bg-[#111214] p-3'><span className={labelClass}>Solde calculé</span><strong className={`mt-2 block text-[16px] ${balance < 0 ? 'text-[#ff4058]' : 'text-emerald-400'}`}>{balance.toLocaleString('fr-FR')} Ar</strong></div></div><header className='flex items-center justify-between'><h3 className='text-[10px] font-semibold'>Dépenses prévues</h3><button type='button' onClick={() => setExpenses((current) => [...current, { label: '', amount: '' }])} className={organizerButtonClass}><Plus size={13} />Ajouter une dépense</button></header>{expenses.map((expense, index) => <div key={index} className='grid gap-2 sm:grid-cols-[1fr_180px_auto]'><input value={expense.label} onChange={(input) => setExpenses((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, label: input.target.value } : item))} className={inputClass} placeholder='Libellé de la dépense' /><input type='number' min='0' value={expense.amount} onChange={(input) => setExpenses((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, amount: input.target.value } : item))} className={inputClass} placeholder='Montant Ar' /><button type='button' disabled={expenses.length <= 1} onClick={() => setExpenses((current) => current.filter((_, itemIndex) => itemIndex !== index))} className='grid h-9 w-9 place-items-center border border-[#343840] text-zinc-600 hover:text-[#ff4058] disabled:opacity-30'><Trash2 size={13} /></button></div>)}</section>}

        {step === 5 && <section className='grid gap-4'><header className='flex items-center justify-between'><div><h3 className='text-[11px] font-semibold'>Système de billetterie</h3><p className='mt-1 text-[8px] text-zinc-600'>Tarifs, quotas, périodes, canaux, accès, conditions et publication.</p></div><button type='button' onClick={() => setTickets((current) => [...current, { ...emptyTicketTypeDraft }])} className={organizerButtonClass}><Plus size={13} />Ajouter un type</button></header>{tickets.map((ticket, index) => <article key={index} className='border border-[#303238] bg-[#111214]'><header className='flex h-10 items-center justify-between border-b border-[#303238] px-3'><strong className='text-[9px] uppercase tracking-[0.1em] text-zinc-400'>Type de billet {index + 1}</strong><button type='button' disabled={tickets.length <= 1} onClick={() => setTickets((current) => current.filter((_, itemIndex) => itemIndex !== index))} className='text-zinc-600 hover:text-[#ff4058] disabled:opacity-30'><Trash2 size={13} /></button></header><div className='p-3'><TicketTypeForm value={ticket} onChange={(next) => setTickets((current) => current.map((item, itemIndex) => itemIndex === index ? next : item))} /></div></article>)}</section>}
      </div>
    </OrganizerDialog>
  </>;
}

function AssignmentStep({ title, description, items, roles, profileRole, onChange, onAdd, onRemove, onInvite }: { title: string; description: string; items: AssignmentDraft[]; roles: string[]; profileRole: 'arbitre' | 'fan'; onChange: (index: number, patch: Partial<AssignmentDraft>) => void; onAdd: () => void; onRemove: (index: number) => void; onInvite: (mention: string) => void }) {
  return <section className='grid gap-2'><header className='flex items-center justify-between gap-3'><div><h3 className='text-[11px] font-semibold'>{title}</h3><p className='mt-1 text-[8px] text-zinc-600'>{description}</p></div><button type='button' onClick={onAdd} className={organizerButtonClass}><Plus size={13} />Ajouter une personne</button></header>{items.map((item, index) => <article key={index} className='grid gap-3 border border-[#303238] bg-[#111214] p-3 sm:grid-cols-[1fr_220px_auto]'><MentionField label='Personne' value={item.name} role={profileRole} onChange={(name) => onChange(index, { name })} onInvite={onInvite} /><label className='grid gap-1'><span className={labelClass}>Fonction</span><select value={item.role} onChange={(input) => onChange(index, { role: input.target.value })} className={inputClass}>{roles.map((role) => <option key={role}>{role}</option>)}</select></label><button type='button' disabled={items.length <= 1} onClick={() => onRemove(index)} className='mt-4 grid h-9 w-9 place-items-center border border-[#343840] text-zinc-600 hover:text-[#ff4058] disabled:opacity-30'><Trash2 size={13} /></button></article>)}</section>;
}
