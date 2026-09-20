import {
  DeliveryAdvancedRepository,
} from "./delivery-advanced.repository";

import type {
  CreateReturnInput,
  DeliveryCarrierInput,
  DeliveryZoneInput,
  MarketplaceReturnResolution,
  MarketplaceReturnStatus,
} from "./types";


export class DeliveryAdvancedService {
  constructor(
    private readonly repository:
      DeliveryAdvancedRepository,
  ) {}


  load() {
    return this.repository.load();
  }


  saveCarrier(
    input: DeliveryCarrierInput,
  ) {
    if (!input.name.trim()) {
      throw new Error(
        "Le nom du transporteur est obligatoire.",
      );
    }

    return this.repository.saveCarrier({
      ...input,
      name:
        input.name.trim(),
      phone:
        input.phone.trim(),
      email:
        input.email.trim(),
      website:
        input.website.trim(),
      trackingUrlTemplate:
        input.trackingUrlTemplate.trim(),
      notes:
        input.notes.trim(),
    });
  }


  archiveCarrier(
    id: string,
  ) {
    if (!id) {
      throw new Error(
        "Transporteur introuvable.",
      );
    }

    return this.repository
      .archiveCarrier(id);
  }


  assignCarrier(
    deliveryId: string,
    carrierId: string | null,
    trackingNumber: string,
  ) {
    if (!deliveryId) {
      throw new Error(
        "Sélectionnez une expédition.",
      );
    }

    return this.repository
      .assignCarrier(
        deliveryId,
        carrierId,
        trackingNumber.trim(),
      );
  }


  saveZone(
    input: DeliveryZoneInput,
  ) {
    if (!input.name.trim()) {
      throw new Error(
        "Le nom de la zone est obligatoire.",
      );
    }

    if (
      !Number.isFinite(
        input.deliveryFee,
      ) ||
      input.deliveryFee < 0
    ) {
      throw new Error(
        "Le tarif de livraison est invalide.",
      );
    }

    if (
      !Number.isInteger(
        input.minDeliveryDays,
      ) ||
      !Number.isInteger(
        input.maxDeliveryDays,
      ) ||
      input.minDeliveryDays < 0 ||
      input.maxDeliveryDays <
        input.minDeliveryDays
    ) {
      throw new Error(
        "Le délai de livraison est invalide.",
      );
    }

    const currency =
      input.currency
        .trim()
        .toUpperCase();

    if (
      !/^[A-Z]{3}$/.test(
        currency,
      )
    ) {
      throw new Error(
        "La devise doit contenir 3 lettres.",
      );
    }

    if (!input.areas.length) {
      throw new Error(
        "Ajoutez au moins un territoire.",
      );
    }

    return this.repository.saveZone({
      ...input,
      name:
        input.name.trim(),
      currency,
    });
  }


  archiveZone(
    id: string,
  ) {
    if (!id) {
      throw new Error(
        "Zone introuvable.",
      );
    }

    return this.repository
      .archiveZone(id);
  }


  createReturn(
    input: CreateReturnInput,
  ) {
    if (!input.orderId) {
      throw new Error(
        "Sélectionnez une commande.",
      );
    }

    if (!input.reason.trim()) {
      throw new Error(
        "Le motif du retour est obligatoire.",
      );
    }

    if (!input.items.length) {
      throw new Error(
        "Sélectionnez au moins un article.",
      );
    }

    if (
      input.items.some(
        (item) =>
          !Number.isInteger(
            item.quantity,
          ) ||
          item.quantity <= 0,
      )
    ) {
      throw new Error(
        "Les quantités retournées sont invalides.",
      );
    }

    return this.repository
      .createReturn({
        ...input,
        reason:
          input.reason.trim(),
      });
  }


  transitionReturn(
    id: string,
    status: MarketplaceReturnStatus,
    note: string,
    resolution?: MarketplaceReturnResolution,
  ) {
    if (!id) {
      throw new Error(
        "Retour introuvable.",
      );
    }

    if (
      status === "resolved" &&
      !resolution
    ) {
      throw new Error(
        "Sélectionnez une résolution.",
      );
    }

    return this.repository
      .transitionReturn(
        id,
        status,
        note.trim(),
        resolution,
      );
  }
}