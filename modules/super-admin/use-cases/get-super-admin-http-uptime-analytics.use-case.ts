import {
  SuperAdminHttpUptimeService,
} from "../services/super-admin-http-uptime.service";


export class GetSuperAdminHttpUptimeAnalyticsUseCase {

  constructor(
    private readonly service:
      SuperAdminHttpUptimeService,
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