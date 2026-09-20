import {
  SellerCatalogCategoriesRepository,
} from "./categories.repository";

import {
  SellerCatalogCategoriesService,
} from "./categories.service";

import {
  ListSellerCatalogCategoriesUseCase,
} from "./categories.use-case";


export function createListSellerCatalogCategoriesUseCase() {
  return new ListSellerCatalogCategoriesUseCase(
    new SellerCatalogCategoriesService(
      new SellerCatalogCategoriesRepository(),
    ),
  );
}