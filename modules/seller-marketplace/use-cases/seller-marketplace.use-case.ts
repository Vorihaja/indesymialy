import {
  SellerMarketplaceService,
} from "../services/seller-marketplace.service";

export class GetSellerMarketplaceUseCase {
  constructor(
    private readonly service:
      SellerMarketplaceService,
  ) {}

  execute(
    periodDays = 30,
  ) {
    return this.service.snapshot(
      periodDays,
    );
  }
}