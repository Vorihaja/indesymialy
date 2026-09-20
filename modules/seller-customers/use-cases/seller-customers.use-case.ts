import {
  SellerCustomersService,
} from "../services/seller-customers.service";

import type {
  CustomerDisputeInput,
  CustomerSegmentInput,
  LoyaltyAdjustmentInput,
} from "../types";

export class ManageSellerCustomersUseCase {
  constructor(
    private readonly service:
      SellerCustomersService,
  ) {}

  execute() {
    return this.service.snapshot();
  }

  saveSegment(
    input: CustomerSegmentInput,
  ) {
    return this.service.saveSegment(
      input,
    );
  }

  setSegmentStatus(
    id: string,
    status: "active" | "archived",
  ) {
    return this.service.setSegmentStatus(
      id,
      status,
    );
  }

  setSegmentMembers(
    segmentId: string,
    customerIds: string[],
  ) {
    return this.service.setSegmentMembers(
      segmentId,
      customerIds,
    );
  }

  adjustLoyalty(
    input: LoyaltyAdjustmentInput,
  ) {
    return this.service.adjustLoyalty(
      input,
    );
  }

  saveDispute(
    input: CustomerDisputeInput,
  ) {
    return this.service.saveDispute(
      input,
    );
  }
}