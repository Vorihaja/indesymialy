import type { PublicNewsRepository } from '../repositories/public-news.repository';
import type { PublicNewsFilters } from '../types';
export class PublicNewsService { constructor(private readonly repository: PublicNewsRepository) {} list(filters: PublicNewsFilters) { return this.repository.list(filters); } }
