import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/infrastructure/supabase/database.types';
import type { EventPlatformRepository } from '@/modules/event-core/repositories/event-platform.repository';
import type { DiscoveryRepository } from './discovery.repository';
import type { DirectoryEntry, DiscoveryFilters, DiscoveryResult, DiscoverySnapshot, PublicClub, PublicDiscipline, PublicFighter, PublicRegion, RankingEntry } from '../types';
import { resolvePublicMediaEventId } from '../public-media-event-link.mjs';

const cleanIdentifier = (value: string) => value.trim().replace(/^@+/, '');

export class DiscoverySupabaseRepository implements DiscoveryRepository {
  private snapshotCache?: Promise<DiscoverySnapshot>;
  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly publicEvents: Pick<EventPlatformRepository, 'getSnapshot'>,
  ) {}

  snapshot(): Promise<DiscoverySnapshot> {
    this.snapshotCache ??= this.loadSnapshot();
    return this.snapshotCache;
  }

  private async loadSnapshot(): Promise<DiscoverySnapshot> {
    const [fightersResult, clubsResult, profilesResult, organizationsResult, disciplinesResult, linksResult, regionsResult, citiesResult, eloResult, mediaResult, publicEventsSnapshot, newsResult] = await Promise.all([
      this.supabase.from('fighters').select('id,profile_id,full_name,nickname,weight_class,status,status_professional,biography,wins,losses,draws,elo_rating').order('elo_rating', { ascending: false }).limit(100),
      this.supabase.from('clubs').select('id,profile_id,organization_id,name,description,logo_url,region_id,is_official_federated').limit(100),
      this.supabase.from('profiles').select('id,username,photo_url,is_verified,status,region_id,city_id').limit(250),
      this.supabase.from('organizations').select('id,slug,discipline,description,logo_url,is_verified,status,region_id,city_id').eq('type', 'club').limit(100),
      this.supabase.from('disciplines').select('id,slug,name,is_active,archived_at').eq('is_active', true).is('archived_at', null).order('name'),
      this.supabase.from('user_disciplines').select('user_id,discipline_id').limit(500),
      this.supabase.from('regions').select('id,name').eq('is_active', true).order('name'),
      this.supabase.from('cities').select('id,name,region_id').eq('is_active', true).order('name'),
      this.supabase.from('elo_history').select('fighter_id,elo_change,recorded_at').order('recorded_at', { ascending: false }).limit(500),
      this.supabase.from('club_media').select('id,title,description,file_url,thumbnail_url,media_type,tags,created_at,event_id,organization_id').eq('is_public', true).order('created_at', { ascending: false }).limit(60),
      this.publicEvents.getSnapshot(),
      this.supabase.from('breaking_news').select('text').order('created_at', { ascending: false }).limit(10),
    ]);
    const failed = [fightersResult, clubsResult, profilesResult, organizationsResult, disciplinesResult, linksResult, regionsResult, citiesResult, eloResult, mediaResult, newsResult].find((result) => result.error);
    if (failed?.error) throw failed.error;

    const profiles = new Map((profilesResult.data ?? []).map((row) => [row.id, row]));
    const regions = new Map((regionsResult.data ?? []).map((row) => [row.id, row.name]));
    const cities = new Map((citiesResult.data ?? []).map((row) => [row.id, row.name]));
    const disciplineNames = new Map((disciplinesResult.data ?? []).map((row) => [row.id, row.name]));
    const disciplineIdsByUser = new Map<string, string[]>();
    for (const row of linksResult.data ?? []) disciplineIdsByUser.set(row.user_id, [...(disciplineIdsByUser.get(row.user_id) ?? []), row.discipline_id]);
    const eloByFighter = new Map<string, number>();
    for (const row of eloResult.data ?? []) if (row.fighter_id && !eloByFighter.has(row.fighter_id)) eloByFighter.set(row.fighter_id, row.elo_change);

    const fighters: PublicFighter[] = (fightersResult.data ?? []).filter((row) => row.status !== 'suspended').map((row, index) => {
      const profile = profiles.get(row.profile_id);
      const fighterDisciplines = (disciplineIdsByUser.get(row.profile_id) ?? []).map((id) => disciplineNames.get(id)).filter((name): name is string => Boolean(name));
      return { id: row.id, identifier: cleanIdentifier(profile?.username || row.id), name: row.full_name, nickname: row.nickname ?? undefined, photoUrl: profile?.photo_url ?? undefined, club: '', coach: '', disciplines: fighterDisciplines, weightCategory: row.weight_class ?? '', record: { wins: row.wins, losses: row.losses, draws: row.draws }, ranking: index + 1, elo: row.elo_rating, progression: eloByFighter.get(row.id) ?? 0, hasProgressionHistory: eloByFighter.has(row.id), biography: row.biography ?? '', recentFights: [], upcomingFights: [], achievements: [], highlights: [], mediaIds: [], publicSponsors: [], news: [], favoritePrepared: false, verified: Boolean(profile?.is_verified), region: profile?.region_id ? regions.get(profile.region_id) ?? '' : '', city: profile?.city_id ? cities.get(profile.city_id) ?? '' : '', status: row.status_professional };
    });

    const organizations = new Map((organizationsResult.data ?? []).map((row) => [row.id, row]));
    const clubs: PublicClub[] = (clubsResult.data ?? []).map((row) => {
      const profile = profiles.get(row.profile_id); const organization = row.organization_id ? organizations.get(row.organization_id) : undefined;
      return { id: row.id, identifier: cleanIdentifier(profile?.username || organization?.slug || row.id), name: row.name, logoUrl: row.logo_url ?? organization?.logo_url ?? undefined, description: row.description ?? organization?.description ?? '', region: regions.get(row.region_id) ?? '', city: organization?.city_id ? cities.get(organization.city_id) ?? '' : '', disciplines: organization?.discipline ? [organization.discipline] : [], coaches: [], fighters: [], results: [], events: [], mediaIds: [], news: [], statistics: { members: 0, fighters: 0, wins: 0, events: 0 }, publicContact: '', official: row.is_official_federated || Boolean(profile?.is_verified) || Boolean(organization?.is_verified), followPrepared: false };
    });
    const directory: DirectoryEntry[] = [...fighters.map((item) => ({ id: item.id, name: item.name, role: 'fighter' as const, discipline: item.disciplines[0] ?? '', region: item.region ?? '', city: item.city ?? '', status: item.status ?? '', verified: item.verified ?? false, weightCategory: item.weightCategory, club: item.club, availabilityPrepared: false, imageUrl: item.photoUrl, href: `/${item.identifier}` })), ...clubs.map((item) => ({ id: item.id, name: item.name, role: 'club' as const, discipline: item.disciplines[0] ?? '', region: item.region, city: item.city, status: 'public', verified: item.official, availabilityPrepared: false, imageUrl: item.logoUrl, href: `/${item.identifier}` }))];
    const rankings: RankingEntry[] = fighters.map((item) => ({ id: `fighter-${item.id}`, entityType: 'fighter', name: item.name, discipline: item.disciplines[0] ?? '', category: item.weightCategory, region: item.region ?? '', nationalRank: item.ranking, regionalRank: 0, elo: item.elo, progression: item.progression, hasProgressionHistory: item.hasProgressionHistory, wins: item.record.wins, losses: item.record.losses, draws: item.record.draws, recentActivity: '', href: `/${item.identifier}` }));
    const publicEventsById = new Map(publicEventsSnapshot.events.map((event) => [event.id, event]));
    const publicEventIds = new Set(publicEventsById.keys());
    const media = (mediaResult.data ?? []).map((row) => {
      const eventId = resolvePublicMediaEventId(row.event_id, publicEventIds);
      return { id: row.id, kind: 'media' as const, title: row.title || 'Média', content: row.description || '', author: '', category: '', discipline: '', region: '', tags: row.tags ?? [], mentions: [], mediaType: row.media_type === 'video' ? 'video' as const : 'image' as const, mediaUrl: row.file_url, thumbnailUrl: row.thumbnail_url ?? undefined, status: 'published' as const, likes: 0, shares: 0, replies: 0, createdAt: row.created_at ?? '', updatedAt: row.created_at ?? '', eventId, eventTitle: eventId ? publicEventsById.get(eventId)?.title : undefined, source: '' };
    });
    const publicDisciplines: PublicDiscipline[] = (disciplinesResult.data ?? []).map((row) => ({ id: row.id, slug: row.slug, name: row.name, presentation: '', generalRules: [], categories: [...new Set(fighters.filter((item) => item.disciplines.includes(row.name)).map((item) => item.weightCategory).filter(Boolean))], fighterIds: fighters.filter((item) => item.disciplines.includes(row.name)).map((item) => item.id), clubIds: clubs.filter((item) => item.disciplines.includes(row.name)).map((item) => item.id), eventIds: [], rankingIds: rankings.filter((item) => item.discipline === row.name).map((item) => item.id), news: [], mediaIds: [], recentFightLiveIds: [] }));
    const publicRegions: PublicRegion[] = (regionsResult.data ?? []).map((row) => ({ id: row.id, name: row.name, cities: (citiesResult.data ?? []).filter((city) => city.region_id === row.id).map((city) => city.name), clubIds: clubs.filter((item) => item.region === row.name).map((item) => item.id), fighterIds: fighters.filter((item) => item.region === row.name).map((item) => item.id), eventIds: [], rankingIds: rankings.filter((item) => item.region === row.name).map((item) => item.id), news: [], statistics: { clubs: clubs.filter((item) => item.region === row.name).length, fighters: fighters.filter((item) => item.region === row.name).length, events: 0 } }));
    const search: DiscoveryResult[] = directory.map((item) => ({ id: item.id, kind: item.role === 'fighter' ? 'fighter' : item.role === 'club' ? 'club' : 'profile', title: item.name, description: [item.discipline, item.city].filter(Boolean).join(' · '), href: item.href, popularity: item.verified ? 1 : 0, tags: [item.discipline, item.region].filter(Boolean) }));
    return { directory, fighters, clubs, rankings, media, disciplines: publicDisciplines, regions: publicRegions, search, breakingNews: (newsResult.data ?? []).map((row) => row.text), trending: [], recommendations: [], platformStats: [] };
  }

  async directory(filters: DiscoveryFilters) { const snapshot = await this.snapshot(); const query = filters.query.trim().toLocaleLowerCase('fr'); let items = snapshot.directory.filter((item) => (!filters.role || item.role === filters.role) && (!query || [item.name, item.city, item.region, item.discipline, item.club ?? ''].some((value) => value.toLocaleLowerCase('fr').includes(query))) && (!filters.discipline || item.discipline === filters.discipline) && (!filters.region || item.region === filters.region) && (!filters.city || item.city === filters.city) && (!filters.status || item.status === filters.status) && (filters.verified === undefined || item.verified === filters.verified) && (!filters.weightCategory || item.weightCategory === filters.weightCategory)); items = items.sort((a, b) => filters.sort === 'name' ? a.name.localeCompare(b.name, 'fr') : Number(b.verified) - Number(a.verified)); const total = items.length; const start = (filters.page - 1) * filters.pageSize; return { items: items.slice(start, start + filters.pageSize), total }; }
  async search(query: string) { const value = query.trim().toLocaleLowerCase('fr'); return (await this.snapshot()).search.filter((item) => !value || [item.title, item.description, ...item.tags].some((field) => field.toLocaleLowerCase('fr').includes(value))); }
  async fighter(id: string) { return (await this.snapshot()).fighters.find((item) => item.id === id || item.identifier === cleanIdentifier(id)) ?? null; }
  async club(id: string) { return (await this.snapshot()).clubs.find((item) => item.id === id || item.identifier === cleanIdentifier(id)) ?? null; }
  async discipline(slug: string): Promise<PublicDiscipline | null> { return (await this.snapshot()).disciplines.find((item) => item.slug === slug) ?? null; }
  async region(id: string): Promise<PublicRegion | null> { return (await this.snapshot()).regions.find((item) => item.id === id) ?? null; }
  async toggleFavorite() { return false; }
}
