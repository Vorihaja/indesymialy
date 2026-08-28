'use client';

import { DisciplineSelect } from '@/modules/disciplines';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Button,
  Loader,
  PublicEmpty,
  PublicFilterBar,
  PublicHero,
  PublicPage,
  PublicSection,
  SearchBar,
  Select,
} from '@/components/ui';
import { useDiscovery } from '../hooks/useDiscovery';
import {
  ClubProfile,
  DirectoryGrid,
  FighterProfile,
  MediaGrid,
  RankingTable,
  SearchGroups,
} from '../components/DiscoveryViews';
import type { DirectoryRole, DiscoveryView } from '../types';
import { hasGlobalFilters, matchesGlobalFilters, normalizeSearchValue, useGlobalSearchFilters } from '@/providers/search/global-search-filters';

export function DiscoveryFeature({ view, id }: { view: DiscoveryView; id?: string }) {
  const api = useDiscovery();
  const searchDiscovery = api.search;
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [query, setQuery] = useState('');
  const globalFilters = useGlobalSearchFilters();

  useEffect(() => {
    if (view === 'search') void searchDiscovery(query);
  }, [query, searchDiscovery, view]);

  if (api.loading) return <LoadingState label='Chargement de la découverte' />;
  if (api.error) return <div className='public-container'><PublicEmpty title='Contenu indisponible' description={api.error} /></div>;
  const snapshot = api.snapshot;
  if (!snapshot) return <div className='public-container'><PublicEmpty title='Aucune donnée publique' /></div>;
  const activeGlobalFilters = hasGlobalFilters(globalFilters);
  const tagMatches = (tags: string[]) => (
    (!globalFilters.region || tags.some((tag) => normalizeSearchValue(tag) === normalizeSearchValue(globalFilters.region)))
    && (!globalFilters.city || tags.some((tag) => normalizeSearchValue(tag) === normalizeSearchValue(globalFilters.city)))
    && (!globalFilters.disciplines.length || globalFilters.disciplines.some((discipline) => tags.some((tag) => normalizeSearchValue(tag) === normalizeSearchValue(discipline))))
  );
  const data = activeGlobalFilters ? {
    ...snapshot,
    directory: snapshot.directory.filter((item) => matchesGlobalFilters([item.name, item.role, item.discipline, item.region, item.city, item.club], globalFilters, { region: item.region, city: item.city, disciplines: [item.discipline] })),
    fighters: snapshot.fighters.filter((item) => matchesGlobalFilters([item.name, item.nickname, item.club, item.coach, item.biography, ...item.disciplines], globalFilters, { disciplines: item.disciplines })),
    clubs: snapshot.clubs.filter((item) => matchesGlobalFilters([item.name, item.description, item.region, item.city, ...item.disciplines], globalFilters, { region: item.region, city: item.city, disciplines: item.disciplines })),
    rankings: snapshot.rankings.filter((item) => matchesGlobalFilters([item.name, item.category, item.discipline, item.region, item.recentActivity], globalFilters, { region: item.region, disciplines: [item.discipline] })),
    media: snapshot.media.filter((item) => matchesGlobalFilters([JSON.stringify(item)], globalFilters, { disciplines: item.discipline ? [item.discipline] : [], date: item.createdAt })),
    disciplines: snapshot.disciplines.filter((item) => matchesGlobalFilters([item.name, item.presentation, ...item.categories], globalFilters, { disciplines: [item.name] })),
    regions: snapshot.regions.filter((item) => matchesGlobalFilters([item.name, ...item.cities, ...item.news], globalFilters, { region: item.name })),
    search: snapshot.search.filter((item) => matchesGlobalFilters([item.title, item.description, ...item.tags], { ...globalFilters, region: '', city: '', disciplines: [] }) && tagMatches(item.tags)),
    trending: snapshot.trending.filter((item) => matchesGlobalFilters([item.title, item.description, ...item.tags], { ...globalFilters, region: '', city: '', disciplines: [] }) && tagMatches(item.tags)),
    recommendations: snapshot.recommendations.filter((item) => matchesGlobalFilters([item.title, item.description, ...item.tags], { ...globalFilters, region: '', city: '', disciplines: [] }) && tagMatches(item.tags)),
  } : snapshot;

  if (view === 'home') return <HomeDiscovery data={data} />;

  if (view === 'directory') {
    return (
      <PageHero eyebrow='Annuaire national' title='Les visages du combat malagasy' description='Profils publics vérifiés, clubs, officiels et partenaires dans toutes les régions de Madagascar.'>
        <PublicFilterBar>
          <SearchBar value={api.filters.query} onChange={(event) => api.setFilters({ ...api.filters, query: event.target.value, page: 1 })} placeholder='Rechercher un profil' aria-label='Rechercher dans l’annuaire' />
          <Select value={api.filters.role ?? ''} onChange={(event) => api.setFilters({ ...api.filters, role: (event.target.value || undefined) as DirectoryRole | undefined, page: 1 })} aria-label='Filtrer par rôle'>
            <option value=''>Tous les rôles</option>
            {['fighter', 'club', 'coach', 'organizer', 'referee', 'judge', 'sponsor', 'seller', 'federation', 'league'].map((role) => <option key={role}>{role}</option>)}
          </Select>
          <DisciplineSelect value={api.filters.discipline ?? ''} emptyLabel='Toutes les disciplines' onChange={(event) => api.setFilters({ ...api.filters, discipline: event.target.value || undefined, page: 1 })} aria-label='Filtrer par discipline' className='ds-input' />
          <Select value={api.filters.region ?? ''} onChange={(event) => api.setFilters({ ...api.filters, region: event.target.value || undefined, page: 1 })} aria-label='Filtrer par région'>
            <option value=''>Toutes les régions</option>
            {data.regions.map((item) => <option key={item.id}>{item.name}</option>)}
          </Select>
          <Button variant='outline' onClick={() => setLayout(layout === 'grid' ? 'list' : 'grid')} aria-pressed={layout === 'list'}>
            Vue {layout === 'grid' ? 'liste' : 'grille'}
          </Button>
        </PublicFilterBar>
        <DirectoryGrid items={(activeGlobalFilters ? data.directory : api.directory.items)} view={layout} />
        <div className='mt-8 flex flex-wrap items-center justify-between gap-4 text-sm text-[var(--ds-muted)]'>
          <span>{activeGlobalFilters ? data.directory.length : api.directory.total} résultats</span>
          <nav className='flex items-center gap-2' aria-label='Pagination de l’annuaire'>
            <Button size='sm' variant='outline' disabled={api.filters.page === 1} onClick={() => api.setFilters({ ...api.filters, page: api.filters.page - 1 })}>Précédent</Button>
            <span aria-current='page'>Page {api.filters.page}</span>
            <Button size='sm' variant='outline' disabled={api.filters.page * api.filters.pageSize >= api.directory.total} onClick={() => api.setFilters({ ...api.filters, page: api.filters.page + 1 })}>Suivant</Button>
          </nav>
        </div>
      </PageHero>
    );
  }

  if (view === 'search') {
    return (
      <PageHero eyebrow='Recherche globale' title='Explorer toute la plateforme' description='Profils, événements, actualités, discussions, produits, médias, disciplines et hashtags.'>
        <SearchBar value={query} onChange={(event) => setQuery(event.target.value)} placeholder='Rechercher sur Indesy Mialy' aria-label='Recherche globale' className='mb-10 min-h-14 text-base' autoFocus />
        <SearchGroups items={api.results.length || query ? api.results : data.trending} />
      </PageHero>
    );
  }

  if (view === 'rankings') {
    const entity = id === 'clubs' ? 'club' : 'fighter';
    const items = data.rankings.filter((item) => (
      id === 'clubs' || id === 'fighters'
        ? item.entityType === entity
        : !id || item.discipline.toLowerCase() === id.toLowerCase().replaceAll('-', ' ')
    ));
    return (
      <PageHero eyebrow='Classements officiels' title={id ? 'Classement ' + id : 'L’élite nationale'} description='ELO, progression, résultats et activité récente, réunis dans une lecture sportive professionnelle.'>
        <RankingTable items={items} />
      </PageHero>
    );
  }

  if (view === 'fighters') return <Listing title='Combattants' eyebrow='Profils publics' description='Records, disciplines, catégories et classements des athlètes malagasy.'><DirectoryGrid items={data.directory.filter((item) => item.role === 'fighter')} view='grid' /></Listing>;
  if (view === 'fighter') {
    const item = data.fighters.find((fighter) => fighter.id === id);
    return item ? <PublicPage><FighterProfile fighter={item} onFavorite={() => { void api.toggleFavorite('fighter', item.id); }} /></PublicPage> : <Missing />;
  }
  if (view === 'clubs') return <Listing title='Clubs' eyebrow='Réseau national' description='Clubs officiels, disciplines, régions, combattants et résultats publics.'><DirectoryGrid items={data.directory.filter((item) => item.role === 'club')} view='grid' /></Listing>;
  if (view === 'club') {
    const item = data.clubs.find((club) => club.id === id);
    return item ? <PublicPage><ClubProfile club={item} onFollow={() => { void api.toggleFavorite('club', item.id); }} /></PublicPage> : <Missing />;
  }

  if (['media', 'photos', 'videos', 'albums'].includes(view)) {
    const items = data.media.filter((item) => (
      view === 'media'
      || (view === 'photos' && item.mediaType === 'image')
      || (view === 'videos' && item.mediaType === 'video')
      || (view === 'albums' && (item.mediaType === 'album' || item.mediaType === 'gallery'))
    ));
    return <Listing title='Médiathèque' eyebrow='Images & mouvement' description='Photos, vidéos, albums et galeries au plus près de l’action.'><MediaGrid items={items} onFavorite={(mediaId) => { void api.toggleFavorite('media', mediaId); }} /></Listing>;
  }
  if (view === 'media-detail') {
    const item = data.media.find((media) => media.id === id);
    return item ? <Listing title={item.title} eyebrow={item.mediaType ?? 'Média'} description={item.content ?? ''}><MediaGrid items={[item]} onFavorite={(mediaId) => { void api.toggleFavorite('media', mediaId); }} /></Listing> : <Missing />;
  }

  if (view === 'disciplines') return <CardLinks title='Disciplines' eyebrow='Arts du combat' description='Explorez les règles, catégories et communautés de chaque discipline.' items={data.disciplines.map((item) => ({ id: item.id, title: item.name, description: item.presentation, href: '/disciplines/' + item.slug }))} />;
  if (view === 'discipline') {
    const item = data.disciplines.find((discipline) => discipline.slug === id);
    return item ? <Detail title={item.name} eyebrow='Discipline' description={item.presentation} rows={[['Règles', item.generalRules], ['Catégories', item.categories], ['Actualités', item.news], ['Fight Live récents', item.recentFightLiveIds.map((fightId) => 'Combat ' + fightId)]]} /> : <Missing />;
  }
  if (view === 'regions') return <CardLinks title='Régions' eyebrow='Madagascar' description='Découvrez les territoires, leurs clubs et leurs talents.' items={data.regions.map((item) => ({ id: item.id, title: item.name, description: item.cities.join(', '), href: '/regions/' + item.id }))} />;
  if (view === 'region') {
    const item = data.regions.find((region) => region.id === id);
    return item ? <Detail title={item.name} eyebrow='Territoire' description={item.cities.join(', ')} rows={[['Statistiques', Object.entries(item.statistics).map(([key, value]) => key + ' : ' + value)], ['Actualités', item.news]]} /> : <Missing />;
  }

  return <Listing title={view === 'trending' ? 'Tendances' : 'Recommandations'} eyebrow='À découvrir' description='Une sélection issue de l’activité publique.'><SearchGroups items={view === 'trending' ? data.trending : data.recommendations} /></Listing>;
}

