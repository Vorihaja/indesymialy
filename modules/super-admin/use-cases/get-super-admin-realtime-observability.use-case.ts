import {
  SuperAdminRealtimeObservabilityService,
} from "../services/super-admin-realtime-observability.service";


export class GetSuperAdminRealtimeObservabilityUseCase {

  constructor(
    private readonly service:
      SuperAdminRealtimeObservabilityService,
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