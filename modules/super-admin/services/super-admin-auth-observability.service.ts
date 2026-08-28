import {
  SuperAdminAuthObservabilityRepository,
} from "../repositories/super-admin-auth-observability.repository";


export class SuperAdminAuthObservabilityService {

  constructor(
    private readonly repository:
      SuperAdminAuthObservabilityRepository,
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