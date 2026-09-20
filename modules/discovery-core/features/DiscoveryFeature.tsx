'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import IndesyDualOrbitLoader from '@/components/loading/IndesyDualOrbitLoader';
import { Button, PublicEmpty, PublicFilterBar, PublicHero, PublicPage, SearchBar, Select } from '@/components/ui';
import { ClubProfile, DirectoryGrid, FighterProfile, MediaGrid, RankingTable, SearchGroups } from '../components/DiscoveryViews';
import { useDiscovery } from '../hooks/useDiscovery';
import type { DiscoveryView } from '../types';

const PAGE_SIZE = 9;

export function DiscoveryFeature({ view, id, categoryId }: { view: DiscoveryView; id?: string; categoryId?: string }) {
  const role = view === 'fighters' ? 'fighter' : view === 'clubs' ? 'club' : undefined;
  const api = useDiscovery(role);
  const searchDiscovery = api.search;
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [query, setQuery] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [category, setCategory] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [mediaEvent, setMediaEvent] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => { if (view === 'search') void searchDiscovery(query); }, [query, searchDiscovery, view]);

  if (api.loading) return <div className='public-loading'><IndesyDualOrbitLoader label='Chargement des données publiques' variant='section' /></div>;
  if (api.error) return <State title='Contenu indisponible' description={api.error} />;
  const data = api.snapshot;
  if (!data) return <State title='Aucune donnée publique' />;

  if (view === 'fighters' || view === 'clubs' || view === 'directory') {
    const isFighters = view === 'fighters'; const isClubs = view === 'clubs';
    const title = isFighters ? 'Combattants' : isClubs ? 'Clubs' : 'Annuaire national';
    const items = view === 'directory' ? api.directory.items : api.directory.items;
    const disciplines = [...new Set(data.directory.filter((item) => !role || item.role === role).map((item) => item.discipline).filter(Boolean))];
    const regions = [...new Set(data.directory.filter((item) => !role || item.role === role).map((item) => item.region).filter(Boolean))];
    const cities = [...new Set(data.directory.filter((item) => !role || item.role === role).map((item) => item.city).filter(Boolean))];
    const categories = [...new Set(data.directory.filter((item) => item.role === 'fighter').map((item) => item.weightCategory).filter((value): value is string => Boolean(value)))];
    return <Shell eyebrow={isFighters ? 'Athlètes publics' : isClubs ? 'Réseau national' : 'Écosystème Indesy'} title={title} description={isFighters ? 'Profils, disciplines et statistiques publiques des athlètes malagasy.' : isClubs ? 'Structures publiques et disciplines de la scène malagasy.' : 'Les profils publics de la communauté des sports de combat.'}>
      <PublicFilterBar className='mb-8'>
        <SearchBar value={api.filters.query} onChange={(event) => api.setFilters({ ...api.filters, query: event.target.value, page: 1 })} placeholder={`Rechercher ${isClubs ? 'un club' : 'un nom'}`} aria-label={`Rechercher dans ${title}`} />
        <Select value={api.filters.discipline ?? ''} onChange={(event) => api.setFilters({ ...api.filters, discipline: event.target.value || undefined, page: 1 })} aria-label='Filtrer par discipline'><option value=''>Toutes les disciplines</option>{disciplines.map((value) => <option key={value}>{value}</option>)}</Select>
        <Select value={api.filters.region ?? ''} onChange={(event) => api.setFilters({ ...api.filters, region: event.target.value || undefined, page: 1 })} aria-label='Filtrer par région'><option value=''>Toutes les régions</option>{regions.map((value) => <option key={value}>{value}</option>)}</Select>
        {isFighters ? <Select value={api.filters.weightCategory ?? ''} onChange={(event) => api.setFilters({ ...api.filters, weightCategory: event.target.value || undefined, page: 1 })} aria-label='Filtrer par catégorie'><option value=''>Toutes les catégories</option>{categories.map((value) => <option key={value}>{value}</option>)}</Select> : null}
        {isClubs ? <Select value={api.filters.city ?? ''} onChange={(event) => api.setFilters({ ...api.filters, city: event.target.value || undefined, page: 1 })} aria-label='Filtrer par ville'><option value=''>Toutes les villes</option>{cities.map((value) => <option key={value}>{value}</option>)}</Select> : null}
        <Button variant='outline' onClick={() => setLayout((value) => value === 'grid' ? 'list' : 'grid')} aria-pressed={layout === 'list'}>Vue {layout === 'grid' ? 'liste' : 'grille'}</Button>
      </PublicFilterBar>
      <DirectoryGrid items={items} view={layout} /><Pagination page={api.filters.page} total={api.directory.total} pageSize={api.filters.pageSize} onPage={(next) => api.setFilters({ ...api.filters, page: next })} />
    </Shell>;
  }

  if (view === 'rankings') {
    const availableDisciplines = [...new Set(data.rankings.map((item) => item.discipline).filter(Boolean))];
    const routeDiscipline = id ? data.disciplines.find((item) => item.slug === id)?.name ?? '' : '';
    const selectedDiscipline = discipline || routeDiscipline;
    const routeCategory = categoryId ? [...new Set(data.rankings.map((item) => item.category))].find((value) => value.toLocaleLowerCase('fr').replaceAll(' ', '-') === decodeURIComponent(categoryId).toLocaleLowerCase('fr')) ?? '' : '';
    const selectedCategory = category || routeCategory;
    const availableCategories = [...new Set(data.rankings.filter((item) => !selectedDiscipline || item.discipline === selectedDiscipline).map((item) => item.category).filter(Boolean))];
    const filtered = data.rankings.filter((item) => (!selectedDiscipline || item.discipline === selectedDiscipline) && (!selectedCategory || item.category === selectedCategory));
    const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    return <Shell eyebrow='Classements officiels' title='Hiérarchie nationale' description='Classement fondé sur la cote ELO et le record enregistrés par l’autorité sportive actuelle.'><PublicFilterBar className='mb-8'><Select value={selectedDiscipline} onChange={(event) => { setDiscipline(event.target.value); setCategory(''); setPage(1); }} aria-label='Sélectionner une discipline'><option value=''>Toutes les disciplines disponibles</option>{availableDisciplines.map((value) => <option key={value}>{value}</option>)}</Select><Select value={selectedCategory} onChange={(event) => { setCategory(event.target.value); setPage(1); }} aria-label='Sélectionner une catégorie'><option value=''>Toutes les catégories disponibles</option>{availableCategories.map((value) => <option key={value}>{value}</option>)}</Select></PublicFilterBar><RankingTable items={shown} /><Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} /><p className='mt-8 max-w-3xl border-l-2 border-[var(--ds-primary)] pl-4 text-sm text-[var(--ds-muted)]'>Méthode : ordre décroissant de la cote ELO actuellement enregistrée. L’évolution n’est affichée que lorsqu’une entrée historique ELO existe.</p></Shell>;
  }

  if (['media', 'photos', 'videos', 'albums'].includes(view)) {
    const forcedType = view === 'photos' ? 'image' : view === 'videos' ? 'video' : '';
    const filtered = data.media.filter((item) => (!query || [item.title, item.content, ...item.tags].some((value) => value.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr')))) && (!(forcedType || mediaType) || item.mediaType === (forcedType || mediaType)) && (!discipline || item.discipline === discipline) && (!mediaEvent || item.eventId === mediaEvent));
    const mediaEvents = [...new Map(data.media.filter((item) => item.eventId).map((item) => [item.eventId as string, item.eventTitle || item.eventId as string])).entries()];
    const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    return <Shell eyebrow='Photos & vidéos' title='Médiathèque' description='Les fichiers explicitement publics publiés par les organisations Indesy.'><PublicFilterBar className='mb-8'><SearchBar value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder='Rechercher un média' aria-label='Rechercher dans les médias' />{!forcedType ? <Select value={mediaType} onChange={(event) => { setMediaType(event.target.value); setPage(1); }} aria-label='Filtrer par type'><option value=''>Photos et vidéos</option><option value='image'>Photos</option><option value='video'>Vidéos</option></Select> : null}{mediaEvents.length ? <Select value={mediaEvent} onChange={(event) => { setMediaEvent(event.target.value); setPage(1); }} aria-label='Filtrer par évènement'><option value=''>Tous les évènements</option>{mediaEvents.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select> : null}</PublicFilterBar><MediaGrid items={shown} /><Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} /></Shell>;
  }

  if (view === 'fighter') { const item = data.fighters.find((fighter) => fighter.id === id || fighter.identifier === id); return item ? <PublicPage className='ui-r3c-density'><FighterProfile fighter={item} /></PublicPage> : <State title='Combattant introuvable' description='Ce profil n’est pas public ou n’existe plus.' />; }
  if (view === 'club') { const item = data.clubs.find((club) => club.id === id || club.identifier === id); return item ? <PublicPage className='ui-r3c-density'><ClubProfile club={item} /></PublicPage> : <State title='Club introuvable' description='Ce profil n’est pas public ou n’existe plus.' />; }
  if (view === 'profile') { const fighter = data.fighters.find((item) => item.identifier === id); if (fighter) return <PublicPage className='ui-r3c-density'><FighterProfile fighter={fighter} /></PublicPage>; const club = data.clubs.find((item) => item.identifier === id); return club ? <PublicPage className='ui-r3c-density'><ClubProfile club={club} /></PublicPage> : <State title='Profil introuvable' description='Cet identifiant public n’existe pas.' />; }
  if (view === 'media-detail') { const item = data.media.find((media) => media.id === id); return <Shell eyebrow={item?.mediaType === 'video' ? 'Vidéo' : 'Photo'} title={item?.title ?? 'Média introuvable'} description={item?.content ?? 'Ce média n’est pas public ou n’existe plus.'}>{item ? <><Link href='/media' className='mb-6 inline-flex text-sm font-bold'>← Retour aux médias</Link><MediaGrid items={[item]} /></> : null}</Shell>; }
  if (view === 'search') return <Shell eyebrow='Recherche publique' title='Explorer Indesy Mialy' description='Profils publics, combattants et clubs.'><SearchBar value={query} onChange={(event) => setQuery(event.target.value)} placeholder='Rechercher' aria-label='Recherche publique' className='mb-8' /><SearchGroups items={api.results} /></Shell>;
  if (view === 'disciplines') return <Cards title='Disciplines' items={data.disciplines.map((item) => ({ id: item.id, title: item.name, href: `/disciplines/${item.slug}` }))} />;
  if (view === 'regions') return <Cards title='Régions' items={data.regions.map((item) => ({ id: item.id, title: item.name, href: `/regions/${item.id}` }))} />;
  return <State title='Contenu public indisponible' />;
}

function Shell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) { return <PublicPage className='ui-r3c-density'><PublicHero eyebrow={eyebrow} title={title} description={description} compact /><main className='public-container'>{children}</main></PublicPage>; }
function State({ title, description }: { title: string; description?: string }) { return <PublicPage className='ui-r3c-density'><main className='public-container'><PublicEmpty title={title} description={description} /></main></PublicPage>; }
function Pagination({ page, total, pageSize, onPage }: { page: number; total: number; pageSize: number; onPage: (page: number) => void }) { if (total <= pageSize) return null; const pages = Math.ceil(total / pageSize); return <nav className='public-pagination' aria-label='Pagination'><Button variant='outline' size='sm' disabled={page <= 1} onClick={() => onPage(page - 1)}>Précédent</Button><span>Page {page} sur {pages}</span><Button variant='outline' size='sm' disabled={page >= pages} onClick={() => onPage(page + 1)}>Suivant</Button></nav>; }
function Cards({ title, items }: { title: string; items: Array<{ id: string; title: string; href: string }> }) { return <Shell eyebrow='Découvrir' title={title} description={`Référentiel public ${title.toLocaleLowerCase('fr')}.`}><div className='public-directory-grid'>{items.map((item) => <Link key={item.id} href={item.href} className='public-directory-row'><strong>{item.title}</strong><span className='ml-auto'>Explorer →</span></Link>)}</div></Shell>; }
