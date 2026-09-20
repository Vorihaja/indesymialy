import {
  DeliveryService,
} from "../services";

export class ListDeliveriesUseCase {
  constructor(
    private readonly service:
      DeliveryService,
  ) {}

  execute() {
    return this.service.list();
  }

  updateMetadata(
    id: string,
    carrier: string,
    trackingNumber: string,
  ) {
    return this.service
      .updateMetadata(
        id,
        carrier,
        trackingNumber,
      );
  }
}