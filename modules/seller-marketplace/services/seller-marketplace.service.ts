import {
  SellerMarketplaceRepository,
} from "../repositories/seller-marketplace.repository";

export class SellerMarketplaceService {
  constructor(
    private readonly repository:
      SellerMarketplaceRepository,
  ) {}

  snapshot(
    periodDays = 30,
  ) {
    if (
      !Number.isInteger(
        periodDays,
      ) ||
      periodDays < 1 ||
      periodDays > 365
    ) {
      throw new Error(
        "La période Marketplace doit être comprise entre 1 et 365 jours.",
      );
    }

    const to =
      new Date();

    const from =
      new Date(
        to.getTime() -
        periodDays *
        24 *
        60 *
        60 *
        1000,
      );

    return this.repository.snapshot(
      from.toISOString(),
      to.toISOString(),
      periodDays,
    );
  }
}