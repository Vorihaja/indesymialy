import {
  SuperAdminSystemService,
} from "../services/super-admin-system.service";

export class GetSuperAdminSystemAnalyticsUseCase {

  constructor(
    private readonly service:
      SuperAdminSystemService,
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
