import {
  SuperAdminPerformanceService,
} from "../services/super-admin-performance.service";

export class GetSuperAdminPerformanceAnalyticsUseCase {

  constructor(
    private readonly service:
      SuperAdminPerformanceService,
  ) {}

  execute(
    from: Date,
    to: Date,
  ) {
    return this.service.getAnalytics(
      from,
      to,
    );
  }
}
