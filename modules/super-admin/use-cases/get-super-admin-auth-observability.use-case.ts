import {
  SuperAdminAuthObservabilityService,
} from "../services/super-admin-auth-observability.service";


export class GetSuperAdminAuthObservabilityUseCase {

  constructor(
    private readonly service:
      SuperAdminAuthObservabilityService,
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