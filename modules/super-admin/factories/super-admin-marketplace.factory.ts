import {
  SuperAdminMarketplaceRepository,
} from "../repositories/super-admin-marketplace.repository";

import {
  SuperAdminMarketplaceService,
} from "../services/super-admin-marketplace.service";

import {
  GetSuperAdminMarketplaceAnalyticsUseCase,
} from "../use-cases/get-super-admin-marketplace-analytics.use-case";

let service:
  SuperAdminMarketplaceService | null =
    null;

export function makeSuperAdminMarketplaceService() {

  service ??=
    new SuperAdminMarketplaceService(
      new SuperAdminMarketplaceRepository(),
    );

  return service;
}

export function makeGetSuperAdminMarketplaceAnalyticsUseCase() {

  return new GetSuperAdminMarketplaceAnalyticsUseCase(
    makeSuperAdminMarketplaceService(),
  );
}
