import {
  PromotionsV2Repository,
} from "./promotions-v2.repository";

import {
  PromotionsV2Service,
} from "./promotions-v2.service";

import {
  ManagePromotionsV2UseCase,
} from "./promotions-v2.use-case";


export function createPromotionsV2UseCase() {
  return new ManagePromotionsV2UseCase(
    new PromotionsV2Service(
      new PromotionsV2Repository(),
    ),
  );
}