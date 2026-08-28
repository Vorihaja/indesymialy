import {
  SuperAdminPerformanceMonitorService,
} from "../services/super-admin-performance-monitor.service";

export class GetSuperAdminPerformanceHistoryUseCase {

  constructor(
    private readonly service:
      SuperAdminPerformanceMonitorService,
  ) {}

  execute(
    periodDays: number,
    limit = 12,
  ) {
    return this.service.getHistory(
      periodDays,
      limit,
    );
  }
}
