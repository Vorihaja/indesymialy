import {
  SellerCatalogCategoriesRepository,
} from "./categories.repository";


export class SellerCatalogCategoriesService {
  constructor(
    private readonly repository:
      SellerCatalogCategoriesRepository,
  ) {}

  list() {
    return this.repository.list();
  }
}