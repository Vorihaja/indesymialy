import { Apple, Dumbbell, Medal, Shirt, Ticket, Wrench } from 'lucide-react';
import type { MarketProduct } from '../types';

export function ProductVisual({ product, compact = false }: { product: MarketProduct; compact?: boolean }) {
  const Icon = product.category === 'Protections' ? Medal : product.category === 'Textile' ? Shirt : product.category === 'Nutrition' ? Apple : product.category === 'Billetterie' ? Ticket : product.category === 'Services' ? Wrench : Dumbbell;
  const accent = product.accent === 'red' ? 'border-red-800/60 text-red-400 bg-red-950/20' : product.accent === 'blue' ? 'border-blue-800/60 text-blue-400 bg-blue-950/20' : product.accent === 'green' ? 'border-emerald-800/60 text-emerald-400 bg-emerald-950/20' : 'border-amber-800/60 text-amber-400 bg-amber-950/20';
  return <div className={`relative grid overflow-hidden border ${accent} ${compact ? 'h-20 w-20 flex-none' : 'aspect-[4/3] w-full'}`}><div className='absolute inset-0 opacity-30' style={{ backgroundImage: 'linear-gradient(#343840 1px, transparent 1px), linear-gradient(90deg, #343840 1px, transparent 1px)', backgroundSize: compact ? '10px 10px' : '18px 18px' }} /><div className='relative grid place-items-center'><Icon size={compact ? 26 : 48} strokeWidth={1.2} /><span className='absolute bottom-2 left-2 text-[6px] font-bold uppercase tracking-[0.14em] opacity-70'>{product.brand}</span></div></div>;
}
