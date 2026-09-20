'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Badge, PublicEmpty, PublicSection } from '@/components/ui';
import type { DirectoryEntry, DiscoveryMedia, DiscoveryResult, PublicClub, PublicFighter, RankingEntry } from '../types';

export function PublicHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <header className='public-section-heading'><div><div className='public-eyebrow'>{eyebrow}</div><h1 className='ds-h1'>{title}</h1><p className='public-section-description'>{description}</p></div></header>;
}

export function DirectoryGrid({ items, view }: { items: DirectoryEntry[]; view: 'grid' | 'list' }) {
  if (!items.length) return <PublicEmpty title='Aucun profil public trouvé' description='Modifiez la recherche ou les filtres.' />;
  return <div className={view === 'grid' ? 'public-directory-grid' : 'grid gap-3'}>{items.map((item) => (
    <Link key={item.id} href={item.href} className='public-directory-row group'>
      <span className='public-directory-image'>
        {item.imageUrl ? <Image src={item.imageUrl} alt='' fill sizes='72px' className='object-cover' /> : <span aria-hidden='true'>{item.name.slice(0, 1)}</span>}
      </span>
      <span className='min-w-0 flex-1'>
        <span className='flex flex-wrap items-center gap-2'><strong className='text-lg'>{item.name}</strong>{item.verified ? <Badge tone='info'>Vérifié</Badge> : null}</span>
        <span className='mt-1 block text-sm text-[var(--ds-muted)]'>{[item.discipline, item.weightCategory, item.city, item.region].filter(Boolean).join(' · ') || 'Informations publiques à venir'}</span>
      </span>
      <span className='text-sm font-bold text-[var(--ds-primary)]'>Voir le profil →</span>
    </Link>
  ))}</div>;
}

export function SearchGroups({ items }: { items: DiscoveryResult[] }) {
  if (!items.length) return <PublicEmpty title='Aucun résultat' description='Vérifiez les termes saisis.' />;
  return <div className='grid gap-3'>{items.map((item) => <Link href={item.href} key={`${item.kind}-${item.id}`} className='public-directory-row'><Badge>{item.kind}</Badge><span className='min-w-0 flex-1'><strong>{item.title}</strong><span className='block text-sm text-[var(--ds-muted)]'>{item.description}</span></span></Link>)}</div>;
}

export function RankingTable({ items }: { items: RankingEntry[] }) {
  if (!items.length) return <PublicEmpty title='Classement indisponible' description='Aucune donnée publique ne correspond à ces critères.' />;
  return <div className='public-table' role='region' aria-label='Classement public' tabIndex={0}><table><thead><tr><th>Rang</th><th>Combattant</th><th>Discipline</th><th>Catégorie</th><th>ELO</th><th>Évolution</th><th>Record</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td className='font-black'>#{item.nationalRank}</td><td className='font-bold'>{item.href ? <Link href={item.href}>{item.name}</Link> : item.name}</td><td>{item.discipline || 'Non renseignée'}</td><td>{item.category || 'Non renseignée'}</td><td className='font-bold'>{item.elo}</td><td>{item.hasProgressionHistory ? `${item.progression > 0 ? '+' : ''}${item.progression}` : '—'}</td><td>{item.wins}-{item.losses}-{item.draws}</td></tr>)}</tbody></table></div>;
}

