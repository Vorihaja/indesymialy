import { AdminMemoryRepository, type AdminDomainData } from "@/modules/admin-core";
import type { AdminUsersDomain } from "../types";
export class AdminUsersRepository { constructor(private readonly repository = new AdminMemoryRepository()) {} list(domain: AdminUsersDomain): Promise<AdminDomainData> { return this.repository.getDomain(domain); } }
