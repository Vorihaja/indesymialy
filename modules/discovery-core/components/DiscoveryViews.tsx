'use client';

import Link from 'next/link';
import { Badge, Button, PublicEmpty, PublicSection } from '@/components/ui';
import type {
  DirectoryEntry,
  DiscoveryMedia,
  DiscoveryResult,
  PublicClub,
  PublicFighter,
  RankingEntry,
} from '../types';

export function PublicHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className='public-section-heading'>
      <div>
        <div className='public-eyebrow'>{eyebrow}</div>
        <h1 className='ds-h1'>{title}</h1>
        <p className='public-section-description'>{description}</p>
      </div>
    </header>
  );
}

export function DirectoryGrid({ items, view }: { items: DirectoryEntry[]; view: 'grid' | 'list' }) {
  if (!items.length) {
    return <PublicEmpty title='Aucun profil trouvé' description='Essayez une autre recherche ou élargissez vos filtres.' />;
  }

  return (
    <div className={view === 'grid' ? 'public-grid' : 'grid gap-3'}>
      {items.map((item, index) => (
        <Link key={item.id} href={item.href} className='public-card group' aria-label={'Voir le profil de ' + item.name}>
          <div className='public-card-body'>
            <div className='flex items-center justify-between gap-3'>
              <Badge tone={item.role === 'fighter' ? 'danger' : 'info'}>{item.role}</Badge>
              {item.verified && <span className='ds-success-text text-xs font-bold' title='Profil vérifié'>● Vérifié</span>}
            </div>
            <div className='mt-8 flex items-end justify-between gap-4'>
              <div>
                <p className='public-card-kicker'>{item.discipline}</p>
                <h2 className='public-card-title'>{item.name}</h2>
                <p className='public-card-copy'>{item.city} · {item.club ?? item.region}</p>
              </div>
              <span className='text-4xl font-black text-[var(--ds-border-strong)]' aria-hidden='true'>
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function SearchGroups({ items }: { items: DiscoveryResult[] }) {
  const kinds = [...new Set(items.map((item) => item.kind))];
  if (!items.length) {
    return <PublicEmpty title='Aucun résultat' description='Vérifiez les termes saisis ou découvrez les tendances du moment.' />;
  }

  return (
    <div className='grid gap-12'>
      {kinds.map((kind) => (
        <section key={kind} aria-labelledby={'results-' + kind}>
          <div className='mb-4 flex items-center justify-between gap-4'>
            <h2 id={'results-' + kind} className='ds-h3 capitalize'>{kind}</h2>
            <Badge>{items.filter((item) => item.kind === kind).length}</Badge>
          </div>
          <div className='public-grid'>
            {items.filter((item) => item.kind === kind).map((item) => (
              <Link href={item.href} key={item.id} className='public-card'>
                <div className='public-card-body'>
                  <p className='public-card-kicker'>{kind}</p>
                  <h3 className='public-card-title'>{item.title}</h3>
                  <p className='public-card-copy'>{item.description}</p>
                  <span className='mt-6 inline-flex text-sm font-bold text-[var(--ds-primary)]'>Découvrir →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function RankingTable({ items }: { items: RankingEntry[] }) {
  if (!items.length) return <PublicEmpty title='Classement indisponible' description='Aucun résultat public ne correspond à ces critères.' />;
  const podium = items.slice(0, 3);

  return (
    <div className='grid gap-8'>
      <div className='grid gap-4 md:grid-cols-3' aria-label='Podium'>
        {podium.map((item, index) => (
          <article key={item.id} className='public-card'>
            <div className='public-card-body'>
              <p className='public-card-kicker'>Position {item.nationalRank}</p>
              <div className='mt-5 flex items-end justify-between gap-4'>
                <div>
                  <h2 className='ds-h3'>{item.name}</h2>
                  <p className='public-card-copy'>{item.discipline} · {item.category}</p>
                </div>
                <strong className='text-4xl text-[var(--ds-primary)]'>#{index + 1}</strong>
              </div>
              <div className='mt-6 flex items-center justify-between border-t border-[var(--ds-border)] pt-4 text-sm'>
                <span>ELO <strong>{item.elo}</strong></span>
                <span className={item.progression >= 0 ? 'ds-success-text' : 'ds-danger-text'}>
                  {item.progression >= 0 ? '▲ +' : '▼ '}{item.progression}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className='public-table'>
        <table>
          <thead>
            <tr><th>Rang</th><th>Profil</th><th>Discipline</th><th>Catégorie</th><th>ELO</th><th>Variation</th><th>Record</th></tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td className='font-black'>#{item.nationalRank}</td>
                <td className='font-bold'>{item.name}</td>
                <td>{item.discipline}</td>
                <td>{item.category}</td>
                <td className='font-bold'>{item.elo}</td>
                <td className={item.progression >= 0 ? 'ds-success-text' : 'ds-danger-text'}>
                  {item.progression >= 0 ? '+' : ''}{item.progression}
                </td>
                <td>{item.wins}-{item.losses}-{item.draws}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FighterProfile({ fighter, onFavorite }: { fighter: PublicFighter; onFavorite: () => void }) {
  return (
    <article>
      <div className='public-hero public-hero-compact'>
        <div className='public-hero-glow' aria-hidden='true' />
        <div className='public-hero-copy'>
          <div className='public-eyebrow'>{fighter.nickname || 'Profil combattant'}</div>
          <h1 className='ds-display'>{fighter.name}</h1>
          <p className='public-lead'>{fighter.club} · Coach {fighter.coach}</p>
          <div className='public-actions'><Button variant='outline' onClick={onFavorite}>Ajouter aux favoris</Button></div>
        </div>
      </div>
      <div className='public-container'>
        <div className='grid grid-cols-2 gap-3 md:grid-cols-5'>
          {[
            ['Record', fighter.record.wins + '-' + fighter.record.losses + '-' + fighter.record.draws],
            ['ELO', String(fighter.elo)],
            ['Rang', '#' + fighter.ranking],
            ['Catégorie', fighter.weightCategory],
            ['Progression', (fighter.progression >= 0 ? '+' : '') + fighter.progression],
          ].map(([label, value]) => (
            <div key={label} className='public-card public-card-body'>
              <p className='public-card-kicker'>{label}</p><strong className='mt-2 block text-xl'>{value}</strong>
            </div>
          ))}
        </div>
        <ProfileSections sections={[
          ['Biographie', [fighter.biography]], ['Disciplines', fighter.disciplines],
          ['Combats récents', fighter.recentFights], ['Prochains combats', fighter.upcomingFights],
          ['Palmarès', fighter.achievements], ['Highlights', fighter.highlights],
          ['Sponsors publics', fighter.publicSponsors], ['Actualités', fighter.news],
        ]} />
      </div>
    </article>
  );
}

export function ClubProfile({ club, onFollow }: { club: PublicClub; onFollow: () => void }) {
  return (
    <article>
      <div className='public-hero public-hero-compact'>
        <div className='public-hero-glow' aria-hidden='true' />
        <div className='public-hero-copy'>
          <div className='public-eyebrow'>{club.official ? 'Club officiel' : 'Club public'}</div>
          <h1 className='ds-display'>{club.name}</h1>
          <p className='public-lead'>{club.description}</p>
          <div className='public-actions'><Button variant='outline' onClick={onFollow}>Suivre ce club</Button></div>
        </div>
        <div className='public-hero-aside'><p className='ds-h3'>{club.city}<br /><span className='text-[var(--ds-muted)]'>{club.region}</span></p></div>
      </div>
      <div className='public-container'>
        <div className='public-grid'>
          {Object.entries(club.statistics).map(([label, value]) => (
            <div key={label} className='public-card public-card-body'>
              <p className='public-card-kicker'>{label}</p><strong className='mt-2 block text-2xl'>{value}</strong>
            </div>
          ))}
        </div>
        <ProfileSections sections={[
          ['Disciplines', club.disciplines], ['Coachs', club.coaches],
          ['Combattants publics', club.fighters], ['Résultats', club.results],
          ['Événements', club.events], ['Actualités', club.news], ['Contact public', [club.publicContact]],
        ]} />
      </div>
    </article>
  );
}

function ProfileSections({ sections }: { sections: Array<[string, string[]]> }) {
  return (
    <div className='mt-12 grid gap-6 md:grid-cols-2'>
      {sections.map(([title, values]) => (
        <PublicSection key={title} title={title} className='public-card public-card-body'>
          {values.length ? (
            <ul className='grid gap-3 text-sm text-[var(--ds-text-2)]'>
              {values.map((value) => <li key={value} className='border-l-2 border-[var(--ds-primary)] pl-3'>{value}</li>)}
            </ul>
          ) : <p className='public-card-copy'>Aucune donnée publique.</p>}
        </PublicSection>
      ))}
    </div>
  );
}

export function MediaGrid({ items, onFavorite }: { items: DiscoveryMedia[]; onFavorite: (id: string) => void }) {
  if (!items.length) return <PublicEmpty title='Aucun média publié' description='Les prochains highlights apparaîtront ici.' />;
  return (
    <div className='public-grid'>
      {items.map((item) => (
        <article key={item.id} className='public-card'>
          <div className='public-media-tile grid place-items-center'>
            <span className='text-4xl text-white' aria-hidden='true'>{item.mediaType === 'video' ? '▶' : '▧'}</span>
          </div>
          <div className='public-card-body'>
            <p className='public-card-kicker'>{item.mediaType} · {item.discipline}</p>
            <h2 className='public-card-title'>{item.title}</h2>
            <p className='public-card-copy'>{item.content}</p>
            <div className='mt-6 flex items-center justify-between gap-4'>
              <Link href={'/media/' + item.id} className='text-sm font-bold text-[var(--ds-primary)]'>Ouvrir →</Link>
              <button onClick={() => onFavorite(item.id)} className='min-h-10 rounded-full px-3 text-xs hover:bg-[var(--ds-hover)]' aria-label={'Ajouter ' + item.title + ' aux favoris'}>♡ Favori</button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
