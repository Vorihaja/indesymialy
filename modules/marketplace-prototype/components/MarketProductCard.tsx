'use client';

import Link from 'next/link';
import { BadgeCheck, Heart, MapPin, Star } from 'lucide-react';
import { useMarketplacePrototype } from '../MarketplaceStore';
import type { MarketProduct } from '../types';
import { ProductVisual } from './ProductVisual';
import { PurchaseStepper } from './PurchaseStepper';

const price = (product: MarketProduct) => product.type === 'rental' ? `${product.rentalPrice?.toLocaleString('fr-FR')} Ar / jour` : `${product.price.toLocaleString('fr-FR')} Ar`;

export function MarketProductCard({ product }: { product: MarketProduct }) {
  const store = useMarketplacePrototype(); const favorite = store.favorites.includes(product.id);
  const sellerVerified = product.sellerVerified ?? product.type !== 'used';
  return <article className='group min-w-0 border border-[#2d3036] bg-[#121316] transition-colors hover:border-[#454a54]'>
    <div className='relative'><Link href={`/marketplace/products/${product.id}`}><ProductVisual product={product} /></Link><div className='absolute left-2 top-2 flex gap-1'><span className='border border-[#3a3e46] bg-[#0d0e10]/90 px-1.5 py-1 text-[7px] font-bold uppercase text-zinc-300'>{product.type === 'service' ? 'Service' : product.type === 'rental' ? 'Location' : product.type === 'used' ? 'Occasion' : 'Neuf'}</span>{product.compareAt && <span className='bg-[#ff1638] px-1.5 py-1 text-[7px] font-bold text-white'>−{Math.round((1 - product.price / product.compareAt) * 100)} %</span>}</div><button type='button' onClick={() => store.toggleFavorite(product.id)} className={`absolute right-2 top-2 grid h-7 w-7 place-items-center border bg-[#0d0e10]/90 transition-colors active:bg-[#087cff] ${favorite ? 'border-[#2588ff] bg-[#087cff] text-white' : 'border-[#3a3e46] text-zinc-400'}`} aria-label='Ajouter aux favoris'><Heart size={13} fill={favorite ? 'currentColor' : 'none'} /></button></div>
    <div className='p-3'><div className='mb-1 flex items-center justify-between text-[7px] font-semibold uppercase tracking-[0.08em] text-zinc-600'><span>{product.discipline}</span><span className='flex items-center gap-1 text-amber-400'><Star size={9} fill='currentColor' />{product.rating} <i className='not-italic text-zinc-700'>({product.reviews})</i></span></div><Link href={`/marketplace/products/${product.id}`} className='line-clamp-2 min-h-8 text-[11px] font-semibold leading-4 text-zinc-100 hover:text-[#6caaf0]'>{product.title}</Link><div className='mt-2 flex items-center gap-1 text-[8px] text-zinc-600'><MapPin size={10} />{product.location} · {product.seller}</div><div className={`mt-1 inline-flex items-center gap-1 text-[8px] ${sellerVerified ? 'text-emerald-400' : 'text-zinc-500'}`}>{sellerVerified && <BadgeCheck size={10} />}{sellerVerified ? 'Profil vérifié' : 'Profil non vérifié'}</div><div className='mt-3 grid gap-2 border-t border-[#292c31] pt-3'><div><strong className='block text-[13px] text-white'>{price(product)}</strong>{product.compareAt && <span className='text-[8px] text-zinc-700 line-through'>{product.compareAt.toLocaleString('fr-FR')} Ar</span>}</div><PurchaseStepper product={product} /></div></div>
  </article>;
}
