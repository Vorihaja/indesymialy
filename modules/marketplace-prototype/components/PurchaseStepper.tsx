'use client';

import { Minus, Plus } from 'lucide-react';
import { useMarketplacePrototype } from '../MarketplaceStore';
import type { MarketProduct } from '../types';

export function PurchaseStepper({ product, variant, startDate, endDate, className = '' }: { product: MarketProduct; variant?: string; startDate?: string; endDate?: string; className?: string }) {
  const store = useMarketplacePrototype();
  const mode = product.type === 'rental' ? 'rental' : 'sale';
  const selectedVariant = variant ?? product.variants[0] ?? 'Standard';
  const line = store.cart.find((item) => item.productId === product.id && item.variant === selectedVariant && item.mode === mode);
  const quantity = line?.quantity ?? 0;
  const add = () => store.addToCart(product.id, selectedVariant, mode, startDate, endDate);
  const remove = () => { if (line) store.updateQuantity(line.id, line.quantity - 1); };

  return <div className={`flex h-8 overflow-hidden border ${quantity > 0 ? 'border-[#2588ff] bg-[#087cff] text-white' : 'border-[#3a3e46] bg-[#151619] text-zinc-300'} ${className}`} aria-label={`Quantité de ${product.title}`}>
    <button type='button' disabled={quantity === 0} onClick={remove} className='grid h-full w-8 place-items-center border-r border-white/15 transition-colors hover:bg-white/10 active:bg-[#1f5fac] disabled:text-zinc-700 disabled:hover:bg-transparent' aria-label='Retirer une unité'><Minus size={11} /></button>
    <button type='button' disabled={product.stock <= 0} onClick={add} className='min-w-[88px] flex-1 px-2 text-[8px] font-semibold transition-colors hover:bg-white/10 active:bg-[#1f5fac] disabled:text-zinc-700'>{product.stock <= 0 ? 'Indisponible' : quantity > 0 ? `Ajouter (${quantity})` : 'Ajouter'}</button>
    <button type='button' disabled={product.stock <= quantity} onClick={add} className='grid h-full w-8 place-items-center border-l border-white/15 transition-colors hover:bg-white/10 active:bg-[#1f5fac] disabled:text-zinc-700 disabled:hover:bg-transparent' aria-label='Ajouter une unité'><Plus size={11} /></button>
  </div>;
}
