import type { AdminUsersData, AdminUsersDomain } from "../types";
import { AdminUsersService } from "../services";
export class GetAdminUsersUseCase { constructor(private readonly service: AdminUsersService) {} execute(domain: AdminUsersDomain): Promise<AdminUsersData> { return this.service.list(domain); } }
