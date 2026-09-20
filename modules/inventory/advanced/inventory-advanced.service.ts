import {
  AdvancedInventoryRepository,
} from "./inventory-advanced.repository";

import type {
  InventoryPhysicalCountInput,
} from "./types";

export class AdvancedInventoryService {
  constructor(
    private readonly repository:
      AdvancedInventoryRepository,
  ) {}

  snapshot() {
    return this.repository.snapshot();
  }

  adjust(
    productId: string,
    delta: number,
    reason: string,
  ) {
    if (
      !Number.isInteger(
        delta,
      ) ||
      delta === 0
    ) {
      throw new Error(
        "La variation doit être un entier différent de zéro.",
      );
    }

    if (!reason.trim()) {
      throw new Error(
        "Le motif du mouvement est obligatoire.",
      );
    }

    return this.repository.adjust(
      productId,
      delta,
      reason.trim(),
    );
  }

  setThreshold(
    productId: string,
    threshold: number,
  ) {
    if (
      !Number.isInteger(
        threshold,
      ) ||
      threshold < 0
    ) {
      throw new Error(
        "Le seuil doit être un entier positif ou nul.",
      );
    }

    return this.repository.setThreshold(
      productId,
      threshold,
    );
  }

  startCount(
    note?: string,
  ) {
    return this.repository.startCount(
      note,
    );
  }

  saveCount(
    countId: string,
    values:
      InventoryPhysicalCountInput[],
  ) {
    values.forEach(
      (value) => {
        if (
          !value.productId ||
          !Number.isInteger(
            value.countedPhysical,
          ) ||
          value.countedPhysical < 0
        ) {
          throw new Error(
            "Un comptage physique est invalide.",
          );
        }
      },
    );

    return this.repository.saveCount(
      countId,
      values,
    );
  }

  finalizeCount(
    countId: string,
  ) {
    return this.repository.finalizeCount(
      countId,
    );
  }

  cancelCount(
    countId: string,
  ) {
    return this.repository.cancelCount(
      countId,
    );
  }
}