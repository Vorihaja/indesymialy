import {
  SuperAdminPerformanceMonitorRepository,
} from "../repositories/super-admin-performance-monitor.repository";

import {
  SuperAdminPerformanceMonitorService,
} from "../services/super-admin-performance-monitor.service";

import {
  CaptureSuperAdminPerformanceSnapshotUseCase,
} from "../use-cases/capture-super-admin-performance-snapshot.use-case";

import {
  GetSuperAdminPerformanceHistoryUseCase,
} from "../use-cases/get-super-admin-performance-history.use-case";

let service:
  SuperAdminPerformanceMonitorService | null =
    null;

export function makeSuperAdminPerformanceMonitorService() {

  service ??=
    new SuperAdminPerformanceMonitorService(
      new SuperAdminPerformanceMonitorRepository(),
    );

  return service;
}

export function makeCaptureSuperAdminPerformanceSnapshotUseCase() {

  return new CaptureSuperAdminPerformanceSnapshotUseCase(
    makeSuperAdminPerformanceMonitorService(),
  );
}

export function makeGetSuperAdminPerformanceHistoryUseCase() {

  return new GetSuperAdminPerformanceHistoryUseCase(
    makeSuperAdminPerformanceMonitorService(),
  );
}
