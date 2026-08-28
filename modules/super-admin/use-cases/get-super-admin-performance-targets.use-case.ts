import {
  SuperAdminPerformanceTargetService,
} from "../services/super-admin-performance-target.service";

export class GetSuperAdminPerformanceTargetsUseCase {

  constructor(
    private readonly service:
      SuperAdminPerformanceTargetService,
  ) {}

  execute() {
    return this.service.getConfiguration();
  }
}