export function FighterProfile({ fighter }: { fighter: PublicFighter; onFavorite?: () => void }) {
  const facts = [['Record', `${fighter.record.wins}-${fighter.record.losses}-${fighter.record.draws}`], ['ELO', String(fighter.elo)], ['Rang national', `#${fighter.ranking}`], ['Catégorie', fighter.weightCategory || 'Non renseignée']];
  return <article><div className='public-hero public-hero-compact'><div className='public-hero-glow' aria-hidden='true' /><div className='public-hero-copy'><div className='public-eyebrow'>Profil combattant {fighter.verified ? 'vérifié' : ''}</div><h1 className='ds-display'>{fighter.name}</h1><p className='public-lead'>{[fighter.nickname, fighter.disciplines.join(', '), fighter.city, fighter.region].filter(Boolean).join(' · ')}</p><Link href='/fighters' className='ds-button ds-secondary'>← Tous les combattants</Link></div>{fighter.photoUrl ? <div className='public-profile-portrait'><Image src={fighter.photoUrl} alt={`Portrait de ${fighter.name}`} fill priority sizes='(max-width: 768px) 80vw, 360px' className='object-cover' /></div> : null}</div><div className='public-container'><div className='grid grid-cols-2 gap-3 md:grid-cols-4'>{facts.map(([label, value]) => <div key={label} className='public-stat'><span>{label}</span><strong>{value}</strong></div>)}</div><ProfileSections sections={[['Biographie', fighter.biography ? [fighter.biography] : []], ['Disciplines', fighter.disciplines]]} /></div></article>;
}

export function ClubProfile({ club }: { club: PublicClub; onFollow?: () => void }) {
  return <article><div className='public-hero public-hero-compact'><div className='public-hero-glow' aria-hidden='true' /><div className='public-hero-copy'><div className='public-eyebrow'>{club.official ? 'Club vérifié' : 'Club public'}</div><h1 className='ds-display'>{club.name}</h1><p className='public-lead'>{club.description || [club.city, club.region].filter(Boolean).join(' · ')}</p><Link href='/clubs' className='ds-button ds-secondary'>← Tous les clubs</Link></div>{club.logoUrl ? <div className='public-profile-portrait'><Image src={club.logoUrl} alt={`Logo de ${club.name}`} fill priority sizes='(max-width: 768px) 60vw, 300px' className='object-contain p-6' /></div> : null}</div><div className='public-container'><ProfileSections sections={[['Disciplines', club.disciplines], ['Localisation publique', [[club.city, club.region].filter(Boolean).join(', ')].filter(Boolean)]]} /></div></article>;
}

function ProfileSections({ sections }: { sections: Array<[string, string[]]> }) { return <div className='mt-10 grid gap-5 md:grid-cols-2'>{sections.map(([title, values]) => <PublicSection key={title} title={title} className='public-editorial-panel'>{values.length ? <ul className='grid gap-3'>{values.map((value) => <li key={value}>{value}</li>)}</ul> : <p className='public-card-copy'>Aucune donnée publique.</p>}</PublicSection>)}</div>; }

export function MediaGrid({ items }: { items: DiscoveryMedia[]; onFavorite?: (id: string) => void }) {
  if (!items.length) return <PublicEmpty title='Aucun média public' description='Aucun fichier public ne correspond aux filtres.' />;
  return <div className='public-media-grid'>{items.map((item) => <article key={item.id} className='public-media-card'><Link href={`/media/${item.id}`} className='public-media-frame' aria-label={`Ouvrir ${item.title}`}>{item.mediaType === 'video' ? <video controls={false} preload='metadata' poster={item.thumbnailUrl} aria-label={item.title}><source src={item.mediaUrl} /></video> : item.thumbnailUrl || item.mediaUrl ? <Image src={(item.thumbnailUrl || item.mediaUrl)!} alt={item.title} fill sizes='(max-width: 768px) 100vw, 33vw' className='object-cover' /> : <span className='grid h-full place-items-center text-sm text-white'>Aperçu indisponible</span>}</Link><div className='p-4'><p className='public-card-kicker'>{item.mediaType === 'video' ? 'Vidéo' : 'Photo'}</p><h2 className='public-card-title'>{item.title}</h2>{item.content ? <p className='public-card-copy'>{item.content}</p> : null}{item.source || item.author ? <p className='mt-3 text-xs text-[var(--ds-muted)]'>Source : {item.source || item.author}</p> : null}<div className='mt-4 flex flex-wrap gap-4'><Link href={`/media/${item.id}`} className='text-sm font-bold text-[var(--ds-primary)]'>Visualiser →</Link>{item.eventId ? <Link href={`/events/${item.eventId}`} className='text-sm font-bold'>Voir l’évènement</Link> : null}</div></div></article>)}</div>;
}
