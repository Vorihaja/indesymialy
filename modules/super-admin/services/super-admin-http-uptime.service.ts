import {
  SuperAdminHttpUptimeRepository,
} from "../repositories/super-admin-http-uptime.repository";


export class SuperAdminHttpUptimeService {

  constructor(
    private readonly repository:
      SuperAdminHttpUptimeRepository,
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