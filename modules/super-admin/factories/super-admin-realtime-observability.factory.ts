import {
  SuperAdminRealtimeObservabilityRepository,
} from "../repositories/super-admin-realtime-observability.repository";

import {
  SuperAdminRealtimeObservabilityService,
} from "../services/super-admin-realtime-observability.service";

import {
  GetSuperAdminRealtimeObservabilityUseCase,
} from "../use-cases/get-super-admin-realtime-observability.use-case";


let service:
  SuperAdminRealtimeObservabilityService | null =
    null;


export function makeSuperAdminRealtimeObservabilityService() {

  service ??=
    new SuperAdminRealtimeObservabilityService(
      new SuperAdminRealtimeObservabilityRepository(),
    );


  return service;
}


export function makeGetSuperAdminRealtimeObservabilityUseCase() {

  return new GetSuperAdminRealtimeObservabilityUseCase(
    makeSuperAdminRealtimeObservabilityService(),
  );
}