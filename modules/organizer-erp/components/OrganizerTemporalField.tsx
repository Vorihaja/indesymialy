export type OrganizerTemporalKind = 'date' | 'time' | 'datetime-local' | 'date-range' | 'time-range';

const inputClass = 'h-9 w-full cursor-pointer border border-[#343840] bg-[#101114] px-2.5 text-[10px] text-white outline-none focus:border-[#087cff]';

function normalized(value: string, type: 'date' | 'time' | 'datetime-local') {
  if (type === 'date') return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
  if (type === 'time') return /^\d{2}:\d{2}$/.test(value) ? value : '';
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? value : '';
}

function Picker({ type, value, onChange, min }: { type: 'date' | 'time' | 'datetime-local'; value: string; onChange: (value: string) => void; min?: string }) {
  return <input type={type} value={normalized(value, type)} min={min} onChange={(event) => onChange(event.target.value)} onClick={(event) => event.currentTarget.showPicker()} onKeyDown={(event) => event.preventDefault()} onPaste={(event) => event.preventDefault()} onDrop={(event) => event.preventDefault()} className={inputClass} />;
}

function splitRange(value: string) {
  const parts = value.split(/\s*(?:→|–|—)\s*/);
  return [parts[0] ?? '', parts[1] ?? ''] as const;
}

export function OrganizerTemporalField({ kind, value, onChange }: { kind: OrganizerTemporalKind; value: string; onChange: (value: string) => void }) {
  if (kind === 'date' || kind === 'time' || kind === 'datetime-local') return <div className='grid gap-1'><Picker type={kind} value={value} onChange={onChange} /><span className='text-[8px] text-zinc-600'>Cliquer pour ouvrir le sélecteur.</span></div>;

  const [start, end] = splitRange(value);
  const type = kind === 'date-range' ? 'date' : 'time';
  return <div className='grid grid-cols-[1fr_auto_1fr] items-center gap-2'><Picker type={type} value={start} onChange={(next) => onChange(`${next} → ${end}`)} /><span className='text-[9px] text-zinc-600'>à</span><Picker type={type} value={end} min={start || undefined} onChange={(next) => onChange(`${start} → ${next}`)} /></div>;
}

export function getOrganizerTemporalKind(label: string): OrganizerTemporalKind | null {
  const normalizedLabel = label.toLocaleLowerCase('fr').normalize('NFD').replaceAll(/[\u0300-\u036f]/g, '').trim();
  if (normalizedLabel.includes('periode')) return 'date-range';
  if (normalizedLabel === 'horaires' || normalizedLabel.includes('disponibilite')) return 'time-range';
  if ((normalizedLabel.includes('date') && normalizedLabel.includes('heure')) || normalizedLabel.includes('echeance') || normalizedLabel.includes('validite') || normalizedLabel.includes('derniere activite') || normalizedLabel.includes('livraison') || normalizedLabel.includes('installation') || normalizedLabel.includes('prise de poste') || normalizedLabel.includes('mise a jour') || normalizedLabel.includes('derniere synchro') || normalizedLabel.includes('genere le')) return 'datetime-local';
  if (normalizedLabel === 'heure' || normalizedLabel === 'horaire' || normalizedLabel.includes('heure de')) return 'time';
  if (normalizedLabel === 'date' || normalizedLabel === 'debut' || normalizedLabel === 'fin' || normalizedLabel.includes('emission') || normalizedLabel.includes('envoyee le') || normalizedLabel.startsWith('date ') || normalizedLabel.endsWith(' date')) return 'date';
  return null;
}
