import {
  SuperAdminPerformanceTargetRepository,
} from "../repositories/super-admin-performance-target.repository";

import {
  SuperAdminPerformanceTargetService,
} from "../services/super-admin-performance-target.service";

import {
  GetSuperAdminPerformanceTargetsUseCase,
} from "../use-cases/get-super-admin-performance-targets.use-case";

import {
  SaveSuperAdminPerformanceTargetsUseCase,
} from "../use-cases/save-super-admin-performance-targets.use-case";

let service:
  SuperAdminPerformanceTargetService | null =
    null;

export function makeSuperAdminPerformanceTargetService() {

  service ??=
    new SuperAdminPerformanceTargetService(
      new SuperAdminPerformanceTargetRepository(),
    );

  return service;
}

export function makeGetSuperAdminPerformanceTargetsUseCase() {

  return new GetSuperAdminPerformanceTargetsUseCase(
    makeSuperAdminPerformanceTargetService(),
  );
}

export function makeSaveSuperAdminPerformanceTargetsUseCase() {

  return new SaveSuperAdminPerformanceTargetsUseCase(
    makeSuperAdminPerformanceTargetService(),
  );
}
