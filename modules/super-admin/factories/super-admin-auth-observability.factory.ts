import {
  SuperAdminAuthObservabilityRepository,
} from "../repositories/super-admin-auth-observability.repository";

import {
  SuperAdminAuthObservabilityService,
} from "../services/super-admin-auth-observability.service";

import {
  GetSuperAdminAuthObservabilityUseCase,
} from "../use-cases/get-super-admin-auth-observability.use-case";


let service:
  SuperAdminAuthObservabilityService | null =
    null;


export function makeSuperAdminAuthObservabilityService() {

  service ??=
    new SuperAdminAuthObservabilityService(
      new SuperAdminAuthObservabilityRepository(),
    );


  return service;
}


export function makeGetSuperAdminAuthObservabilityUseCase() {

  return new GetSuperAdminAuthObservabilityUseCase(
    makeSuperAdminAuthObservabilityService(),
  );
}