import {
  DeliveryAdvancedRepository,
} from "./delivery-advanced.repository";

import {
  DeliveryAdvancedService,
} from "./delivery-advanced.service";

import {
  ManageDeliveryAdvancedUseCase,
} from "./delivery-advanced.use-case";


export function createDeliveryAdvancedUseCase() {
  return new ManageDeliveryAdvancedUseCase(
    new DeliveryAdvancedService(
      new DeliveryAdvancedRepository(),
    ),
  );
}