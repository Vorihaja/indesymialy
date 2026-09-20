import {
  SellerFinanceService,
} from "../services/seller-finance.service";

export class SellerFinanceUseCase {
  constructor(
    private readonly service:
      SellerFinanceService,
  ) {}

  transactions() {
    return this.service.transactions();
  }

  revenue() {
    return this.service.revenue();
  }
}