import { CatalogService } from "../services";
import type { ProductFilters } from "../types";

export class BrowseCatalogUseCase {
  constructor(private readonly service: CatalogService) {}

  execute(filters: ProductFilters) { return this.service.catalog(filters); }
  detail(id: string) { return this.service.product(id); }
  favorites() { return this.service.favorites(); }
  favoriteProducts() { return this.service.favoriteProducts(); }
  toggleFavorite(id: string) { return this.service.toggleFavorite(id); }
}
