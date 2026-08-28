export type TicketTypeDraft = {
  name: string;
  code: string;
  category: string;
  zone: string;
  price: string;
  currency: string;
  quota: string;
  maxPerOrder: string;
  salesStart: string;
  salesEnd: string;
  channels: string[];
  conditions: string;
  status: string;
};

export const emptyTicketTypeDraft: TicketTypeDraft = {
  name: '',
  code: '',
  category: 'Standard',
  zone: '',
  price: '',
  currency: 'Ar',
  quota: '',
  maxPerOrder: '6',
  salesStart: '2026-08-11T08:00',
  salesEnd: '2026-08-30T18:00',
  channels: ['Web'],
  conditions: '',
  status: 'Brouillon',
};

const inputClass = 'h-9 w-full border border-[#343840] bg-[#101114] px-2.5 text-[10px] text-white outline-none focus:border-[#087cff]';
const labelClass = 'text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-500';
const channelOptions = ['Web', 'Mobile money', 'Revendeurs', 'Guichet', 'Back-office'];

export function TicketTypeForm({ value, onChange }: { value: TicketTypeDraft; onChange: (value: TicketTypeDraft) => void }) {
  const update = <Key extends keyof TicketTypeDraft>(key: Key, next: TicketTypeDraft[Key]) => onChange({ ...value, [key]: next });
  const toggleChannel = (channel: string) => update('channels', value.channels.includes(channel) ? value.channels.filter((item) => item !== channel) : [...value.channels, channel]);

  return <div className='grid gap-4'>
    <section className='grid gap-3 sm:grid-cols-2'>
      <label className='grid gap-1 sm:col-span-2'><span className={labelClass}>Nom du billet *</span><input autoFocus required value={value.name} onChange={(event) => update('name', event.target.value)} className={inputClass} placeholder='Ex. Tribune A · Tarif standard' /></label>
      <label className='grid gap-1'><span className={labelClass}>Code *</span><input required value={value.code} onChange={(event) => update('code', event.target.value.toUpperCase().replaceAll(' ', '-'))} className={inputClass} placeholder='MFN-TA' /></label>
      <label className='grid gap-1'><span className={labelClass}>Catégorie</span><select value={value.category} onChange={(event) => update('category', event.target.value)} className={inputClass}><option>Standard</option><option>VIP</option><option>Promotionnel</option><option>Invitation</option><option>Staff</option><option>Presse</option></select></label>
      <label className='grid gap-1 sm:col-span-2'><span className={labelClass}>Zone d’accès *</span><input required value={value.zone} onChange={(event) => update('zone', event.target.value)} className={inputClass} placeholder='Tribune, espace VIP, backstage…' /></label>
    </section>

    <section className='grid gap-3 border-t border-[#303238] pt-4 sm:grid-cols-4'>
      <label className='grid gap-1 sm:col-span-2'><span className={labelClass}>Prix</span><input type='number' min='0' step='1000' value={value.price} onChange={(event) => update('price', event.target.value)} className={inputClass} placeholder='45000' /></label>
      <label className='grid gap-1'><span className={labelClass}>Devise</span><select value={value.currency} onChange={(event) => update('currency', event.target.value)} className={inputClass}><option>Ar</option><option>EUR</option><option>USD</option></select></label>
      <label className='grid gap-1'><span className={labelClass}>Quota *</span><input required type='number' min='1' value={value.quota} onChange={(event) => update('quota', event.target.value)} className={inputClass} placeholder='800' /></label>
      <label className='grid gap-1'><span className={labelClass}>Maximum / commande</span><input type='number' min='1' value={value.maxPerOrder} onChange={(event) => update('maxPerOrder', event.target.value)} className={inputClass} /></label>
      <label className='grid gap-1 sm:col-span-2'><span className={labelClass}>Début des ventes *</span><input required type='datetime-local' value={value.salesStart} onChange={(event) => update('salesStart', event.target.value)} onClick={(event) => event.currentTarget.showPicker()} onKeyDown={(event) => event.preventDefault()} onPaste={(event) => event.preventDefault()} onDrop={(event) => event.preventDefault()} className={`${inputClass} cursor-pointer`} /><span className='text-[8px] text-zinc-600'>Cliquer pour choisir automatiquement la date et l’heure.</span></label>
      <label className='grid gap-1 sm:col-span-2'><span className={labelClass}>Fin des ventes *</span><input required type='datetime-local' value={value.salesEnd} min={value.salesStart} onChange={(event) => update('salesEnd', event.target.value)} onClick={(event) => event.currentTarget.showPicker()} onKeyDown={(event) => event.preventDefault()} onPaste={(event) => event.preventDefault()} onDrop={(event) => event.preventDefault()} className={`${inputClass} cursor-pointer`} /><span className='text-[8px] text-zinc-600'>La fin ne peut pas précéder le début des ventes.</span></label>
    </section>

    <section className='grid gap-2 border-t border-[#303238] pt-4'><span className={labelClass}>Canaux de distribution *</span><div className='grid gap-px border border-[#303238] bg-[#303238] sm:grid-cols-3'>{channelOptions.map((channel) => <label key={channel} className='flex h-9 cursor-pointer items-center gap-2 bg-[#111214] px-3 text-[9px] text-zinc-400 hover:text-white'><input type='checkbox' checked={value.channels.includes(channel)} onChange={() => toggleChannel(channel)} className='accent-[#087cff]' />{channel}</label>)}</div></section>

    <section className='grid gap-3 border-t border-[#303238] pt-4 sm:grid-cols-[1fr_180px]'>
      <label className='grid gap-1'><span className={labelClass}>Conditions et avantages</span><textarea value={value.conditions} onChange={(event) => update('conditions', event.target.value)} className='min-h-20 resize-y border border-[#343840] bg-[#101114] p-2.5 text-[10px] text-white outline-none focus:border-[#087cff]' placeholder='Accès inclus, justificatif nécessaire, conditions de remboursement…' /></label>
      <label className='grid content-start gap-1'><span className={labelClass}>Statut initial</span><select value={value.status} onChange={(event) => update('status', event.target.value)} className={inputClass}><option>Brouillon</option><option>Actif</option><option>Publié</option></select><span className='mt-1 text-[8px] leading-4 text-zinc-600'>« Publié » rend le billet disponible sur les canaux sélectionnés dans ce prototype.</span></label>
    </section>
  </div>;
}
