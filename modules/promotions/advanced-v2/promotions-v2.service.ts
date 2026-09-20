import {
  PromotionsV2Repository,
} from "./promotions-v2.repository";

import type {
  MarketplaceBundleInput,
  MarketplacePartnershipInput,
  PromotionV2Status,
} from "./types";


function currency(
  value: string,
) {
  const result =
    value
      .trim()
      .toUpperCase();

  if (
    !/^[A-Z]{3}$/.test(
      result,
    )
  ) {
    throw new Error(
      "La devise doit contenir exactement 3 lettres.",
    );
  }

  return result;
}


function validDates(
  startsAt: string | null,
  endsAt: string | null,
) {
  if (
    startsAt &&
    endsAt &&
    new Date(endsAt).getTime() <=
      new Date(startsAt).getTime()
  ) {
    throw new Error(
      "La date de fin doit être postérieure à la date de début.",
    );
  }
}


export class PromotionsV2Service {
  constructor(
    private readonly repository:
      PromotionsV2Repository,
  ) {}


  load() {
    return this.repository.load();
  }


  saveBundle(
    input: MarketplaceBundleInput,
  ) {
    const name =
      input.name.trim();

    if (!name) {
      throw new Error(
        "Le nom du bundle est obligatoire.",
      );
    }


    const distinctProducts =
      new Set(
        input.items
          .map(
            (item) =>
              item.productId,
          )
          .filter(Boolean),
      );


    if (
      distinctProducts.size < 2
    ) {
      throw new Error(
        "Un bundle doit contenir au moins deux produits distincts.",
      );
    }


    if (
      input.items.some(
        (item) =>
          !item.productId ||
          !Number.isInteger(
            item.quantity,
          ) ||
          item.quantity <= 0 ||
          !Number.isInteger(
            item.sortOrder,
          ) ||
          item.sortOrder < 0,
      )
    ) {
      throw new Error(
        "Les produits ou quantités du bundle sont invalides.",
      );
    }


    if (
      input.pricingMode ===
        "fixed_price" &&
      (
        input.fixedPrice ===
          null ||
        !Number.isFinite(
          input.fixedPrice,
        ) ||
        input.fixedPrice <= 0
      )
    ) {
      throw new Error(
        "Le prix fixe du bundle doit être positif.",
      );
    }


    if (
      input.pricingMode ===
        "percent_discount" &&
      (
        input.discountPercent ===
          null ||
        !Number.isFinite(
          input.discountPercent,
        ) ||
        input.discountPercent <= 0 ||
        input.discountPercent > 100
      )
    ) {
      throw new Error(
        "La remise doit être comprise entre 0 et 100 %.",
      );
    }


    validDates(
      input.startsAt,
      input.endsAt,
    );


    return this.repository
      .saveBundle({
        ...input,

        name,

        description:
          input.description.trim(),

        currency:
          currency(
            input.currency,
          ),

        fixedPrice:
          input.pricingMode ===
            "fixed_price"
            ? input.fixedPrice
            : null,

        discountPercent:
          input.pricingMode ===
            "percent_discount"
            ? input.discountPercent
            : null,
      });
  }


  setBundleStatus(
    id: string,
    status: PromotionV2Status,
  ) {
    if (!id) {
      throw new Error(
        "Bundle introuvable.",
      );
    }

    return this.repository
      .setBundleStatus(
        id,
        status,
      );
  }


  savePartnership(
    input: MarketplacePartnershipInput,
  ) {
    const partnerName =
      input.partnerName.trim();

    if (!partnerName) {
      throw new Error(
        "Le nom du partenaire est obligatoire.",
      );
    }


    if (
      input.benefitType ===
        "percent_discount" &&
      (
        input.benefitValue ===
          null ||
        !Number.isFinite(
          input.benefitValue,
        ) ||
        input.benefitValue <= 0 ||
        input.benefitValue > 100
      )
    ) {
      throw new Error(
        "L'avantage en pourcentage doit être compris entre 0 et 100 %.",
      );
    }


    if (
      input.benefitType ===
        "fixed_discount" &&
      (
        input.benefitValue ===
          null ||
        !Number.isFinite(
          input.benefitValue,
        ) ||
        input.benefitValue <= 0
      )
    ) {
      throw new Error(
        "L'avantage fixe doit être positif.",
      );
    }


    if (
      input.benefitType ===
        "promotion_code" &&
      input.promotionCode
        .trim()
        .length < 2
    ) {
      throw new Error(
        "Le code partenaire est obligatoire.",
      );
    }


    validDates(
      input.startsAt,
      input.endsAt,
    );


    return this.repository
      .savePartnership({
        ...input,

        partnerName,

        contactName:
          input.contactName.trim(),

        contactEmail:
          input.contactEmail
            .trim()
            .toLowerCase(),

        contactPhone:
          input.contactPhone.trim(),

        description:
          input.description.trim(),

        promotionCode:
          input.promotionCode
            .trim()
            .toUpperCase(),

        currency:
          currency(
            input.currency,
          ),

        benefitValue:
          (
            input.benefitType ===
              "percent_discount" ||
            input.benefitType ===
              "fixed_discount"
          )
            ? input.benefitValue
            : null,
      });
  }


  setPartnershipStatus(
    id: string,
    status: PromotionV2Status,
    note: string,
  ) {
    if (!id) {
      throw new Error(
        "Partenariat introuvable.",
      );
    }

    return this.repository
      .setPartnershipStatus(
        id,
        status,
        note.trim(),
      );
  }
}