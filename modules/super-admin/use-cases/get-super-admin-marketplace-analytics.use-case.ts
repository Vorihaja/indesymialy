import {
  SuperAdminMarketplaceService,
} from "../services/super-admin-marketplace.service";

export class GetSuperAdminMarketplaceAnalyticsUseCase {

  constructor(
    private readonly service:
      SuperAdminMarketplaceService,
  ) {}

  execute(
    from: Date,
    to: Date,
  ) {
    return this.service.getAnalytics(
      from,
      to,
    );
  }
}
