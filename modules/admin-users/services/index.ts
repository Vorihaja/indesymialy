import type { AdminUsersData, AdminUsersDomain } from "../types";
import { AdminUsersRepository } from "../repositories";
export class AdminUsersService { constructor(private readonly repository: AdminUsersRepository) {} list(domain: AdminUsersDomain): Promise<AdminUsersData> { return this.repository.list(domain); } }
