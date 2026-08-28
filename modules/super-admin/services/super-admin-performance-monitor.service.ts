import {
  SuperAdminPerformanceMonitorRepository,
} from "../repositories/super-admin-performance-monitor.repository";

export class SuperAdminPerformanceMonitorService {

  constructor(
    private readonly repository:
      SuperAdminPerformanceMonitorRepository,
  ) {}

  captureSnapshot(
    periodDays: number,
  ) {
    return this.repository.captureSnapshot(
      periodDays,
    );
  }

  getHistory(
    periodDays: number,
    limit = 12,
  ) {
    return this.repository.getHistory(
      periodDays,
      limit,
    );
  }
}
