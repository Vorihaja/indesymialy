import {
  MarketplaceService,
  createMarketplaceRuntimeRepository,
} from "@/modules/marketplace-core";
import { CatalogRepository } from "../repositories";
import type { ProductFilters } from "../types";

const marketplaceRuntimeRepository = createMarketplaceRuntimeRepository();

export class CatalogService {
  private readonly marketplace = new MarketplaceService(marketplaceRuntimeRepository);

  constructor(private readonly repository: CatalogRepository) {}

  catalog(filters: ProductFilters) { return this.marketplace.catalog(filters); }
  product(id: string) { return this.repository.product(id); }
  favorites() { return this.repository.favorites(); }
  favoriteProducts() { return this.repository.favoriteProducts(); }
  toggleFavorite(id: string) { return this.repository.toggleFavorite(id); }
}
