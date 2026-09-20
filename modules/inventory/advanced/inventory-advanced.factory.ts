import {
  AdvancedInventoryRepository,
} from "./inventory-advanced.repository";

import {
  AdvancedInventoryService,
} from "./inventory-advanced.service";

import {
  ManageAdvancedInventoryUseCase,
} from "./inventory-advanced.use-case";

export function createAdvancedInventoryUseCase() {
  return new ManageAdvancedInventoryUseCase(
    new AdvancedInventoryService(
      new AdvancedInventoryRepository(),
    ),
  );
}