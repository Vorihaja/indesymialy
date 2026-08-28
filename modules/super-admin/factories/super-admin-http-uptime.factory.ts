import {
  SuperAdminHttpUptimeRepository,
} from "../repositories/super-admin-http-uptime.repository";

import {
  SuperAdminHttpUptimeService,
} from "../services/super-admin-http-uptime.service";

import {
  GetSuperAdminHttpUptimeAnalyticsUseCase,
} from "../use-cases/get-super-admin-http-uptime-analytics.use-case";


let service:
  SuperAdminHttpUptimeService | null =
    null;


export function makeSuperAdminHttpUptimeService() {

  service ??=
    new SuperAdminHttpUptimeService(
      new SuperAdminHttpUptimeRepository(),
    );


  return service;
}


export function makeGetSuperAdminHttpUptimeAnalyticsUseCase() {

  return new GetSuperAdminHttpUptimeAnalyticsUseCase(
    makeSuperAdminHttpUptimeService(),
  );
}