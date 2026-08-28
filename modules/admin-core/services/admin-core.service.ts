import type { AdminDomain, AdminDomainData } from "../types";
import { AdminMemoryRepository } from "../repositories/admin-memory.repository";
export class AdminCoreService { constructor(private readonly repository: AdminMemoryRepository) {} getDomain(domain: AdminDomain): Promise<AdminDomainData> { return this.repository.getDomain(domain); } }
