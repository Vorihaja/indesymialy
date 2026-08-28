import {
  SuperAdminPerformanceRepository,
} from "../repositories/super-admin-performance.repository";

import {
  SuperAdminPerformanceService,
} from "../services/super-admin-performance.service";

import {
  GetSuperAdminPerformanceAnalyticsUseCase,
} from "../use-cases/get-super-admin-performance-analytics.use-case";

let service:
  SuperAdminPerformanceService | null =
    null;

export function makeSuperAdminPerformanceService() {

  service ??=
    new SuperAdminPerformanceService(
      new SuperAdminPerformanceRepository(),
    );

  return service;
}

export function makeGetSuperAdminPerformanceAnalyticsUseCase() {

  return new GetSuperAdminPerformanceAnalyticsUseCase(
    makeSuperAdminPerformanceService(),
  );
}