function LoadingState({ label }: { label: string }) {
  return <div className='public-container grid min-h-80 place-items-center'><Loader label={label} /></div>;
}

function PageHero({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return <PublicPage><PublicHero eyebrow={eyebrow} title={title} description={description} compact /><main className='public-container'>{children}</main></PublicPage>;
}

function Listing({ title, eyebrow, description, children }: { title: string; eyebrow: string; description: string; children: React.ReactNode }) {
  return <PageHero eyebrow={eyebrow} title={title} description={description}>{children}</PageHero>;
}

function Missing() {
  return <div className='public-container'><PublicEmpty title='Fiche publique introuvable' description='Le contenu recherché n’est pas disponible.' /></div>;
}

function CardLinks({ title, eyebrow, description, items }: { title: string; eyebrow: string; description: string; items: Array<{ id: string; title: string; description: string; href: string }> }) {
  return (
    <Listing title={title} eyebrow={eyebrow} description={description}>
      <div className='public-grid'>
        {items.map((item) => (
          <Link key={item.id} href={item.href} className='public-card'>
            <div className='public-card-body'>
              <p className='public-card-kicker'>{eyebrow}</p>
              <h2 className='public-card-title'>{item.title}</h2>
              <p className='public-card-copy'>{item.description}</p>
              <span className='mt-8 inline-flex text-sm font-bold text-[var(--ds-primary)]'>Explorer →</span>
            </div>
          </Link>
        ))}
      </div>
    </Listing>
  );
}

function Detail({ title, eyebrow, description, rows }: { title: string; eyebrow: string; description: string; rows: Array<[string, string[]]> }) {
  return (
    <Listing title={title} eyebrow={eyebrow} description={description}>
      <div className='grid gap-6 md:grid-cols-2'>
        {rows.map(([label, items]) => (
          <PublicSection key={label} title={label} className='public-card public-card-body'>
            {items.length ? <ul className='grid gap-3 text-sm text-[var(--ds-text-2)]'>{items.map((item) => <li key={item} className='border-l-2 border-[var(--ds-primary)] pl-3'>{item}</li>)}</ul> : <p className='public-card-copy'>Aucune donnée publique.</p>}
          </PublicSection>
        ))}
      </div>
    </Listing>
  );
}

function HomeDiscovery({ data }: { data: NonNullable<ReturnType<typeof useDiscovery>['snapshot']> }) {
  return (
    <div>
      <HomeCards title='Combattants populaires' eyebrow='Athlètes' description='Les profils les plus suivis du moment.' items={data.fighters.map((item) => ({ id: item.id, title: item.name, description: '#' + item.ranking + ' · ELO ' + item.elo, href: '/fighters/' + item.id }))} />
      <HomeCards title='Clubs mis en avant' eyebrow='Communautés' description='Des structures qui font vivre les disciplines.' items={data.clubs.map((item) => ({ id: item.id, title: item.name, description: item.city + ' · ' + item.disciplines.join(', '), href: '/clubs/' + item.id }))} />
      <PublicSection eyebrow='National' title='Classements' description='Les meilleures progressions du moment.'><RankingTable items={data.rankings.slice(0, 5)} /></PublicSection>
      <HomeCards title='Disciplines' eyebrow='Pratiques' description='Comprendre et découvrir chaque art du combat.' items={data.disciplines.map((item) => ({ id: item.id, title: item.name, description: item.presentation, href: '/disciplines/' + item.slug }))} />
      <PublicSection eyebrow='Médias récents' title='Dans l’arène' description='Highlights et galeries récentes.'><MediaGrid items={data.media} onFavorite={() => undefined} /></PublicSection>
      <PublicSection eyebrow='Recommandations' title='À découvrir maintenant' description='Une sélection personnalisable et déterministe.'><SearchGroups items={data.recommendations} /></PublicSection>
      <aside className='public-hero public-hero-compact rounded-[var(--ds-r-xl)]' aria-label='Rejoindre Indesy Mialy'>
        <div className='public-hero-copy'>
          <div className='public-eyebrow'>Votre place dans l’arène</div>
          <h2 className='ds-h1'>Rejoignez l’écosystème Indesy Mialy</h2>
          <p className='public-lead'>Créez votre profil, suivez vos favoris et participez aux prochains événements.</p>
          <div className='public-actions'><Link href='/auth' className='ds-button ds-primary'>Créer un compte</Link></div>
        </div>
      </aside>
    </div>
  );
}

function HomeCards({ title, eyebrow, description, items }: { title: string; eyebrow: string; description: string; items: Array<{ id: string; title: string; description: string; href: string }> }) {
  return (
    <PublicSection eyebrow={eyebrow} title={title} description={description}>
      <div className='public-grid'>
        {items.map((item) => (
          <Link key={item.id} href={item.href} className='public-card'>
            <div className='public-card-body'>
              <p className='public-card-kicker'>{eyebrow}</p>
              <h3 className='public-card-title'>{item.title}</h3>
              <p className='public-card-copy'>{item.description}</p>
              <span className='mt-6 inline-flex text-sm font-bold text-[var(--ds-primary)]'>Découvrir →</span>
            </div>
          </Link>
        ))}
      </div>
    </PublicSection>
  );
}
