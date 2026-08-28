import {
  SuperAdminPerformanceRepository,
} from "../repositories/super-admin-performance.repository";

export class SuperAdminPerformanceService {

  constructor(
    private readonly repository:
      SuperAdminPerformanceRepository,
  ) {}

  getAnalytics(
    from: Date,
    to: Date,
  ) {
    return this.repository.getAnalytics(
      from,
      to,
    );
  }
}
