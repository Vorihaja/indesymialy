import {
  DeliveryAdvancedService,
} from "./delivery-advanced.service";

import type {
  CreateReturnInput,
  DeliveryCarrierInput,
  DeliveryZoneInput,
  MarketplaceReturnResolution,
  MarketplaceReturnStatus,
} from "./types";


export class ManageDeliveryAdvancedUseCase {
  constructor(
    private readonly service:
      DeliveryAdvancedService,
  ) {}


  load() {
    return this.service.load();
  }


  saveCarrier(
    input: DeliveryCarrierInput,
  ) {
    return this.service
      .saveCarrier(input);
  }


  archiveCarrier(
    id: string,
  ) {
    return this.service
      .archiveCarrier(id);
  }


  assignCarrier(
    deliveryId: string,
    carrierId: string | null,
    trackingNumber: string,
  ) {
    return this.service
      .assignCarrier(
        deliveryId,
        carrierId,
        trackingNumber,
      );
  }


  saveZone(
    input: DeliveryZoneInput,
  ) {
    return this.service
      .saveZone(input);
  }


  archiveZone(
    id: string,
  ) {
    return this.service
      .archiveZone(id);
  }


  createReturn(
    input: CreateReturnInput,
  ) {
    return this.service
      .createReturn(input);
  }


  transitionReturn(
    id: string,
    status: MarketplaceReturnStatus,
    note: string,
    resolution?: MarketplaceReturnResolution,
  ) {
    return this.service
      .transitionReturn(
        id,
        status,
        note,
        resolution,
      );
  }
}