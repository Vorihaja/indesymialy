import {
  SellerCustomersRepository,
} from "../repositories/seller-customers.repository";

import type {
  CustomerDisputeInput,
  CustomerSegmentInput,
  LoyaltyAdjustmentInput,
} from "../types";

export class SellerCustomersService {
  constructor(
    private readonly repository:
      SellerCustomersRepository,
  ) {}

  snapshot() {
    return this.repository.getSnapshot();
  }

  saveSegment(
    input: CustomerSegmentInput,
  ) {
    return this.repository.saveSegment(
      input,
    );
  }

  setSegmentStatus(
    id: string,
    status: "active" | "archived",
  ) {
    return this.repository.setSegmentStatus(
      id,
      status,
    );
  }

  setSegmentMembers(
    segmentId: string,
    customerIds: string[],
  ) {
    return this.repository.setSegmentMembers(
      segmentId,
      customerIds,
    );
  }

  adjustLoyalty(
    input: LoyaltyAdjustmentInput,
  ) {
    return this.repository.adjustLoyalty(
      input,
    );
  }

  saveDispute(
    input: CustomerDisputeInput,
  ) {
    return this.repository.saveDispute(
      input,
    );
  }
}