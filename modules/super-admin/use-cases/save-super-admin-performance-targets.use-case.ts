import {
  SuperAdminPerformanceTargetService,
} from "../services/super-admin-performance-target.service";

import type {
  SuperAdminKpiTargetUpdate,
} from "../performance-target.types";

export class SaveSuperAdminPerformanceTargetsUseCase {

  constructor(
    private readonly service:
      SuperAdminPerformanceTargetService,
  ) {}

  execute(
    targets:
      SuperAdminKpiTargetUpdate[],
  ) {
    return this.service.saveConfiguration(
      targets,
    );
  }
}
