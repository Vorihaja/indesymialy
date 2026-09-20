import {
  PromotionsService,
} from "../services/promotions.service";

import type {
  PromotionCampaignInput,
  PromotionCodeInput,
  PromotionCodeStatus,
  PromotionStatus,
} from "../types";

export class PromotionsUseCase {
  constructor(
    private readonly service:
      PromotionsService,
  ) {}

  execute() {
    return this.service.snapshot();
  }

  saveCampaign(
    input:
      PromotionCampaignInput,
  ) {
    return this.service.saveCampaign(
      input,
    );
  }

  setCampaignStatus(
    id: string,
    status:
      PromotionStatus,
  ) {
    return this.service.setCampaignStatus(
      id,
      status,
    );
  }

  saveCode(
    input:
      PromotionCodeInput,
  ) {
    return this.service.saveCode(
      input,
    );
  }

  setCodeStatus(
    id: string,
    status:
      PromotionCodeStatus,
  ) {
    return this.service.setCodeStatus(
      id,
      status,
    );
  }
}