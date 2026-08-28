import { SuperAdminService } from "../services/super-admin.service";

export class GetSuperAdminAnalyticsUseCase {
  constructor(
    private readonly service: SuperAdminService,
  ) {}

  execute(from: Date, to: Date) {
    return this.service.getAnalytics(from, to);
  }
}
