import {
  SellerFinanceRepository,
} from "../repositories/seller-finance.repository";

export class SellerFinanceService {
  constructor(
    private readonly repository:
      SellerFinanceRepository,
  ) {}

  transactions() {
    return this.repository.transactions();
  }

  revenue() {
    return this.repository.revenue();
  }
}