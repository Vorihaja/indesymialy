import {
  SuperAdminPerformanceTargetRepository,
} from "../repositories/super-admin-performance-target.repository";

import type {
  SuperAdminKpiTargetUpdate,
} from "../performance-target.types";

export class SuperAdminPerformanceTargetService {

  constructor(
    private readonly repository:
      SuperAdminPerformanceTargetRepository,
  ) {}

  getConfiguration() {
    return this.repository.getConfiguration();
  }

  saveConfiguration(
    targets:
      SuperAdminKpiTargetUpdate[],
  ) {
    return this.repository.saveConfiguration(
      targets,
    );
  }
}
