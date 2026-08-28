import {
  SuperAdminRealtimeObservabilityRepository,
} from "../repositories/super-admin-realtime-observability.repository";


export class SuperAdminRealtimeObservabilityService {

  constructor(
    private readonly repository:
      SuperAdminRealtimeObservabilityRepository,
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