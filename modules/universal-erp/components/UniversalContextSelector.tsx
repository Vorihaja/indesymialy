import { ChevronDown } from 'lucide-react';

export function UniversalContextSelector({ moduleLabel, tabs, active, onChange }: {
  moduleLabel: string;
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}) {
  if (tabs.length <= 1) return null;

  return <div className='flex min-h-10 flex-wrap items-center justify-between gap-2 border border-[#303238] bg-[#141518] px-3 py-1.5'>
    <div>
      <span className='block text-[7px] font-bold uppercase tracking-[0.12em] text-zinc-600'>Module actif</span>
      <strong className='mt-0.5 block text-[9px] font-semibold text-zinc-300'>{moduleLabel}</strong>
    </div>
    <label className='relative flex h-8 min-w-[210px] items-center border border-[#343840] bg-[#101114]'>
      <span className='sr-only'>Sous-fonction</span>
      <select value={active} onChange={(event) => onChange(event.target.value)} className='h-full w-full cursor-pointer appearance-none bg-transparent px-2.5 pr-8 text-[9px] font-semibold text-zinc-300 outline-none focus:border-[#087cff]'>
        {tabs.map((tab) => <option key={tab} value={tab} className='bg-[#17191d]'>{tab}</option>)}
      </select>
      <ChevronDown size={13} className='pointer-events-none absolute right-2 text-zinc-600' />
    </label>
  </div>;
}
