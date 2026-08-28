'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type FormEvent, type ReactNode } from 'react';
import { ChevronDown, Heart, Menu, Package, Search, ShoppingBag, X } from 'lucide-react';
import { MarketplacePrototypeProvider, useMarketplacePrototype } from '../MarketplaceStore';

const links = [
  ['Catalogue', '/marketplace'], ['Services', '/marketplace/category/services'], ['Équipement', '/marketplace/category/equipement'], ['Protections', '/marketplace/category/protection'], ['Textile', '/marketplace/category/textile'], ['Nutrition', '/marketplace/category/nutrition'], ['Billetterie', '/marketplace/category/billetterie'], ['Locations', '/marketplace/rentals'],
] as const;

export function MarketplaceShell({ children }: { children: ReactNode }) {
  return <MarketplacePrototypeProvider><MarketplaceChrome>{children}</MarketplaceChrome></MarketplacePrototypeProvider>;
}

function MarketplaceChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname(); const router = useRouter(); const store = useMarketplacePrototype(); const [mobile, setMobile] = useState(false); const [search, setSearch] = useState('');
  const submit = (event: FormEvent) => { event.preventDefault(); if (search.trim()) router.push(`/marketplace/search?q=${encodeURIComponent(search.trim())}`); };
  const cartQuantity = store.cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartAmount = store.cart.reduce((sum, line) => { const product = store.products.find((item) => item.id === line.productId); if (!product) return sum; const days = line.mode === 'rental' && line.startDate && line.endDate ? Math.max(1, Math.ceil((new Date(line.endDate).getTime() - new Date(line.startDate).getTime()) / 86400000) + 1) : 1; return sum + (line.mode === 'rental' ? product.rentalPrice ?? 0 : product.price) * line.quantity * days; }, 0);
  return <div className='marketplace-prototype min-h-[calc(100dvh-var(--platform-header-height,84px))] bg-[#090a0c] font-[Segoe_UI,Arial,Helvetica,Roboto,sans-serif] text-zinc-100'>
    <div className='fixed left-0 right-0 top-[var(--platform-header-height,84px)] z-[95] border-b border-[#2a2d33] bg-[#0d0e10]/95 backdrop-blur-sm'>
      <div className='mx-auto flex h-12 max-w-[1500px] items-center gap-3 px-3 sm:px-5'>
        <Link href='/marketplace' className='flex flex-none items-center gap-2 border-r border-[#30333a] pr-4'><span className='grid h-7 w-7 place-items-center border border-[#ff1638] bg-[#ff1638]/10 text-[#ee4253]'><ShoppingBag size={14} /></span><span><strong className='block text-[11px] tracking-[0.08em]'>MARKETPLACE</strong><small className='block text-[6px] font-bold uppercase tracking-[0.18em] text-zinc-600'>Indesy Mialy</small></span></Link>
        <form onSubmit={submit} className='hidden h-8 min-w-0 max-w-xl flex-1 items-center border border-[#343840] bg-[#151619] md:flex'><Search size={13} className='mx-2 text-zinc-600' /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Rechercher équipement, billet, service…' className='min-w-0 flex-1 bg-transparent text-[9px] text-white outline-none placeholder:text-zinc-700' /><button className='h-full border-l border-[#343840] px-3 text-[8px] font-semibold text-zinc-400 hover:text-white'>Rechercher</button></form>
        <div className='ml-auto flex items-center'><Link href='/marketplace/favorites' className='relative grid h-9 w-9 place-items-center text-zinc-400 hover:bg-white/[0.04] hover:text-white active:bg-[#087cff]' aria-label='Favoris'><Heart size={16} /><span className='absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-[#087cff] px-1 text-[7px] font-bold text-white'>{store.favorites.length}</span></Link><Link href='/marketplace/orders' className='grid h-9 w-9 place-items-center text-zinc-400 hover:bg-white/[0.04] hover:text-white active:bg-[#087cff]' aria-label='Commandes'><Package size={16} /></Link><Link href='/marketplace/cart' className={`ml-1 flex h-10 min-w-[126px] items-center border px-2 transition-colors sm:min-w-[178px] sm:px-3 ${cartQuantity > 0 ? 'border-[#4b8fdf] bg-[#087cff] text-white' : 'border-[#3a3e46] bg-[#151619] text-zinc-400'}`} aria-label={`Panier : ${cartQuantity} article(s), ${cartAmount.toLocaleString('fr-FR')} Ariary`}><span className='relative grid h-7 w-7 flex-none place-items-center border border-white/20'><ShoppingBag size={13} /><span className='absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-white px-1 text-[7px] font-bold text-[#087cff]'>{cartQuantity}</span></span><span className='ml-2 min-w-0 flex-1'><small className='block text-[6px] font-bold uppercase tracking-[0.1em] text-white/65'>Panier · {cartQuantity} article{cartQuantity > 1 ? 's' : ''}</small><strong className='block truncate text-[9px] sm:text-[11px]'>{cartAmount.toLocaleString('fr-FR')} Ar</strong></span><ChevronDown size={11} className='ml-1 hidden rotate-[-90deg] text-white/70 sm:block' /></Link><button type='button' onClick={() => setMobile((value) => !value)} className='ml-1 grid h-9 w-9 place-items-center text-zinc-400 active:bg-[#087cff] md:hidden'>{mobile ? <X size={17} /> : <Menu size={17} />}</button></div>
      </div>
      <nav className={`${mobile ? 'flex' : 'hidden'} mx-auto max-w-[1500px] overflow-x-auto border-t border-[#25282d] px-3 md:flex md:h-9 md:items-stretch md:border-t md:px-5`} aria-label='Catégories Marketplace'>{links.map(([label, href]) => { const active = href === '/marketplace' ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} onClick={() => setMobile(false)} className={`flex h-9 flex-none items-center border-b-2 px-3 text-[8px] font-semibold uppercase tracking-[0.06em] ${active ? 'border-[#ff1638] text-white' : 'border-transparent text-zinc-500 hover:text-zinc-200'}`}>{label}</Link>; })}<Link href='/marketplace/search' className='ml-auto hidden h-9 items-center gap-1 px-3 text-[8px] text-zinc-500 lg:flex'>Toutes les catégories <ChevronDown size={11} /></Link></nav>
    </div>
    <div className='marketplace-bar-spacer' aria-hidden='true' />
    {children}
  </div>;
}
