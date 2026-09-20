import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/infrastructure/supabase/database.types';
import type { PublicNewsFilters, PublicNewsPage } from '../types';
export interface PublicNewsRepository { list(filters: PublicNewsFilters): Promise<PublicNewsPage> }
export class PublicNewsSupabaseRepository implements PublicNewsRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}
  async list(filters: PublicNewsFilters): Promise<PublicNewsPage> {
    const start = (filters.page - 1) * filters.pageSize;
    let query = this.supabase.from('breaking_news').select('id,text,created_at', { count: 'exact' }).order('created_at', { ascending: false }).range(start, start + filters.pageSize - 1);
    const term = filters.query.trim();
    if (term) query = query.ilike('text', `%${term.replaceAll('%', '\\%').replaceAll('_', '\\_')}%`);
    const { data, count, error } = await query;
    if (error) throw error;
    return { items: (data ?? []).map((row) => ({ id: row.id, title: row.text, publishedAt: row.created_at })), total: count ?? 0 };
  }
}
