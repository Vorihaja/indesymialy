'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, Check, ChevronRight, Copy, Eye, Filter, GitBranch, MoreHorizontal, Pencil, PlayCircle, Plus, Search, Trash2, X } from 'lucide-react';
import type { OrganizerModuleMock } from '../types';
import { OrganizerDialog, OrganizerToast, organizerButtonClass, organizerPrimaryButtonClass, type OrganizerToastState } from './OrganizerFeedback';
import { TicketTypeForm, emptyTicketTypeDraft, type TicketTypeDraft } from './TicketTypeForm';
import { getOrganizerTemporalKind, OrganizerTemporalField } from './OrganizerTemporalField';
import { createEventWizardDraftFromRow, EventCreationWizard, type EventWizardDraft } from './EventCreationWizard';
import { getProfileRoleForCell, OrganizerProfileLink } from './OrganizerProfileLink';

const toneBorder = { red: 'border-l-[#ff1638]', blue: 'border-l-[#087cff]', green: 'border-l-emerald-500', amber: 'border-l-amber-500' };
type DialogMode = 'create' | 'view' | 'edit' | 'archive' | null;

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function ModuleDataView({ data, tab, onTabChange, hideKpis = false }: { data: OrganizerModuleMock; tab: string; onTabChange?: (tab: string) => void; hideKpis?: boolean }) {
  const ticketTypeView = tab === 'Types de billets' && Boolean(data.ticketTypes);
  const columns = ticketTypeView ? data.ticketTypes!.columns : data.columns;
  const [rows, setRows] = useState(ticketTypeView ? data.ticketTypes!.rows : data.rows);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [menuIndex, setMenuIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [ticketDraft, setTicketDraft] = useState<TicketTypeDraft>({ ...emptyTicketTypeDraft });
  const [toast, setToast] = useState<OrganizerToastState>(null);
  const [eventWizardOpen, setEventWizardOpen] = useState(false);
  const [eventWizardInitial, setEventWizardInitial] = useState<EventWizardDraft | undefined>(undefined);
  const [eventWizardSession, setEventWizardSession] = useState(0);
  const [editingEventIndex, setEditingEventIndex] = useState<number | null>(null);
  const [eventDrafts, setEventDrafts] = useState<Record<string, EventWizardDraft>>({});

  useEffect(() => {
    setRows(ticketTypeView ? data.ticketTypes!.rows : data.rows);
    setQuery('');
    setStatusFilter('Tous');
    setMenuIndex(null);
  }, [data, ticketTypeView]);

  const statusOptions = useMemo(() => ['Tous', ...Array.from(new Set(rows.map((row) => row.at(-1) ?? '—')))], [rows]);
  const visibleRows = useMemo(() => rows.map((row, index) => ({ row, index })).filter(({ row }) => {
    const matchesQuery = !query.trim() || row.some((cell) => cell.toLocaleLowerCase('fr').includes(query.trim().toLocaleLowerCase('fr')));
    const matchesStatus = statusFilter === 'Tous' || row.at(-1) === statusFilter;
    return matchesQuery && matchesStatus;
  }), [query, rows, statusFilter]);

  const selectedRow = selectedIndex === null ? null : rows[selectedIndex];
  const closeDialog = () => { setDialog(null); setSelectedIndex(null); };
  const prepareForm = (row?: string[]) => {
    setFormValues(Object.fromEntries(columns.map((column, index) => [column, row?.[index] ?? ''])));
    if (ticketTypeView) {
      const channels = row?.[8] === 'Tous les canaux' ? ['Web', 'Mobile money', 'Revendeurs', 'Guichet'] : row?.[8]?.split(', ') ?? ['Web'];
      setTicketDraft({ ...emptyTicketTypeDraft, name: row?.[0] ?? '', code: row?.[1] ?? '', category: row?.[2] ?? 'Standard', zone: row?.[3] ?? '', price: row?.[4]?.replaceAll(/\D/g, '') ?? '', quota: row?.[5] ?? '', channels, status: row?.[9] ?? 'Brouillon' });
    }
  };
  const openCreate = () => {
    if (data.creationMode === 'event') {
      setEventWizardInitial(undefined);
      setEditingEventIndex(null);
      setEventWizardSession((current) => current + 1);
      setEventWizardOpen(true);
      return;
    }
    prepareForm();
    if (data.ticketTypes) {
      setTicketDraft({ ...emptyTicketTypeDraft });
      if (!ticketTypeView) onTabChange?.('Types de billets');
    }
    setDialog('create');
  };
  const openRow = (mode: Exclude<DialogMode, 'create' | 'archive' | null>, index: number) => {
    if (data.creationMode === 'event' && mode === 'edit') {
      const row = rows[index];
      if (!row) return;
      setEventWizardInitial(eventDrafts[row[0]] ?? createEventWizardDraftFromRow(row));
      setEditingEventIndex(index);
      setEventWizardSession((current) => current + 1);
      setEventWizardOpen(true);
      setDialog(null);
      setMenuIndex(null);
      return;
    }
    setSelectedIndex(index);
    prepareForm(rows[index]);
    setDialog(mode);
    setMenuIndex(null);
  };

  const saveForm = () => {
    if (ticketTypeView && (!ticketDraft.name.trim() || !ticketDraft.code.trim() || !ticketDraft.zone.trim() || !ticketDraft.quota || ticketDraft.channels.length === 0)) {
      setToast({ message: 'Complète les champs obligatoires et sélectionne un canal.', tone: 'warning' });
      return;
    }
    if (ticketTypeView && (!ticketDraft.salesStart || !ticketDraft.salesEnd || new Date(ticketDraft.salesEnd) <= new Date(ticketDraft.salesStart))) {
      setToast({ message: 'Choisis une fin de vente postérieure au début.', tone: 'warning' });
      return;
    }
    const nextRow = ticketTypeView ? [
      ticketDraft.name.trim(), ticketDraft.code.trim(), ticketDraft.category, ticketDraft.zone.trim(),
      ticketDraft.price ? `${Number(ticketDraft.price).toLocaleString('fr-FR')} ${ticketDraft.currency}` : 'Gratuit',
      ticketDraft.quota, dialog === 'edit' ? selectedRow?.[6] ?? '0' : '0',
      `${new Date(ticketDraft.salesStart).toLocaleDateString('fr-FR')} → ${new Date(ticketDraft.salesEnd).toLocaleDateString('fr-FR')}`,
      ticketDraft.channels.join(', '), ticketDraft.status,
    ] : columns.map((column) => formValues[column]?.trim() || '—');
    if (dialog === 'edit' && selectedIndex !== null) {
      setRows((current) => current.map((row, index) => index === selectedIndex ? nextRow : row));
      setToast({ message: `${data.label} : élément modifié.` });
    } else {
      setRows((current) => [nextRow, ...current]);
      setToast({ message: `${data.label} : élément ajouté au prototype.` });
    }
    closeDialog();
  };

  const duplicateRow = (index: number) => {
    const duplicate = [...rows[index]];
    duplicate[0] = `${duplicate[0]} · copie`;
    setRows((current) => [duplicate, ...current]);
    setMenuIndex(null);
    setToast({ message: 'Élément dupliqué dans les données mock.' });
  };

  const validateRow = (index: number) => {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? row.map((cell, cellIndex) => cellIndex === row.length - 1 ? 'Validé' : cell) : row));
    setMenuIndex(null);
    setToast({ message: 'Statut mis à jour : Validé.' });
  };

  const applyContextAction = (index: number, action: string) => {
    const normalizedAction = action.toLocaleLowerCase('fr');
    if (normalizedAction.includes('exporter') || normalizedAction.includes('télécharger')) {
      exportCsv();
      return;
    }
    const status = normalizedAction.includes('publier') ? 'Publié' : normalizedAction.includes('confirmer') ? 'Confirmé' : normalizedAction.includes('valider') ? 'Validé' : normalizedAction.includes('annuler') ? 'Annulé' : normalizedAction.includes('refuser') || normalizedAction.includes('rejeter') ? 'Refusé' : normalizedAction.includes('clôturer') || normalizedAction.includes('terminer') ? 'Terminé' : normalizedAction.includes('payer') || normalizedAction.includes('rembourser') ? 'Payé' : normalizedAction.includes('suspendre') || normalizedAction.includes('bloquer') ? 'Suspendu' : normalizedAction.includes('envoyer') || normalizedAction.includes('notifier') || normalizedAction.includes('relancer') ? 'Envoyé' : normalizedAction.includes('démarrer') || normalizedAction.includes('ouvrir') || normalizedAction.includes('exécuter') ? 'En cours' : action;
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? row.map((cell, cellIndex) => cellIndex === row.length - 1 ? status : cell) : row));
    setMenuIndex(null);
    setToast({ message: `${action} · workflow mock mis à jour.`, tone: 'info' });
  };

  const archiveRow = () => {
    if (selectedIndex === null) return;
    setRows((current) => current.filter((_, index) => index !== selectedIndex));
    closeDialog();
    setToast({ message: 'Élément archivé. Recharge la page pour restaurer les mocks.', tone: 'warning' });
  };

  const exportCsv = () => {
    const lines = [columns, ...visibleRows.map(({ row }) => row)].map((row) => row.map(csvCell).join(';')).join('\n');
    const blob = new Blob([`\uFEFF${lines}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${data.label.toLocaleLowerCase('fr').replaceAll(/[^a-z0-9]+/gi, '-')}-${tab.toLocaleLowerCase('fr').replaceAll(/[^a-z0-9]+/gi, '-')}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setToast({ message: `${visibleRows.length} lignes exportées au format CSV.`, tone: 'info' });
  };

  const primaryAction = () => data.action.toLocaleLowerCase('fr').includes('export') ? exportCsv() : openCreate();

  return <div className='grid gap-3' onClick={() => { if (menuIndex !== null) setMenuIndex(null); }}>
    <OrganizerToast toast={toast} onClose={() => setToast(null)} />
    {!hideKpis && <section className='grid grid-cols-2 gap-px overflow-hidden border border-[#303238] bg-[#303238] xl:grid-cols-5'>
      {data.kpis.map((kpi) => <article key={kpi.label} className={`min-h-[76px] border-l-2 bg-[#151619] px-3 py-2 ${kpi.tone ? toneBorder[kpi.tone] : 'border-l-transparent'}`}><span className='text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-500'>{kpi.label}</span><strong className='mt-1.5 block truncate text-[18px] font-semibold tracking-[-0.03em]'>{kpi.value}</strong><span className='mt-0.5 block truncate text-[8px] text-zinc-500'>{kpi.detail}</span></article>)}
    </section>}

    {data.workflow && <section className='flex min-h-11 items-center gap-3 overflow-x-auto border border-[#303238] bg-[#121316] px-3 py-2'><span className='flex flex-none items-center gap-2 text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-500'><GitBranch size={13} className='text-[#3d92ff]' />{data.workflow.label}</span><div className='flex min-w-max flex-1 items-center'>{data.workflow.stages.map((stage, index) => <div key={stage} className='flex items-center'><span className={`flex h-6 items-center border px-2 text-[8px] font-semibold ${index < data.workflow!.activeStage ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : index === data.workflow!.activeStage ? 'border-[#087cff] bg-blue-500/10 text-[#3d92ff]' : 'border-[#303238] text-zinc-600'}`}>{index < data.workflow!.activeStage && <Check size={10} className='mr-1' />}{stage}</span>{index < data.workflow!.stages.length - 1 && <span className='h-px w-3 bg-[#343840]' />}</div>)}</div></section>}

    <section className='border border-[#303238] bg-[#151619]'>
      <header className='flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-[#303238] px-3 py-2'>
        <div><span className='text-[7px] font-bold uppercase tracking-[0.12em] text-zinc-500'>{data.label}</span><h2 className='mt-0.5 text-[10px] font-semibold text-zinc-100'>{tab}</h2></div>
        <div className='flex flex-wrap items-center justify-end gap-1.5'>
          {searchOpen && <label className='flex h-8 items-center border border-[#343840] bg-[#101114] px-2'><Search size={13} className='text-zinc-600' /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder='Rechercher…' className='h-full w-44 bg-transparent px-2 text-[9px] text-white outline-none placeholder:text-zinc-600' /><button type='button' onClick={() => { setQuery(''); setSearchOpen(false); }} className='text-zinc-600 hover:text-white' aria-label='Fermer la recherche'><X size={12} /></button></label>}
          {!searchOpen && <button type='button' onClick={() => setSearchOpen(true)} className='grid h-8 w-8 place-items-center border border-[#343840] text-zinc-500 hover:text-white' aria-label='Rechercher'><Search size={14} /></button>}
          <button type='button' onClick={() => setFilterOpen((current) => !current)} className={`${organizerButtonClass} ${statusFilter !== 'Tous' ? 'border-[#087cff] text-[#3d92ff]' : ''}`}><Filter size={13} />Filtrer</button>
          <button type='button' onClick={exportCsv} className={organizerButtonClass}><ArrowDownToLine size={13} />Exporter</button>
          <button type='button' onClick={primaryAction} className={organizerPrimaryButtonClass}>{data.action.toLocaleLowerCase('fr').includes('export') ? <ArrowDownToLine size={13} /> : <Plus size={13} />}{data.action}</button>
        </div>
      </header>

      {filterOpen && <div className='flex flex-wrap items-end gap-3 border-b border-[#303238] bg-[#111214] px-3 py-2'><label className='grid gap-1'><span className='text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-600'>Statut</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className='h-8 min-w-44 border border-[#343840] bg-[#17191d] px-2 text-[9px] text-zinc-300 outline-none'>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label><button type='button' onClick={() => { setStatusFilter('Tous'); setQuery(''); }} className={organizerButtonClass}>Réinitialiser</button><button type='button' onClick={() => setFilterOpen(false)} className={organizerPrimaryButtonClass}><Check size={13} />Appliquer</button></div>}

      <div className='overflow-x-auto'><table className='w-full min-w-[860px] border-collapse text-left text-[10px]'><thead className='bg-[#101114] text-[8px] uppercase tracking-[0.09em] text-zinc-500'><tr>{columns.map((column) => <th key={column} className='h-8 border-b border-[#292c31] px-3 font-semibold'>{column}</th>)}<th className='w-10 border-b border-[#292c31]' /></tr></thead><tbody className='divide-y divide-[#292c31]'>
        {visibleRows.map(({ row, index: rowIndex }) => <tr key={`${row[0]}-${rowIndex}`} className='group hover:bg-white/[0.025]'>{row.map((cell, index) => { const profileRole = getProfileRoleForCell(columns[index] ?? '', row); return <td key={`${cell}-${index}`} className={`h-10 whitespace-nowrap px-3 ${index === 0 ? 'font-semibold text-zinc-200' : cell.includes('Confirmé') || cell.includes('Valide') || cell.includes('Reçu') || cell.includes('Atteint') || cell === 'Actif' ? 'text-emerald-400' : cell.toLocaleLowerCase('fr').includes('attente') || cell.toLocaleLowerCase('fr').includes('surveiller') || cell.includes('Partiel') ? 'text-amber-400' : 'text-zinc-400'}`}>{profileRole ? <OrganizerProfileLink name={cell} role={profileRole} /> : cell}</td>; })}<td className='relative'><button type='button' onClick={(event) => { event.stopPropagation(); setMenuIndex(menuIndex === rowIndex ? null : rowIndex); }} className='grid h-8 w-8 place-items-center text-zinc-600 group-hover:text-zinc-300' aria-label={`Actions pour ${row[0]}`}><MoreHorizontal size={15} /></button>{menuIndex === rowIndex && <div className='absolute right-2 top-8 z-30 w-44 border border-[#3b3f47] bg-[#191b1f] py-1 shadow-xl' onClick={(event) => event.stopPropagation()}>{[[Eye, 'Consulter', () => openRow('view', rowIndex)], [Pencil, 'Modifier', () => openRow('edit', rowIndex)], [Copy, 'Dupliquer', () => duplicateRow(rowIndex)]].map(([Icon, label, action]) => { const ActionIcon = Icon as typeof Eye; return <button key={String(label)} type='button' onClick={action as () => void} className='flex h-8 w-full items-center gap-2 px-3 text-left text-[9px] text-zinc-400 hover:bg-white/[0.04] hover:text-white'><ActionIcon size={13} />{String(label)}</button>; })}{data.rowActions && <div className='my-1 border-t border-[#303238] pt-1'>{data.rowActions.map((action) => <button key={action} type='button' onClick={() => applyContextAction(rowIndex, action)} className='flex h-8 w-full items-center gap-2 px-3 text-left text-[9px] text-[#3d92ff] hover:bg-blue-500/10'><PlayCircle size={13} />{action}</button>)}</div>}{!data.rowActions && <button type='button' onClick={() => validateRow(rowIndex)} className='flex h-8 w-full items-center gap-2 px-3 text-left text-[9px] text-zinc-400 hover:bg-white/[0.04] hover:text-white'><Check size={13} />Marquer validé</button>}<button type='button' onClick={() => { setSelectedIndex(rowIndex); setDialog('archive'); setMenuIndex(null); }} className='flex h-8 w-full items-center gap-2 px-3 text-left text-[9px] text-[#ff4058] hover:bg-red-500/10'><Trash2 size={13} />Archiver</button></div>}</td></tr>)}
        {visibleRows.length === 0 && <tr><td colSpan={columns.length + 1} className='h-24 px-3 text-center text-[10px] text-zinc-600'>Aucun résultat pour ces critères.</td></tr>}
      </tbody></table></div>
      <footer className='flex h-9 items-center justify-between border-t border-[#303238] px-3 text-[8px] text-zinc-500'><span>{visibleRows.length} sur {rows.length} résultats mock</span><span>Page 1 / 1</span></footer>
    </section>

    {(data.progress || data.focus) && <div className='grid gap-3 lg:grid-cols-2'>
      {data.progress && <section className='border border-[#303238] bg-[#151619] p-3'><h3 className='text-[9px] font-bold uppercase tracking-[0.11em] text-zinc-400'>Progression</h3><div className='mt-3 grid gap-3'>{data.progress.map((item) => <div key={item.label}><div className='flex items-end justify-between gap-3'><div><strong className='block text-[10px] font-semibold'>{item.label}</strong><span className='text-[8px] text-zinc-500'>{item.detail}</span></div><span className='font-mono text-[11px] text-zinc-300'>{item.value} %</span></div><div className='mt-1.5 h-1 bg-[#292c31]'><div className='h-full bg-[#087cff]' style={{ width: `${item.value}%` }} /></div></div>)}</div></section>}
      {data.focus && <section className='border border-[#303238] bg-[#151619]'><header className='h-10 border-b border-[#303238] px-3 py-2'><h3 className='text-[9px] font-bold uppercase tracking-[0.11em] text-zinc-400'>{data.focus.title}</h3></header><div className='divide-y divide-[#292c31]'>{data.focus.items.map((item) => <button type='button' key={item.label} onClick={() => setToast({ message: `${item.label} : ${item.value}`, tone: 'info' })} className='flex min-h-9 w-full items-center justify-between gap-3 px-3 text-left hover:bg-white/[0.025]'><span className='text-[9px] text-zinc-500'>{item.label}</span><span className={`flex items-center gap-2 text-[10px] font-semibold ${item.status === 'warning' ? 'text-amber-400' : item.status === 'done' ? 'text-emerald-400' : 'text-zinc-300'}`}>{item.value}<ChevronRight size={12} /></span></button>)}</div></section>}
    </div>}

    <OrganizerDialog open={dialog === 'create' || dialog === 'edit'} eyebrow={data.label} title={dialog === 'edit' ? 'Modifier l’élément' : data.action} description='Prototype UI : les changements restent locaux jusqu’au rechargement de la page.' onClose={closeDialog} footer={<><button type='button' onClick={closeDialog} className={organizerButtonClass}>Annuler</button><button type='button' onClick={saveForm} className={organizerPrimaryButtonClass}><Check size={13} />Enregistrer</button></>}>
      {ticketTypeView ? <TicketTypeForm value={ticketDraft} onChange={setTicketDraft} /> : <form className='grid gap-3 sm:grid-cols-2' onSubmit={(event) => { event.preventDefault(); saveForm(); }}>{columns.map((column, index) => { const temporalKind = getOrganizerTemporalKind(column); return <label key={column} className={`grid gap-1 ${index === 0 ? 'sm:col-span-2' : ''}`}><span className='text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-500'>{column}</span>{temporalKind ? <OrganizerTemporalField kind={temporalKind} value={formValues[column] ?? ''} onChange={(value) => setFormValues((current) => ({ ...current, [column]: value }))} /> : <input value={formValues[column] ?? ''} onChange={(event) => setFormValues((current) => ({ ...current, [column]: event.target.value }))} required={index === 0} className='h-9 border border-[#343840] bg-[#101114] px-2.5 text-[10px] text-white outline-none focus:border-[#087cff]' placeholder={index === 0 ? 'Champ obligatoire' : column} />}</label>; })}</form>}
    </OrganizerDialog>

    <OrganizerDialog open={dialog === 'view'} eyebrow={data.label} title={selectedRow?.[0] ?? 'Détail'} description={`Vue détaillée · ${tab}`} onClose={closeDialog} footer={<><button type='button' onClick={closeDialog} className={organizerButtonClass}>Fermer</button><button type='button' onClick={() => { if (selectedIndex !== null) openRow('edit', selectedIndex); }} className={organizerPrimaryButtonClass}><Pencil size={13} />Modifier</button></>}>
      <dl className='grid border border-[#303238] sm:grid-cols-2'>{columns.map((column, index) => <div key={column} className='border-b border-[#292c31] p-3 sm:odd:border-r'><dt className='text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-600'>{column}</dt><dd className='mt-1 text-[10px] font-semibold text-zinc-200'>{selectedRow?.[index] ?? '—'}</dd></div>)}</dl>
    </OrganizerDialog>

    <OrganizerDialog open={dialog === 'archive'} eyebrow='Confirmation' title='Archiver cet élément ?' description='Cette action modifie uniquement les données mock de cette session.' onClose={closeDialog} footer={<><button type='button' onClick={closeDialog} className={organizerButtonClass}>Conserver</button><button type='button' onClick={archiveRow} className={organizerPrimaryButtonClass}><Trash2 size={13} />Archiver</button></>}><p className='text-[10px] leading-5 text-zinc-400'>{selectedRow?.[0] ?? 'Élément sélectionné'} sera retiré de la liste. Un rechargement restaurera les données initiales.</p></OrganizerDialog>

    <EventCreationWizard key={`event-wizard-${eventWizardSession}`} open={eventWizardOpen} initialValue={eventWizardInitial} onClose={() => setEventWizardOpen(false)} onSave={(row, mode, draft) => {
      const previousName = editingEventIndex === null ? null : rows[editingEventIndex]?.[0] ?? null;
      setRows((current) => editingEventIndex === null ? [row, ...current] : current.map((item, index) => index === editingEventIndex ? row : item));
      setEventDrafts((current) => { const next = { ...current }; if (previousName && previousName !== row[0]) delete next[previousName]; next[row[0]] = draft; return next; });
      setToast({ message: editingEventIndex !== null ? `Événement modifié avec ${row.at(-1)} de readiness.` : mode === 'Brouillon' ? `Brouillon enregistré avec ${row.at(-1)} de readiness.` : `Événement créé avec ${row.at(-1)} de readiness.` });
      setEditingEventIndex(null);
    }} />
  </div>;
}
