import {
  SuperAdminBusinessRepository,
} from "../repositories/super-admin-business.repository";

import {
  SuperAdminBusinessService,
} from "../services/super-admin-business.service";

import {
  GetSuperAdminBusinessAnalyticsUseCase,
} from "../use-cases/get-super-admin-business-analytics.use-case";

let service:
  SuperAdminBusinessService | null =
    null;

export function makeSuperAdminBusinessService() {

  service ??=
    new SuperAdminBusinessService(
      new SuperAdminBusinessRepository(),
    );

  return service;
}

export function makeGetSuperAdminBusinessAnalyticsUseCase() {

  return new GetSuperAdminBusinessAnalyticsUseCase(
    makeSuperAdminBusinessService(),
  );
}
