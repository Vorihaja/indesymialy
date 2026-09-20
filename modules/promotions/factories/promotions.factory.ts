import {
  PromotionsRepository,
} from "../repositories/promotions.repository";

import {
  PromotionsService,
} from "../services/promotions.service";

import {
  PromotionsUseCase,
} from "../use-cases/promotions.use-case";

export function createPromotionsUseCase() {
  return new PromotionsUseCase(
    new PromotionsService(
      new PromotionsRepository(),
    ),
  );
}