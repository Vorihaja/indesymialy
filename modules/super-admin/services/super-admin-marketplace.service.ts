import {
  SuperAdminMarketplaceRepository,
} from "../repositories/super-admin-marketplace.repository";

export class SuperAdminMarketplaceService {

  constructor(
    private readonly repository:
      SuperAdminMarketplaceRepository,
  ) {}

  getAnalytics(
    from: Date,
    to: Date,
  ) {
    return this.repository.getAnalytics(
      from,
      to,
    );
  }
}
