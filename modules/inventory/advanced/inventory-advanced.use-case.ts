import {
  AdvancedInventoryService,
} from "./inventory-advanced.service";

import type {
  InventoryPhysicalCountInput,
} from "./types";

export class ManageAdvancedInventoryUseCase {
  constructor(
    private readonly service:
      AdvancedInventoryService,
  ) {}

  execute() {
    return this.service.snapshot();
  }

  adjust(
    productId: string,
    delta: number,
    reason: string,
  ) {
    return this.service.adjust(
      productId,
      delta,
      reason,
    );
  }

  setThreshold(
    productId: string,
    threshold: number,
  ) {
    return this.service.setThreshold(
      productId,
      threshold,
    );
  }

  startCount(
    note?: string,
  ) {
    return this.service.startCount(
      note,
    );
  }

  saveCount(
    countId: string,
    values:
      InventoryPhysicalCountInput[],
  ) {
    return this.service.saveCount(
      countId,
      values,
    );
  }

  finalizeCount(
    countId: string,
  ) {
    return this.service.finalizeCount(
      countId,
    );
  }

  cancelCount(
    countId: string,
  ) {
    return this.service.cancelCount(
      countId,
    );
  }
}