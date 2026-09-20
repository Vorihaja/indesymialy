export interface PublicNewsItem { id: string; title: string; publishedAt: string | null }
export interface PublicNewsPage { items: PublicNewsItem[]; total: number }
export interface PublicNewsFilters { query: string; page: number; pageSize: number }
