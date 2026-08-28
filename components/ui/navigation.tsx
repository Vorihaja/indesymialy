'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Laptop, Moon, Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import { IconButton } from './core';
import { useTheme } from './theme';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
}

const segmentLabels: Record<string, string> = {
  dashboard: 'Dashboard', admin: 'Administration', club: 'Club',
  combattant: 'Combattant', organisateur: 'Organisateur',
  federation: 'Fédération', ligue: 'Ligue', juge: 'Juge',
  arbitre: 'Arbitre', sponsor: 'Sponsor', vendeur: 'Vendeur',
  coach: 'Coach', fan: 'Fan', messages: 'Messages',
  notifications: 'Notifications', settings: 'Paramètres',
  management: 'Gestion', events: 'Événements', profile: 'Profil',
};

export function Breadcrumb({ items, className }: { items?: BreadcrumbItem[]; className?: string }) {
  const pathname = usePathname();
  const generated: BreadcrumbItem[] = pathname.split('/').filter(Boolean).map((segment, index, all) => ({
    label: segmentLabels[segment] ?? decodeURIComponent(segment).replaceAll('-', ' '),
    href: index < all.length - 1 ? '/' + all.slice(0, index + 1).join('/') : undefined,
  }));
  const resolved = items ?? generated;
  return <nav aria-label='Fil d’Ariane' className={'ds-breadcrumb '+(className ?? '')}><ol>{resolved.map((item,index)=><li key={(item.href ?? '')+item.label}>{index>0&&<ChevronRight aria-hidden='true' size={13}/>} {item.href ? <Link href={item.href}>{item.icon}{item.label}</Link> : <span aria-current='page'>{item.icon}{item.label}</span>}</li>)}</ol></nav>;
}

export function ThemeToggle({ compact=false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const next = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Laptop;
  return <IconButton variant='ghost' aria-label={'Thème actuel : '+theme+'. Passer à '+next} title={'Thème : '+theme} onClick={()=>setTheme(next)}><Icon size={17}/>{!compact&&<span className='ds-sr-only'>{theme}</span>}</IconButton>;
}

export function Brand({ compact=false }: { compact?: boolean }) {
  return <Link href='/' className='ds-brand' aria-label='Indesy Mialy — Accueil'><span className='ds-brand-mark' aria-hidden='true'><img src='https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/logo' alt='' /></span>{!compact&&<span className='ds-brand-name'><strong>INDESY</strong> MIALY</span>}</Link>;
}
