import {
  SuperAdminBusinessService,
} from "../services/super-admin-business.service";

export class GetSuperAdminBusinessAnalyticsUseCase {

  constructor(
    private readonly service:
      SuperAdminBusinessService,
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
