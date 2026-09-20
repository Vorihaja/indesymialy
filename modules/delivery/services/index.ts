import {
  DeliveryRepository,
} from "../repositories";

export class DeliveryService {
  constructor(
    private readonly repository:
      DeliveryRepository,
  ) {}

  list() {
    return this.repository.list();
  }

  updateMetadata(
    id: string,
    carrier: string,
    trackingNumber: string,
  ) {
    if (!id) {
      throw new Error(
        "Livraison introuvable.",
      );
    }

    return this.repository
      .updateMetadata(
        id,
        carrier,
        trackingNumber,
      );
  }
}