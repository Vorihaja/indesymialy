'use client';

import { useEffect, type ReactNode } from 'react';
import { CheckCircle2, CircleAlert, Info, TriangleAlert, X } from 'lucide-react';

export type OrganizerToastState = {
  message: string;
  tone?: 'success' | 'info' | 'warning' | 'error';
} | null;

export function OrganizerDialog({ open, eyebrow, title, description, children, footer, wide = false, onClose }: {
  open: boolean;
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return <div className='fixed inset-0 z-[200] grid place-items-center bg-black/70 p-4' role='presentation' onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={`max-h-[min(760px,calc(100dvh-32px))] w-full overflow-y-auto border border-[#3a3d44] bg-[#151619] text-zinc-100 shadow-2xl ${wide ? 'max-w-[1040px]' : 'max-w-[620px]'}`} role='dialog' aria-modal='true' aria-label={title}>
      <header className='flex items-start justify-between gap-4 border-b border-[#303238] px-4 py-3'>
        <div>{eyebrow && <span className='block text-[8px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]'>{eyebrow}</span>}<h2 className='mt-0.5 text-[12px] font-semibold'>{title}</h2>{description && <p className='mt-1 text-[9px] leading-4 text-zinc-500'>{description}</p>}</div>
        <button type='button' onClick={onClose} className='grid h-8 w-8 flex-none place-items-center border border-[#343840] text-zinc-500 hover:bg-white/[0.04] hover:text-white' aria-label='Fermer'><X size={15} /></button>
      </header>
      {children && <div className='p-4'>{children}</div>}
      {footer && <footer className='flex min-h-12 flex-wrap items-center justify-end gap-2 border-t border-[#303238] bg-[#111214] px-4 py-2'>{footer}</footer>}
    </section>
  </div>;
}

export function OrganizerToast({ toast, onClose }: { toast: OrganizerToastState; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(onClose, 3200);
    return () => window.clearTimeout(timeout);
  }, [toast, onClose]);

  if (!toast) return null;
  const Icon = toast.tone === 'error' ? CircleAlert : toast.tone === 'warning' ? TriangleAlert : toast.tone === 'info' ? Info : CheckCircle2;
  const tone = toast.tone === 'error' ? 'border-[#ff1638] text-[#ff4058]' : toast.tone === 'warning' ? 'border-amber-500 text-amber-400' : toast.tone === 'info' ? 'border-[#087cff] text-[#3d92ff]' : 'border-emerald-500 text-emerald-400';
  return <div className={`fixed right-4 z-[220] flex min-h-11 max-w-[360px] items-center gap-3 border-l-2 border-y border-r border-y-[#343840] border-r-[#343840] bg-[#17191d] px-3 py-2 shadow-xl ${tone}`} style={{ top: 'calc(var(--platform-header-height, 84px) + 12px)' }} role={toast.tone === 'error' ? 'alert' : 'status'} aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}>
    <Icon size={15} className='flex-none' /><span className='text-[10px] font-semibold text-zinc-200'>{toast.message}</span><button type='button' onClick={onClose} className='ml-auto text-zinc-600 hover:text-white' aria-label='Fermer'><X size={13} /></button>
  </div>;
}

export const organizerButtonClass = 'flex h-8 items-center gap-2 border border-[#3a3e46] px-3 text-[9px] font-semibold text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-40';
export const organizerPrimaryButtonClass = 'flex h-8 items-center gap-2 bg-[#ff1638] px-3 text-[9px] font-semibold text-white transition-colors hover:bg-[#e23245] disabled:cursor-not-allowed disabled:opacity-40';
