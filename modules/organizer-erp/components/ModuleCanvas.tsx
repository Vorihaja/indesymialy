export function ModuleCanvas({ module, tab, live = false }: { module: string; tab: string; live?: boolean }) {
  return <div className='grid min-h-[420px] place-items-center border border-dashed border-[#2b2e34] bg-[#111215]'>
    <div className='text-center'><span className={`mx-auto mb-3 block h-1.5 w-1.5 rounded-full ${live ? 'bg-[#ff1638] animate-pulse' : 'bg-[#3b414b]'}`} /><strong className='block text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500'>{module}</strong><span className='mt-1 block text-[9px] text-zinc-600'>{tab} · structure prête pour composition</span></div>
  </div>;
}
