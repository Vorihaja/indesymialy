import {
  SuperAdminSystemService,
} from "../services/super-admin-system.service";

export class GetSuperAdminSystemHistoryUseCase {

  constructor(
    private readonly service:
      SuperAdminSystemService,
  ) {}

  execute(
    periodDays: number,
    limit = 24,
  ) {

    return this.service.getHistory(
      periodDays,
      limit,
    );
  }
}
