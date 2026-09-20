import {
  PromotionsV2Service,
} from "./promotions-v2.service";

import type {
  MarketplaceBundleInput,
  MarketplacePartnershipInput,
  PromotionV2Status,
} from "./types";


export class ManagePromotionsV2UseCase {
  constructor(
    private readonly service:
      PromotionsV2Service,
  ) {}


  load() {
    return this.service.load();
  }


  saveBundle(
    input: MarketplaceBundleInput,
  ) {
    return this.service
      .saveBundle(input);
  }


  setBundleStatus(
    id: string,
    status: PromotionV2Status,
  ) {
    return this.service
      .setBundleStatus(
        id,
        status,
      );
  }


  savePartnership(
    input: MarketplacePartnershipInput,
  ) {
    return this.service
      .savePartnership(input);
  }


  setPartnershipStatus(
    id: string,
    status: PromotionV2Status,
    note: string,
  ) {
    return this.service
      .setPartnershipStatus(
        id,
        status,
        note,
      );
  }
}