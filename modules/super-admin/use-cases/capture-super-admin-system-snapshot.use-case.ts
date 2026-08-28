import {
  SuperAdminSystemService,
} from "../services/super-admin-system.service";

export class CaptureSuperAdminSystemSnapshotUseCase {

  constructor(
    private readonly service:
      SuperAdminSystemService,
  ) {}

  execute(
    periodDays: number,
    rpcLatencyMs: number,
  ) {

    return this.service.captureSnapshot(
      periodDays,
      rpcLatencyMs,
    );
  }
}
