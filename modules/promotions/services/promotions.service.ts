import {
  PromotionsRepository,
} from "../repositories/promotions.repository";

import type {
  PromotionCampaignInput,
  PromotionCodeInput,
  PromotionCodeStatus,
  PromotionStatus,
} from "../types";

export class PromotionsService {
  constructor(
    private readonly repository:
      PromotionsRepository,
  ) {}

  snapshot() {
    return this.repository.snapshot();
  }

  saveCampaign(
    input:
      PromotionCampaignInput,
  ) {
    const name =
      input.name.trim();

    if (!name) {
      throw new Error(
        "Le nom de la campagne est obligatoire.",
      );
    }

    if (
      !Number.isFinite(
        input.discountValue,
      ) ||
      input.discountValue <= 0
    ) {
      throw new Error(
        "La remise doit être supérieure à zéro.",
      );
    }

    if (
      input.discountType ===
        "percent" &&
      input.discountValue > 100
    ) {
      throw new Error(
        "Une remise en pourcentage ne peut pas dépasser 100 %.",
      );
    }

    if (
      input.minOrderAmount < 0
    ) {
      throw new Error(
        "Le minimum de commande ne peut pas être négatif.",
      );
    }

    if (
      input.maxDiscountAmount !==
        null &&
      input.maxDiscountAmount <= 0
    ) {
      throw new Error(
        "Le plafond de remise doit être positif.",
      );
    }

    if (
      input.usageLimit !==
        null &&
      (
        !Number.isInteger(
          input.usageLimit,
        ) ||
        input.usageLimit <= 0
      )
    ) {
      throw new Error(
        "La limite d’utilisation doit être un entier positif.",
      );
    }

    if (
      input.startsAt &&
      input.endsAt &&
      new Date(
        input.endsAt,
      ).getTime() <=
        new Date(
          input.startsAt,
        ).getTime()
    ) {
      throw new Error(
        "La date de fin doit être postérieure au début.",
      );
    }

    return this.repository.saveCampaign(
      {
        ...input,
        name,
        description:
          input.description.trim(),
        currency:
          input.currency
            .trim()
            .toUpperCase(),
      },
    );
  }

  setCampaignStatus(
    id: string,
    status:
      PromotionStatus,
  ) {
    return this.repository.setCampaignStatus(
      id,
      status,
    );
  }

  saveCode(
    input:
      PromotionCodeInput,
  ) {
    const code =
      input.code
        .trim()
        .toUpperCase();

    if (
      code.length < 2
    ) {
      throw new Error(
        "Le code promo doit contenir au moins 2 caractères.",
      );
    }

    if (!input.promotionId) {
      throw new Error(
        "Une campagne est obligatoire.",
      );
    }

    if (
      input.usageLimit !==
        null &&
      (
        !Number.isInteger(
          input.usageLimit,
        ) ||
        input.usageLimit <= 0
      )
    ) {
      throw new Error(
        "La limite d’utilisation doit être un entier positif.",
      );
    }

    return this.repository.saveCode(
      {
        ...input,
        code,
      },
    );
  }

  setCodeStatus(
    id: string,
    status:
      PromotionCodeStatus,
  ) {
    return this.repository.setCodeStatus(
      id,
      status,
    );
  }
}