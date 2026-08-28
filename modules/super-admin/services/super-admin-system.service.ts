import {
  SuperAdminSystemRepository,
} from "../repositories/super-admin-system.repository";

export class SuperAdminSystemService {

  constructor(
    private readonly repository:
      SuperAdminSystemRepository,
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


  captureSnapshot(
    periodDays: number,
    rpcLatencyMs: number,
  ) {

    return this.repository.captureSnapshot(
      periodDays,
      rpcLatencyMs,
    );
  }


  getHistory(
    periodDays: number,
    limit = 24,
  ) {

    return this.repository.getHistory(
      periodDays,
      limit,
    );
  }
}
