import {
  SellerCatalogCategoriesService,
} from "./categories.service";


export class ListSellerCatalogCategoriesUseCase {
  constructor(
    private readonly service:
      SellerCatalogCategoriesService,
  ) {}

  execute() {
    return this.service.list();
  }
}