import {
  SuperAdminPerformanceMonitorService,
} from "../services/super-admin-performance-monitor.service";

export class CaptureSuperAdminPerformanceSnapshotUseCase {

  constructor(
    private readonly service:
      SuperAdminPerformanceMonitorService,
  ) {}

  execute(
    periodDays: number,
  ) {
    return this.service.captureSnapshot(
      periodDays,
    );
  }
}
