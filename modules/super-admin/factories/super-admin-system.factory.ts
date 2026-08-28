import {
  SuperAdminSystemRepository,
} from "../repositories/super-admin-system.repository";

import {
  SuperAdminSystemService,
} from "../services/super-admin-system.service";

import {
  GetSuperAdminSystemAnalyticsUseCase,
} from "../use-cases/get-super-admin-system-analytics.use-case";

import {
  CaptureSuperAdminSystemSnapshotUseCase,
} from "../use-cases/capture-super-admin-system-snapshot.use-case";

import {
  GetSuperAdminSystemHistoryUseCase,
} from "../use-cases/get-super-admin-system-history.use-case";

let service:
  SuperAdminSystemService | null =
    null;

export function makeSuperAdminSystemService() {

  service ??=
    new SuperAdminSystemService(
      new SuperAdminSystemRepository(),
    );

  return service;
}


export function makeGetSuperAdminSystemAnalyticsUseCase() {

  return new GetSuperAdminSystemAnalyticsUseCase(
    makeSuperAdminSystemService(),
  );
}


export function makeCaptureSuperAdminSystemSnapshotUseCase() {

  return new CaptureSuperAdminSystemSnapshotUseCase(
    makeSuperAdminSystemService(),
  );
}


export function makeGetSuperAdminSystemHistoryUseCase() {

  return new GetSuperAdminSystemHistoryUseCase(
    makeSuperAdminSystemService(),
  );
}
