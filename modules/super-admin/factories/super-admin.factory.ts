import { SuperAdminRepository } from "../repositories/super-admin.repository";
import { SuperAdminService } from "../services/super-admin.service";
import { GetSuperAdminAnalyticsUseCase } from "../use-cases/get-super-admin-analytics.use-case";
import { SuperAdminGovernanceUseCase } from "../use-cases/super-admin-governance.use-case";

let service: SuperAdminService | null = null;

export function makeSuperAdminService() {
  service ??= new SuperAdminService(
    new SuperAdminRepository(),
  );

  return service;
}

export function makeGetSuperAdminAnalyticsUseCase() {
  return new GetSuperAdminAnalyticsUseCase(
    makeSuperAdminService(),
  );
}

export function makeSuperAdminGovernanceUseCase() {
  return new SuperAdminGovernanceUseCase(
    makeSuperAdminService(),
  );
}
