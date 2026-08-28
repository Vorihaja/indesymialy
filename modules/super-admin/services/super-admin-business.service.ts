import {
  SuperAdminBusinessRepository,
} from "../repositories/super-admin-business.repository";

export class SuperAdminBusinessService {

  constructor(
    private readonly repository:
      SuperAdminBusinessRepository,
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
