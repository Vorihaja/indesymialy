import type { PublicNewsService } from '../services/public-news.service';
import type { PublicNewsFilters } from '../types';
export class ListPublicNewsUseCase { constructor(private readonly service: PublicNewsService) {} execute(filters: PublicNewsFilters) { return this.service.list(filters); } }
