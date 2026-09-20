import {
  SellerMarketplaceRepository,
} from "../repositories/seller-marketplace.repository";

import {
  SellerMarketplaceService,
} from "../services/seller-marketplace.service";

import {
  GetSellerMarketplaceUseCase,
} from "../use-cases/seller-marketplace.use-case";

export function createSellerMarketplaceUseCase() {
  return new GetSellerMarketplaceUseCase(
    new SellerMarketplaceService(
      new SellerMarketplaceRepository(),
    ),
  );
}