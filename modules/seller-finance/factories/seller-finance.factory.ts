import {
  SellerFinanceRepository,
} from "../repositories/seller-finance.repository";

import {
  SellerFinanceService,
} from "../services/seller-finance.service";

import {
  SellerFinanceUseCase,
} from "../use-cases/seller-finance.use-case";

export function createSellerFinanceUseCase() {
  return new SellerFinanceUseCase(
    new SellerFinanceService(
      new SellerFinanceRepository(),
    ),
  );
}